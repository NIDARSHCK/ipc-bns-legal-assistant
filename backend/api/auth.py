from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from core.security import authenticated_user

router = APIRouter()

@router.get("/me")
def me(authorization: Optional[str] = Header(default=None)):
    user = authenticated_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required.")
    return user
