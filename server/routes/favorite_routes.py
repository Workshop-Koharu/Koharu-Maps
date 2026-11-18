"""
Koharu Maps - User Favorites (Bookmarks) Routes
Authentication-gated bookmarking for places and coordinates.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from server.database import get_db_connection
from server.auth import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


class AddFavoriteRequest(BaseModel):
    title: str
    category: str = "장소"
    address: Optional[str] = ""
    lon: float
    lat: float
    memo: Optional[str] = ""


@router.get("")
def list_favorites(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    favs = conn.execute(
        "SELECT id, title, category, address, lon, lat, memo, created_at FROM favorites WHERE user_id = ? ORDER BY id DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    return {"status": "success", "favorites": [dict(f) for f in favs]}


@router.post("")
def add_favorite(req: AddFavoriteRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO favorites (user_id, title, category, address, lon, lat, memo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (current_user["id"], req.title, req.category, req.address, req.lon, req.lat, req.memo)
    )
    fav_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": "즐겨찾기에 등록되었습니다.",
        "favorite": {
            "id": fav_id,
            "title": req.title,
            "category": req.category,
            "address": req.address,
            "lon": req.lon,
            "lat": req.lat,
            "memo": req.memo,
        }
    }


@router.delete("/{fav_id}")
def delete_favorite(fav_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM favorites WHERE id = ? AND user_id = ?", (fav_id, current_user["id"])).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="즐겨찾기 항목을 찾을 수 없습니다.")

    conn.execute("DELETE FROM favorites WHERE id = ?", (fav_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "즐겨찾기에서 삭제되었습니다."}
