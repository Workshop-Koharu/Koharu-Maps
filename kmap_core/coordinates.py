"""
Koharu Maps - Core Coordinate & Projection Engine
Pure mathematical implementation of Geographic and Projected Coordinate Systems.
Zero external GIS libraries used.
"""

import math
from typing import Tuple, Dict, Any, List

# Constants for WGS84 and Web Mercator (EPSG:3857)
WGS84_A = 6378137.0  # Semi-major axis in meters
WGS84_B = 6356752.314245  # Semi-minor axis in meters
WGS84_F = 1.0 / 298.257223563  # Flattening
WGS84_E2 = 2 * WGS84_F - WGS84_F ** 2  # First eccentricity squared

MERCATOR_MAX_LAT = 85.0511287798066  # Latitude boundary where Y explodes
EARTH_CIRCUMFERENCE = 2.0 * math.pi * WGS84_A
ORIGIN_SHIFT = EARTH_CIRCUMFERENCE / 2.0  # ~20037508.342789244 meters

# GRS80 / Korean Central Origin (EPSG:5186 / 5181 standard parameters)
GRS80_A = 6378137.0
GRS80_F = 1.0 / 298.257222101
GRS80_E2 = 2 * GRS80_F - GRS80_F ** 2
KOREA_CENTRAL_LAT0 = math.radians(38.0)
KOREA_CENTRAL_LON0 = math.radians(127.5)
KOREA_CENTRAL_K0 = 1.0
KOREA_CENTRAL_X0 = 1000000.0  # False Northing
KOREA_CENTRAL_Y0 = 200000.0   # False Easting


def clamp_lat(lat: float) -> float:
    """Clamps latitude between -MERCATOR_MAX_LAT and MERCATOR_MAX_LAT."""
    return max(-MERCATOR_MAX_LAT, min(MERCATOR_MAX_LAT, lat))


def wrap_lon(lon: float) -> float:
    """Wraps longitude into [-180.0, 180.0]."""
    while lon > 180.0:
        lon -= 360.0
    while lon < -180.0:
        lon += 360.0
    return lon


def wgs84_to_web_mercator(lon: float, lat: float) -> Tuple[float, float]:
    """
    Transforms WGS84 (EPSG:4326) degrees into Web Mercator (EPSG:3857) meters.
    x in meters [-20037508.34, 20037508.34]
    y in meters [-20037508.34, 20037508.34]
    """
    lon = wrap_lon(lon)
    lat = clamp_lat(lat)

    x = lon * ORIGIN_SHIFT / 180.0
    lat_rad = math.radians(lat)
    y = math.log(math.tan((math.pi / 4.0) + (lat_rad / 2.0))) * WGS84_A
    return x, y


def web_mercator_to_wgs84(x: float, y: float) -> Tuple[float, float]:
    """
    Transforms Web Mercator (EPSG:3857) meters to WGS84 (EPSG:4326) degrees.
    Returns (longitude, latitude).
    """
    lon = (x / ORIGIN_SHIFT) * 180.0
    lat = math.degrees(2.0 * math.atan(math.exp(y / WGS84_A)) - (math.pi / 2.0))
    return wrap_lon(lon), clamp_lat(lat)


def lonlat_to_tile(lon: float, lat: float, zoom: int) -> Tuple[int, int]:
    """
    Returns tile coordinates (tile_x, tile_y) for a given longitude, latitude and zoom level.
    """
    lat = clamp_lat(lat)
    lon = wrap_lon(lon)
    n = 2.0 ** zoom
    xtile = int((lon + 180.0) / 360.0 * n)
    lat_rad = math.radians(lat)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    # Clamp to valid range
    max_tile = int(n) - 1
    xtile = max(0, min(max_tile, xtile))
    ytile = max(0, min(max_tile, ytile))
    return xtile, ytile


def tile_to_bounds_wgs84(tile_x: int, tile_y: int, zoom: int) -> Dict[str, float]:
    """
    Returns the bounding box of a tile in WGS84 degrees:
    min_lon, min_lat, max_lon, max_lat
    """
    n = 2.0 ** zoom
    lon_min = tile_x / n * 360.0 - 180.0
    lon_max = (tile_x + 1) / n * 360.0 - 180.0

    lat_rad_top = math.atan(math.sinh(math.pi * (1.0 - 2.0 * tile_y / n)))
    lat_rad_bottom = math.atan(math.sinh(math.pi * (1.0 - 2.0 * (tile_y + 1) / n)))

    lat_max = math.degrees(lat_rad_top)
    lat_min = math.degrees(lat_rad_bottom)

    return {
        "min_lon": lon_min,
        "min_lat": lat_min,
        "max_lon": lon_max,
        "max_lat": lat_max,
    }


def tile_to_bounds_mercator(tile_x: int, tile_y: int, zoom: int) -> Dict[str, float]:
    """
    Returns bounding box of a tile in Web Mercator meters.
    """
    bounds_geo = tile_to_bounds_wgs84(tile_x, tile_y, zoom)
    min_x, min_y = wgs84_to_web_mercator(bounds_geo["min_lon"], bounds_geo["min_lat"])
    max_x, max_y = wgs84_to_web_mercator(bounds_geo["max_lon"], bounds_geo["max_lat"])
    return {
        "min_x": min_x,
        "min_y": min_y,
        "max_x": max_x,
        "max_y": max_y,
    }


def lonlat_to_pixel(lon: float, lat: float, zoom: int, tile_size: int = 256) -> Tuple[float, float]:
    """
    Converts lon/lat to absolute global pixel coordinates at the given zoom level.
    """
    lat = clamp_lat(lat)
    lon = wrap_lon(lon)
    n = 2.0 ** zoom
    x = (lon + 180.0) / 360.0 * n * tile_size
    lat_rad = math.radians(lat)
    y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n * tile_size
    return x, y


def pixel_to_lonlat(pixel_x: float, pixel_y: float, zoom: int, tile_size: int = 256) -> Tuple[float, float]:
    """
    Converts absolute global pixel coordinates back to lon/lat.
    """
    n = 2.0 ** zoom
    total_px = n * tile_size
    lon = (pixel_x / total_px) * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1.0 - 2.0 * pixel_y / total_px)))
    lat = math.degrees(lat_rad)
    return wrap_lon(lon), clamp_lat(lat)


def wgs84_to_tm_korea(lon: float, lat: float) -> Tuple[float, float]:
    """
    Transverse Mercator projection for Korea Central Origin (GRS80/EPSG:5186).
    Implemented from Gauss-Krüger formulation.
    """
    phi = math.radians(lat)
    lam = math.radians(lon)
    lam0 = KOREA_CENTRAL_LON0
    phi0 = KOREA_CENTRAL_LAT0
    k0 = KOREA_CENTRAL_K0
    a = GRS80_A
    e2 = GRS80_E2

    # Meridian distance M
    def meridian_distance(p: float) -> float:
        e4 = e2 * e2
        e6 = e4 * e2
        c0 = 1.0 - (e2 / 4.0) - (3.0 * e4 / 64.0) - (5.0 * e6 / 256.0)
        c2 = (3.0 * e2 / 8.0) + (3.0 * e4 / 32.0) + (45.0 * e6 / 1024.0)
        c4 = (15.0 * e4 / 256.0) + (45.0 * e6 / 1024.0)
        c6 = (35.0 * e6 / 3072.0)
        return a * (c0 * p - c2 * math.sin(2.0 * p) + c4 * math.sin(4.0 * p) - c6 * math.sin(6.0 * p))

    m = meridian_distance(phi)
    m0 = meridian_distance(phi0)

    delta_lam = lam - lam0
    n = a / math.sqrt(1.0 - e2 * (math.sin(phi) ** 2))
    t = math.tan(phi) ** 2
    c = (e2 / (1.0 - e2)) * (math.cos(phi) ** 2)
    a_term = delta_lam * math.cos(phi)

    # Easting (X in TM Korea convention usually easting/northing or northing/easting)
    # In standard Korean TM: Easting = Y, Northing = X
    easting = KOREA_CENTRAL_Y0 + k0 * n * (
        a_term
        + ((1.0 - t + c) * (a_term ** 3)) / 6.0
        + ((5.0 - 18.0 * t + t ** 2 + 72.0 * c - 58.0 * (e2 / (1.0 - e2))) * (a_term ** 5)) / 120.0
    )
    northing = KOREA_CENTRAL_X0 + k0 * (
        m - m0 + n * math.tan(phi) * (
            (a_term ** 2) / 2.0
            + ((5.0 - t + 9.0 * c + 4.0 * (c ** 2)) * (a_term ** 4)) / 24.0
            + ((61.0 - 58.0 * t + t ** 2 + 600.0 * c - 330.0 * (e2 / (1.0 - e2))) * (a_term ** 6)) / 720.0
        )
    )
    return easting, northing


def haversine_distance(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """
    Calculates great-circle distance between two points in meters using Haversine formula.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return WGS84_A * c


def initial_bearing(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """
    Calculates the initial compass bearing (azimuth) in degrees from point 1 to point 2 [0, 360).
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dlam = math.radians(lon2 - lon1)

    y = math.sin(dlam) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlam)
    bearing_rad = math.atan2(y, x)
    return (math.degrees(bearing_rad) + 360.0) % 360.0
