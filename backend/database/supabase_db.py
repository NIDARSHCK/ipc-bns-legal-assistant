import os
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


def supabase() -> Optional[Client]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SECRET_KEY")
    if not url or not key:
        return None
    return create_client(url, key)


def get_user_from_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    client = supabase()
    if not client:
        return None
    try:
        result = client.auth.get_user(token)
        user = result.user
        role = "user"
        try:
            profile = (
                client.table("profiles")
                .select("role")
                .eq("id", user.id)
                .maybe_single()
                .execute()
            )
            if profile.data:
                role = profile.data.get("role") or "user"
        except Exception:
            role = "user"
        return {"id": user.id, "email": user.email, "role": role}
    except Exception:
        return None


def save_query(
    user_id: Optional[str],
    question: str,
    answer: str,
    incident_date: str,
    legal_era: str,
    citations: list[dict],
) -> Optional[str]:
    client = supabase()
    if not client or not user_id:
        return None

    result = (
        client.table("query_history")
        .insert(
            {
                "user_id": user_id,
                "question": question,
                "answer": answer,
                "incident_date": incident_date,
                "legal_era": legal_era,
                "citations": citations,
            }
        )
        .execute()
    )
    if result.data:
        return result.data[0].get("id")
    return None


def get_user_history(user_id: str) -> list[dict]:
    client = supabase()
    if not client:
        return []
    result = (
        client.table("query_history")
        .select("id, question, answer, incident_date, legal_era, citations, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []


def get_all_history() -> list[dict]:
    client = supabase()
    if not client:
        return []
    result = (
        client.table("query_history")
        .select("id, user_id, question, answer, incident_date, legal_era, citations, created_at")
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )
    return result.data or []
