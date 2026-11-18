import unittest
from kmap_core.sample_data import build_default_dataset
from kmap_core.tile_engine import pack_kmap_package, unpack_kmap_package

class TestNavigationAndSearch(unittest.TestCase):
    def setUp(self):
        self.features, self.graph, self.geocoder = build_default_dataset()

    def test_a_star_pathfinding(self):
        # Route from Gwanghwamun (Node 1) to Gangnam Station (Node 20)
        # 1 -> 2 -> 3 -> 9 -> 25 -> 19 -> 20 (or via Hannam Bridge)
        route = self.graph.a_star_route(1, 20)
        self.assertIsNotNone(route)
        self.assertTrue(route["distance_m"] > 5000)
        self.assertTrue(len(route["coordinates"]) > 5)
        self.assertTrue(len(route["instructions"]) >= 2)
        # Check that depart and arrive instructions exist
        self.assertEqual(route["instructions"][0]["type"], "depart")
        self.assertEqual(route["instructions"][-1]["type"], "arrive")

    def test_search_and_reverse_geocode(self):
        # Search "강남역"
        results = self.geocoder.search("강남역")
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0]["name"], "강남역")

        # Search address keyword "세종대로"
        results_addr = self.geocoder.search("세종대로")
        self.assertTrue(len(results_addr) > 0)

        # Reverse geocode near Seoul City Hall (126.9784, 37.5663)
        rev = self.geocoder.reverse_geocode(126.9784, 37.5663, max_dist_m=500)
        self.assertIsNotNone(rev)
        self.assertEqual(rev["name"], "서울시청")

    def test_kmap_package_integrity(self):
        metadata = {"project": "Koharu Maps", "region": "South Korea"}
        pkg_bytes = pack_kmap_package(metadata, self.features[:10])
        unpacked = unpack_kmap_package(pkg_bytes)
        self.assertEqual(unpacked["metadata"]["project"], "Koharu Maps")
        self.assertEqual(len(unpacked["features"]), 10)

if __name__ == "__main__":
    unittest.main()
