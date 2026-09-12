from datetime import date
from typing import Optional, Any
from fastapi import APIRouter, Header
from pydantic import BaseModel

import json
from core.security import authenticated_user
from database.supabase_db import save_query, create_conversation, save_message, get_conversation_messages
from core.llm_handler import analyze_query_intent, build_legal_answer, build_comparison_answer
from core.vector_db import search_legal_corpus, semantic_text_search

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

def normalize_comparison_data(
    comp: Optional[dict],
    default_source_act: Optional[str] = None,
    default_target_act: Optional[str] = None,
) -> Optional[dict]:
    if not comp or not isinstance(comp, dict):
        return comp

    source_act = str(comp.get("source_act") or default_source_act or "").strip().upper()
    target_act = str(comp.get("target_act") or default_target_act or "").strip().upper()

    source_data = comp.get("source")
    target_data = comp.get("target")

    # If source_act == "IPC" and source exists and ipc is missing, assign source to ipc
    if source_act == "IPC" and source_data and "ipc" not in comp:
        comp["ipc"] = source_data
    # If source_act == "BNS" and source exists and bns is missing, assign source to bns
    elif source_act == "BNS" and source_data and "bns" not in comp:
        comp["bns"] = source_data

    # If target_act == "IPC" and target exists and ipc is missing, assign target to ipc
    if target_act == "IPC" and target_data and "ipc" not in comp:
        comp["ipc"] = target_data
    # If target_act == "BNS" and target exists and bns is missing, assign target to bns
    elif target_act == "BNS" and target_data and "bns" not in comp:
        comp["bns"] = target_data

    return comp

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

    # Hydrate conversation from database if empty/missing and conversation_id exists for authenticated user
    conversation = payload.conversation or []
    if user and conversation_id and not conversation:
        db_messages = get_conversation_messages(user["id"], conversation_id)
        if db_messages:
            conversation = [
                {
                    "role": m.get("role", "user"),
                    "content": json.dumps(m.get("content")) if isinstance(m.get("content"), dict) else str(m.get("content", ""))
                }
                for m in db_messages
            ]
        
    if user and conversation_id:
        save_message(user["id"], conversation_id, "user", payload.question)

    if payload.forced_era:
        legal_era = payload.forced_era
    else:
        legal_era = "BNS" if payload.incident_date >= date(2024, 7, 1) else "IPC"

    namespace = "bns_v2" if legal_era == "BNS" else "ipc_v2"

    # 1. Deterministic Extraction FIRST
    from core.vector_db import detect_exact_sections
    exact_matches = detect_exact_sections(payload.question)
    detected_act = None
    detected_section = None
    if exact_matches:
        for e in exact_matches:
            if e.get("act"):
                detected_act = e.get("act")
            if e.get("section"):
                detected_section = e.get("section")
            if detected_act and detected_section:
                break
    
    # 2. LLM Intent Analysis
    try:
        intent_data = await analyze_query_intent(payload.question, conversation)
    except Exception as e:
        print(f"Warning: Intent analysis failed: {e}")
        intent_data = {}
        
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

    if intent == "unsupported":
        answer = {
            "direct_answer": "I can only assist with Indian criminal law questions, specifically the Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS).",
            "relevant_law": "N/A",
            "what_it_means": "The question asked is outside the scope of Indian criminal law assistance.",
            "how_it_relates": "N/A"
        }
        if user and conversation_id:
            save_message(user["id"], conversation_id, "assistant", answer)

        return AskResponse(
            answer=answer, intent=intent, legal_era=legal_era, namespace=namespace,
            citations=[], comparison=None, history_id=None, conversation_id=conversation_id, query=payload.question,
            expanded_query=optimized_query,
            disclaimer="This system is dedicated exclusively to Indian criminal law (IPC and BNS)."
        )

    try:
        if intent == "comparison":
            # TWO-STAGE COMPARISON RETRIEVAL
            source_act = intent_data.get("source_act") or detected_act
            source_section = intent_data.get("source_section") or detected_section
            target_act = intent_data.get("target_act")
            
            if not source_act:
                source_act = "IPC" if legal_era == "BNS" else "BNS"
            if not target_act:
                target_act = "BNS" if source_act == "IPC" else "IPC"
                
            source_namespace = f"{source_act.lower()}_v2"
            target_namespace = f"{target_act.lower()}_v2"
            
            # 1. Retrieve Source
            source_query = f"{source_act} {source_section}" if source_section else optimized_query
            retrieved_source = search_legal_corpus(source_query, top_k=1, force_act=source_act)
            
            if not retrieved_source:
                answer = {"direct_answer": f"Could not retrieve the source {source_act} provision to compare."}
                comparison = None
                retrieved = []
            else:
                source_chunk = retrieved_source[0]
                source_text_for_search = f"{source_chunk.get('title', '')} {source_chunk.get('text', '')}"
                
                # 2. Semantic Search on Target (Bypassing exact filters)
                target_candidates = semantic_text_search(source_text_for_search, target_namespace, top_k=5)
                
                # If target section was explicitly mentioned in query, ensure it is included in target candidates
                target_exact_sec = None
                for e in exact_matches:
                    if e.get("act") == target_act and e.get("section"):
                        target_exact_sec = e.get("section")
                        break
                if target_exact_sec:
                    has_exact = any(c.get("section") == target_exact_sec for c in target_candidates)
                    if not has_exact:
                        explicit_target = search_legal_corpus(f"{target_act} {target_exact_sec}", top_k=1, force_act=target_act)
                        if explicit_target:
                            target_candidates = explicit_target + target_candidates

                # 3. LLM Comparison
                try:
                    llm_res = await build_comparison_answer(payload.question, source_chunk, target_candidates, conversation)
                    answer = llm_res.get("answer", "")
                    comparison = normalize_comparison_data(
                        llm_res.get("comparison", None),
                        default_source_act=source_act,
                        default_target_act=target_act,
                    )
                except Exception:
                    answer = {"direct_answer": build_fallback_answer(payload.question, payload.incident_date.isoformat(), legal_era, [source_chunk])}
                    comparison = None

                # Citations combine both
                retrieved = [source_chunk] + target_candidates
        else:
            # STANDARD RETRIEVAL
            source_act = detected_act

            # 1. Determine explicit Act selection ONLY from the ORIGINAL USER QUESTION
            if not source_act:
                q_upper = payload.question.upper()
                if "IPC" in q_upper and "BNS" not in q_upper:
                    source_act = "IPC"
                elif "BNS" in q_upper and "IPC" not in q_upper:
                    source_act = "BNS"

            # 2. Inherit section & Act from conversation context (intent_data) if not explicitly in current question
            effective_section = detected_section
            if not effective_section and intent_data.get("source_section"):
                effective_section = intent_data.get("source_section")

            if not source_act and intent_data.get("source_act"):
                source_act = intent_data.get("source_act")

            if not source_act and payload.forced_era:
                source_act = payload.forced_era

            # If effective section exists but source_act remains unspecified, fallback to legal_era
            if not source_act and effective_section:
                source_act = legal_era

            # Construct search query
            search_query = f"{source_act} {effective_section}" if (effective_section and source_act) else (f"section {effective_section}" if effective_section else optimized_query)

            # Deterministic defense for natural language queries (no section in question or context)
            if not effective_section:
                import re
                # 1. Prevent vector_db from falsely locking the Act based on LLM-injected words
                if not source_act:
                    search_query = re.sub(r'\b(IPC|BNS)\b', '', search_query, flags=re.IGNORECASE).strip()
                # 2. Strip optimizer-injected section labels and standalone section numbers
                search_query = re.sub(r'(?i)\bsec(?:tion)?\.?\s*\d+[A-Za-z()/-]*\b', '', search_query)
                search_query = re.sub(r'(?i)\b(?:IPC|BNS)\s*\d+[A-Za-z()/-]*\b', '', search_query)
                search_query = re.sub(r'(?<![₹$€£\w])\b\d{1,3}[A-Za-z]?\b(?!\s*(?:rupees|rs|k|lakh|crore|years|months|days|percent|%))', '', search_query, flags=re.IGNORECASE)
                search_query = re.sub(r'\s+', ' ', search_query).strip()

                # 3. For punishment queries without explicit section, ensure punishment concepts are preserved
                q_lower = payload.question.lower()
                if any(w in q_lower for w in ["punishment", "penalty", "imprisonment", "fine", "sentence"]):
                    if not any(w in search_query.lower() for w in ["punishment", "penalty", "imprisonment"]):
                        search_query = f"{search_query} punishment penalty imprisonment"

            print(f"[DEBUG chat.py] Original: '{payload.question}' | Effective Section: {effective_section} | Effective Act: {source_act} | Final Search Query: '{search_query}'")
                
            retrieved = search_legal_corpus(search_query, top_k=5, force_act=source_act)
            if not retrieved:
                answer = {"direct_answer": "I couldn't find a sufficiently relevant source in the available legal documents."}
                comparison = None
            else:
                try:
                    llm_res = await build_legal_answer(
                        payload.question, payload.incident_date.isoformat(), legal_era, retrieved, conversation
                    )
                    answer = llm_res.get("answer", "")
                    comparison = normalize_comparison_data(llm_res.get("comparison", None))
                except Exception as exc:
                    print(f"[ERROR chat.py] build_legal_answer failed: {exc}")
                    answer = {"direct_answer": build_fallback_answer(payload.question, payload.incident_date.isoformat(), legal_era, retrieved)}
                    comparison = None

    except Exception as exc:
        import traceback
        traceback.print_exc()
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
