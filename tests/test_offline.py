import unittest
import socket
from unittest.mock import patch
from server.gis_state import spatial_index, tile_engine, road_graph, geocoder
from kmap_core.geometry import BoundingBox

class TestOfflineIntegrity(unittest.TestCase):
    def test_zero_network_dependency(self):
        """
        Simulate complete network disconnection by blocking socket.socket creation.
        Core GIS algorithms must still perform flawlessly.
        """
        def blocked_socket(*args, **kwargs):
            raise OSError("Network unreachable (Simulated Air-Gapped Offline Mode)")

        with patch("socket.socket", side_effect=blocked_socket):
            # 1. Search Query must succeed offline
            search_res = geocoder.search("강남역")
            self.assertTrue(len(search_res) > 0)
            self.assertEqual(search_res[0]["name"], "강남역")

            # 2. Reverse geocoding must succeed offline
            rev_res = geocoder.reverse_geocode(126.9784, 37.5663)
            self.assertIsNotNone(rev_res)

            # 3. Pathfinding must succeed offline
            route_res = road_graph.a_star_route(1, 20)
            self.assertIsNotNone(route_res)
            self.assertTrue(route_res["distance_m"] > 0)

            # 4. Vector Tile Slicing must succeed offline
            tile_res = tile_engine.get_tile_data(13, 7120, 3190)
            self.assertIn("layers", tile_res)

            # 5. Spatial Index BBox query must succeed offline
            features = spatial_index.query(BoundingBox(126.9, 37.5, 127.1, 37.6))
            self.assertTrue(len(features) > 0)

if __name__ == "__main__":
    unittest.main()
