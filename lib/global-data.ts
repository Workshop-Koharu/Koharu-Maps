/**
 * Koharu Maps - Global & Regional Cartographic Master Dataset
 * Provides global continents, world metropolises, high-density Korea road network, and landmarks.
 * Zero external tile servers or geocoders.
 */

import { MapFeature, RoadGraph, haversineDistance } from './gis-engine';

export interface SearchPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  country: string;
  lon: number;
  lat: number;
}

export function buildGlobalMasterDataset(): {
  features: MapFeature[];
  roadGraph: RoadGraph;
  searchIndex: SearchPlace[];
} {
  const features: MapFeature[] = [];
  const roadGraph = new RoadGraph();
  const searchIndex: SearchPlace[] = [];

  let idCounter = 1;

  // =========================================================================
  // 1. GLOBAL CONTINENTS & OCEANS (World Coverage at Zoom 0~8)
  // =========================================================================
  const continents: { name: string; polygon: [number, number][] }[] = [
    // Eurasia simplified
    {
      name: 'Eurasia',
      polygon: [
        [-10, 36], [10, 36], [30, 30], [50, 25], [75, 10], [100, 5],
        [120, 20], [130, 35], [145, 45], [170, 65], [180, 70],
        [140, 75], [90, 75], [40, 70], [10, 70], [-10, 60], [-10, 36]
      ]
    },
    // Africa
    {
      name: 'Africa',
      polygon: [
        [-17, 15], [-5, 36], [30, 32], [50, 12], [40, -10],
        [20, -35], [18, -34], [10, 5], [-17, 15]
      ]
    },
    // North America
    {
      name: 'North America',
      polygon: [
        [-168, 65], [-140, 70], [-90, 75], [-60, 60], [-55, 45],
        [-75, 35], [-80, 25], [-97, 20], [-105, 20], [-120, 35],
        [-130, 50], [-168, 65]
      ]
    },
    // South America
    {
      name: 'South America',
      polygon: [
        [-80, 8], [-60, 10], [-35, -5], [-40, -22], [-55, -35],
        [-68, -55], [-75, -45], [-80, -5], [-80, 8]
      ]
    },
    // Australia
    {
      name: 'Australia',
      polygon: [
        [115, -22], [130, -12], [145, -15], [153, -28], [150, -38],
        [138, -35], [115, -35], [113, -25], [115, -22]
      ]
    },
    // Korean Peninsula (High Detail)
    {
      name: '대한민국',
      polygon: [
        [126.1, 37.8], [128.4, 38.6], [129.4, 36.1], [129.0, 35.1],
        [127.8, 34.8], [126.3, 34.5], [126.5, 36.0], [126.6, 37.5],
        [126.1, 37.8]
      ]
    },
    // Jeju Island
    {
      name: '제주특별자치도',
      polygon: [
        [126.15, 33.30], [126.90, 33.50], [126.95, 33.45],
        [126.55, 33.20], [126.15, 33.30]
      ]
    }
  ];

  continents.forEach(c => {
    features.push({
      id: `cont_${idCounter++}`,
      type: 'Polygon',
      layer: 'continent',
      coordinates: [c.polygon],
      properties: { name: c.name },
      minZoom: 0,
      maxZoom: 9,
    });
  });

  // =========================================================================
  // 2. WORLD METROPOLISES (Global POIs & Landmarks)
  // =========================================================================
  const globalCities: SearchPlace[] = [
    { id: 'city_1', name: '서울특별시', category: '수도/대도시', address: '대한민국 서울특별시', city: '서울', country: '대한민국', lon: 126.9784, lat: 37.5663 },
    { id: 'city_2', name: '도쿄 (Tokyo)', category: '수도/대도시', address: '일본 도쿄도', city: 'Tokyo', country: '일본', lon: 139.6917, lat: 35.6895 },
    { id: 'city_3', name: '뉴욕 (New York)', category: '글로벌 대도시', address: '미국 뉴욕주 뉴욕시', city: 'New York', country: '미국', lon: -74.0060, lat: 40.7128 },
    { id: 'city_4', name: '런던 (London)', category: '수도/대도시', address: '영국 그레이터런던', city: 'London', country: '영국', lon: -0.1278, lat: 51.5074 },
    { id: 'city_5', name: '파리 (Paris)', category: '수도/대도시', address: '프랑스 일드프랑스 파리', city: 'Paris', country: '프랑스', lon: 2.3522, lat: 48.8566 },
    { id: 'city_6', name: '싱가포르 (Singapore)', category: '글로벌 도시국가', address: '싱가포르', city: 'Singapore', country: '싱가포르', lon: 103.8198, lat: 1.3521 },
    { id: 'city_7', name: '시드니 (Sydney)', category: '글로벌 대도시', address: '호주 뉴사우스웨일스 시드니', city: 'Sydney', country: '호주', lon: 151.2093, lat: -33.8688 },
    { id: 'city_8', name: '베이징 (Beijing)', category: '수도/대도시', address: '중국 베이징시', city: 'Beijing', country: '중국', lon: 116.4074, lat: 39.9042 },
    { id: 'city_9', name: '베를린 (Berlin)', category: '수도/대도시', address: '독일 베를린', city: 'Berlin', country: '독일', lon: 13.4050, lat: 52.5200 },
    { id: 'city_10', name: '샌프란시스코 (San Francisco)', category: '기술/문화 중심', address: '미국 캘리포니아주 샌프란시스코', city: 'San Francisco', country: '미국', lon: -122.4194, lat: 37.7749 },
  ];

  globalCities.forEach(city => {
    searchIndex.push(city);
    features.push({
      id: `gcity_${idCounter++}`,
      type: 'Point',
      layer: 'place',
      coordinates: [city.lon, city.lat],
      properties: { name: city.name, category: city.category, address: city.address },
      minZoom: 2,
      maxZoom: 24,
    });
  });

  // =========================================================================
  // 3. KOREA HIGH-PRECISION WATERWAYS & PARKS
  // =========================================================================
  // 한강
  const hanRiver = [
    [126.8000, 37.5850], [126.8500, 37.5650], [126.8900, 37.5450],
    [126.9200, 37.5300], [126.9600, 37.5180], [127.0000, 37.5250],
    [127.0500, 37.5300], [127.1000, 37.5400], [127.1500, 37.5500],
    [127.1550, 37.5620], [127.1050, 37.5550], [127.0520, 37.5450],
    [127.0020, 37.5380], [126.9580, 37.5320], [126.9180, 37.5420],
    [126.8880, 37.5580], [126.8480, 37.5780], [126.7980, 37.5980],
    [126.8000, 37.5850]
  ];
  features.push({
    id: `water_${idCounter++}`,
    type: 'Polygon',
    layer: 'water',
    coordinates: [hanRiver],
    properties: { name: '한강', type: 'river' },
    minZoom: 6,
    maxZoom: 24,
  });

  // 녹지 (남산공원, 서울숲, 올림픽공원, 여의도공원)
  const parks = [
    {
      name: '남산공원',
      polygon: [
        [126.9800, 37.5450], [127.0000, 37.5460], [127.0050, 37.5580],
        [126.9880, 37.5620], [126.9750, 37.5560], [126.9800, 37.5450]
      ]
    },
    {
      name: '서울숲',
      polygon: [
        [127.0350, 37.5400], [127.0480, 37.5400], [127.0460, 37.5480],
        [127.0340, 37.5470], [127.0350, 37.5400]
      ]
    },
    {
      name: '올림픽공원',
      polygon: [
        [127.1150, 37.5150], [127.1350, 37.5160], [127.1320, 37.5280],
        [127.1120, 37.5260], [127.1150, 37.5150]
      ]
    },
    {
      name: '여의도공원',
      polygon: [
        [126.9200, 37.5230], [126.9250, 37.5250], [126.9220, 37.5330],
        [126.9170, 37.5310], [126.9200, 37.5230]
      ]
    }
  ];

  parks.forEach(p => {
    features.push({
      id: `park_${idCounter++}`,
      type: 'Polygon',
      layer: 'green',
      coordinates: [p.polygon],
      properties: { name: p.name, type: 'park' },
      minZoom: 9,
      maxZoom: 24,
    });
  });

  // =========================================================================
  // 4. LANDMARKS & 2.5D BUILDINGS
  // =========================================================================
  const landmarkBuildings = [
    { name: '롯데월드타워', lon: 127.1025, lat: 37.5126, w: 0.002, h: 0.002, levels: 123 },
    { name: '63빌딩', lon: 126.9400, lat: 37.5195, w: 0.0015, h: 0.0015, levels: 60 },
    { name: '국회의사당', lon: 126.9142, lat: 37.5320, w: 0.0025, h: 0.002, levels: 7 },
    { name: '서울시청', lon: 126.9784, lat: 37.5663, w: 0.0012, h: 0.0012, levels: 13 },
    { name: 'DDP(동대문디자인플라자)', lon: 127.0098, lat: 37.5668, w: 0.002, h: 0.0015, levels: 4 },
    { name: '코엑스(COEX)', lon: 127.0590, lat: 37.5115, w: 0.003, h: 0.003, levels: 5 },
    { name: '광화문', lon: 126.9768, lat: 37.5750, w: 0.0015, h: 0.0012, levels: 2 },
  ];

  landmarkBuildings.forEach(b => {
    const hw = b.w / 2;
    const hh = b.h / 2;
    const poly = [
      [b.lon - hw, b.lat - hh], [b.lon + hw, b.lat - hh],
      [b.lon + hw, b.lat + hh], [b.lon - hw, b.lat + hh],
      [b.lon - hw, b.lat - hh]
    ];
    features.push({
      id: `bldg_${idCounter++}`,
      type: 'Polygon',
      layer: 'building',
      coordinates: [poly],
      properties: { name: b.name, levels: b.levels },
      minZoom: 11,
      maxZoom: 24,
    });
  });

  // =========================================================================
  // 5. ROAD NETWORK GRAPH & VECTOR ROADS (Seoul & Expressway Network)
  // =========================================================================
  const roadNodes = [
    [1, 126.9768, 37.5750, '광화문교차로'],
    [2, 126.9770, 37.5660, '서울시청교차로'],
    [3, 126.9710, 37.5550, '서울역교차로'],
    [4, 126.9850, 37.5700, '종각역교차로'],
    [5, 127.0000, 37.5700, '종로5가교차로'],
    [6, 127.0100, 37.5670, '동대문역사문화공원'],
    [7, 126.9820, 37.5630, '을지로입구교차로'],
    [8, 126.9730, 37.5350, '삼각지역교차로'],
    [9, 126.9900, 37.5330, '이태원역교차로'],
    [10, 126.9650, 37.5290, '용산역교차로'],
    [11, 126.9240, 37.5215, '여의도역교차로'],
    [12, 126.9150, 37.5300, '국회의사당교차로'],
    [13, 126.9230, 37.5570, '홍대입구역교차로'],
    [14, 126.9360, 37.5550, '신촌오거리'],
    [15, 127.0210, 37.5160, '신사역사거리'],
    [16, 127.0280, 37.5045, '신논현역교차로'],
    [17, 127.0280, 37.4980, '강남역사거리'],
    [18, 127.0360, 37.5005, '역삼역교차로'],
    [19, 127.0480, 37.5045, '선릉역교차로'],
    [20, 127.0590, 37.5085, '삼성역(코엑스)사거리'],
    [21, 127.0280, 37.4850, '양재역사거리'],
    [22, 127.0100, 37.5030, '고속터미널교차로'],
    [23, 127.1000, 37.5130, '잠실역사거리'],
    [24, 127.1120, 37.5150, '올림픽공원평화의문'],
    [25, 127.0380, 37.4600, '양재IC'],
    [26, 127.1080, 37.4000, '판교IC'],
    [27, 127.1350, 36.8350, '천안IC'],
    [28, 127.1139, 36.8151, '천안시청교차로'],
    [29, 127.1490, 36.8090, '천안역삼거리'],
  ] as const;

  roadNodes.forEach(([id, lon, lat, name]) => {
    roadGraph.addNode(id, lon, lat, name);
  });

  const roadEdges: [number, number, string, string, number][] = [
    [1, 2, '세종대로', 'primary', 50],
    [2, 3, '세종대로', 'primary', 50],
    [1, 4, '종로', 'primary', 50],
    [4, 5, '종로', 'primary', 50],
    [2, 7, '을지로', 'primary', 50],
    [3, 8, '한강대로', 'primary', 60],
    [8, 10, '한강대로', 'primary', 60],
    [8, 9, '이태원로', 'secondary', 40],
    [3, 14, '충정로', 'primary', 50],
    [14, 13, '신촌로', 'primary', 50],
    [9, 15, '한남대교', 'trunk', 70],
    [8, 22, '반포대교', 'trunk', 70],
    [15, 16, '강남대로', 'primary', 50],
    [16, 17, '강남대로', 'primary', 50],
    [17, 21, '강남대로', 'primary', 50],
    [22, 16, '사평대로', 'primary', 50],
    [17, 18, '테헤란로', 'primary', 50],
    [18, 19, '테헤란로', 'primary', 50],
    [19, 20, '테헤란로', 'primary', 50],
    [20, 23, '올림픽로', 'primary', 60],
    [23, 24, '올림픽로', 'primary', 60],
    [21, 25, '경부선 연결로', 'trunk', 60],
    [25, 26, '경부고속도로', 'motorway', 100],
    [26, 27, '경부고속도로', 'motorway', 110],
    [27, 29, '천안대로', 'primary', 60],
    [29, 28, '번영로', 'primary', 60],
  ];

  roadEdges.forEach(([fromId, toId, rName, rType, spd]) => {
    roadGraph.addEdge(fromId, toId, rName, rType, spd, false);

    const n1 = roadGraph.nodes.get(fromId)!;
    const n2 = roadGraph.nodes.get(toId)!;
    features.push({
      id: `road_${idCounter++}`,
      type: 'LineString',
      layer: 'road',
      coordinates: [[n1.lon, n1.lat], [n2.lon, n2.lat]],
      properties: { name: rName, type: rType, speed: spd },
      minZoom: rType === 'motorway' ? 5 : (rType === 'trunk' ? 8 : 11),
      maxZoom: 24,
    });
  });

  // =========================================================================
  // 6. DOMESTIC PLACES & ADDRESS DIRECTORY (Forward & Reverse Search)
  // =========================================================================
  const domesticPlaces: SearchPlace[] = [
    { id: 'p_1', name: '광화문', category: '명소', address: '서울특별시 종로구 세종대로 172', city: '서울', country: '대한민국', lon: 126.9768, lat: 37.5750 },
    { id: 'p_2', name: '경복궁', category: '역사/문화', address: '서울특별시 종로구 사직로 161', city: '서울', country: '대한민국', lon: 126.9770, lat: 37.5796 },
    { id: 'p_3', name: '서울역', category: '교통', address: '서울특별시 중구 한강대로 405', city: '서울', country: '대한민국', lon: 126.9710, lat: 37.5550 },
    { id: 'p_4', name: '서울시청', category: '공공기관', address: '서울특별시 중구 세종대로 110', city: '서울', country: '대한민국', lon: 126.9784, lat: 37.5663 },
    { id: 'p_5', name: '남산서울타워', category: '명소', address: '서울특별시 용산구 남산공원길 105', city: '서울', country: '대한민국', lon: 126.9882, lat: 37.5512 },
    { id: 'p_6', name: '강남역', category: '교통/상업', address: '서울특별시 강남구 강남대로 396', city: '서울', country: '대한민국', lon: 127.0280, lat: 37.4980 },
    { id: 'p_7', name: '코엑스 (COEX)', category: '전시/문화', address: '서울특별시 강남구 영동대로 513', city: '서울', country: '대한민국', lon: 127.0590, lat: 37.5115 },
    { id: 'p_8', name: '롯데월드타워', category: '명소/쇼핑', address: '서울특별시 송파구 올림픽로 300', city: '서울', country: '대한민국', lon: 127.1025, lat: 37.5126 },
    { id: 'p_9', name: '국회의사당', category: '공공기관', address: '서울특별시 영등포구 의사당대로 1', city: '서울', country: '대한민국', lon: 126.9142, lat: 37.5320 },
    { id: 'p_10', name: '홍대입구역', category: '교통/상업', address: '서울특별시 마포구 양화로 160', city: '서울', country: '대한민국', lon: 126.9230, lat: 37.5570 },
    { id: 'p_11', name: '판교 테크노밸리', category: '업무', address: '경기도 성남시 분당구 판교역로 235', city: '성남', country: '대한민국', lon: 127.1080, lat: 37.4000 },
    { id: 'p_12', name: '천안시청', category: '공공기관', address: '충청남도 천안시 서북구 번영로 156', city: '천안', country: '대한민국', lon: 127.1139, lat: 36.8151 },
    { id: 'p_13', name: '천안 성정동', category: '행정구역', address: '충청남도 천안시 서북구 성정동', city: '천안', country: '대한민국', lon: 127.1350, lat: 36.8200 },
    { id: 'p_14', name: '인천국제공항', category: '공항', address: '인천광역시 중구 공항로 272', city: '인천', country: '대한민국', lon: 126.4505, lat: 37.4485 },
    { id: 'p_15', name: '대전역', category: '교통', address: '대전광역시 동구 중앙로 215', city: '대전', country: '대한민국', lon: 127.4342, lat: 36.3315 },
    { id: 'p_16', name: '부산역', category: '교통', address: '부산광역시 동구 중앙대로 206', city: '부산', country: '대한민국', lon: 129.0416, lat: 35.1152 },
  ];

  domesticPlaces.forEach(p => {
    searchIndex.push(p);
    features.push({
      id: `poi_${idCounter++}`,
      type: 'Point',
      layer: 'place',
      coordinates: [p.lon, p.lat],
      properties: { name: p.name, category: p.category, address: p.address },
      minZoom: 10,
      maxZoom: 24,
    });
  });

  return { features, roadGraph, searchIndex };
}

// Global Singleton Dataset
let masterData: ReturnType<typeof buildGlobalMasterDataset> | null = null;

export function getMasterData() {
  if (!masterData) {
    masterData = buildGlobalMasterDataset();
  }
  return masterData;
}
