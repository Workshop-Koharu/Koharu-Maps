"""
Koharu Maps - API Key Issuance & Management
Free API Key generation, listing, revocation, and usage statistics.
"""

import secrets
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from server.database import get_db_connection
from server.auth import get_current_user

router = APIRouter(prefix="/api/keys", tags=["API Keys"])


class CreateKeyRequest(BaseModel):
    name: str = "기본 무료 API 키"


def generate_api_key_token() -> str:
    return f"kmap_live_{secrets.token_hex(24)}"


@router.get("")
def list_api_keys(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    keys = conn.execute(
        "SELECT id, name, key, usage_count, is_active, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY id DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    return {"status": "success", "keys": [dict(k) for k in keys]}


@router.post("")
def create_api_key(req: CreateKeyRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    key_token = generate_api_key_token()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO api_keys (user_id, key, name) VALUES (?, ?, ?)",
        (current_user["id"], key_token, req.name)
    )
    key_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": "새로운 무료 API 키가 발급되었습니다.",
        "key": {
            "id": key_id,
            "name": req.name,
            "key": key_token,
            "usage_count": 0,
            "is_active": True,
        }
    }


@router.delete("/{key_id}")
def delete_api_key(key_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM api_keys WHERE id = ? AND user_id = ?", (key_id, current_user["id"])).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="API 키를 찾을 수 없습니다.")

    conn.execute("DELETE FROM api_keys WHERE id = ?", (key_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "API 키가 삭제되었습니다."}


@router.post("/{key_id}/regenerate")
def regenerate_api_key(key_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM api_keys WHERE id = ? AND user_id = ?", (key_id, current_user["id"])).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="API 키를 찾을 수 없습니다.")

    new_token = generate_api_key_token()
    conn.execute("UPDATE api_keys SET key = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", (new_token, key_id))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "API 키가 재발급되었습니다.", "key": new_token}
