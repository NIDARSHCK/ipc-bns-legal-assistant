import re
import os
from datetime import date
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.llm_handler import build_legal_answer, analyze_query_intent

from core.section_mapping import find_mapping_for_query, get_equivalent_section, get_mappings
from core.vector_db import search_legal_corpus

from database.supabase_db import (
    get_all_history,
    get_user_from_token,
    get_user_history,
    save_query,
)

app = FastAPI(
    title="IPC-BNS Legal Assistant API",
    version="2.0.1",
)

origins = (
    os.getenv("ALLOWED_ORIGINS")
    or os.getenv("FRONTEND_ORIGINS")
    or "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,https://ipc-bns-legal-assistant.vercel.app"
)

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class AskRequest(BaseModel):
    question: str
    incident_date: date
    forced_era: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    intent: str
    legal_era: str
    namespace: str
    citations: list[dict]
    comparison: Optional[dict] = None
    history_id: Optional[str] = None
    query: str
    expanded_query: Optional[str] = None
    disclaimer: str



def build_fallback_answer(question: str, incident_date: str, legal_era: str, retrieved: list[dict]) -> str:
    primary = retrieved[0]
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


def authenticated_user(authorization: Optional[str]) -> Optional[dict]:
    token = None

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]

    return get_user_from_token(token) if token else None


@app.get("/")
def root():
    return {"message": "API Running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/mapping")
def mapping():
    return {"items": get_mappings()}


@app.get("/me")
def me(authorization: Optional[str] = Header(default=None)):
    user = authenticated_user(authorization)

    if not user:
        raise HTTPException(status_code=401, detail="Sign in required.")

    return user


@app.get("/history")
def history(authorization: Optional[str] = Header(default=None)):
    user = authenticated_user(authorization)

    if not user:
        raise HTTPException(status_code=401, detail="Sign in required.")

    return {"items": get_user_history(user["id"])}


@app.get("/admin/history")
def admin_history(authorization: Optional[str] = Header(default=None)):
    user = authenticated_user(authorization)

    if not user:
        raise HTTPException(status_code=401, detail="Sign in required.")

    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin account required.")

    return {"items": get_all_history()}


@app.post("/ask", response_model=AskResponse)
async def ask_legacy(
    payload: AskRequest,
    authorization: Optional[str] = Header(default=None),
):
    return await ask_legal_question(payload, authorization)


@app.post("/chat", response_model=AskResponse)
async def ask_legal_question(
    payload: AskRequest,
    authorization: Optional[str] = Header(default=None),
):
    user = authenticated_user(authorization)

    # The hardcoded legal guardrail has been bypassed.
    # All queries are now safely routed through NLP Intent Classification (Groq).

    # Temporal Legal Routing
    if payload.forced_era:
        legal_era = payload.forced_era
    else:
        legal_era = (
            "BNS"
            if payload.incident_date >= date(2024, 7, 1)
            else "IPC"
        )

    namespace = "bns" if legal_era == "BNS" else "ipc"

    intent_data = await analyze_query_intent(payload.question)
    intent = intent_data.get("intent", "legal_question")
    optimized_query = intent_data.get("optimized_query") or payload.question

    if intent == "greeting":
        answer = "Hello! I'm NyayaSetu Legal AI. You can ask me about IPC and BNS provisions, offences, punishments, or comparisons."
        return AskResponse(
            answer=answer,
            intent=intent,
            legal_era=legal_era,
            namespace=namespace,
            citations=[],
            comparison=None,
            history_id=None
        )

    # Regex Exact Section Detection
    section_match = re.search(
        r"(?:section|sec\.?)\s*(\d+[A-Za-z()/-]*)",
        payload.question,
        flags=re.I,
    )

    exact_section = None

    if section_match:
        exact_section = section_match.group(1)

    try:
        retrieved = search_legal_corpus(
            optimized_query,
            namespace=None, # Allow searching across both namespaces
            exact_section=exact_section,
        )

        if not retrieved:
            answer = "I couldn't find a sufficiently relevant source in the available legal documents."
            comparison = None
        else:
            try:
                llm_res = await build_legal_answer(
                    question=payload.question,
                    incident_date=payload.incident_date.isoformat(),
                    legal_era=legal_era,
                    retrieved_chunks=retrieved,
                )
                answer = llm_res.get("answer", "")
                comparison = llm_res.get("comparison", None)
            except Exception:
                answer = build_fallback_answer(
                    payload.question,
                    payload.incident_date.isoformat(),
                    legal_era,
                    retrieved,
                )
                comparison = None
            
            # Relational Mapping
            mapping = None
            if exact_section:
                mapping = next((item for item in get_mappings() if item["ipc_section"] == exact_section or item["bns_section"] == exact_section), None)
                
            if not mapping:
                mapping = find_mapping_for_query(payload.question, legal_era)

            if mapping and not comparison:
                ipc_sec = mapping["ipc_section"]
                bns_sec = mapping["bns_section"]
                title = mapping["bns_title"] if legal_era == "BNS" else mapping["ipc_title"]
                
                if legal_era == "IPC":
                    answer += f"\n\n**Section Mapping:** IPC Section {ipc_sec} maps to **BNS Section {bns_sec}** ({title}). Note: {mapping['notes']}"
                else:
                    answer += f"\n\n**Section Mapping:** BNS Section {bns_sec} maps to **IPC Section {ipc_sec}** ({title}). Note: {mapping['notes']}"

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"RAG pipeline failed: {exc}",
        ) from exc

    # Store Query History
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
        
    print("\n" + "="*50)
    print("DEVELOPMENT DEBUG LOG")
    print("="*50)
    print(f"USER QUERY: {payload.question}")
    print(f"intent: {intent}")
    print(f"expanded query: {optimized_query}")
    print(f"top_k: 5 (default)")
    if 'retrieved' in locals() and retrieved:
        print(f"retrieved documents: {len(retrieved)}")
        for i, c in enumerate(retrieved):
            print(f"  [{i+1}] Score: {c.get('score')} | Act: {c.get('act')} | Section: {c.get('section')}")
            print(f"       Metadata: Page {c.get('page')}, Year {c.get('year')}, Status {c.get('status')}")
    else:
        print("retrieved documents: 0")
    print(f"final decision: {answer[:100]}...")
    print("="*50 + "\n")

    return AskResponse(
        answer=answer,
        intent=intent,
        legal_era=legal_era,
        namespace=namespace,
        citations=retrieved if 'retrieved' in locals() else [],
        comparison=comparison if 'comparison' in locals() else None,
        history_id=history_id,
        query=payload.question,
        expanded_query=optimized_query,
        disclaimer="This information is for general legal information and is not a substitute for professional legal advice."
    )
