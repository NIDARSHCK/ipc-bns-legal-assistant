import re
import os
from datetime import date
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.llm_handler import build_legal_answer
from core.query_guard import is_legal_query
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

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
class AskRequest(BaseModel):
    question: str = Field(..., min_length=5)
    incident_date: date
    forced_era: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    legal_era: str
    namespace: str
    citations: list[dict]
    history_id: Optional[str] = None


def build_demo_retrieval(question: str, legal_era: str, namespace: str, exact_section: str | None) -> list[dict]:
    mapping = find_mapping_for_query(question, legal_era)
    if exact_section:
        mapping = next(
            (
                item
                for item in get_mappings()
                if item["ipc_section"] == exact_section or item["bns_section"] == exact_section
            ),
            mapping,
        )
    if not mapping:
        mapping = get_mappings()[0]

    section = mapping["bns_section"] if legal_era == "BNS" else mapping["ipc_section"]
    title = mapping["bns_title"] if legal_era == "BNS" else mapping["ipc_title"]
    other_act = "IPC" if legal_era == "BNS" else "BNS"
    other_section = mapping["ipc_section"] if legal_era == "BNS" else mapping["bns_section"]

    return [
        {
            "id": f"demo-{namespace}-{section}",
            "score": 0.91,
            "act": legal_era,
            "section": section,
            "title": title,
            "page": "demo",
            "text": (
                f"{legal_era} Section {section}: {title}. "
                f"Transition note: the corresponding {other_act} provision is Section {other_section}. "
                f"{mapping['notes']}"
            ),
        }
    ]


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

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Please sign in before asking a legal question.",
        )

    if not is_legal_query(payload.question):
        raise HTTPException(
            status_code=400,
            detail="This assistant only answers Indian legal questions.",
        )

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
        try:
            retrieved = search_legal_corpus(
                payload.question,
                namespace=namespace,
                exact_section=exact_section,
            )
        except Exception:
            retrieved = build_demo_retrieval(
                payload.question,
                legal_era=legal_era,
                namespace=namespace,
                exact_section=exact_section,
            )

        if not retrieved:
            raise HTTPException(
                status_code=404,
                detail="No reliable legal source matched this query.",
            )

        try:
            answer = await build_legal_answer(
                question=payload.question,
                incident_date=payload.incident_date.isoformat(),
                legal_era=legal_era,
                retrieved_chunks=retrieved,
            )
        except Exception:
            answer = build_fallback_answer(
                payload.question,
                payload.incident_date.isoformat(),
                legal_era,
                retrieved,
            )

        # Relational Mapping
        mapped_section = None

        if exact_section:
            mapped_section = get_equivalent_section(
                exact_section,
                legal_era,
            )

        if mapped_section:
            if legal_era == "IPC":
                answer += (
                    f"\n\nEquivalent provision under BNS: "
                    f"Section {mapped_section}"
                )
            else:
                answer += (
                    f"\n\nEquivalent provision under IPC: "
                    f"Section {mapped_section}"
                )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"RAG pipeline failed: {exc}",
        ) from exc

    # Store Query History
    history_id = save_query(
        user_id=user["id"],
        question=payload.question,
        answer=answer,
        incident_date=payload.incident_date.isoformat(),
        legal_era=legal_era,
        citations=retrieved,
    )

    return AskResponse(
        answer=answer,
        legal_era=legal_era,
        namespace=namespace,
        citations=retrieved,
        history_id=history_id,
    )
