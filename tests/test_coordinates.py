import unittest
import math
from kmap_core.coordinates import (
    wgs84_to_web_mercator,
    web_mercator_to_wgs84,
    lonlat_to_tile,
    tile_to_bounds_wgs84,
    haversine_distance,
    initial_bearing,
    wgs84_to_tm_korea,
)

class TestCoordinates(unittest.TestCase):
    def test_mercator_roundtrip(self):
        # Seoul City Hall approx (126.9784, 37.5663)
        lon, lat = 126.9784, 37.5663
        mx, my = wgs84_to_web_mercator(lon, lat)
        rt_lon, rt_lat = web_mercator_to_wgs84(mx, my)
        self.assertAlmostEqual(lon, rt_lon, places=5)
        self.assertAlmostEqual(lat, rt_lat, places=5)

    def test_tile_math(self):
        lon, lat = 126.9784, 37.5663
        zoom = 14
        tx, ty = lonlat_to_tile(lon, lat, zoom)
        bounds = tile_to_bounds_wgs84(tx, ty, zoom)
        self.assertTrue(bounds["min_lon"] <= lon <= bounds["max_lon"])
        self.assertTrue(bounds["min_lat"] <= lat <= bounds["max_lat"])

    def test_haversine(self):
        # Seoul to Busan approx 325km
        seoul_lon, seoul_lat = 126.9784, 37.5663
        busan_lon, busan_lat = 129.0416, 35.1152
        dist = haversine_distance(seoul_lon, seoul_lat, busan_lon, busan_lat)
        # Should be between 300km and 350km
        self.assertTrue(300000 < dist < 350000)

    def test_bearing(self):
        # Due North
        b_north = initial_bearing(127.0, 37.0, 127.0, 38.0)
        self.assertAlmostEqual(b_north, 0.0, places=1)
        # Due East
        b_east = initial_bearing(127.0, 37.0, 128.0, 37.0)
        self.assertAlmostEqual(b_east, 90.0, delta=1.0)

    def test_tm_korea(self):
        easting, northing = wgs84_to_tm_korea(127.5, 38.0)
        # At origin (127.5, 38.0), false easting = 200,000, false northing = 1,000,000
        self.assertAlmostEqual(easting, 200000.0, delta=10.0)
        self.assertAlmostEqual(northing, 1000000.0, delta=10.0)

if __name__ == "__main__":
    unittest.main()
