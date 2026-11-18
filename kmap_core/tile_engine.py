"""
Koharu Maps - Tile Engine & KMAP Storage Container
Vector Tile generation, slicing, binary/json packing with SHA256 integrity verification.
Zero external tile libraries.
"""

import json
import hashlib
import struct
from typing import Dict, List, Any, Optional
from kmap_core.coordinates import tile_to_bounds_wgs84, lonlat_to_tile
from kmap_core.geometry import BoundingBox, Feature, clip_line_segment, sutherland_hodgman_polygon_clip


KMAP_MAGIC = b"KMAP"
KMAP_VERSION = 1


class TileEngine:
    """Manages vector tile rendering and slicing."""
    def __init__(self, spatial_index):
        self.spatial_index = spatial_index

    def get_tile_data(self, z: int, x: int, y: int) -> Dict[str, Any]:
        """
        Slices and returns map features for tile (z, x, y).
        Outputs features normalized and clipped to the tile boundary.
        """
        bounds = tile_to_bounds_wgs84(x, y, z)
        bbox = BoundingBox(bounds["min_lon"], bounds["min_lat"], bounds["max_lon"], bounds["max_lat"])

        candidates = self.spatial_index.query(bbox, zoom=z)
        layers: Dict[str, List[Dict[str, Any]]] = {
            "water": [],
            "green": [],
            "boundary": [],
            "road": [],
            "building": [],
            "place": [],
            "label": [],
        }

        tile_w = bbox.width()
        tile_h = bbox.height()

        def norm_pt(pt):
            # Normalize to tile internal coordinate system [0, 4096]
            if tile_w == 0 or tile_h == 0:
                return [2048, 2048]
            nx = int(((pt[0] - bbox.min_x) / tile_w) * 4096)
            # Invert Y for screen/tile coordinates (0 is top)
            ny = int(((bbox.max_y - pt[1]) / tile_h) * 4096)
            return [nx, ny]

        for feat in candidates:
            layer_name = feat.layer if feat.layer in layers else "road"

            if feat.geom_type == "Point":
                px, py = feat.coordinates
                if bbox.contains_point(px, py):
                    layers[layer_name].append({
                        "id": feat.id,
                        "type": "Point",
                        "pos": norm_pt((px, py)),
                        "lonlat": [px, py],
                        "properties": feat.properties
                    })

            elif feat.geom_type == "LineString":
                # Clip line to tile bbox
                clipped_pts = []
                for i in range(len(feat.coordinates) - 1):
                    p1 = feat.coordinates[i]
                    p2 = feat.coordinates[i + 1]
                    seg = clip_line_segment(p1, p2, bbox)
                    if seg:
                        s1, s2 = seg
                        ns1 = norm_pt(s1)
                        ns2 = norm_pt(s2)
                        if not clipped_pts or clipped_pts[-1] != ns1:
                            clipped_pts.append(ns1)
                        clipped_pts.append(ns2)

                if len(clipped_pts) >= 2:
                    layers[layer_name].append({
                        "id": feat.id,
                        "type": "LineString",
                        "points": clipped_pts,
                        "properties": feat.properties
                    })

            elif feat.geom_type == "Polygon":
                # Exterior ring
                ring = feat.coordinates[0]
                clipped_ring = sutherland_hodgman_polygon_clip(ring, bbox)
                if len(clipped_ring) >= 3:
                    layers[layer_name].append({
                        "id": feat.id,
                        "type": "Polygon",
                        "points": [norm_pt(p) for p in clipped_ring],
                        "properties": feat.properties
                    })

        return {
            "z": z,
            "x": x,
            "y": y,
            "extent": 4096,
            "bounds": bounds,
            "layers": layers
        }


def pack_kmap_package(metadata: Dict[str, Any], features: List[Feature]) -> bytes:
    """
    Packs map features into the custom standalone KMAP binary package.
    Container specification:
    [4 bytes Magic: 'KMAP']
    [2 bytes Version: uint16]
    [32 bytes SHA256 Checksum of payload]
    [4 bytes Header JSON length: uint32]
    [Header JSON bytes]
    [Payload JSON bytes]
    """
    feature_dicts = [f.to_dict() for f in features]
    payload = {
        "metadata": metadata,
        "features": feature_dicts,
    }
    payload_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    checksum = hashlib.sha256(payload_bytes).digest()

    header = {
        "format": "Koharu Maps Offline Archive",
        "version": KMAP_VERSION,
        "crs": "EPSG:4326",
        "feature_count": len(features),
        "payload_size": len(payload_bytes)
    }
    header_bytes = json.dumps(header).encode("utf-8")

    magic = KMAP_MAGIC
    version_bytes = struct.pack(">H", KMAP_VERSION)
    header_len_bytes = struct.pack(">I", len(header_bytes))

    return magic + version_bytes + checksum + header_len_bytes + header_bytes + payload_bytes


def unpack_kmap_package(data: bytes) -> Dict[str, Any]:
    """
    Unpacks and verifies integrity of a KMAP package.
    Raises ValueError on corruption or checksum mismatch.
    """
    if len(data) < 42:
        raise ValueError("Corrupted data: size is smaller than KMAP minimum header size.")

    magic = data[:4]
    if magic != KMAP_MAGIC:
        raise ValueError(f"Invalid magic header: expected {KMAP_MAGIC}, got {magic}")

    version = struct.unpack(">H", data[4:6])[0]
    expected_checksum = data[6:38]
    header_len = struct.unpack(">I", data[38:42])[0]

    header_bytes = data[42:42 + header_len]
    payload_bytes = data[42 + header_len:]

    actual_checksum = hashlib.sha256(payload_bytes).digest()
    if actual_checksum != expected_checksum:
        raise ValueError("KMAP Integrity Failure: SHA256 Checksum mismatch! Data may be tampered or corrupted.")

    header = json.loads(header_bytes.decode("utf-8"))
    payload = json.loads(payload_bytes.decode("utf-8"))

    return {
        "header": header,
        "metadata": payload.get("metadata", {}),
        "features": payload.get("features", [])
    }
