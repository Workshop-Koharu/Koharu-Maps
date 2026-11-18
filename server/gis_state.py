"""
Koharu Maps - GIS State Manager
In-memory GIS core singletons: SpatialIndex, TileEngine, RoadGraph, LocalGeocoder.
"""

from kmap_core.sample_data import build_default_dataset
from kmap_core.spatial_index import SpatialIndex
from kmap_core.tile_engine import TileEngine

# Global in-memory GIS state
features, road_graph, geocoder = build_default_dataset()

spatial_index = SpatialIndex()
spatial_index.insert_bulk(features)

tile_engine = TileEngine(spatial_index)


def get_gis_state():
    return {
        "features": features,
        "spatial_index": spatial_index,
        "tile_engine": tile_engine,
        "road_graph": road_graph,
        "geocoder": geocoder,
    }
