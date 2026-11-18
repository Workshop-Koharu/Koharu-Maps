"""
Koharu Maps - Navigation & Routing Routes
Topological road graph routing with A* and Dijkstra algorithms.
"""

from typing import Optional
from fastapi import APIRouter, Query, Request, HTTPException
from server.gis_state import road_graph
from server.auth import verify_api_key

router = APIRouter(prefix="/api/v1", tags=["Navigation & Routing"])


@router.get("/route")
def calculate_route(
    request: Request,
    start: str = Query(..., description="출발 좌표: 'lon,lat' (예: '126.9768,37.5750')"),
    target: str = Query(..., description="도착 좌표: 'lon,lat' (예: '127.0280,37.4980')"),
    algorithm: str = Query("a_star", description="경로 탐색 알고리즘: 'a_star' 또는 'dijkstra'"),
    weight: str = Query("time", description="가중치 기준: 'time' 또는 'distance'")
):
    """
    Computes turn-by-turn navigation route on local road graph.
    Zero external routing APIs used.
    """
    verify_api_key(request)

    try:
        s_lon, s_lat = [float(x.strip()) for x in start.split(",")]
        t_lon, t_lat = [float(x.strip()) for x in target.split(",")]
    except Exception:
        raise HTTPException(status_code=400, detail="좌표 형식이 올바르지 않습니다. '경도,위도' 형식이어야 합니다.")

    # Snap to nearest road graph node
    start_node_id, start_snap_dist = road_graph.find_nearest_node(s_lon, s_lat)
    target_node_id, target_snap_dist = road_graph.find_nearest_node(t_lon, t_lat)

    if start_node_id == -1 or target_node_id == -1:
        raise HTTPException(status_code=404, detail="연결 가능한 도로망 노드를 찾을 수 없습니다.")

    weight_by_time = (weight == "time")
    if algorithm == "dijkstra":
        route_res = road_graph.dijkstra_route(start_node_id, target_node_id)
    else:
        route_res = road_graph.a_star_route(start_node_id, target_node_id, weight_by_time=weight_by_time)

    if not route_res:
        raise HTTPException(status_code=404, detail="두 지점 사이의 연결 경로를 찾을 수 없습니다.")

    start_node = road_graph.nodes[start_node_id]
    target_node = road_graph.nodes[target_node_id]

    return {
        "status": "success",
        "algorithm": algorithm,
        "weight": weight,
        "start": {
            "query": [s_lon, s_lat],
            "snapped_node_id": start_node_id,
            "snapped_node_name": start_node.name,
            "snap_distance_m": round(start_snap_dist, 1)
        },
        "target": {
            "query": [t_lon, t_lat],
            "snapped_node_id": target_node_id,
            "snapped_node_name": target_node.name,
            "snap_distance_m": round(target_snap_dist, 1)
        },
        "route": route_res
    }
