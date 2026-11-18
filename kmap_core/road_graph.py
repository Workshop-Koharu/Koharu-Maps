"""
Koharu Maps - Road Graph & Navigation Engine
A* search, Dijkstra, topological graph construction, turn instruction generator.
Zero external navigation libraries.
"""

import math
import heapq
from typing import Dict, List, Tuple, Optional, Any
from kmap_core.coordinates import haversine_distance, initial_bearing


class RoadNode:
    def __init__(self, node_id: int, lon: float, lat: float, name: str = ""):
        self.id = node_id
        self.lon = lon
        self.lat = lat
        self.name = name

    def to_dict(self) -> Dict[str, Any]:
        return {"id": self.id, "lon": self.lon, "lat": self.lat, "name": self.name}


class RoadEdge:
    def __init__(
        self,
        edge_id: int,
        from_node: int,
        to_node: int,
        distance_m: float,
        road_name: str = "도로",
        road_type: str = "residential",
        speed_kmh: float = 50.0,
        oneway: bool = False,
        geometry: Optional[List[Tuple[float, float]]] = None
    ):
        self.id = edge_id
        self.from_node = from_node
        self.to_node = to_node
        self.distance_m = distance_m
        self.road_name = road_name
        self.road_type = road_type
        self.speed_kmh = speed_kmh
        self.oneway = oneway
        # Geometry coordinates in [[lon, lat], ...]
        self.geometry = geometry or []
        # Traversal time in seconds
        self.travel_time_sec = (distance_m / 1000.0) / (speed_kmh / 3600.0) if speed_kmh > 0 else distance_m

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "from_node": self.from_node,
            "to_node": self.to_node,
            "distance_m": self.distance_m,
            "travel_time_sec": self.travel_time_sec,
            "road_name": self.road_name,
            "road_type": self.road_type,
            "speed_kmh": self.speed_kmh,
            "oneway": self.oneway,
            "geometry": self.geometry,
        }


class TurnInstruction:
    def __init__(
        self,
        instruction_type: str,
        message: str,
        road_name: str,
        distance_m: float,
        duration_sec: float,
        location: Tuple[float, float]
    ):
        self.type = instruction_type  # 'depart', 'straight', 'turn-left', 'turn-right', 'slight-left', 'slight-right', 'u-turn', 'arrive'
        self.message = message
        self.road_name = road_name
        self.distance_m = distance_m
        self.duration_sec = duration_sec
        self.location = location

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "message": self.message,
            "road_name": self.road_name,
            "distance_m": round(self.distance_m, 1),
            "duration_sec": round(self.duration_sec, 1),
            "location": [round(self.location[0], 6), round(self.location[1], 6)],
        }


class RoadGraph:
    """Directed topological road network graph."""
    def __init__(self):
        self.nodes: Dict[int, RoadNode] = {}
        # adjacency list: from_node_id -> list of RoadEdge
        self.adj: Dict[int, List[RoadEdge]] = {}
        self.edge_counter = 0

    def add_node(self, node_id: int, lon: float, lat: float, name: str = "") -> RoadNode:
        node = RoadNode(node_id, lon, lat, name)
        self.nodes[node_id] = node
        if node_id not in self.adj:
            self.adj[node_id] = []
        return node

    def add_edge(
        self,
        from_node: int,
        to_node: int,
        distance_m: Optional[float] = None,
        road_name: str = "도로",
        road_type: str = "residential",
        speed_kmh: float = 50.0,
        oneway: bool = False,
        geometry: Optional[List[Tuple[float, float]]] = None
    ) -> RoadEdge:
        if from_node not in self.nodes or to_node not in self.nodes:
            raise ValueError(f"Nodes {from_node} or {to_node} must exist before adding edge.")

        n1 = self.nodes[from_node]
        n2 = self.nodes[to_node]

        if distance_m is None:
            distance_m = haversine_distance(n1.lon, n1.lat, n2.lon, n2.lat)

        if geometry is None:
            geometry = [(n1.lon, n1.lat), (n2.lon, n2.lat)]

        self.edge_counter += 1
        edge = RoadEdge(
            edge_id=self.edge_counter,
            from_node=from_node,
            to_node=to_node,
            distance_m=distance_m,
            road_name=road_name,
            road_type=road_type,
            speed_kmh=speed_kmh,
            oneway=oneway,
            geometry=geometry
        )
        self.adj[from_node].append(edge)

        if not oneway:
            self.edge_counter += 1
            rev_geom = list(reversed(geometry))
            rev_edge = RoadEdge(
                edge_id=self.edge_counter,
                from_node=to_node,
                to_node=from_node,
                distance_m=distance_m,
                road_name=road_name,
                road_type=road_type,
                speed_kmh=speed_kmh,
                oneway=oneway,
                geometry=rev_geom
            )
            self.adj[to_node].append(rev_edge)

        return edge

    def find_nearest_node(self, lon: float, lat: float) -> Tuple[int, float]:
        """Snaps coordinate to nearest node on the road network."""
        best_node = -1
        min_dist = float("inf")
        for node_id, node in self.nodes.items():
            dist = haversine_distance(lon, lat, node.lon, node.lat)
            if dist < min_dist:
                min_dist = dist
                best_node = node_id
        return best_node, min_dist

    def a_star_route(
        self,
        start_node_id: int,
        target_node_id: int,
        weight_by_time: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        A* algorithm searching shortest/fastest route between two nodes.
        Returns detailed route with geometry and turn instructions.
        """
        if start_node_id not in self.nodes or target_node_id not in self.nodes:
            return None

        target_node = self.nodes[target_node_id]

        # priority queue items: (f_score, current_node_id)
        open_set: List[Tuple[float, int]] = []
        heapq.heappush(open_set, (0.0, start_node_id))

        came_from: Dict[int, Tuple[int, RoadEdge]] = {}  # node -> (prev_node, edge)
        g_score: Dict[int, float] = {node_id: float("inf") for node_id in self.nodes}
        g_score[start_node_id] = 0.0

        def heuristic(node_id: int) -> float:
            n = self.nodes[node_id]
            dist = haversine_distance(n.lon, n.lat, target_node.lon, target_node.lat)
            if weight_by_time:
                # Max speed approx 110 km/h = ~30.5 m/s for admissible heuristic
                return dist / 30.5
            return dist

        while open_set:
            current_f, current_id = heapq.heappop(open_set)

            if current_id == target_node_id:
                # Reconstruct path
                return self._reconstruct_path(start_node_id, target_node_id, came_from)

            for edge in self.adj.get(current_id, []):
                neighbor = edge.to_node
                cost = edge.travel_time_sec if weight_by_time else edge.distance_m
                tentative_g = g_score[current_id] + cost

                if tentative_g < g_score[neighbor]:
                    came_from[neighbor] = (current_id, edge)
                    g_score[neighbor] = tentative_g
                    f = tentative_g + heuristic(neighbor)
                    heapq.heappush(open_set, (f, neighbor))

        return None  # No path found

    def dijkstra_route(self, start_node_id: int, target_node_id: int) -> Optional[Dict[str, Any]]:
        return self.a_star_route(start_node_id, target_node_id, weight_by_time=False)

    def _reconstruct_path(
        self,
        start_id: int,
        target_id: int,
        came_from: Dict[int, Tuple[int, RoadEdge]]
    ) -> Dict[str, Any]:
        path_edges: List[RoadEdge] = []
        curr = target_id
        while curr != start_id:
            prev_node, edge = came_from[curr]
            path_edges.append(edge)
            curr = prev_node
        path_edges.reverse()

        full_coords: List[List[float]] = []
        total_distance = 0.0
        total_duration = 0.0

        for i, edge in enumerate(path_edges):
            total_distance += edge.distance_m
            total_duration += edge.travel_time_sec
            pts = edge.geometry
            if i > 0 and full_coords and pts:
                # avoid repeating junction coordinate
                full_coords.extend([[round(p[0], 6), round(p[1], 6)] for p in pts[1:]])
            else:
                full_coords.extend([[round(p[0], 6), round(p[1], 6)] for p in pts])

        # Generate Turn-by-Turn Instructions
        instructions = self._generate_turn_instructions(path_edges)

        return {
            "distance_m": round(total_distance, 1),
            "duration_sec": round(total_duration, 1),
            "duration_min": round(total_duration / 60.0, 1),
            "coordinates": full_coords,
            "instructions": [ins.to_dict() for ins in instructions],
            "edges_count": len(path_edges),
        }

    def _generate_turn_instructions(self, edges: List[RoadEdge]) -> List[TurnInstruction]:
        if not edges:
            return []

        instructions: List[TurnInstruction] = []
        first_edge = edges[0]
        start_node = self.nodes[first_edge.from_node]

        # Depart instruction
        instructions.append(
            TurnInstruction(
                instruction_type="depart",
                message=f"{first_edge.road_name}(으)로 출발합니다.",
                road_name=first_edge.road_name,
                distance_m=first_edge.distance_m,
                duration_sec=first_edge.travel_time_sec,
                location=(start_node.lon, start_node.lat)
            )
        )

        acc_dist = 0.0
        acc_time = 0.0
        current_road_name = first_edge.road_name

        for i in range(len(edges) - 1):
            e1 = edges[i]
            e2 = edges[i + 1]
            n_mid = self.nodes[e1.to_node]
            n_prev = self.nodes[e1.from_node]
            n_next = self.nodes[e2.to_node]

            b1 = initial_bearing(n_prev.lon, n_prev.lat, n_mid.lon, n_mid.lat)
            b2 = initial_bearing(n_mid.lon, n_mid.lat, n_next.lon, n_next.lat)

            diff = (b2 - b1 + 360.0) % 360.0

            action = "straight"
            msg = f"{e2.road_name} 방면으로 계속 직진하세요."

            if 20.0 <= diff < 45.0:
                action = "slight-right"
                msg = f"{e2.road_name} 방면으로 완만한 우회전입니다."
            elif 45.0 <= diff < 140.0:
                action = "turn-right"
                msg = f"{e2.road_name} 방면으로 우회전입니다."
            elif 140.0 <= diff < 220.0:
                action = "u-turn"
                msg = f"유턴입니다."
            elif 220.0 <= diff < 315.0:
                action = "turn-left"
                msg = f"{e2.road_name} 방면으로 좌회전입니다."
            elif 315.0 <= diff < 340.0:
                action = "slight-left"
                msg = f"{e2.road_name} 방면으로 완만한 좌회전입니다."

            if action != "straight" or e2.road_name != current_road_name:
                instructions.append(
                    TurnInstruction(
                        instruction_type=action,
                        message=msg,
                        road_name=e2.road_name,
                        distance_m=e2.distance_m,
                        duration_sec=e2.travel_time_sec,
                        location=(n_mid.lon, n_mid.lat)
                    )
                )
                current_road_name = e2.road_name

        last_edge = edges[-1]
        last_node = self.nodes[last_edge.to_node]
        instructions.append(
            TurnInstruction(
                instruction_type="arrive",
                message="목적지에 도착했습니다.",
                road_name=last_edge.road_name,
                distance_m=0,
                duration_sec=0,
                location=(last_node.lon, last_node.lat)
            )
        )

        return instructions
