/**
 * Koharu Maps - Global & Regional Cartographic Master Dataset
 * Developed by KCS - Koharu Coding Server
 * Features: World Countries, Oceans, Global Metropolises, High-Density Korea Road Network, Landmarks
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
  // 1. WORLD COUNTRIES & MAJOR OCEANS (Shown at low zoom levels: 1 ~ 6)
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
    { name: '태평양', lon: 160.0, lat: 10.0 },
    { name: '대서양', lon: -30.0, lat: 15.0 },
    { name: '인도양', lon: 80.0, lat: -15.0 },
    { name: '북극해', lon: 0.0, lat: 85.0 },
  ];

  worldOceans.forEach((o) => {
    features.push({
      id: `ocean_${idCounter++}`,
      type: 'Point',
      layer: 'ocean',
      coordinates: [o.lon, o.lat],
      properties: { name: o.name, kind: 'ocean' },
      minZoom: 1,
      maxZoom: 4,
    });
  });

  // =========================================================================
  // 2. WORLD METROPOLISES (Global Cities: Zoom 5 ~ 11)
  // =========================================================================
  const globalCities: SearchPlace[] = [
    { id: 'city_1', name: '서울특별시', category: '수도/대도시', address: '대한민국 서울특별시', city: '서울', country: '대한민국', lon: 126.9784, lat: 37.5663 },
    { id: 'city_1b', name: '부산광역시', category: '해양수도/광역시', address: '대한민국 부산광역시', city: '부산', country: '대한민국', lon: 129.0756, lat: 35.1796 },
    { id: 'city_1c', name: '인천광역시', category: '국제공항/광역시', address: '대한민국 인천광역시', city: '인천', country: '대한민국', lon: 126.7052, lat: 37.4563 },
    { id: 'city_1d', name: '대구광역시', category: '광역시', address: '대한민국 대구광역시', city: '대구', country: '대한민국', lon: 128.6014, lat: 35.8714 },
    { id: 'city_1e', name: '대전광역시', category: '과학도시/광역시', address: '대한민국 대전광역시', city: '대전', country: '대한민국', lon: 127.3845, lat: 36.3504 },
    { id: 'city_1f', name: '광주광역시', category: '문화수도/광역시', address: '대한민국 광주광역시', city: '광주', country: '대한민국', lon: 126.8526, lat: 35.1595 },
    { id: 'city_1g', name: '울산광역시', category: '산업수도/광역시', address: '대한민국 울산광역시', city: '울산', country: '대한민국', lon: 129.3114, lat: 35.5384 },
    { id: 'city_1h', name: '세종특별자치시', category: '행정수도', address: '대한민국 세종특별자치시', city: '세종', country: '대한민국', lon: 127.2890, lat: 36.4800 },
    { id: 'city_1i', name: '제주특별자치도', category: '특별자치도', address: '대한민국 제주특별자치도', city: '제주', country: '대한민국', lon: 126.5312, lat: 33.4996 },
    { id: 'city_2', name: '도쿄 (Tokyo)', category: '수도/대도시', address: '일본 도쿄도', city: 'Tokyo', country: '일본', lon: 139.6917, lat: 35.6895 },
    { id: 'city_2b', name: '오사카 (Osaka)', category: '대도시', address: '일본 오사카부', city: 'Osaka', country: '일본', lon: 135.5023, lat: 34.6937 },
    { id: 'city_3', name: '뉴욕 (New York)', category: '글로벌 대도시', address: '미국 뉴욕주 뉴욕시', city: 'New York', country: '미국', lon: -74.0060, lat: 40.7128 },
    { id: 'city_4', name: '런던 (London)', category: '수도/대도시', address: '영국 그레이터런던', city: 'London', country: '영국', lon: -0.1278, lat: 51.5074 },
    { id: 'city_5', name: '파리 (Paris)', category: '수도/대도시', address: '프랑스 일드프랑스 파리', city: 'Paris', country: '프랑스', lon: 2.3522, lat: 48.8566 },
    { id: 'city_6', name: '싱가포르 (Singapore)', category: '도시국가', address: '싱가포르', city: 'Singapore', country: '싱가포르', lon: 103.8198, lat: 1.3521 },
    { id: 'city_7', name: '시드니 (Sydney)', category: '글로벌 대도시', address: '호주 뉴사우스웨일스 시드니', city: 'Sydney', country: '호주', lon: 151.2093, lat: -33.8688 },
    { id: 'city_8', name: '베이징 (Beijing)', category: '수도/대도시', address: '중국 베이징시', city: 'Beijing', country: '중국', lon: 116.4074, lat: 39.9042 },
    { id: 'city_8b', name: '상하이 (Shanghai)', category: '경제중심', address: '중국 상하이시', city: 'Shanghai', country: '중국', lon: 121.4737, lat: 31.2304 },
    { id: 'city_9', name: '베를린 (Berlin)', category: '수도/대도시', address: '독일 베를린', city: 'Berlin', country: '독일', lon: 13.4050, lat: 52.5200 },
    { id: 'city_10', name: '로스앤젤레스 (Los Angeles)', category: '대도시', address: '미국 캘리포니아주 로스앤젤레스', city: 'Los Angeles', country: '미국', lon: -118.2437, lat: 34.0522 },
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
      maxZoom: 12,
    });
  });

  // =========================================================================
  // 3. KOREA HIGH-DENSITY ROAD NETWORK (Routing & Detailed Graph)
  // =========================================================================
  const koreaRoadNodes: { id: string; name: string; lon: number; lat: number }[] = [
    { id: 'rn_1', name: '서울역', lon: 126.9710, lat: 37.5550 },
    { id: 'rn_2', name: '시청교차로', lon: 126.9765, lat: 37.5658 },
    { id: 'rn_3', name: '광화문사거리', lon: 126.9768, lat: 37.5750 },
    { id: 'rn_4', name: '종로1가', lon: 126.9830, lat: 37.5702 },
    { id: 'rn_5', name: '을지로입구', lon: 126.9820, lat: 37.5660 },
    { id: 'rn_6', name: '명동입구', lon: 126.9855, lat: 37.5605 },
    { id: 'rn_7', name: '남산1호터널북단', lon: 126.9880, lat: 37.5520 },
    { id: 'rn_8', name: '한남대교북단', lon: 127.0110, lat: 37.5320 },
    { id: 'rn_9', name: '한남대교남단', lon: 127.0160, lat: 37.5180 },
    { id: 'rn_10', name: '신사역사거리', lon: 127.0205, lat: 37.5165 },
    { id: 'rn_11', name: '논현역사거리', lon: 127.0220, lat: 37.5110 },
    { id: 'rn_12', name: '강남역사거리', lon: 127.0280, lat: 37.4980 },
    { id: 'rn_13', name: '역삼역', lon: 127.0360, lat: 37.5005 },
    { id: 'rn_14', name: '선릉역', lon: 127.0490, lat: 37.5045 },
    { id: 'rn_15', name: '삼성역(코엑스)', lon: 127.0630, lat: 37.5085 },
    { id: 'rn_16', name: '양재IC', lon: 127.0420, lat: 37.4720 },
    { id: 'rn_17', name: '판교IC', lon: 127.1000, lat: 37.3950 },
    { id: 'rn_18', name: '수원신갈IC', lon: 127.1050, lat: 37.2650 },
    { id: 'rn_19', name: '천안IC', lon: 127.1650, lat: 36.8320 },
    { id: 'rn_20', name: '천안시청', lon: 127.1139, lat: 36.8151 },
  ];

  koreaRoadNodes.forEach((node) => {
    roadGraph.addNode(node.id, node.lon, node.lat, { name: node.name });
  });

  const koreaRoadEdges: [string, string, string][] = [
    ['rn_1', 'rn_2', '세종대로'],
    ['rn_2', 'rn_3', '세종대로'],
    ['rn_3', 'rn_4', '종로'],
    ['rn_2', 'rn_5', '을지로'],
    ['rn_5', 'rn_6', '남대문로'],
    ['rn_6', 'rn_7', '삼일대로'],
    ['rn_7', 'rn_8', '한남대로'],
    ['rn_8', 'rn_9', '한남대교'],
    ['rn_9', 'rn_10', '강남대로'],
    ['rn_10', 'rn_11', '강남대로'],
    ['rn_11', 'rn_12', '강남대로'],
    ['rn_12', 'rn_13', '테헤란로'],
    ['rn_13', 'rn_14', '테헤란로'],
    ['rn_14', 'rn_15', '테헤란로'],
    ['rn_12', 'rn_16', '강남대로'],
    ['rn_16', 'rn_17', '경부고속도로'],
    ['rn_17', 'rn_18', '경부고속도로'],
    ['rn_18', 'rn_19', '경부고속도로'],
    ['rn_19', 'rn_20', '번영로'],
  ];

  koreaRoadEdges.forEach(([from, to, name]) => {
    const n1 = koreaRoadNodes.find((n) => n.id === from);
    const n2 = koreaRoadNodes.find((n) => n.id === to);
    if (!n1 || !n2) return;

    const dist = haversineDistance(n1.lon, n1.lat, n2.lon, n2.lat);
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
  // 4. LANDMARKS & LOCAL POIS (High Zoom: 11 ~ 24)
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

let _masterDataCache: ReturnType<typeof buildGlobalMasterDataset> | null = null;

export function getMasterData() {
  if (!_masterDataCache) {
    _masterDataCache = buildGlobalMasterDataset();
  }
  return _masterDataCache;
}
