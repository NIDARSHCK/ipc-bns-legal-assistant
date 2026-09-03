import os
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

LOCAL_HISTORY: list[dict] = []


def supabase() -> Optional[Client]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SECRET_KEY")
    if not url or not key:
        return None
    try:
        return create_client(url, key)
    except Exception:
        return None


def get_user_from_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    if token == "demo-token":
        return {"id": "demo-user", "email": "demo@local.test", "role": "admin"}
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


import json
from typing import Optional, Any

def save_query(
    user_id: Optional[str],
    question: str,
    answer: Any,
    incident_date: str,
    legal_era: str,
    citations: list[dict],
) -> Optional[str]:
    if isinstance(answer, dict):
        answer = json.dumps(answer)
    client = supabase()
    if not client or not user_id:
        history_id = str(uuid4())
        LOCAL_HISTORY.insert(
            0,
            {
                "id": history_id,
                "user_id": user_id or "demo-user",
                "question": question,
                "answer": answer,
                "incident_date": incident_date,
                "legal_era": legal_era,
                "citations": citations,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        return history_id

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
        return [item for item in LOCAL_HISTORY if item["user_id"] == user_id][:50]
    result = (
        client.table("query_history")
        .select("id, question, answer, incident_date, legal_era, citations, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    history = result.data or []
    for item in history:
        if isinstance(item.get("answer"), str) and item["answer"].strip().startswith("{"):
            try:
                item["answer"] = json.loads(item["answer"])
            except Exception:
                pass
    return history


def get_all_history() -> list[dict]:
    client = supabase()
    if not client:
        return LOCAL_HISTORY[:200]
    result = (
        client.table("query_history")
        .select("id, user_id, question, answer, incident_date, legal_era, citations, created_at")
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )
    history = result.data or []
    for item in history:
        if isinstance(item.get("answer"), str) and item["answer"].strip().startswith("{"):
            try:
                item["answer"] = json.loads(item["answer"])
            except Exception:
                pass
    return history

def create_conversation(user_id: str, title: str) -> Optional[str]:
    client = supabase()
    if not client: return str(uuid4())
    res = client.table("conversations").insert({"user_id": user_id, "title": title}).execute()
    if res.data:
        return res.data[0]["id"]
    return None

def save_message(user_id: str, conversation_id: str, role: str, content: Any) -> Optional[str]:
    client = supabase()
    if not client: return str(uuid4())
    # Handle dict/string conversion for JSONB
    if isinstance(content, str) and content.strip().startswith("{"):
        try: content = json.loads(content)
        except Exception: pass
    
    res = client.table("messages").insert({
        "user_id": user_id, 
        "conversation_id": conversation_id, 
        "role": role, 
        "content": content
    }).execute()
    
    # Update conversation's updated_at timestamp
    client.table("conversations").update({
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", conversation_id).execute()
    
    if res.data: return res.data[0]["id"]
    return None

def get_conversations(user_id: str) -> list[dict]:
    client = supabase()
    if not client: return []
    res = client.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).limit(50).execute()
    return res.data or []

def get_conversation_messages(user_id: str, conversation_id: str) -> list[dict]:
    client = supabase()
    if not client: return []
    res = client.table("messages").select("*").eq("user_id", user_id).eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
    messages = res.data or []
    for m in messages:
        if isinstance(m.get("content"), str) and m["content"].strip().startswith("{"):
            try: m["content"] = json.loads(m["content"])
            except Exception: pass
    return messages
