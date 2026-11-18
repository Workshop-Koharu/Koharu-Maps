/**
 * Koharu Maps - Global & Regional Cartographic Master Dataset
 * Developed by KCS - Koharu Coding Server
 * Features: Continents, Oceans, Countries, Metropolises, 3D Buildings, Parks, Rivers, High-Density Road Network, Nationwide Korean & Global Landmarks
 */

import { MapFeature, RoadGraph, haversineDistance } from './gis-engine';

export interface PlaceReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  likes: number;
}

export interface SearchPlace {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  address: string;
  city: string;
  country: string;
  lon: number;
  lat: number;
  rating?: number;
  reviewCount?: number;
  photo?: string;
  phone?: string;
  hours?: string;
  menu?: string[];
  facilities?: string[];
  reviews?: PlaceReview[];
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
  // 1. WORLD CONTINENTAL LANDMASSES (Vector Cartography at Zoom 0 ~ 10)
  // =========================================================================
  const continents: { name: string; polygon: [number, number][] }[] = [
    // Eurasia
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
    // Antarctica
    {
      name: 'Antarctica',
      polygon: [
        [-180, -65], [180, -65], [180, -85], [-180, -85], [-180, -65]
      ]
    },
    // Korean Peninsula (High Detail Vector Landmass)
    {
      name: '대한민국',
      polygon: [
        [125.8, 38.2], [128.4, 38.6], [129.4, 36.1], [129.2, 35.1],
        [128.5, 34.8], [127.8, 34.7], [126.3, 34.3], [126.1, 35.5],
        [126.5, 36.8], [126.6, 37.6], [125.8, 38.2]
      ]
    },
    // Jeju Island
    {
      name: '제주특별자치도',
      polygon: [
        [126.15, 33.30], [126.55, 33.55], [126.95, 33.45],
        [126.90, 33.20], [126.15, 33.30]
      ]
    },
    // Japan
    {
      name: '일본 열도',
      polygon: [
        [130.5, 33.2], [132.5, 34.5], [135.5, 35.5], [139.0, 35.5],
        [141.5, 38.5], [141.0, 41.5], [145.0, 44.0], [141.0, 45.5],
        [139.5, 41.5], [136.5, 36.5], [131.0, 34.0], [130.5, 33.2]
      ]
    }
  ];

  continents.forEach(c => {
    features.push({
      id: `cont_${idCounter++}`,
      type: 'Polygon',
      layer: 'continent',
      coordinates: [c.polygon],
      properties: { name: c.name, kind: 'continent' },
      minZoom: 0,
      maxZoom: 14,
    });
  });

  // =========================================================================
  // 2. WORLD COUNTRIES & MAJOR OCEANS (Shown at zoom levels: 1 ~ 6)
  // =========================================================================
  const worldCountries: { name: string; lon: number; lat: number }[] = [
    { name: '대한민국', lon: 127.7669, lat: 35.9078 },
    { name: '일본', lon: 138.2529, lat: 36.2048 },
    { name: '중국', lon: 104.1954, lat: 35.8617 },
    { name: '미국', lon: -95.7129, lat: 37.0902 },
    { name: '캐나다', lon: -106.3468, lat: 56.1304 },
    { name: '러시아', lon: 105.3188, lat: 61.5240 },
    { name: '영국', lon: -3.4360, lat: 55.3781 },
    { name: '프랑스', lon: 2.2137, lat: 46.2276 },
    { name: '독일', lon: 10.4515, lat: 51.1657 },
    { name: '호주', lon: 133.7751, lat: -25.2744 },
    { name: '인도', lon: 78.9629, lat: 20.5937 },
    { name: '브라질', lon: -51.9253, lat: -14.2350 },
    { name: '멕시코', lon: -102.5528, lat: 23.6345 },
    { name: '이집트', lon: 30.8025, lat: 26.8206 },
    { name: '남아프리카 공화국', lon: 22.9375, lat: -30.5595 },
    { name: '사우디아라비아', lon: 45.0792, lat: 23.8859 },
    { name: '인도네시아', lon: 113.9213, lat: -0.7893 },
    { name: '이탈리아', lon: 12.5674, lat: 41.8719 },
    { name: '스페인', lon: -3.7492, lat: 40.4637 },
    { name: '터키', lon: 35.2433, lat: 38.9637 },
    { name: '베트남', lon: 108.2772, lat: 14.0583 },
    { name: '태국', lon: 100.9925, lat: 15.8700 },
    { name: '필리핀', lon: 121.7740, lat: 12.8797 },
    { name: '아르헨티나', lon: -63.6167, lat: -38.4161 },
    { name: '뉴질랜드', lon: 174.8860, lat: -40.9006 },
  ];

  worldCountries.forEach((c) => {
    features.push({
      id: `country_${idCounter++}`,
      type: 'Point',
      layer: 'country',
      coordinates: [c.lon, c.lat],
      properties: { name: c.name, kind: 'country' },
      minZoom: 1,
      maxZoom: 6,
    });
    searchIndex.push({
      id: `c_${idCounter}`,
      name: c.name,
      category: '국가',
      address: c.name,
      city: c.name,
      country: c.name,
      lon: c.lon,
      lat: c.lat,
    });
  });

  const worldOceans: { name: string; lon: number; lat: number }[] = [
    { name: '태평양 (Pacific Ocean)', lon: -160.0, lat: 10.0 },
    { name: '대서양 (Atlantic Ocean)', lon: -30.0, lat: 20.0 },
    { name: '인도양 (Indian Ocean)', lon: 75.0, lat: -15.0 },
    { name: '북극해 (Arctic Ocean)', lon: 0.0, lat: 80.0 },
    { name: '남극해 (Southern Ocean)', lon: 0.0, lat: -65.0 },
  ];

  worldOceans.forEach((o) => {
    features.push({
      id: `ocean_${idCounter++}`,
      type: 'Point',
      layer: 'ocean',
      coordinates: [o.lon, o.lat],
      properties: { name: o.name, kind: 'ocean' },
      minZoom: 1,
      maxZoom: 5,
    });
  });

  // =========================================================================
  // 3. GLOBAL METROPOLISES (Shown at zoom levels: 5 ~ 10)
  // =========================================================================
  const globalCities: SearchPlace[] = [
    { id: 'gc_1', name: '서울', category: '수도/대도시', address: '대한민국 서울특별시', city: '서울', country: '대한민국', lon: 126.9780, lat: 37.5665 },
    { id: 'gc_2', name: '부산', category: '대도시/항구', address: '대한민국 부산광역시', city: '부산', country: '대한민국', lon: 129.0756, lat: 35.1796 },
    { id: 'gc_3', name: '인천', category: '대도시/국제공항', address: '대한민국 인천광역시', city: '인천', country: '대한민국', lon: 126.7052, lat: 37.4563 },
    { id: 'gc_4', name: '대구', category: '대도시', address: '대한민국 대구광역시', city: '대구', country: '대한민국', lon: 128.6014, lat: 35.8714 },
    { id: 'gc_5', name: '대전', category: '연구단지/대도시', address: '대한민국 대전광역시', city: '대전', country: '대한민국', lon: 127.3845, lat: 36.3504 },
    { id: 'gc_6', name: '광주', category: '대도시', address: '대한민국 광주광역시', city: '광주', country: '대한민국', lon: 126.8526, lat: 35.1595 },
    { id: 'gc_7', name: '울산', category: '산업수도', address: '대한민국 울산광역시', city: '울산', country: '대한민국', lon: 129.3114, lat: 35.5384 },
    { id: 'gc_8', name: '세종', category: '행정수도', address: '대한민국 세종특별자치시', city: '세종', country: '대한민국', lon: 127.2890, lat: 36.4800 },
    { id: 'gc_9', name: '수원', category: '역사/첨단도시', address: '대한민국 경기도 수원시', city: '수원', country: '대한민국', lon: 127.0286, lat: 37.2636 },
    { id: 'gc_10', name: '성남/판교', category: 'IT/첨단산업', address: '대한민국 경기도 성남시', city: '성남', country: '대한민국', lon: 127.1265, lat: 37.4200 },
    { id: 'gc_11', name: '춘천', category: '호반도시', address: '대한민국 강원특별자치도 춘천시', city: '춘천', country: '대한민국', lon: 127.7300, lat: 37.8813 },
    { id: 'gc_12', name: '강릉', category: '관광/해변도시', address: '대한민국 강원특별자치도 강릉시', city: '강릉', country: '대한민국', lon: 128.8760, lat: 37.7519 },
    { id: 'gc_13', name: '청주', category: '교육/문화도시', address: '대한민국 충청북도 청주시', city: '청주', country: '대한민국', lon: 127.4897, lat: 36.6424 },
    { id: 'gc_14', name: '천안', category: '교통요충지', address: '대한민국 충청남도 천안시', city: '천안', country: '대한민국', lon: 127.1528, lat: 36.8151 },
    { id: 'gc_15', name: '전주', category: '전통/미식도시', address: '대한민국 전북특별자치도 전주시', city: '전주', country: '대한민국', lon: 127.1480, lat: 35.8242 },
    { id: 'gc_16', name: '여수', category: '해양관광도시', address: '대한민국 전라남도 여수시', city: '여수', country: '대한민국', lon: 127.6622, lat: 34.7604 },
    { id: 'gc_17', name: '경주', category: '천년고도', address: '대한민국 경상북도 경주시', city: '경주', country: '대한민국', lon: 129.2247, lat: 35.8562 },
    { id: 'gc_18', name: '창원', category: '기계산업도시', address: '대한민국 경상남도 창원시', city: '창원', country: '대한민국', lon: 128.6811, lat: 35.2280 },
    { id: 'gc_19', name: '제주', category: '세계자연유산', address: '대한민국 제주특별자치도 제주시', city: '제주', country: '대한민국', lon: 126.5312, lat: 33.4996 },
    { id: 'gc_20', name: '도쿄 (Tokyo)', category: '글로벌 대도시', address: '일본 도쿄도', city: '도쿄', country: '일본', lon: 139.6917, lat: 35.6895 },
    { id: 'gc_21', name: '오사카 (Osaka)', category: '대도시', address: '일본 오사카부', city: '오사카', country: '일본', lon: 135.5023, lat: 34.6937 },
    { id: 'gc_22', name: '베이징 (Beijing)', category: '수도', address: '중국 베이징시', city: '베이징', country: '중국', lon: 116.4074, lat: 39.9042 },
    { id: 'gc_23', name: '상하이 (Shanghai)', category: '경제수도', address: '중국 상하이시', city: '상하이', country: '중국', lon: 121.4737, lat: 31.2304 },
    { id: 'gc_24', name: '뉴욕 (New York)', category: '글로벌 금융수도', address: '미국 뉴욕주 뉴욕시', city: '뉴욕', country: '미국', lon: -74.0060, lat: 40.7128 },
    { id: 'gc_25', name: '런던 (London)', category: '유럽 대도시', address: '영국 런던', city: '런던', country: '영국', lon: -0.1276, lat: 51.5074 },
    { id: 'gc_26', name: '파리 (Paris)', category: '문화수도', address: '프랑스 파리', city: '파리', country: '프랑스', lon: 2.3522, lat: 48.8566 },
  ];

  globalCities.forEach((city) => {
    searchIndex.push(city);
    features.push({
      id: `gcity_${idCounter++}`,
      type: 'Point',
      layer: 'city',
      coordinates: [city.lon, city.lat],
      properties: { name: city.name, category: city.category, address: city.address, kind: 'city' },
      minZoom: 5,
      maxZoom: 14,
    });
  });

  // =========================================================================
  // 4. WATERWAYS & GREEN PARKS (For Vector Cartography)
  // =========================================================================
  features.push({
    id: `river_han`,
    type: 'Polygon',
    layer: 'water',
    coordinates: [[
      [126.82, 37.58], [126.88, 37.55], [126.93, 37.52], [126.98, 37.51],
      [127.02, 37.53], [127.07, 37.53], [127.14, 37.57], [127.13, 37.56],
      [127.06, 37.51], [127.01, 37.49], [126.95, 37.49], [126.88, 37.53],
      [126.82, 37.58]
    ]],
    properties: { name: '한강 (Han River)' },
    minZoom: 9,
    maxZoom: 24,
  });

  features.push({
    id: `park_namsan`,
    type: 'Polygon',
    layer: 'green',
    coordinates: [[
      [126.975, 37.555], [126.995, 37.558], [127.005, 37.548],
      [126.990, 37.545], [126.975, 37.555]
    ]],
    properties: { name: '남산공원' },
    minZoom: 11,
    maxZoom: 24,
  });

  features.push({
    id: `park_yeouido`,
    type: 'Polygon',
    layer: 'green',
    coordinates: [[
      [126.920, 37.530], [126.940, 37.525], [126.935, 37.518],
      [126.918, 37.522], [126.920, 37.530]
    ]],
    properties: { name: '여의도공원' },
    minZoom: 12,
    maxZoom: 24,
  });

  // =========================================================================
  // 5. 3D SKYSCRAPER BUILDINGS (Extruded 3D Isometric Buildings for 3D Mode)
  // =========================================================================
  const landmark3DBuildings = [
    {
      name: '롯데월드타워',
      lon: 127.1025,
      lat: 37.5125,
      height: 555,
      footprintW: 0.0016,
      footprintH: 0.0012,
      roofColor: '#60a5fa',
      wallColor: '#2563eb',
    },
    {
      name: '여의도 63빌딩',
      lon: 126.9400,
      lat: 37.5195,
      height: 250,
      footprintW: 0.0012,
      footprintH: 0.0010,
      roofColor: '#fbbf24',
      wallColor: '#d97706',
    },
    {
      name: '파크원 타워 1',
      lon: 126.9270,
      lat: 37.5255,
      height: 333,
      footprintW: 0.0012,
      footprintH: 0.0010,
      roofColor: '#f87171',
      wallColor: '#dc2626',
    },
    {
      name: 'N서울타워',
      lon: 126.9882,
      lat: 37.5512,
      height: 236,
      footprintW: 0.0008,
      footprintH: 0.0008,
      roofColor: '#38bdf8',
      wallColor: '#0284c7',
    },
    {
      name: '강남파이낸스센터',
      lon: 127.0360,
      lat: 37.5005,
      height: 204,
      footprintW: 0.0014,
      footprintH: 0.0010,
      roofColor: '#94a3b8',
      wallColor: '#475569',
    },
    {
      name: '트레이드타워 (COEX)',
      lon: 127.0595,
      lat: 37.5100,
      height: 228,
      footprintW: 0.0012,
      footprintH: 0.0010,
      roofColor: '#38bdf8',
      wallColor: '#1d4ed8',
    },
    {
      name: '광화문 D타워',
      lon: 126.9790,
      lat: 37.5710,
      height: 105,
      footprintW: 0.0010,
      footprintH: 0.0008,
      roofColor: '#94a3b8',
      wallColor: '#334155',
    },
    {
      name: '서울시청 본관',
      lon: 126.9784,
      lat: 37.5663,
      height: 70,
      footprintW: 0.0014,
      footprintH: 0.0010,
      roofColor: '#34d399',
      wallColor: '#059669',
    },
    {
      name: '도쿄 스카이트리',
      lon: 139.8107,
      lat: 35.7100,
      height: 634,
      footprintW: 0.0016,
      footprintH: 0.0012,
      roofColor: '#38bdf8',
      wallColor: '#0284c7',
    },
    {
      name: '도쿄타워',
      lon: 139.7454,
      lat: 35.6586,
      height: 333,
      footprintW: 0.0012,
      footprintH: 0.0010,
      roofColor: '#ef4444',
      wallColor: '#dc2626',
    },
    {
      name: '원 월드 트레이드 센터',
      lon: -74.0134,
      lat: 40.7127,
      height: 541,
      footprintW: 0.0015,
      footprintH: 0.0012,
      roofColor: '#60a5fa',
      wallColor: '#1d4ed8',
    },
    {
      name: '엠파이어 스테이트 빌딩',
      lon: -73.9857,
      lat: 40.7484,
      height: 381,
      footprintW: 0.0014,
      footprintH: 0.0010,
      roofColor: '#fbbf24',
      wallColor: '#b45309',
    },
  ];

  landmark3DBuildings.forEach(b => {
    const hw = b.footprintW / 2;
    const hh = b.footprintH / 2;
    features.push({
      id: `bldg_${idCounter++}`,
      type: 'Polygon',
      layer: 'building',
      coordinates: [[
        [b.lon - hw, b.lat - hh],
        [b.lon + hw, b.lat - hh],
        [b.lon + hw, b.lat + hh],
        [b.lon - hw, b.lat + hh],
        [b.lon - hw, b.lat - hh]
      ]],
      properties: {
        name: b.name,
        height: b.height,
        roofColor: b.roofColor,
        wallColor: b.wallColor,
      },
      minZoom: 11,
      maxZoom: 24,
    });
  });

  // =========================================================================
  // 6. HIGH-DENSITY ROAD NETWORK (A* Routing Graph)
  // =========================================================================
  const koreaRoadNodes = [
    { id: 'rn_1', name: '광화문 교차로', lon: 126.9768, lat: 37.5750 },
    { id: 'rn_2', name: '세종대로 사거리', lon: 126.9772, lat: 37.5700 },
    { id: 'rn_3', name: '시청역 삼거리', lon: 126.9770, lat: 37.5645 },
    { id: 'rn_4', name: '서울역 교차로', lon: 126.9710, lat: 37.5550 },
    { id: 'rn_5', name: '숙대입구역 사거리', lon: 126.9720, lat: 37.5450 },
    { id: 'rn_6', name: '삼각지역 교차로', lon: 126.9735, lat: 37.5350 },
    { id: 'rn_7', name: '용산역 삼거리', lon: 126.9640, lat: 37.5298 },
    { id: 'rn_8', name: '한강대교 북단', lon: 126.9600, lat: 37.5200 },
    { id: 'rn_9', name: '한강대교 남단', lon: 126.9530, lat: 37.5100 },
    { id: 'rn_10', name: '노량진역 사거리', lon: 126.9420, lat: 37.5135 },
    { id: 'rn_11', name: '올림픽대로 여의나루', lon: 126.9320, lat: 37.5270 },
    { id: 'rn_12', name: '반포대교 남단', lon: 127.0000, lat: 37.5080 },
    { id: 'rn_13', name: '고속터미널 사거리', lon: 127.0050, lat: 37.5040 },
    { id: 'rn_14', name: '신사역 사거리', lon: 127.0200, lat: 37.5160 },
    { id: 'rn_15', name: '논현역 교차로', lon: 127.0220, lat: 37.5110 },
    { id: 'rn_16', name: '신논현역 사거리', lon: 127.0250, lat: 37.5045 },
    { id: 'rn_17', name: '강남역 사거리', lon: 127.0280, lat: 37.4980 },
    { id: 'rn_18', name: '양재IC (경부고속도로)', lon: 127.0420, lat: 37.4700 },
    { id: 'rn_19', name: '천안IC (경부고속도로)', lon: 127.1650, lat: 36.8350 },
    { id: 'rn_20', name: '천안시청 사거리', lon: 127.1139, lat: 36.8151 },
  ];

  koreaRoadNodes.forEach((node) => {
    roadGraph.addNode(node.id, node.lon, node.lat, { name: node.name });
  });

  const koreaRoadEdges: [string, string, string][] = [
    ['rn_1', 'rn_2', '세종대로'],
    ['rn_2', 'rn_3', '세종대로'],
    ['rn_3', 'rn_4', '한강대로'],
    ['rn_4', 'rn_5', '한강대로'],
    ['rn_5', 'rn_6', '한강대로'],
    ['rn_6', 'rn_7', '이태원로'],
    ['rn_7', 'rn_8', '한강대로'],
    ['rn_8', 'rn_9', '한강대교'],
    ['rn_9', 'rn_10', '노들로'],
    ['rn_10', 'rn_11', '올림픽대로'],
    ['rn_9', 'rn_12', '올림픽대로'],
    ['rn_12', 'rn_13', '반포대로'],
    ['rn_12', 'rn_14', '잠원로'],
    ['rn_14', 'rn_15', '강남대로'],
    ['rn_15', 'rn_16', '강남대로'],
    ['rn_16', 'rn_17', '강남대로'],
    ['rn_17', 'rn_18', '강남대로'],
    ['rn_18', 'rn_19', '경부고속도로'],
    ['rn_19', 'rn_20', '번영로'],
  ];

  koreaRoadEdges.forEach(([from, to, name]) => {
    const n1 = koreaRoadNodes.find((n) => n.id === from);
    const n2 = koreaRoadNodes.find((n) => n.id === to);
    if (!n1 || !n2) return;

    const isHighway = name.includes('고속도로');
    const speed = isHighway ? 100 : 50;

    roadGraph.addEdge(
      from,
      to,
      name,
      isHighway ? 'motorway' : 'primary',
      speed,
      false,
      [[n1.lon, n1.lat], [n2.lon, n2.lat]]
    );

    features.push({
      id: `road_${idCounter++}`,
      type: 'LineString',
      layer: 'road',
      coordinates: [[n1.lon, n1.lat], [n2.lon, n2.lat]],
      properties: { name, kind: isHighway ? 'motorway' : 'primary' },
      minZoom: isHighway ? 6 : 9,
      maxZoom: 24,
    });
  });

  // =========================================================================
  // 7. COMPREHENSIVE NATIONWIDE & GLOBAL FACILITIES, RESTAURANTS, CAFES, POIS
  // =========================================================================
  const richPlacesDataset: SearchPlace[] = [
    // --- 서울특별시 (Seoul) ---
    {
      id: 'p_seoul_1',
      name: '광화문 & 경복궁',
      category: '문화관광',
      subCategory: 'tour',
      address: '서울특별시 종로구 사직로 161',
      city: '서울',
      country: '대한민국',
      lon: 126.9768,
      lat: 37.5750,
      rating: 4.9,
      reviewCount: 3840,
      photo: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&auto=format&fit=crop&q=80',
      phone: '02-3700-3900',
      hours: '수~월 09:00 - 18:00 (매주 화요일 휴궁)',
      menu: ['대인 관람권 3,000원', '한복 착용자 무료 관람', '수문장 교대의식 (10:00, 14:00)'],
      facilities: ['한국어 해설', '수유실', '물품보관소', '유모차 대여', '장애인 편의시설'],
      reviews: [
        { id: 'r_g1', author: '역사덕후', rating: 5, date: '2026.11.17', content: '가을 단풍과 경회루의 반영이 장관입니다. 광화문 광장과 이어져 산책하기 최적입니다.', likes: 45 },
        { id: 'r_g2', author: 'Sarah_Travel', rating: 5, date: '2026.11.15', content: 'Must-visit historic royal palace in Korea! Beautiful architecture and great guides.', likes: 29 }
      ]
    },
    {
      id: 'p_seoul_2',
      name: '롯데월드타워 & 서울스카이',
      category: '3D 랜드마크',
      subCategory: '3d_bldg',
      address: '서울특별시 송파구 올림픽로 300',
      city: '서울',
      country: '대한민국',
      lon: 127.1025,
      lat: 37.5125,
      rating: 4.8,
      reviewCount: 5210,
      photo: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80',
      phone: '02-1661-2000',
      hours: '매일 10:30 - 22:00',
      menu: ['서울스카이 전망대 29,000원', '스카이브릿지 투어 80,000원', '123라운지 시그니처 칵테일 25,000원'],
      facilities: ['초고속 더블데크 엘리베이터', '지하 6층 대형 주차장', '쇼핑몰/면세점 연결', '레스토랑가'],
      reviews: [
        { id: 'r_lw1', author: '야경러버', rating: 5, date: '2026.11.18', content: '120층 유리 바닥에서 내려다보는 서울 야경은 숨이 멎을 정도로 압도적입니다.', likes: 38 }
      ]
    },
    {
      id: 'p_seoul_3',
      name: '성수동 어니언 카페 (Cafe Onion)',
      category: '감성 카페',
      subCategory: 'cafe',
      address: '서울특별시 성동구 아차산로9길 8',
      city: '서울',
      country: '대한민국',
      lon: 127.0580,
      lat: 37.5440,
      rating: 4.7,
      reviewCount: 2180,
      photo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
      phone: '02-1644-1941',
      hours: '평일 08:00 - 22:00 / 주말 10:00 - 22:00',
      menu: ['팡도르 6,000원', '아바나 블렌드 아메리카노 5,500원', '공주밤빵 6,500원'],
      facilities: ['인더스트리얼 루프탑', '반려동물 테라스 동반', '테이크아웃 할인', '무료 Wi-Fi'],
      reviews: [
        { id: 'r_on1', author: '카페투어러', rating: 5, date: '2026.11.17', content: '성수동의 상징적인 폐공장 개조 베이커리. 팡도르 슈가파우더 비주얼과 커피 밸런스가 최고.', likes: 21 }
      ]
    },
    {
      id: 'p_seoul_4',
      name: '명동교자 본점',
      category: '추천 맛집',
      subCategory: 'food',
      address: '서울특별시 중구 명동10길 29',
      city: '서울',
      country: '대한민국',
      lon: 126.9855,
      lat: 37.5625,
      rating: 4.8,
      reviewCount: 7650,
      photo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
      phone: '02-776-5348',
      hours: '매일 10:30 - 21:00 (라스트오더 20:30)',
      menu: ['칼국수 11,000원', '만두 (10개) 12,000원', '비빔국수 11,000원', '마늘김치 무료 리필'],
      facilities: ['미슐랭 빕구르망 선정', '포장 가능', '혼밥석 완비', '제로페이'],
      reviews: [
        { id: 'r_md1', author: '면마니아', rating: 5, date: '2026.11.16', content: '진한 닭육수와 불맛 고기 고명, 알싸한 마늘김치의 조화는 서울 최고입니다.', likes: 52 }
      ]
    },
    {
      id: 'p_seoul_5',
      name: '여의도 더현대 서울',
      category: '쇼핑/복합문화',
      subCategory: 'tour',
      address: '서울특별시 영등포구 여의대로 108',
      city: '서울',
      country: '대한민국',
      lon: 126.9285,
      lat: 37.5260,
      rating: 4.8,
      reviewCount: 4120,
      photo: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&auto=format&fit=crop&q=80',
      phone: '02-767-2233',
      hours: '월~목 10:30 - 20:00 / 금~일 10:30 - 20:30',
      menu: ['사운즈포레스트 실내정원', '지하 1층 테이스티 서울 맛집거리', 'ALT.1 전시장'],
      facilities: ['실내 조경 공원', '발렛 파킹', '유모차 대여', 'VIP 라운지', '반려견 캐리어 입장'],
      reviews: [
        { id: 'r_th1', author: '쇼퍼홀릭', rating: 5, date: '2026.11.18', content: '5층 실내 정원에서 쉬면서 팝업스토어 구경하기에 완벽한 실내 복합 문화공간.', likes: 31 }
      ]
    },

    // --- 부산광역시 (Busan) ---
    {
      id: 'p_busan_1',
      name: '해운대 해수욕장 & 해운대 블루라인파크',
      category: '문화관광',
      subCategory: 'tour',
      address: '부산광역시 해운대구 우동 해운대해변로 264',
      city: '부산',
      country: '대한민국',
      lon: 129.1586,
      lat: 35.1587,
      rating: 4.9,
      reviewCount: 6840,
      photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      phone: '051-749-5700',
      hours: '연중무휴 (해변 산책로 24시간 개방)',
      menu: ['스카이캡슐 2인 편도 35,000원', '해변열차 1회권 7,000원'],
      facilities: ['공영주차장', '탈의실/샤워장', '송림공원 산책로', '동백섬 연결로'],
      reviews: [
        { id: 'r_bu1', author: '바다사랑', rating: 5, date: '2026.11.17', content: '끝없이 펼쳐진 백사장과 동백섬 해안 산책로가 부산 여행의 백미입니다.', likes: 49 }
      ]
    },
    {
      id: 'p_busan_2',
      name: '광안리 해수욕장 & 광안대교',
      category: '문화관광',
      subCategory: 'tour',
      address: '부산광역시 수영구 광안해변로 219',
      city: '부산',
      country: '대한민국',
      lon: 129.1185,
      lat: 35.1532,
      rating: 4.9,
      reviewCount: 5930,
      photo: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      phone: '051-610-4742',
      hours: '24시간 개방 / 광안대교 드론쇼 매주 토요일 저녁',
      menu: ['해변 오션뷰 카페거리', '민락수변공원 회센터', '광안대교 드론라이트쇼'],
      facilities: ['패들보드 SUP 존', '오션뷰 테라스 카페', '공영주차장'],
      reviews: [
        { id: 'r_bu2', author: '나이트워커', rating: 5, date: '2026.11.18', content: '광안대교 야경 조명과 해변에서 듣는 파도소리가 낭만 그 자체입니다.', likes: 42 }
      ]
    },
    {
      id: 'p_busan_3',
      name: '자갈치시장 본관',
      category: '추천 맛집',
      subCategory: 'food',
      address: '부산광역시 중구 자갈치해안로 52',
      city: '부산',
      country: '대한민국',
      lon: 129.0305,
      lat: 35.0968,
      rating: 4.6,
      reviewCount: 3410,
      photo: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
      phone: '051-713-8000',
      hours: '매일 05:00 - 22:00 (첫째/셋째 화요일 휴무)',
      menu: ['모둠 생선회 소 50,000원', '꼼장어 양념구이 40,000원', '생선구이 정식 12,000원'],
      facilities: ['1층 수산물 시장 & 2층 초장집', '지하 공영주차장', '옥상 전망대'],
      reviews: [
        { id: 'r_bu3', author: '회킬러', rating: 5, date: '2026.11.15', content: '싱싱한 활어를 즉석에서 골라 2층에서 먹는 맛! 활기찬 부산의 에너지를 느낄 수 있습니다.', likes: 27 }
      ]
    },

    // --- 대전광역시 (Daejeon) ---
    {
      id: 'p_daejeon_1',
      name: '성심당 본점 (Sungsimdang Bakery)',
      category: '추천 맛집',
      subCategory: 'food',
      address: '대전광역시 중구 대종로480번길 15',
      city: '대전',
      country: '대한민국',
      lon: 127.4273,
      lat: 36.3277,
      rating: 4.9,
      reviewCount: 12500,
      photo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      phone: '1588-8069',
      hours: '매일 08:00 - 22:00',
      menu: ['튀김소보로 1,700원', '튀소구마 1,700원', '부추빵 2,000원', '보문산메아리 6,000원', '순수롤 14,000원'],
      facilities: ['전국구 유명 빵집', '줄서기 대기 시스템', '전용 주차장', '포장 박스 지원'],
      reviews: [
        { id: 'r_dj1', author: '빵순이', rating: 5, date: '2026.11.17', content: '대전의 명물! 갓 나온 바삭한 튀김소보로와 부추빵은 기다린 시간이 전혀 아깝지 않습니다.', likes: 88 },
        { id: 'r_dj2', author: '대전현지인', rating: 5, date: '2026.11.16', content: '가성비와 퀄리티 모두 대한민국 1등 제과점. 보문산메아리 결대로 찢어먹으면 꿀맛.', likes: 64 }
      ]
    },
    {
      id: 'p_daejeon_2',
      name: '엑스포과학공원 & 한빛탑 미디어파사드',
      category: '문화관광',
      subCategory: 'tour',
      address: '대전광역시 유성구 대덕대로 480',
      city: '대전',
      country: '대한민국',
      lon: 127.3848,
      lat: 36.3765,
      rating: 4.8,
      reviewCount: 2310,
      photo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      phone: '042-250-1111',
      hours: '매일 09:30 - 21:40 (음악분수 저녁 타임)',
      menu: ['한빛탑 전망대 무료 입장', '엑스포 음악분수쇼', '물빛광장 산책로'],
      facilities: ['무료 주차', '푸드트럭 존', '자전거 대여', '화장실'],
      reviews: [
        { id: 'r_dj3', author: '과학소년', rating: 5, date: '2026.11.18', content: '저녁 음악분수쇼와 한빛탑 전망대 야경이 일품입니다.', likes: 19 }
      ]
    },

    // --- 대구광역시 (Daegu) ---
    {
      id: 'p_daegu_1',
      name: '서문시장 야시장',
      category: '추천 맛집',
      subCategory: 'food',
      address: '대구광역시 중구 큰장로26길 45',
      city: '대구',
      country: '대한민국',
      lon: 128.5805,
      lat: 35.8692,
      rating: 4.8,
      reviewCount: 4520,
      photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      phone: '053-256-6341',
      hours: '수~일 19:00 - 23:30 (월/화 휴무)',
      menu: ['서문 서패삼겹살김밥 5,000원', '납작만두 4,000원', '칼제비 5,000원', '소고기 불초밥 6,000원'],
      facilities: ['전국 최대 규모 전통 야시장', '공영주차빌딩', '버스킹 공연장'],
      reviews: [
        { id: 'r_dg1', author: '야식헌터', rating: 5, date: '2026.11.17', content: '음식 종류가 어마어마하고 가격도 착해서 골라 먹는 재미가 쏠쏠합니다.', likes: 35 }
      ]
    },

    // --- 인천광역시 (Incheon) ---
    {
      id: 'p_incheon_1',
      name: '송도 센트럴파크',
      category: '문화관광',
      subCategory: 'tour',
      address: '인천광역시 연수구 컨벤시아대로 160',
      city: '인천',
      country: '대한민국',
      lon: 126.6385,
      lat: 37.3925,
      rating: 4.9,
      reviewCount: 4720,
      photo: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80',
      phone: '032-453-7980',
      hours: '연중무휴 24시간',
      menu: ['문보트/구름보트 38,000원', '카약 25,000원', '사슴농장 관람 무료'],
      facilities: ['해수로 보트하우스', '한옥호텔 경원재', '트라이볼 공연장', '지하 대형주차장'],
      reviews: [
        { id: 'r_ic1', author: '미래도시러', rating: 5, date: '2026.11.16', content: '바닷물이 흐르는 해수공원과 미래지향적 빌딩들의 조화가 한국의 맨해튼 같습니다.', likes: 41 }
      ]
    },

    // --- 광주광역시 (Gwangju) ---
    {
      id: 'p_gwangju_1',
      name: '국립아시아문화전당 (ACC)',
      category: '문화관광',
      subCategory: 'tour',
      address: '광주광역시 동구 문화전당로 38',
      city: '광주',
      country: '대한민국',
      lon: 126.9195,
      lat: 35.1465,
      rating: 4.8,
      reviewCount: 3100,
      photo: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
      phone: '1899-5566',
      hours: '화~일 10:00 - 18:00 (수/토 야간개장 20:00)',
      menu: ['복합 전시 관람료 무료/유료기획전', '어린이문화원', '하늘마당 피크닉존'],
      facilities: ['지하 건축미학', '하늘마당 잔디광장', '도서관', '카페테리아', '주차장'],
      reviews: [
        { id: 'r_gj1', author: '예술산책', rating: 5, date: '2026.11.18', content: '지하로 파고든 건축 설계가 경이롭고, 잔디밭 하늘마당에서의 피크닉이 최고입니다.', likes: 25 }
      ]
    },

    // --- 강원특별자치도 (Gangwon) ---
    {
      id: 'p_gangwon_1',
      name: '강릉 안목해변 커피거리',
      category: '감성 카페',
      subCategory: 'cafe',
      address: '강원특별자치도 강릉시 창해로 14번길 20-1',
      city: '강릉',
      country: '대한민국',
      lon: 128.9485,
      lat: 37.7715,
      rating: 4.9,
      reviewCount: 6150,
      photo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
      phone: '033-640-4531',
      hours: '각 카페별 08:30 - 23:00',
      menu: ['강릉 초당옥수수커피 6,000원', '핸드드립 스페셜티 7,000원', '순두부젤라또 4,500원'],
      facilities: ['해안선 오션뷰 테라스', '백사장 산책로', '무료 해변주차장'],
      reviews: [
        { id: 'r_gw1', author: '커피마니아', rating: 5, date: '2026.11.17', content: '파란 동해바다를 한눈에 담으며 마시는 드립커피 한 잔의 행복.', likes: 53 }
      ]
    },

    // --- 전북특별자치도 (Jeonbuk) ---
    {
      id: 'p_jeonju_1',
      name: '전주 한옥마을 & 경기전',
      category: '문화관광',
      subCategory: 'tour',
      address: '전북특별자치도 전주시 완산구 기린대로 99',
      city: '전주',
      country: '대한민국',
      lon: 127.1530,
      lat: 35.8150,
      rating: 4.9,
      reviewCount: 8900,
      photo: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&auto=format&fit=crop&q=80',
      phone: '063-282-1330',
      hours: '연중무휴 24시간',
      menu: ['경기전 관람료 3,000원', '전주비빔밥 정식 15,000원', '한옥 숙박 체험'],
      facilities: ['한복 대여점', '골목길 전통 공예방', '공영주차장'],
      reviews: [
        { id: 'r_jj1', author: '한옥러버', rating: 5, date: '2026.11.16', content: '고즈넉한 한옥 기와지붕 골목과 풍부한 먹거리가 넘쳐나는 필수 여행지.', likes: 47 }
      ]
    },

    // --- 전라남도 (Jeonnam) ---
    {
      id: 'p_yeosu_1',
      name: '여수 낭만포차거리 & 오동도',
      category: '추천 맛집',
      subCategory: 'food',
      address: '전라남도 여수시 하멜로 102',
      city: '여수',
      country: '대한민국',
      lon: 127.7510,
      lat: 34.7390,
      rating: 4.8,
      reviewCount: 5400,
      photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      phone: '061-659-3870',
      hours: '매일 18:00 - 01:00',
      menu: ['여수 돌문어 해물삼합 45,000원', '딱새우회 30,000원', '서대회무침 25,000원'],
      facilities: ['하멜등대 포토존', '해상케이블카 연결', '오션뷰 노상 테이블'],
      reviews: [
        { id: 'r_ys1', author: '버스커', rating: 5, date: '2026.11.18', content: '여수 밤바다 노래를 들으며 거북선대교 아래서 먹는 돌문어삼합은 최고입니다.', likes: 39 }
      ]
    },

    // --- 경상북도 (Gyeongbuk) ---
    {
      id: 'p_gyeongju_1',
      name: '경주 첨성대 & 동궁과 월지(안압지)',
      category: '문화관광',
      subCategory: 'tour',
      address: '경상북도 경주시 첨성로 140',
      city: '경주',
      country: '대한민국',
      lon: 129.2190,
      lat: 35.8347,
      rating: 4.9,
      reviewCount: 7100,
      photo: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
      phone: '054-779-8585',
      hours: '연중무휴 (동궁과 월지 야간점등 22:00까지)',
      menu: ['첨성대 무료 관람', '동궁과 월지 성인 3,000원', '황남빵 1박스 20,000원'],
      facilities: ['비단벌레차 투어', '야간 조명 시설', '황리단길 연결'],
      reviews: [
        { id: 'r_gj1', author: '천년신라', rating: 5, date: '2026.11.17', content: '밤에 조명이 켜진 안압지와 첨성대는 감탄이 절로 나오는 아름다움입니다.', likes: 58 }
      ]
    },

    // --- 제주특별자치도 (Jeju) ---
    {
      id: 'p_jeju_1',
      name: '성산일출봉',
      category: '문화관광',
      subCategory: 'tour',
      address: '제주특별자치도 서귀포시 성산읍 일출로 284-12',
      city: '서귀포',
      country: '대한민국',
      lon: 126.9360,
      lat: 33.4583,
      rating: 4.9,
      reviewCount: 9200,
      photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      phone: '064-783-0959',
      hours: '매일 07:00 - 20:00 (매월 첫째 월요일 휴무)',
      menu: ['정상 등반 관람료 5,000원', '무료 해안 산책코스'],
      facilities: ['유네스코 세계자연유산', '해녀 물질 공연장', '전망 쉼터', '대형 주차장'],
      reviews: [
        { id: 'r_jj1', author: '제주바람', rating: 5, date: '2026.11.18', content: '분화구 위에서 내려다보는 제주의 푸른 바다는 평생 잊지 못할 장관입니다.', likes: 72 }
      ]
    },
    {
      id: 'p_jeju_2',
      name: '협재 해수욕장 & 금능 해변',
      category: '문화관광',
      subCategory: 'tour',
      address: '제주특별자치도 제주시 한림읍 한림로 329-10',
      city: '제주',
      country: '대한민국',
      lon: 126.2395,
      lat: 33.3940,
      rating: 4.9,
      reviewCount: 6400,
      photo: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      phone: '064-728-3981',
      hours: '연중무휴 24시간',
      menu: ['비양도 조망 에메랄드빛 해변', '제주 흑돼지 구이 골목'],
      facilities: ['야영장/캠핑장', '샤워실/탈의실', '올레 14코스', '주차장'],
      reviews: [
        { id: 'r_jj2', author: '에메랄드', rating: 5, date: '2026.11.16', content: '비양도가 보이는 맑고 투명한 에메랄드빛 바다는 국내 최고입니다.', likes: 44 }
      ]
    },

    // --- 글로벌 대표 명소 (Global Highlights) ---
    {
      id: 'p_tokyo_1',
      name: '시부야 스크램블 교차로 (Shibuya Crossing)',
      category: '문화관광',
      subCategory: 'tour',
      address: '2 Chome-2-1 Dogenzaka, Shibuya City, Tokyo',
      city: '도쿄',
      country: '일본',
      lon: 139.7006,
      lat: 35.6595,
      rating: 4.8,
      reviewCount: 15400,
      photo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
      phone: '+81-3-3463-1211',
      hours: '24시간 횡단보도 개방',
      menu: ['SHIBUYA SKY 전망대 입장료 2,200엔', '하치코 동상 포토존'],
      facilities: ['지하철 시부야역 직결', '쇼핑몰 복합연결', '전망 카페'],
      reviews: [
        { id: 'r_tk1', author: 'Kenji_M', rating: 5, date: '2026.11.17', content: 'The beating heart of modern Tokyo! Unbelievable energy especially at sunset.', likes: 95 }
      ]
    },
    {
      id: 'p_ny_1',
      name: '타임스 스퀘어 (Times Square, New York)',
      category: '문화관광',
      subCategory: 'tour',
      address: 'Broadway & 7th Ave, New York, NY 10036',
      city: '뉴욕',
      country: '미국',
      lon: -73.9855,
      lat: 40.7580,
      rating: 4.8,
      reviewCount: 22400,
      photo: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&auto=format&fit=crop&q=80',
      phone: '+1-212-768-1560',
      hours: '24시간 네온사인 점등',
      menu: ['브로드웨이 뮤지컬 공연', 'TKTS 티켓 할인 부스'],
      facilities: ['보행자 전용 광장', '레드 스텝 쉼터', '지하철 타임스스퀘어역 연결'],
      reviews: [
        { id: 'r_ny1', author: 'BroadwayFan', rating: 5, date: '2026.11.18', content: 'The dazzling crossroads of the world. Iconic billboards and unforgettable vibe.', likes: 112 }
      ]
    },
    {
      id: 'p_paris_1',
      name: '에펠탑 (Eiffel Tower, Paris)',
      category: '3D 랜드마크',
      subCategory: '3d_bldg',
      address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
      city: '파리',
      country: '프랑스',
      lon: 2.2945,
      lat: 48.8584,
      rating: 4.9,
      reviewCount: 31200,
      photo: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop&q=80',
      phone: '+33-892-70-12-39',
      hours: '매일 09:30 - 23:45',
      menu: ['정상 전망대 엘리베이터 28.30€', '쥘 베른 레스토랑'],
      facilities: ['기념품점', '샴페인 바', '샹드마르스 공원'],
      reviews: [
        { id: 'r_pr1', author: 'ParisLover', rating: 5, date: '2026.11.17', content: 'Truly the romantic symbol of France. Stunning shimmering lights every hour at night.', likes: 140 }
      ]
    }
  ];

  richPlacesDataset.forEach((place) => {
    searchIndex.push(place);
    features.push({
      id: place.id,
      type: 'Point',
      layer: 'place',
      coordinates: [place.lon, place.lat],
      properties: {
        name: place.name,
        category: place.category,
        subCategory: place.subCategory,
        address: place.address,
        city: place.city,
        rating: place.rating,
        reviewCount: place.reviewCount,
        photo: place.photo,
        phone: place.phone,
        hours: place.hours,
        menu: place.menu,
        facilities: place.facilities,
        reviews: place.reviews,
        kind: place.subCategory === '3d_bldg' ? 'bldg' : 'poi',
      },
      minZoom: 6,
      maxZoom: 24,
    });
  });

  return { features, roadGraph, searchIndex };
}

// Global Singleton Dataset Cache
let _masterData: ReturnType<typeof buildGlobalMasterDataset> | null = null;

export function getMasterData() {
  if (!_masterData) {
    _masterData = buildGlobalMasterDataset();
  }
  return _masterData;
}
