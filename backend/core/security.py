from typing import Optional
from fastapi import HTTPException
from database.supabase_db import get_user_from_token

def authenticated_user(authorization: Optional[str]) -> Optional[dict]:
    token = None

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]

    return get_user_from_token(token) if token else None

def get_current_user(authorization: Optional[str]) -> dict:
    user = authenticated_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required.")
    return user
