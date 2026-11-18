"""
Koharu Maps - Geographic Geometry Engine
Core primitives, algorithms, spatial analysis and clipping.
Zero external GIS libraries used.
"""

import math
from typing import List, Tuple, Optional, Dict, Any, Union


class BoundingBox:
    """Represents a 2D bounding box (min_x, min_y, max_x, max_y)."""
    def __init__(self, min_x: float, min_y: float, max_x: float, max_y: float):
        self.min_x = min(min_x, max_x)
        self.min_y = min(min_y, max_y)
        self.max_x = max(min_x, max_x)
        self.max_y = max(min_y, max_y)

    def contains_point(self, x: float, y: float) -> bool:
        return self.min_x <= x <= self.max_x and self.min_y <= y <= self.max_y

    def intersects(self, other: "BoundingBox") -> bool:
        return not (
            self.max_x < other.min_x
            or self.min_x > other.max_x
            or self.max_y < other.min_y
            or self.min_y > other.max_y
        )

    def expand(self, other: "BoundingBox") -> "BoundingBox":
        return BoundingBox(
            min(self.min_x, other.min_x),
            min(self.min_y, other.min_y),
            max(self.max_x, other.max_x),
            max(self.max_y, other.max_y)
        )

    def center(self) -> Tuple[float, float]:
        return (self.min_x + self.max_x) / 2.0, (self.min_y + self.max_y) / 2.0

    def width(self) -> float:
        return self.max_x - self.min_x

    def height(self) -> float:
        return self.max_y - self.min_y

    def to_dict(self) -> Dict[str, float]:
        return {
            "min_x": self.min_x,
            "min_y": self.min_y,
            "max_x": self.max_x,
            "max_y": self.max_y,
        }

    def __repr__(self) -> str:
        return f"BBox({self.min_x:.5f}, {self.min_y:.5f}, {self.max_x:.5f}, {self.max_y:.5f})"


def point_distance_sq(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    dx = p1[0] - p2[0]
    dy = p1[1] - p2[1]
    return dx * dx + dy * dy


def point_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    return math.sqrt(point_distance_sq(p1, p2))


def perpendicular_distance(point: Tuple[float, float], line_start: Tuple[float, float], line_end: Tuple[float, float]) -> float:
    """Perpendicular distance from point to line segment."""
    x0, y0 = point
    x1, y1 = line_start
    x2, y2 = line_end

    dx = x2 - x1
    dy = y2 - y1
    seg_len_sq = dx * dx + dy * dy

    if seg_len_sq == 0.0:
        return point_distance(point, line_start)

    # Project point onto line: t = dot(point - start, end - start) / len_sq
    t = ((x0 - x1) * dx + (y0 - y1) * dy) / seg_len_sq
    t = max(0.0, min(1.0, t))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy

    return point_distance(point, (proj_x, proj_y))


def ramer_douglas_peucker(points: List[Tuple[float, float]], epsilon: float) -> List[Tuple[float, float]]:
    """
    Ramer-Douglas-Peucker polyline simplification algorithm.
    Reduces the number of points in a curve with maximum deviation <= epsilon.
    """
    if len(points) <= 2:
        return points

    dmax = 0.0
    index = 0
    start = points[0]
    end = points[-1]

    for i in range(1, len(points) - 1):
        d = perpendicular_distance(points[i], start, end)
        if d > dmax:
            index = i
            dmax = d

    if dmax > epsilon:
        rec_results1 = ramer_douglas_peucker(points[:index + 1], epsilon)
        rec_results2 = ramer_douglas_peucker(points[index:], epsilon)
        return rec_results1[:-1] + rec_results2
    else:
        return [start, end]


def point_in_polygon(x: float, y: float, polygon: List[Tuple[float, float]]) -> bool:
    """
    Ray-casting algorithm for Point-In-Polygon query.
    Returns True if (x, y) is inside the polygon.
    """
    n = len(polygon)
    if n < 3:
        return False

    inside = False
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside


def polygon_area(ring: List[Tuple[float, float]]) -> float:
    """Computes signed area of a 2D planar polygon ring using Shoelace formula."""
    n = len(ring)
    if n < 3:
        return 0.0
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += ring[i][0] * ring[j][1]
        area -= ring[j][0] * ring[i][1]
    return area / 2.0


def compute_bounding_box(points: List[Tuple[float, float]]) -> BoundingBox:
    if not points:
        return BoundingBox(0, 0, 0, 0)
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return BoundingBox(min(xs), min(ys), max(xs), max(ys))


# Cohen-Sutherland Line Clipping
INSIDE = 0  # 0000
LEFT = 1    # 0001
RIGHT = 2   # 0010
BOTTOM = 4  # 0100
TOP = 8     # 1000

def _compute_code(x: float, y: float, bbox: BoundingBox) -> int:
    code = INSIDE
    if x < bbox.min_x:
        code |= LEFT
    elif x > bbox.max_x:
        code |= RIGHT
    if y < bbox.min_y:
        code |= BOTTOM
    elif y > bbox.max_y:
        code |= TOP
    return code


def clip_line_segment(p1: Tuple[float, float], p2: Tuple[float, float], bbox: BoundingBox) -> Optional[Tuple[Tuple[float, float], Tuple[float, float]]]:
    """Clips a 2D line segment (p1 -> p2) against an axis-aligned bounding box using Cohen-Sutherland."""
    x1, y1 = p1
    x2, y2 = p2
    code1 = _compute_code(x1, y1, bbox)
    code2 = _compute_code(x2, y2, bbox)

    while True:
        if (code1 | code2) == 0:
            # Both points inside
            return (x1, y1), (x2, y2)
        elif (code1 & code2) != 0:
            # Both points share outside zone -> completely outside
            return None
        else:
            # At least one point outside, pick outside point
            code_out = code1 if code1 != 0 else code2
            x, y = 0.0, 0.0

            if code_out & TOP:
                x = x1 + (x2 - x1) * (bbox.max_y - y1) / (y2 - y1)
                y = bbox.max_y
            elif code_out & BOTTOM:
                x = x1 + (x2 - x1) * (bbox.min_y - y1) / (y2 - y1)
                y = bbox.min_y
            elif code_out & RIGHT:
                y = y1 + (y2 - y1) * (bbox.max_x - x1) / (x2 - x1)
                x = bbox.max_x
            elif code_out & LEFT:
                y = y1 + (y2 - y1) * (bbox.min_x - x1) / (x2 - x1)
                x = bbox.min_x

            if code_out == code1:
                x1, y1 = x, y
                code1 = _compute_code(x1, y1, bbox)
            else:
                x2, y2 = x, y
                code2 = _compute_code(x2, y2, bbox)


def sutherland_hodgman_polygon_clip(polygon: List[Tuple[float, float]], bbox: BoundingBox) -> List[Tuple[float, float]]:
    """
    Clips a polygon against an axis-aligned bounding box using Sutherland-Hodgman.
    """
    def clip_edge(poly: List[Tuple[float, float]], edge: str) -> List[Tuple[float, float]]:
        out = []
        if not poly:
            return out
        for i in range(len(poly)):
            curr_p = poly[i]
            prev_p = poly[(i - 1) % len(poly)]

            def is_inside(p: Tuple[float, float]) -> bool:
                if edge == "left":
                    return p[0] >= bbox.min_x
                if edge == "right":
                    return p[0] <= bbox.max_x
                if edge == "bottom":
                    return p[1] >= bbox.min_y
                if edge == "top":
                    return p[1] <= bbox.max_y
                return True

            def intersection(p1: Tuple[float, float], p2: Tuple[float, float]) -> Tuple[float, float]:
                x1, y1 = p1
                x2, y2 = p2
                dx = x2 - x1
                dy = y2 - y1
                if edge == "left":
                    return bbox.min_x, y1 + dy * (bbox.min_x - x1) / dx if dx != 0 else y1
                if edge == "right":
                    return bbox.max_x, y1 + dy * (bbox.max_x - x1) / dx if dx != 0 else y1
                if edge == "bottom":
                    return x1 + dx * (bbox.min_y - y1) / dy if dy != 0 else x1, bbox.min_y
                if edge == "top":
                    return x1 + dx * (bbox.max_y - y1) / dy if dy != 0 else x1, bbox.max_y
                return p1

            curr_in = is_inside(curr_p)
            prev_in = is_inside(prev_p)

            if curr_in:
                if not prev_in:
                    out.append(intersection(prev_p, curr_p))
                out.append(curr_p)
            elif prev_in:
                out.append(intersection(prev_p, curr_p))

        return out

    res = polygon
    for edge in ["left", "right", "bottom", "top"]:
        res = clip_edge(res, edge)
        if not res:
            break
    return res


def convex_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Monotone Chain 2D convex hull algorithm O(N log N)."""
    pts = sorted(set(points))
    if len(pts) <= 1:
        return pts

    def cross(o: Tuple[float, float], a: Tuple[float, float], b: Tuple[float, float]) -> float:
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    return lower[:-1] + upper[:-1]


class Feature:
    """Represents a vector map feature with geometry, attributes, layer, and styling."""
    def __init__(
        self,
        feature_id: Union[int, str],
        geom_type: str,
        coordinates: Any,
        layer: str,
        properties: Optional[Dict[str, Any]] = None,
        min_zoom: int = 0,
        max_zoom: int = 24
    ):
        self.id = feature_id
        self.geom_type = geom_type  # 'Point', 'LineString', 'Polygon', 'MultiPolygon'
        self.coordinates = coordinates
        self.layer = layer
        self.properties = properties or {}
        self.min_zoom = min_zoom
        self.max_zoom = max_zoom
        self.bbox = self._calculate_bbox()

    def _calculate_bbox(self) -> BoundingBox:
        if self.geom_type == "Point":
            x, y = self.coordinates
            return BoundingBox(x, y, x, y)
        elif self.geom_type == "LineString":
            return compute_bounding_box(self.coordinates)
        elif self.geom_type == "Polygon":
            # coordinates[0] is exterior ring
            return compute_bounding_box(self.coordinates[0])
        elif self.geom_type == "MultiPolygon":
            flat = [p for poly in self.coordinates for p in poly[0]]
            return compute_bounding_box(flat)
        return BoundingBox(0, 0, 0, 0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": "Feature",
            "layer": self.layer,
            "geometry": {
                "type": self.geom_type,
                "coordinates": self.coordinates,
            },
            "properties": self.properties,
            "bbox": self.bbox.to_dict(),
            "min_zoom": self.min_zoom,
            "max_zoom": self.max_zoom,
        }
