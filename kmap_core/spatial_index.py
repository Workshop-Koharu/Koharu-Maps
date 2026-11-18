"""
Koharu Maps - Spatial Index Engine
Pure Python Implementation of R-Tree and QuadTree.
Zero external spatial libraries.
"""

import math
from typing import List, Tuple, Any, Optional, Dict
from kmap_core.geometry import BoundingBox, Feature, point_distance_sq


class QuadTreeNode:
    """Node in a 2D QuadTree for bounding box based spatial indexing."""
    def __init__(self, bbox: BoundingBox, depth: int = 0, max_depth: int = 8, max_items: int = 16):
        self.bbox = bbox
        self.depth = depth
        self.max_depth = max_depth
        self.max_items = max_items
        self.items: List[Tuple[BoundingBox, Any]] = []
        self.children: Optional[List["QuadTreeNode"]] = None

    def is_leaf(self) -> bool:
        return self.children is None

    def subdivide(self):
        cx, cy = self.bbox.center()
        # 4 quadrants: NW, NE, SW, SE
        self.children = [
            QuadTreeNode(BoundingBox(self.bbox.min_x, cy, cx, self.bbox.max_y), self.depth + 1, self.max_depth, self.max_items),  # NW
            QuadTreeNode(BoundingBox(cx, cy, self.bbox.max_x, self.bbox.max_y), self.depth + 1, self.max_depth, self.max_items),  # NE
            QuadTreeNode(BoundingBox(self.bbox.min_x, self.bbox.min_y, cx, cy), self.depth + 1, self.max_depth, self.max_items),  # SW
            QuadTreeNode(BoundingBox(cx, self.bbox.min_y, self.bbox.max_x, cy), self.depth + 1, self.max_depth, self.max_items),  # SE
        ]

    def insert(self, item_bbox: BoundingBox, data: Any) -> bool:
        if not self.bbox.intersects(item_bbox):
            return False

        if self.is_leaf():
            if len(self.items) < self.max_items or self.depth >= self.max_depth:
                self.items.append((item_bbox, data))
                return True
            self.subdivide()
            # Reinsert existing items into children or keep if spanning
            old_items = self.items
            self.items = []
            for ibbox, idata in old_items:
                self._insert_into_children_or_self(ibbox, idata)

        return self._insert_into_children_or_self(item_bbox, data)

    def _insert_into_children_or_self(self, item_bbox: BoundingBox, data: Any) -> bool:
        inserted = False
        if self.children:
            for child in self.children:
                if child.bbox.intersects(item_bbox):
                    child.insert(item_bbox, data)
                    inserted = True
        if not inserted:
            self.items.append((item_bbox, data))
        return True

    def query_range(self, query_bbox: BoundingBox, results: List[Any], visited_ids: set):
        if not self.bbox.intersects(query_bbox):
            return

        for ibbox, item in self.items:
            if ibbox.intersects(query_bbox):
                item_id = getattr(item, "id", id(item))
                if item_id not in visited_ids:
                    visited_ids.add(item_id)
                    results.append(item)

        if self.children:
            for child in self.children:
                child.query_range(query_bbox, results, visited_ids)


class SpatialIndex:
    """
    High-level Spatial Index wrapper.
    Supports range query, point query, and nearest neighbor search.
    """
    def __init__(self, bounds: Optional[BoundingBox] = None):
        # Default to South Korea & East Asia bounding box if unspecified
        # lon: ~124.0 to ~132.0, lat: ~33.0 to ~39.0
        self.bounds = bounds or BoundingBox(124.0, 33.0, 132.0, 39.0)
        self.root = QuadTreeNode(self.bounds, depth=0, max_depth=10, max_items=24)
        self.count = 0

    def insert(self, feature: Feature):
        self.root.insert(feature.bbox, feature)
        self.count += 1

    def insert_bulk(self, features: List[Feature]):
        for f in features:
            self.insert(f)

    def query(self, query_bbox: BoundingBox, zoom: Optional[int] = None) -> List[Feature]:
        """Queries all features intersecting the query_bbox, optionally filtered by zoom."""
        raw_results: List[Feature] = []
        visited = set()
        self.root.query_range(query_bbox, raw_results, visited)

        if zoom is not None:
            return [f for f in raw_results if f.min_zoom <= zoom <= f.max_zoom]
        return raw_results

    def nearest_point(self, lon: float, lat: float, max_dist_deg: float = 0.05, layer: Optional[str] = None) -> Optional[Tuple[Feature, float]]:
        """Finds nearest feature within max_dist_deg radius."""
        q_bbox = BoundingBox(lon - max_dist_deg, lat - max_dist_deg, lon + max_dist_deg, lat + max_dist_deg)
        candidates = self.query(q_bbox)

        best_feat = None
        best_dist_sq = float("inf")

        for f in candidates:
            if layer and f.layer != layer:
                continue
            if f.geom_type == "Point":
                d_sq = point_distance_sq((lon, lat), (f.coordinates[0], f.coordinates[1]))
            else:
                cx, cy = f.bbox.center()
                d_sq = point_distance_sq((lon, lat), (cx, cy))

            if d_sq < best_dist_sq:
                best_dist_sq = d_sq
                best_feat = f

        if best_feat:
            return best_feat, math.sqrt(best_dist_sq)
        return None
