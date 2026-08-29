from datetime import date
from typing import Optional, Any
from fastapi import APIRouter, Header
from pydantic import BaseModel

from core.security import authenticated_user
from database.supabase_db import save_query, create_conversation, save_message
from core.llm_handler import analyze_query_intent, build_legal_answer
from core.vector_db import search_legal_corpus
from core.section_mapping import find_mapping_for_query

router = APIRouter()

class AskRequest(BaseModel):
    question: str
    incident_date: date
    forced_era: Optional[str] = None
    conversation: Optional[list[dict]] = []
    conversation_id: Optional[str] = None

class AskResponse(BaseModel):
    answer: Any
    intent: str
    legal_era: str
    namespace: str
    citations: list[dict]
    comparison: Optional[dict] = None
    history_id: Optional[str] = None
    conversation_id: Optional[str] = None
    query: str
    expanded_query: Optional[str] = None
    disclaimer: str

def build_fallback_answer(question: str, incident_date: str, legal_era: str, retrieved: list[dict]) -> str:
    primary = retrieved[0] if retrieved else {"act": "Unknown", "section": "Unknown", "title": "Unknown", "page": "Unknown"}
    return (
        "1. Direct answer\n"
        f"For an incident dated {incident_date}, the query is routed to {legal_era}. "
        f"The closest structured reference is {primary['act']} Section {primary['section']} "
        f"({primary['title']}).\n\n"
        "2. Relevant sections\n"
        f"- {primary['act']} Section {primary['section']}: {primary['title']}\n\n"
        "3. Practical next steps\n"
        "Use this as a starting reference, then verify the final statutory text and facts with an advocate "
        "before filing, pleading, or relying on the provision.\n\n"
        "4. Citations\n"
        f"- {primary['act']} Section {primary['section']}, source page: {primary['page']}\n\n"
        "Note: This local answer was generated without live LLM/Pinecone credentials."
    )

@router.post("/chat", response_model=AskResponse)
async def ask_legal_question(
    payload: AskRequest,
    authorization: Optional[str] = Header(default=None),
):
    user = authenticated_user(authorization)
    
    conversation_id = payload.conversation_id
    if user and not conversation_id:
        title = payload.question[:40] + ("..." if len(payload.question) > 40 else "")
        conversation_id = create_conversation(user["id"], title)
        
    if user and conversation_id:
        save_message(user["id"], conversation_id, "user", payload.question)

    if payload.forced_era:
        legal_era = payload.forced_era
    else:
        legal_era = "BNS" if payload.incident_date >= date(2024, 7, 1) else "IPC"

    namespace = "bns" if legal_era == "BNS" else "ipc"

    intent_data = await analyze_query_intent(payload.question, payload.conversation)
    intent = intent_data.get("intent", "legal_question")
    optimized_query = intent_data.get("optimized_query") or payload.question

    if intent == "greeting":
        answer = {
            "direct_answer": "Hello! I'm NyayaSetu Legal AI. You can ask me about IPC and BNS provisions, offences, punishments, or comparisons.",
            "relevant_law": "N/A",
            "what_it_means": "I am an AI assistant designed to help with Indian legal research.",
            "how_it_relates": "N/A"
        }
        if user and conversation_id:
            save_message(user["id"], conversation_id, "assistant", answer)
            
        return AskResponse(
            answer=answer, intent=intent, legal_era=legal_era, namespace=namespace,
            citations=[], comparison=None, history_id=None, conversation_id=conversation_id, query=payload.question,
            expanded_query=optimized_query,
            disclaimer="This information is for general legal information and is not a substitute for professional legal advice."
        )

    try:
        retrieved = search_legal_corpus(optimized_query, top_k=5, force_act=legal_era)
    except Exception as e:
        print(f"Pinecone retrieval error: {e}")
        ans = {"direct_answer": "The legal vector database is currently experiencing a temporary connection issue. Please wait a few seconds and try again."}
        if user and conversation_id: save_message(user["id"], conversation_id, "assistant", ans)
        return AskResponse(
            answer=ans,
            intent=intent, legal_era=legal_era, namespace=namespace, citations=[], comparison=None, history_id=None, conversation_id=conversation_id,
            query=payload.question, expanded_query=optimized_query, disclaimer="System temporarily unavailable."
        )

    try:
        if not retrieved:
            answer = {"direct_answer": "I couldn't find a sufficiently relevant source in the available legal documents."}
            comparison = None
        else:
            try:
                llm_res = await build_legal_answer(
                    payload.question, payload.incident_date.isoformat(), legal_era, retrieved, payload.conversation
                )
                answer = llm_res.get("answer", "")
                comparison = llm_res.get("comparison", None)
            except Exception:
                answer = build_fallback_answer(payload.question, payload.incident_date.isoformat(), legal_era, retrieved)
                comparison = None
            
            mapping = find_mapping_for_query(payload.question, legal_era)
            if mapping and not comparison:
                ipc_sec = mapping["ipc_section"]
                bns_sec = mapping["bns_section"]
                title = mapping["bns_title"] if legal_era == "BNS" else mapping["ipc_title"]
                
                mapping_text = f"Section Mapping: {'IPC Section ' + ipc_sec + ' maps to BNS Section ' + bns_sec if legal_era == 'IPC' else 'BNS Section ' + bns_sec + ' maps to IPC Section ' + ipc_sec} ({title}). Note: {mapping['notes']}"
                
                if isinstance(answer, dict):
                    answer["section_mapping"] = mapping_text
                else:
                    answer += f"\n\n{mapping_text}"

    except Exception as exc:
        print(f"RAG pipeline error: {exc}")
        ans = {"direct_answer": "The AI generation service is experiencing an issue. Please wait and try again."}
        if user and conversation_id: save_message(user["id"], conversation_id, "assistant", ans)
        return AskResponse(
            answer=ans,
            intent=intent, legal_era=legal_era, namespace=namespace, citations=retrieved if 'retrieved' in locals() else [],
            comparison=None, history_id=None, conversation_id=conversation_id, query=payload.question, expanded_query=optimized_query, disclaimer="System temporarily unavailable."
        )

    history_id = None
    if user:
        history_id = save_query(
            user_id=user["id"],
            question=payload.question,
            answer=answer,
            incident_date=payload.incident_date.isoformat(),
            legal_era=legal_era,
            citations=retrieved if 'retrieved' in locals() else [],
        )
        if conversation_id:
            full_response = {
                "answer": answer,
                "citations": retrieved if 'retrieved' in locals() else [],
                "comparison": comparison if 'comparison' in locals() else None,
                "legal_era": legal_era,
                "namespace": namespace,
                "disclaimer": "This information is for general legal information and is not a substitute for professional legal advice."
            }
            save_message(user["id"], conversation_id, "assistant", full_response)

    return AskResponse(
        answer=answer, intent=intent, legal_era=legal_era, namespace=namespace,
        citations=retrieved if 'retrieved' in locals() else [],
        comparison=comparison if 'comparison' in locals() else None,
        history_id=history_id, conversation_id=conversation_id, query=payload.question, expanded_query=optimized_query,
        disclaimer="This information is for general legal information and is not a substitute for professional legal advice."
    )

@router.post("/ask", response_model=AskResponse)
async def ask_legacy(payload: AskRequest, authorization: Optional[str] = Header(default=None)):
    return await ask_legal_question(payload, authorization)
