"""
Koharu Maps - Geocoding & Spatial Search Engine
Local forward and reverse geocoding, inverted index, prefix matching.
Zero external geocoding APIs.
"""

import re
import math
from typing import List, Dict, Any, Optional, Tuple
from kmap_core.coordinates import haversine_distance


class SearchDocument:
    def __init__(
        self,
        doc_id: str,
        name: str,
        category: str,
        address: str,
        lon: float,
        lat: float,
        road_name: str = "",
        city: str = "",
        district: str = ""
    ):
        self.id = doc_id
        self.name = name
        self.category = category
        self.address = address
        self.lon = lon
        self.lat = lat
        self.road_name = road_name
        self.city = city
        self.district = district

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "address": self.address,
            "road_name": self.road_name,
            "city": self.city,
            "district": self.district,
            "location": {"lon": round(self.lon, 6), "lat": round(self.lat, 6)},
        }


class LocalGeocoder:
    """Offline In-Memory Geocoding & Place Search Engine."""
    def __init__(self):
        self.docs: Dict[str, SearchDocument] = {}
        # token -> set of doc_ids
        self.inverted_index: Dict[str, set] = {}

    def _tokenize(self, text: str) -> List[str]:
        # Normalize: lowercase, remove punctuation, extract words & character bi-grams
        cleaned = re.sub(r"[^\w\s가-힣]", " ", text.lower())
        words = [w.strip() for w in cleaned.split() if w.strip()]
        tokens = set(words)
        # Add character bi-grams for Korean partial search
        for w in words:
            if len(w) >= 2:
                for i in range(len(w) - 1):
                    tokens.add(w[i:i+2])
        return list(tokens)

    def add_document(self, doc: SearchDocument):
        self.docs[doc.id] = doc
        full_text = f"{doc.name} {doc.address} {doc.road_name} {doc.city} {doc.district} {doc.category}"
        tokens = self._tokenize(full_text)
        for t in tokens:
            if t not in self.inverted_index:
                self.inverted_index[t] = set()
            self.inverted_index[t].add(doc.id)

    def search(
        self,
        query: str,
        limit: int = 10,
        center_lon: Optional[float] = None,
        center_lat: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Forward geocoding: searches places and addresses by query string.
        Optionally ranks by proximity if center_lon/lat is provided.
        """
        q_tokens = self._tokenize(query.strip())
        if not q_tokens:
            return []

        doc_scores: Dict[str, float] = {}

        for token in q_tokens:
            matched_ids = self.inverted_index.get(token, set())
            for did in matched_ids:
                doc = self.docs[did]
                score = doc_scores.get(did, 0.0)

                # Exact match bonuses
                if query.lower() in doc.name.lower():
                    score += 10.0
                if doc.name.lower().startswith(query.lower()):
                    score += 15.0
                if query.lower() in doc.address.lower():
                    score += 5.0
                score += 2.0
                doc_scores[did] = score

        if not doc_scores:
            # Fallback substring search across all docs
            q_clean = query.strip().lower()
            for did, doc in self.docs.items():
                if q_clean in doc.name.lower() or q_clean in doc.address.lower():
                    doc_scores[did] = 5.0

        results = []
        for did, score in doc_scores.items():
            doc = self.docs[did]
            dist_km = None
            if center_lon is not None and center_lat is not None:
                dist_m = haversine_distance(center_lon, center_lat, doc.lon, doc.lat)
                dist_km = round(dist_m / 1000.0, 2)
                # Boost closer results slightly
                score += max(0.0, (50.0 - dist_km) * 0.1)

            item = doc.to_dict()
            item["score"] = round(score, 2)
            if dist_km is not None:
                item["distance_km"] = dist_km
            results.append((score, item))

        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1] for r in results[:limit]]

    def reverse_geocode(self, lon: float, lat: float, max_dist_m: float = 5000.0) -> Optional[Dict[str, Any]]:
        """
        Reverse geocoding: finds closest place and address for a given coordinate.
        """
        best_doc = None
        min_dist = float("inf")

        for doc in self.docs.values():
            dist = haversine_distance(lon, lat, doc.lon, doc.lat)
            if dist < min_dist and dist <= max_dist_m:
                min_dist = dist
                best_doc = doc

        if best_doc:
            res = best_doc.to_dict()
            res["distance_m"] = round(min_dist, 1)
            return res
        return None
