"""
Koharu Maps - Geocoding & Place Search Routes
Offline local forward and reverse geocoding with Korean text tokenization.
"""

from typing import Optional
from fastapi import APIRouter, Query, Request, HTTPException
from server.gis_state import geocoder
from server.auth import verify_api_key

router = APIRouter(prefix="/api/v1", tags=["Search & Geocoding"])


@router.get("/search")
def search_places(
    request: Request,
    q: str = Query(..., min_length=1, description="검색어 (예: 강남역, 광화문, 세종대로, 천안시청)"),
    limit: int = Query(10, ge=1, le=50),
    center_lon: Optional[float] = Query(None, description="현재 뷰포트 중심 경도 (가중치 적용)"),
    center_lat: Optional[float] = Query(None, description="현재 뷰포트 중심 위도 (가중치 적용)")
):
    """
    Local forward geocoding & POI search.
    Completely offline search over inverted index with character n-grams.
    """
    verify_api_key(request)
    results = geocoder.search(q, limit=limit, center_lon=center_lon, center_lat=center_lat)
    return {
        "status": "success",
        "query": q,
        "count": len(results),
        "results": results
    }


@router.get("/reverse-geocode")
def reverse_geocode(
    request: Request,
    lon: float = Query(..., description="경도"),
    lat: float = Query(..., description="위도"),
    max_dist_m: float = Query(3000.0, description="최대 탐색 반경(미터)")
):
    """
    Local reverse geocoding: finds nearest road/address/landmark.
    """
    verify_api_key(request)
    res = geocoder.reverse_geocode(lon, lat, max_dist_m=max_dist_m)
    if not res:
        return {
            "status": "success",
            "found": False,
            "message": "해당 반경 내에 등록된 주소 정보가 없습니다.",
            "location": {"lon": lon, "lat": lat}
        }
    return {
        "status": "success",
        "found": True,
        "place": res
    }
