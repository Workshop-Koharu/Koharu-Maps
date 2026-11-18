import unittest
import os
from fastapi.testclient import TestClient
from server.main import app
from server.database import get_db_connection

class TestApiServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Clean test user if exists
        conn = get_db_connection()
        conn.execute("DELETE FROM users WHERE email = 'testuser@koharu.local'")
        conn.commit()
        conn.close()

    def test_01_health_check(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "online")
        self.assertTrue(data["network_independent"])

    def test_02_metadata(self):
        resp = self.client.get("/api/v1/metadata")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["engine"], "Koharu Maps Independent Cartographic Engine")
        self.assertIn("water", data["layers"])

    def test_03_features_query(self):
        resp = self.client.get("/api/v1/features?bbox=126.9,37.5,127.1,37.6")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["count"] > 0)

    def test_04_search_forward(self):
        resp = self.client.get("/api/v1/search?q=광화문")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["count"] > 0)
        self.assertEqual(data["results"][0]["name"], "광화문")

    def test_05_reverse_geocode(self):
        resp = self.client.get("/api/v1/reverse-geocode?lon=126.9768&lat=37.5750")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["found"])
        self.assertEqual(data["place"]["name"], "광화문")

    def test_06_routing_a_star(self):
        resp = self.client.get("/api/v1/route?start=126.9768,37.5750&target=127.0280,37.4980&algorithm=a_star")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["route"]["distance_m"] > 5000)
        self.assertTrue(len(data["route"]["instructions"]) >= 2)

    def test_07_favorites_auth_guard(self):
        # Unauthenticated request MUST fail with 401
        resp = self.client.get("/api/favorites")
        self.assertEqual(resp.status_code, 401)

    def test_08_auth_and_api_keys(self):
        # Register user
        reg_resp = self.client.post("/api/auth/register", json={
            "name": "테스터",
            "email": "testuser@koharu.local",
            "password": "testpassword123"
        })
        self.assertEqual(reg_resp.status_code, 200)
        token = reg_resp.json()["token"]

        headers = {"Authorization": f"Bearer {token}"}

        # Profile check
        me_resp = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["user"]["email"], "testuser@koharu.local")

        # Create Free API Key
        key_resp = self.client.post("/api/keys", json={"name": "테스트 서비스 키"}, headers=headers)
        self.assertEqual(key_resp.status_code, 200)
        api_key = key_resp.json()["key"]["key"]
        self.assertTrue(api_key.startswith("kmap_live_"))

        # Call API using X-API-Key
        api_call_resp = self.client.get("/api/v1/search?q=서울역", headers={"X-API-Key": api_key})
        self.assertEqual(api_call_resp.status_code, 200)
        self.assertTrue(api_call_resp.json()["count"] > 0)

        # Add Favorite (Authenticated)
        fav_resp = self.client.post("/api/favorites", json={
            "title": "내 단골 서울역",
            "lon": 126.9710,
            "lat": 37.5550,
            "address": "서울특별시 중구 한강대로 405",
            "memo": "자주 가는 기차역"
        }, headers=headers)
        self.assertEqual(fav_resp.status_code, 200)

        # List Favorites
        fav_list = self.client.get("/api/favorites", headers=headers)
        self.assertEqual(fav_list.status_code, 200)
        self.assertEqual(len(fav_list.json()["favorites"]), 1)

    def test_09_export_kmap_archive(self):
        resp = self.client.get("/api/v1/export/kmap")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(len(resp.content) > 100)
        # Check magic header
        self.assertEqual(resp.content[:4], b"KMAP")

if __name__ == "__main__":
    unittest.main()
