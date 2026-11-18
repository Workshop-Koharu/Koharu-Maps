"""
Koharu Maps - Standalone GIS & Offline Cartographic Engine Core.
"""

from kmap_core.coordinates import (
    wgs84_to_web_mercator,
    web_mercator_to_wgs84,
    lonlat_to_tile,
    tile_to_bounds_wgs84,
    tile_to_bounds_mercator,
    lonlat_to_pixel,
    pixel_to_lonlat,
    haversine_distance,
    initial_bearing,
    wgs84_to_tm_korea,
)
from kmap_core.geometry import (
    BoundingBox,
    Feature,
    point_in_polygon,
    ramer_douglas_peucker,
    clip_line_segment,
    sutherland_hodgman_polygon_clip,
    convex_hull,
)
from kmap_core.spatial_index import SpatialIndex
from kmap_core.road_graph import RoadGraph, RoadNode, RoadEdge, TurnInstruction
from kmap_core.geocoder import LocalGeocoder, SearchDocument
from kmap_core.tile_engine import TileEngine, pack_kmap_package, unpack_kmap_package
from kmap_core.sample_data import build_default_dataset

__version__ = "1.0.0"
