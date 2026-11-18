"""
Koharu Maps - Comprehensive Offline Geographic Dataset Builder
Builds realistic vector features, topological road graph, and POI/address search index for Korea.
Zero external runtime dependencies.
"""

from typing import List, Tuple
from kmap_core.geometry import Feature
from kmap_core.road_graph import RoadGraph
from kmap_core.geocoder import LocalGeocoder, SearchDocument


def build_default_dataset() -> Tuple[List[Feature], RoadGraph, LocalGeocoder]:
    features: List[Feature] = []
    graph = RoadGraph()
    geocoder = LocalGeocoder()

    feat_id = 1

    # =========================================================================
    # 1. WATER LAYER (한강 및 주요 수계)
    # =========================================================================
    # 한강 본류 (강서 -> 여의도 -> 반포 -> 뚝섬 -> 잠실 -> 강동)
    han_river_polygon = [
        [
            (126.8000, 37.5850), (126.8500, 37.5650), (126.8900, 37.5450),
            (126.9200, 37.5300), (126.9600, 37.5180), (127.0000, 37.5250),
            (127.0500, 37.5300), (127.1000, 37.5400), (127.1500, 37.5500),
            (127.1550, 37.5620), (127.1050, 37.5550), (127.0520, 37.5450),
            (127.0020, 37.5380), (126.9580, 37.5320), (126.9180, 37.5420),
            (126.8880, 37.5580), (126.8480, 37.5780), (126.7980, 37.5980),
            (126.8000, 37.5850)
        ]
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="Polygon",
        coordinates=han_river_polygon,
        layer="water",
        properties={"name": "한강", "type": "river"},
        min_zoom=5, max_zoom=24
    ))
    feat_id += 1

    # 탄천
    tancheon_line = [
        (127.0650, 37.5320), (127.0670, 37.5100), (127.0720, 37.4900),
        (127.1050, 37.4500), (127.1150, 37.4000)
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="LineString",
        coordinates=tancheon_line,
        layer="water",
        properties={"name": "탄천", "type": "stream", "width": 4},
        min_zoom=9, max_zoom=24
    ))
    feat_id += 1

    # 중랑천
    jungnang_line = [
        (127.0500, 37.5380), (127.0600, 37.5600), (127.0700, 37.5900),
        (127.0750, 37.6400), (127.0680, 37.6800)
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="LineString",
        coordinates=jungnang_line,
        layer="water",
        properties={"name": "중랑천", "type": "stream", "width": 4},
        min_zoom=9, max_zoom=24
    ))
    feat_id += 1

    # 안양천
    anyang_line = [
        (126.8900, 37.5450), (126.8850, 37.5200), (126.8820, 37.4800),
        (126.8900, 37.4300)
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="LineString",
        coordinates=anyang_line,
        layer="water",
        properties={"name": "안양천", "type": "stream", "width": 4},
        min_zoom=9, max_zoom=24
    ))
    feat_id += 1

    # =========================================================================
    # 2. GREEN & PARKS LAYER (남산, 북한산, 서울숲, 여의도공원, 올림픽공원)
    # =========================================================================
    # 남산공원
    namsan_poly = [
        [
            (126.9800, 37.5450), (127.0000, 37.5460), (127.0050, 37.5580),
            (126.9880, 37.5620), (126.9750, 37.5560), (126.9800, 37.5450)
        ]
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="Polygon",
        coordinates=namsan_poly,
        layer="green",
        properties={"name": "남산공원", "type": "park"},
        min_zoom=8, max_zoom=24
    ))
    feat_id += 1

    # 서울숲
    seoul_forest_poly = [
        [
            (127.0350, 37.5400), (127.0480, 37.5400), (127.0460, 37.5480),
            (127.0340, 37.5470), (127.0350, 37.5400)
        ]
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="Polygon",
        coordinates=seoul_forest_poly,
        layer="green",
        properties={"name": "서울숲", "type": "park"},
        min_zoom=10, max_zoom=24
    ))
    feat_id += 1

    # 올림픽공원
    olympic_park_poly = [
        [
            (127.1150, 37.5150), (127.1350, 37.5160), (127.1320, 37.5280),
            (127.1120, 37.5260), (127.1150, 37.5150)
        ]
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="Polygon",
        coordinates=olympic_park_poly,
        layer="green",
        properties={"name": "올림픽공원", "type": "park"},
        min_zoom=10, max_zoom=24
    ))
    feat_id += 1

    # 여의도공원
    yeouido_park_poly = [
        [
            (126.9200, 37.5230), (126.9250, 37.5250), (126.9220, 37.5330),
            (126.9170, 37.5310), (126.9200, 37.5230)
        ]
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="Polygon",
        coordinates=yeouido_park_poly,
        layer="green",
        properties={"name": "여의도공원", "type": "park"},
        min_zoom=11, max_zoom=24
    ))
    feat_id += 1

    # 경복궁 부지
    gyeongbokgung_poly = [
        [
            (126.9730, 37.5755), (126.9800, 37.5755), (126.9800, 37.5830),
            (126.9730, 37.5830), (126.9730, 37.5755)
        ]
    ]
    features.append(Feature(
        feature_id=feat_id,
        geom_type="Polygon",
        coordinates=gyeongbokgung_poly,
        layer="green",
        properties={"name": "경복궁", "type": "historic"},
        min_zoom=12, max_zoom=24
    ))
    feat_id += 1

    # =========================================================================
    # 3. BUILDINGS LAYER (주요 랜드마크 건물 풋프린트)
    # =========================================================================
    landmarks = [
        {"name": "롯데월드타워", "lon": 127.1025, "lat": 37.5126, "w": 0.002, "h": 0.002, "levels": 123},
        {"name": "63빌딩", "lon": 126.9400, "lat": 37.5195, "w": 0.0015, "h": 0.0015, "levels": 60},
        {"name": "국회의사당", "lon": 126.9142, "lat": 37.5320, "w": 0.0025, "h": 0.002, "levels": 7},
        {"name": "서울시청", "lon": 126.9784, "lat": 37.5663, "w": 0.0012, "h": 0.0012, "levels": 13},
        {"name": "동대문디자인플라자(DDP)", "lon": 127.0098, "lat": 37.5668, "w": 0.002, "h": 0.0015, "levels": 4},
        {"name": "코엑스(COEX)", "lon": 127.0590, "lat": 37.5115, "w": 0.003, "h": 0.003, "levels": 5},
        {"name": "강남파이낸스센터", "lon": 127.0365, "lat": 37.5005, "w": 0.0012, "h": 0.0012, "levels": 45},
        {"name": "천안시청", "lon": 127.1139, "lat": 36.8151, "w": 0.0015, "h": 0.0015, "levels": 12},
    ]

    for b in landmarks:
        cx, cy, w, h = b["lon"], b["lat"], b["w"], b["h"]
        b_poly = [
            [
                (cx - w/2, cy - h/2), (cx + w/2, cy - h/2),
                (cx + w/2, cy + h/2), (cx - w/2, cy + h/2),
                (cx - w/2, cy - h/2)
            ]
        ]
        features.append(Feature(
            feature_id=feat_id,
            geom_type="Polygon",
            coordinates=b_poly,
            layer="building",
            properties={"name": b["name"], "levels": b["levels"], "height": b["levels"] * 3.5},
            min_zoom=12, max_zoom=24
        ))
        feat_id += 1

    # =========================================================================
    # 4. ROAD NETWORK & TOPOLOGICAL GRAPH (네비게이션 연동 도로망)
    # =========================================================================
    # Road network nodes (ID, Lon, Lat, Name)
    nodes_data = [
        # 서울 도심 (종로, 광화문, 시청, 서울역)
        (1, 126.9768, 37.5750, "광화문교차로"),
        (2, 126.9770, 37.5660, "서울시청교차로"),
        (3, 126.9710, 37.5550, "서울역교차로"),
        (4, 126.9850, 37.5700, "종각역교차로"),
        (5, 127.0000, 37.5700, "종로5가교차로"),
        (6, 127.0100, 37.5670, "동대문역사문화공원"),
        (7, 126.9820, 37.5630, "을지로입구교차로"),
        (8, 127.0050, 37.5630, "을지로4가교차로"),

        # 용산 / 한강진
        (9, 126.9730, 37.5350, "삼각지역교차로"),
        (10, 126.9900, 37.5330, "이태원역교차로"),
        (11, 126.9650, 37.5290, "용산역교차로"),

        # 여의도
        (12, 126.9240, 37.5215, "여의도역교차로"),
        (13, 126.9320, 37.5270, "여의나루교차로"),
        (14, 126.9150, 37.5300, "국회의사당교차로"),

        # 마포 / 신촌 / 홍대
        (15, 126.9230, 37.5570, "홍대입구역교차로"),
        (16, 126.9360, 37.5550, "신촌오거리"),
        (17, 126.9450, 37.5400, "공덕역교차로"),

        # 강남권 (신사, 논현, 강남역, 역삼, 선릉, 삼성)
        (18, 127.0210, 37.5160, "신사역사거리"),
        (19, 127.0280, 37.5045, "신논현역교차로"),
        (20, 127.0280, 37.4980, "강남역사거리"),
        (21, 127.0360, 37.5005, "역삼역교차로"),
        (22, 127.0480, 37.5045, "선릉역교차로"),
        (23, 127.0590, 37.5085, "삼성역(코엑스)사거리"),
        (24, 127.0280, 37.4850, "양재역사거리"),
        (25, 127.0100, 37.5030, "고속터미널교차로"),

        # 잠실 / 송파
        (26, 127.1000, 37.5130, "잠실역사거리"),
        (27, 127.1120, 37.5150, "올림픽공원평화의문"),

        # 고속도로 & 주요 간선
        (28, 127.0380, 37.4600, "양재IC"),
        (29, 127.1080, 37.4000, "판교IC"),
        (30, 127.1350, 36.8350, "천안IC"),
        (31, 127.1130, 36.8150, "천안시청교차로"),
        (32, 127.1490, 36.8090, "천안역삼거리"),
    ]

    for nid, lon, lat, name in nodes_data:
        graph.add_node(nid, lon, lat, name)

    # Road network edges
    # (from_node, to_node, road_name, road_type, speed_kmh, oneway)
    edges_data = [
        # 세종대로 (광화문 - 시청 - 서울역)
        (1, 2, "세종대로", "primary", 50.0, False),
        (2, 3, "세종대로", "primary", 50.0, False),
        # 종로 (광화문 - 종각 - 종로5가)
        (1, 4, "종로", "primary", 50.0, False),
        (4, 5, "종로", "primary", 50.0, False),
        # 을지로
        (2, 7, "을지로", "primary", 50.0, False),
        (7, 8, "을지로", "primary", 50.0, False),
        (8, 6, "을지로", "primary", 50.0, False),
        (5, 6, "동대문로", "secondary", 40.0, False),
        (4, 7, "남대문로", "secondary", 40.0, False),

        # 한강대로 (서울역 - 삼각지 - 용산역)
        (3, 9, "한강대로", "primary", 60.0, False),
        (9, 11, "한강대로", "primary", 60.0, False),
        (9, 10, "이태원로", "secondary", 40.0, False),

        # 신촌로 & 마포대로
        (3, 16, "충정로", "primary", 50.0, False),
        (16, 15, "신촌로", "primary", 50.0, False),
        (16, 17, "백범로", "secondary", 50.0, False),
        (17, 11, "원효로", "secondary", 40.0, False),
        (17, 12, "마포대교", "primary", 60.0, False),

        # 여의도 내부망
        (12, 13, "여의나루로", "secondary", 40.0, False),
        (12, 14, "의사당대로", "primary", 50.0, False),

        # 반포대교 & 한남대교 (강북 - 강남 연결)
        (10, 18, "한남대교", "trunk", 70.0, False),
        (9, 25, "반포대교", "trunk", 70.0, False),

        # 강남대로 (신사 - 신논현 - 강남역 - 양재역)
        (18, 19, "강남대로", "primary", 50.0, False),
        (19, 20, "강남대로", "primary", 50.0, False),
        (20, 24, "강남대로", "primary", 50.0, False),
        (25, 19, "사평대로", "primary", 50.0, False),

        # 테헤란로 (강남역 - 역삼 - 선릉 - 삼성역)
        (20, 21, "테헤란로", "primary", 50.0, False),
        (21, 22, "테헤란로", "primary", 50.0, False),
        (22, 23, "테헤란로", "primary", 50.0, False),

        # 올림픽로 (삼성역 - 잠실역 - 올림픽공원)
        (23, 26, "올림픽로", "primary", 60.0, False),
        (26, 27, "올림픽로", "primary", 50.0, False),

        # 경부고속도로 (양재 - 판교 - 천안)
        (24, 28, "경부고속도로 연결로", "trunk", 60.0, False),
        (28, 29, "경부고속도로", "motorway", 100.0, False),
        (29, 30, "경부고속도로", "motorway", 110.0, False),

        # 천안 시내 (천안IC - 천안역 - 천안시청)
        (30, 32, "천안대로", "primary", 60.0, False),
        (32, 31, "번영로", "primary", 60.0, False),
    ]

    for fn, tn, rname, rtype, spd, ow in edges_data:
        edge = graph.add_edge(fn, tn, road_name=rname, road_type=rtype, speed_kmh=spd, oneway=ow)
        # Add to vector feature rendering list
        n1 = graph.nodes[fn]
        n2 = graph.nodes[tn]
        features.append(Feature(
            feature_id=feat_id,
            geom_type="LineString",
            coordinates=[(n1.lon, n1.lat), (n2.lon, n2.lat)],
            layer="road",
            properties={
                "name": rname,
                "type": rtype,
                "speed": spd,
                "width": 6 if rtype in ["motorway", "trunk"] else (4 if rtype == "primary" else 2)
            },
            min_zoom=6 if rtype == "motorway" else (9 if rtype in ["trunk", "primary"] else 12),
            max_zoom=24
        ))
        feat_id += 1

    # =========================================================================
    # 5. POI & ADDRESS SEARCH DATABASE (Forward & Reverse Geocoder)
    # =========================================================================
    pois = [
        SearchDocument(
            doc_id="poi_1", name="광화문", category="명소",
            address="서울특별시 종로구 세종대로 172", road_name="세종대로",
            city="서울특별시", district="종로구", lon=126.9768, lat=37.5750
        ),
        SearchDocument(
            doc_id="poi_2", name="경복궁", category="역사/문화",
            address="서울특별시 종로구 사직로 161", road_name="사직로",
            city="서울특별시", district="종로구", lon=126.9770, lat=37.5796
        ),
        SearchDocument(
            doc_id="poi_3", name="서울역", category="교통",
            address="서울특별시 중구 한강대로 405", road_name="한강대로",
            city="서울특별시", district="중구", lon=126.9710, lat=37.5550
        ),
        SearchDocument(
            doc_id="poi_4", name="서울시청", category="공공기관",
            address="서울특별시 중구 세종대로 110", road_name="세종대로",
            city="서울특별시", district="중구", lon=126.9784, lat=37.5663
        ),
        SearchDocument(
            doc_id="poi_5", name="남산서울타워", category="명소",
            address="서울특별시 용산구 남산공원길 105", road_name="남산공원길",
            city="서울특별시", district="용산구", lon=126.9882, lat=37.5512
        ),
        SearchDocument(
            doc_id="poi_6", name="강남역", category="교통/상업",
            address="서울특별시 강남구 강남대로 396", road_name="강남대로",
            city="서울특별시", district="강남구", lon=127.0280, lat=37.4980
        ),
        SearchDocument(
            doc_id="poi_7", name="코엑스 (COEX)", category="전시/문화",
            address="서울특별시 강남구 영동대로 513", road_name="영동대로",
            city="서울특별시", district="강남구", lon=127.0590, lat=37.5115
        ),
        SearchDocument(
            doc_id="poi_8", name="롯데월드타워", category="명소/쇼핑",
            address="서울특별시 송파구 올림픽로 300", road_name="올림픽로",
            city="서울특별시", district="송파구", lon=127.1025, lat=37.5126
        ),
        SearchDocument(
            doc_id="poi_9", name="국회의사당", category="공공기관",
            address="서울특별시 영등포구 의사당대로 1", road_name="의사당대로",
            city="서울특별시", district="영등포구", lon=126.9142, lat=37.5320
        ),
        SearchDocument(
            doc_id="poi_10", name="홍대입구역", category="교통/상업",
            address="서울특별시 마포구 양화로 160", road_name="양화로",
            city="서울특별시", district="마포구", lon=126.9230, lat=37.5570
        ),
        SearchDocument(
            doc_id="poi_11", name="동대문디자인플라자(DDP)", category="문화",
            address="서울특별시 중구 을지로 281", road_name="을지로",
            city="서울특별시", district="중구", lon=127.0098, lat=37.5668
        ),
        SearchDocument(
            doc_id="poi_12", name="판교 테크노밸리", category="업무",
            address="경기도 성남시 분당구 판교역로 235", road_name="판교역로",
            city="성남시", district="분당구", lon=127.1080, lat=37.4000
        ),
        SearchDocument(
            doc_id="poi_13", name="천안역", category="교통",
            address="충청남도 천안시 동남구 대흥로 239", road_name="대흥로",
            city="천안시", district="동남구", lon=127.1490, lat=37.8090
        ),
        SearchDocument(
            doc_id="poi_14", name="천안시청", category="공공기관",
            address="충청남도 천안시 서북구 번영로 156", road_name="번영로",
            city="천안시", district="서북구", lon=127.1139, lat=36.8151
        ),
        SearchDocument(
            doc_id="poi_15", name="천안 성정동", category="행정구역",
            address="충청남도 천안시 서북구 성정동", road_name="서부대로",
            city="천안시", district="서북구", lon=127.1350, lat=36.8200
        ),
        SearchDocument(
            doc_id="poi_16", name="인천국제공항 제1여객터미널", category="공항",
            address="인천광역시 중구 공항로 272", road_name="공항로",
            city="인천광역시", district="중구", lon=126.4505, lat=37.4485
        ),
        SearchDocument(
            doc_id="poi_17", name="대전역", category="교통",
            address="대전광역시 동구 중앙로 215", road_name="중앙로",
            city="대전광역시", district="동구", lon=127.4342, lat=36.3315
        ),
        SearchDocument(
            doc_id="poi_18", name="부산역", category="교통",
            address="부산광역시 동구 중앙대로 206", road_name="중앙대로",
            city="부산광역시", district="동구", lon=129.0416, lat=35.1152
        ),
    ]

    for p in pois:
        geocoder.add_document(p)
        # Also add point feature to map
        features.append(Feature(
            feature_id=feat_id,
            geom_type="Point",
            coordinates=(p.lon, p.lat),
            layer="place",
            properties={"name": p.name, "category": p.category, "address": p.address},
            min_zoom=10, max_zoom=24
        ))
        feat_id += 1

    return features, graph, geocoder
