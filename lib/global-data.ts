/**
 * Koharu Maps - Global & Regional Cartographic Master Dataset
 * Developed by KCS - Koharu Coding Server
 * Features: Continents, Oceans, Countries, Metropolises, 3D Buildings, Parks, Rivers, High-Density Road Network, Landmarks
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
    { id: 'gc_7', name: '제주', category: '관광도시', address: '대한민국 제주특별자치도', city: '제주', country: '대한민국', lon: 126.5312, lat: 33.4996 },
    { id: 'gc_8', name: '도쿄 (Tokyo)', category: '글로벌 대도시', address: '일본 도쿄도', city: '도쿄', country: '일본', lon: 139.6917, lat: 35.6895 },
    { id: 'gc_9', name: '오사카 (Osaka)', category: '대도시', address: '일본 오사카부', city: '오사카', country: '일본', lon: 135.5023, lat: 34.6937 },
    { id: 'gc_10', name: '베이징 (Beijing)', category: '수도', address: '중국 베이징시', city: '베이징', country: '중국', lon: 116.4074, lat: 39.9042 },
    { id: 'gc_11', name: '상하이 (Shanghai)', category: '경제수도', address: '중국 상하이시', city: '상하이', country: '중국', lon: 121.4737, lat: 31.2304 },
    { id: 'gc_12', name: '뉴욕 (New York)', category: '글로벌 금융수도', address: '미국 뉴욕주 뉴욕시', city: '뉴욕', country: '미국', lon: -74.0060, lat: 40.7128 },
    { id: 'gc_13', name: '워싱턴 D.C.', category: '수도', address: '미국 워싱턴 D.C.', city: '워싱턴 D.C.', country: '미국', lon: -77.0369, lat: 38.9072 },
    { id: 'gc_14', name: '로스앤젤레스 (Los Angeles)', category: '대도시', address: '미국 캘리포니아주 로스앤젤레스', city: '로스앤젤레스', country: '미국', lon: -118.2437, lat: 34.0522 },
    { id: 'gc_15', name: '런던 (London)', category: '유럽 대도시', address: '영국 런던', city: '런던', country: '영국', lon: -0.1276, lat: 51.5074 },
    { id: 'gc_16', name: '파리 (Paris)', category: '문화수도', address: '프랑스 파리', city: '파리', country: '프랑스', lon: 2.3522, lat: 48.8566 },
    { id: 'gc_17', name: '베를린 (Berlin)', category: '수도', address: '독일 베를린', city: '베를린', country: '독일', lon: 13.4050, lat: 52.5200 },
    { id: 'gc_18', name: '시드니 (Sydney)', category: '항구도시', address: '호주 뉴사우스웨일스 시드니', city: '시드니', country: '호주', lon: 151.2093, lat: -33.8688 },
    { id: 'gc_19', name: '싱가포르 (Singapore)', category: '도시국가', address: '싱가포르', city: '싱가포르', country: '싱가포르', lon: 103.8198, lat: 1.3521 },
    { id: 'gc_20', name: '홍콩 (Hong Kong)', category: '국제금융중심지', address: '중국 홍콩특별행정구', city: '홍콩', country: '홍콩', lon: 114.1694, lat: 22.3193 },
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
  // Han River (한강 서울 수계)
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

  // Namsan Mountain Park (남산 공원)
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

  // Yeouido Hangang Park (여의도 한강공원)
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
    // Seoul
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
    // Tokyo
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
    // New York
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
      minZoom: isHighway ? 6 : 10,
      maxZoom: 24,
    });
  });

  // =========================================================================
  // 7. MAJOR DOMESTIC LANDMARKS & POIs (Zoom 11 ~ 24)
  // =========================================================================
  const koreaLandmarks: SearchPlace[] = [
    { id: 'p_1', name: '광화문', category: '역사/명소', address: '서울특별시 종로구 사직로 161', city: '서울', country: '대한민국', lon: 126.9768, lat: 37.5750 },
    { id: 'p_2', name: '경복궁', category: '궁궐/문화재', address: '서울특별시 종로구 사직로 161', city: '서울', country: '대한민국', lon: 126.9770, lat: 37.5796 },
    { id: 'p_3', name: '서울역', category: '철도역/교통', address: '서울특별시 중구 한강대로 405', city: '서울', country: '대한민국', lon: 126.9710, lat: 37.5550 },
    { id: 'p_4', name: 'N서울타워 (남산타워)', category: '랜드마크/전망대', address: '서울특별시 용산구 남산공원길 105', city: '서울', country: '대한민국', lon: 126.9882, lat: 37.5512 },
    { id: 'p_5', name: '명동성당', category: '종교/명소', address: '서울특별시 중구 명동길 74', city: '서울', country: '대한민국', lon: 126.9873, lat: 37.5632 },
    { id: 'p_6', name: '강남역', category: '교통/상업', address: '서울특별시 강남구 강남대로 396', city: '서울', country: '대한민국', lon: 127.0280, lat: 37.4980 },
    { id: 'p_7', name: '코엑스 (COEX)', category: '컨벤션/쇼핑', address: '서울특별시 강남구 영동대로 513', city: '서울', country: '대한민국', lon: 127.0590, lat: 37.5115 },
    { id: 'p_8', name: '롯데월드타워', category: '초고층/랜드마크', address: '서울특별시 송파구 올림픽로 300', city: '서울', country: '대한민국', lon: 127.1025, lat: 37.5125 },
    { id: 'p_9', name: '여의도 63빌딩', category: '랜드마크', address: '서울특별시 영등포구 63로 50', city: '서울', country: '대한민국', lon: 126.9400, lat: 37.5195 },
    { id: 'p_10', name: '인천국제공항', category: '국제공항', address: '인천광역시 중구 공항로 272', city: '인천', country: '대한민국', lon: 126.4406, lat: 37.4602 },
    { id: 'p_11', name: '해운대해수욕장', category: '관광/해변', address: '부산광역시 해운대구 우동', city: '부산', country: '대한민국', lon: 129.1586, lat: 35.1587 },
    { id: 'p_12', name: '성산일출봉', category: '자연유산/관광', address: '제주특별자치도 서귀포시 성산읍', city: '서귀포', country: '대한민국', lon: 126.9360, lat: 33.4583 },
  ];

  koreaLandmarks.forEach((lm) => {
    searchIndex.push(lm);
    features.push({
      id: `lm_${idCounter++}`,
      type: 'Point',
      layer: 'place',
      coordinates: [lm.lon, lm.lat],
      properties: { name: lm.name, category: lm.category, address: lm.address, kind: 'poi' },
      minZoom: 11,
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
