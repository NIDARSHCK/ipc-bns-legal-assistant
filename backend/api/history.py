from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from core.security import authenticated_user
from database.supabase_db import get_all_history, get_user_history

router = APIRouter()

@router.get("/history")
def history(authorization: Optional[str] = Header(default=None)):
    user = authenticated_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required.")
    return {"items": get_user_history(user["id"])}

@router.get("/admin/history")
def admin_history(authorization: Optional[str] = Header(default=None)):
    user = authenticated_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required.")
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin account required.")
    return {"items": get_all_history()}
