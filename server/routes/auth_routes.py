"""
Koharu Maps - Authentication Routes
Registration, Login, User profile, and Social OAuth2 endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import re
from typing import Optional, Dict, Any
from server.database import get_db_connection
from server.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_social_auth_url, exchange_social_code
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="비밀번호는 최소 6자 이상이어야 합니다.")

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="이미 등록된 이메일 주소입니다.")

    hashed_pw = hash_password(req.password)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (email, password_hash, name, provider) VALUES (?, ?, ?, 'local')",
        (req.email, hashed_pw, req.name)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    token = create_access_token(user_id, req.email, req.name)
    return {
        "status": "success",
        "message": "회원가입이 완료되었습니다.",
        "token": token,
        "user": {"id": user_id, "email": req.email, "name": req.name, "provider": "local"}
    }


@router.post("/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    user = conn.execute("SELECT id, email, password_hash, name, provider FROM users WHERE email = ?", (req.email,)).fetchone()
    conn.close()

    if not user or not user["password_hash"]:
        raise HTTPException(status_code=400, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    token = create_access_token(user["id"], user["email"], user["name"])
    return {
        "status": "success",
        "message": "로그인에 성공했습니다.",
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "provider": user["provider"]}
    }


@router.get("/me")
def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"status": "success", "user": current_user}


@router.get("/social/{provider}")
def social_login_redirect(provider: str):
    """Generates redirect URL for Google / Discord / GitHub login."""
    url = get_social_auth_url(provider)
    return {"status": "success", "auth_url": url}


@router.get("/social/callback/{provider}")
async def social_callback(provider: str, code: str):
    """OAuth2 callback handler: exchanges code for token, signs in or creates user."""
    profile = await exchange_social_code(provider, code)

    conn = get_db_connection()
    user = conn.execute("SELECT id, email, name, provider, avatar_url FROM users WHERE email = ?", (profile["email"],)).fetchone()

    if not user:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, name, provider, provider_id, avatar_url) VALUES (?, ?, ?, ?, ?)",
            (profile["email"], profile["name"], profile["provider"], profile["provider_id"], profile["avatar_url"])
        )
        user_id = cursor.lastrowid
        conn.commit()
    else:
        user_id = user["id"]
        # Update avatar
        conn.execute("UPDATE users SET avatar_url = ? WHERE id = ?", (profile["avatar_url"], user_id))
        conn.commit()

    conn.close()

    token = create_access_token(user_id, profile["email"], profile["name"])
    # Redirect to main web app with token in hash
    return RedirectResponse(url=f"/#token={token}")
