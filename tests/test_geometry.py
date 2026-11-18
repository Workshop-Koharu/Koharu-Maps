import unittest
from kmap_core.geometry import (
    BoundingBox,
    point_in_polygon,
    ramer_douglas_peucker,
    clip_line_segment,
    sutherland_hodgman_polygon_clip,
    convex_hull
)

class TestGeometry(unittest.TestCase):
    def test_point_in_polygon(self):
        poly = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]
        self.assertTrue(point_in_polygon(5.0, 5.0, poly))
        self.assertFalse(point_in_polygon(15.0, 5.0, poly))
        self.assertFalse(point_in_polygon(-1.0, 5.0, poly))

    def test_ramer_douglas_peucker(self):
        line = [(0, 0), (1, 0.1), (2, -0.1), (3, 0), (4, 5), (5, 0)]
        simplified = ramer_douglas_peucker(line, epsilon=0.5)
        # Should keep start, peak (4, 5), and end
        self.assertTrue(len(simplified) < len(line))
        self.assertIn((4, 5), simplified)

    def test_clip_line(self):
        bbox = BoundingBox(0, 0, 10, 10)
        # Segment crossing through box
        res = clip_line_segment((-5, 5), (15, 5), bbox)
        self.assertIsNotNone(res)
        p1, p2 = res
        self.assertAlmostEqual(p1[0], 0.0)
        self.assertAlmostEqual(p2[0], 10.0)

    def test_convex_hull(self):
        pts = [(0, 0), (2, 0), (2, 2), (0, 2), (1, 1)]
        hull = convex_hull(pts)
        self.assertEqual(len(hull), 4)

if __name__ == "__main__":
    unittest.main()
