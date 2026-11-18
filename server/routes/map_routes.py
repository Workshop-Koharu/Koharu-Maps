"""
Koharu Maps - Vector Map & Tile Routes
Zero-dependency vector tile delivery, spatial queries, and KMAP export.
"""

from typing import Optional
from fastapi import APIRouter, Query, Response, Request
from server.gis_state import tile_engine, spatial_index, features
from server.auth import verify_api_key
from kmap_core.geometry import BoundingBox
from kmap_core.tile_engine import pack_kmap_package

router = APIRouter(prefix="/api/v1", tags=["Map Data & Tiles"])


@router.get("/metadata")
def get_map_metadata(request: Request):
    verify_api_key(request)
    return {
        "status": "success",
        "engine": "Koharu Maps Independent Cartographic Engine",
        "version": "1.0.0",
        "crs": ["EPSG:4326 (WGS84)", "EPSG:3857 (Web Mercator)", "EPSG:5186 (Korea Central TM)"],
        "bounds": {
            "min_lon": 126.0,
            "min_lat": 33.0,
            "max_lon": 130.0,
            "max_lat": 38.5,
        },
        "layers": ["water", "green", "road", "building", "place", "boundary", "label"],
        "total_features": len(features)
    }


@router.get("/tile/{z}/{x}/{y}")
def get_vector_tile(z: int, x: int, y: int, request: Request):
    """
    Returns vector features sliced and clipped for tile (z, x, y).
    Free API accessible with or without API key.
    """
    verify_api_key(request)
    tile_data = tile_engine.get_tile_data(z, x, y)
    return tile_data


@router.get("/features")
def query_features(
    request: Request,
    bbox: Optional[str] = Query(None, description="min_lon,min_lat,max_lon,max_lat"),
    zoom: Optional[int] = Query(None, ge=0, le=24),
    limit: int = Query(500, ge=1, le=2000)
):
    """Spatial query of vector features inside bounding box."""
    verify_api_key(request)
    if bbox:
        try:
            parts = [float(p.strip()) for p in bbox.split(",")]
            query_bbox = BoundingBox(parts[0], parts[1], parts[2], parts[3])
        except Exception:
            query_bbox = BoundingBox(126.5, 37.0, 127.5, 38.0)
    else:
        # Default Seoul Area
        query_bbox = BoundingBox(126.8, 37.4, 127.2, 37.7)

    results = spatial_index.query(query_bbox, zoom=zoom)
    return {
        "status": "success",
        "count": len(results[:limit]),
        "features": [f.to_dict() for f in results[:limit]]
    }


@router.get("/export/kmap")
def export_kmap_archive(request: Request):
    """Exports all current map features into standalone .kmap binary package."""
    verify_api_key(request)
    meta = {
        "project": "Koharu Maps",
        "region": "South Korea Master Set",
        "exported_at": "2026-11-18",
    }
    pkg_bytes = pack_kmap_package(meta, features)
    return Response(
        content=pkg_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": 'attachment; filename="korea_offline.kmap"'}
    )
