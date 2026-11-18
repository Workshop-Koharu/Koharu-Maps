"""
Koharu Maps - Authentication & OAuth2 Engine
JWT issuance, password hashing, Google/Discord/GitHub Social Login.
"""

import hashlib
import os
import secrets
import time
from typing import Optional, Dict, Any
import jwt
import httpx
from fastapi import Depends, HTTPException, Security, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from server.config import (
    SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
    DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI,
    GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI
)
from server.database import get_db_connection

security_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}:{key.hex()}"


def verify_password(plain_password: str, hashed: str) -> bool:
    try:
        salt, key_hex = hashed.split(":")
        check_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return secrets.compare_digest(key_hex, check_key.hex())
    except Exception:
        return False


def create_access_token(user_id: int, email: str, name: str) -> str:
    expire = time.time() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다.")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="인증 토큰이 유효하지 않거나 만료되었습니다.")

    user_id = int(payload["sub"])
    conn = get_db_connection()
    user = conn.execute("SELECT id, email, name, provider, avatar_url, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
    return dict(user)


def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None
    user_id = int(payload["sub"])
    conn = get_db_connection()
    user = conn.execute("SELECT id, email, name, provider, avatar_url, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None


def verify_api_key(request: Request) -> Optional[Dict[str, Any]]:
    """
    Validates API key from 'X-API-Key' header or '?api_key=' query param.
    Free tier validation with usage counter tracking.
    """
    api_key = request.headers.get("X-API-Key") or request.query_params.get("api_key")
    if not api_key:
        return None

    conn = get_db_connection()
    row = conn.execute("SELECT id, user_id, name, usage_count, is_active FROM api_keys WHERE key = ?", (api_key,)).fetchone()
    if row and row["is_active"]:
        # Update usage counter
        conn.execute("UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = ?", (row["id"],))
        conn.commit()
        res = dict(row)
        conn.close()
        return res
    conn.close()
    return None


# =========================================================================
# Social Login OAuth2 Helper Functions
# =========================================================================

def get_social_auth_url(provider: str) -> str:
    provider = provider.lower()
    if provider == "google":
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Google OAuth2 클라이언트 ID가 설정되지 않았습니다.")
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={GOOGLE_CLIENT_ID}&"
            f"redirect_uri={GOOGLE_REDIRECT_URI}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"access_type=offline"
        )

    elif provider == "discord":
        if not DISCORD_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Discord OAuth2 클라이언트 ID가 설정되지 않았습니다.")
        return (
            f"https://discord.com/api/oauth2/authorize?"
            f"client_id={DISCORD_CLIENT_ID}&"
            f"redirect_uri={DISCORD_REDIRECT_URI}&"
            f"response_type=code&"
            f"scope=identify%20email"
        )

    elif provider == "github":
        if not GITHUB_CLIENT_ID:
            raise HTTPException(status_code=500, detail="GitHub OAuth2 클라이언트 ID가 설정되지 않았습니다.")
        return (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={GITHUB_CLIENT_ID}&"
            f"redirect_uri={GITHUB_REDIRECT_URI}&"
            f"scope=user:email"
        )

    else:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 소셜 로그인 제공자: {provider}")


async def exchange_social_code(provider: str, code: str) -> Dict[str, Any]:
    """Exchanges authorization code for user info from social provider."""
    provider = provider.lower()
    async with httpx.AsyncClient(timeout=10.0) as client:
        if provider == "google":
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                }
            )
            token_data = token_resp.json()
            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail=f"Google 로그인 실패: {token_data}")

            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            uinfo = user_resp.json()
            return {
                "provider": "google",
                "provider_id": uinfo.get("id"),
                "email": uinfo.get("email"),
                "name": uinfo.get("name") or uinfo.get("email", "").split("@")[0],
                "avatar_url": uinfo.get("picture", "")
            }

        elif provider == "discord":
            token_resp = await client.post(
                "https://discord.com/api/oauth2/token",
                data={
                    "client_id": DISCORD_CLIENT_ID,
                    "client_secret": DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": DISCORD_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            token_data = token_resp.json()
            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail=f"Discord 로그인 실패: {token_data}")

            user_resp = await client.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            uinfo = user_resp.json()
            avatar = f"https://cdn.discordapp.com/avatars/{uinfo['id']}/{uinfo['avatar']}.png" if uinfo.get("avatar") else ""
            return {
                "provider": "discord",
                "provider_id": uinfo.get("id"),
                "email": uinfo.get("email"),
                "name": uinfo.get("global_name") or uinfo.get("username"),
                "avatar_url": avatar
            }

        elif provider == "github":
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                json={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": GITHUB_REDIRECT_URI,
                },
                headers={"Accept": "application/json"}
            )
            token_data = token_resp.json()
            if "access_token" not in token_data:
                raise HTTPException(status_code=400, detail=f"GitHub 로그인 실패: {token_data}")

            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            uinfo = user_resp.json()

            email = uinfo.get("email")
            if not email:
                emails_resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {token_data['access_token']}"}
                )
                emails = emails_resp.json()
                for e in emails:
                    if e.get("primary"):
                        email = e.get("email")
                        break

            return {
                "provider": "github",
                "provider_id": str(uinfo.get("id")),
                "email": email or f"github_{uinfo.get('id')}@koharu.local",
                "name": uinfo.get("name") or uinfo.get("login"),
                "avatar_url": uinfo.get("avatar_url", "")
            }
