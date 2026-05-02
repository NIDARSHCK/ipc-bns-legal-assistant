import re
from datetime import date
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.llm_handler import build_legal_answer
from core.query_guard import is_legal_query
from core.section_mapping import get_equivalent_section
from core.vector_db import search_legal_corpus

from database.supabase_db import (
    get_all_history,
    get_user_from_token,
    get_user_history,
    save_query,
)

app = FastAPI(
    title="IPC-BNS Legal Assistant API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*vercel\\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
        # Hybrid Retrieval
        retrieved = search_legal_corpus(
            payload.question,
            namespace=namespace,
            exact_section=exact_section,
        )

        if not retrieved:
            raise HTTPException(
                status_code=404,
                detail="No reliable legal source matched this query.",
            )

        # LLM Inference
        answer = await build_legal_answer(
            question=payload.question,
            incident_date=payload.incident_date.isoformat(),
            legal_era=legal_era,
            retrieved_chunks=retrieved,
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