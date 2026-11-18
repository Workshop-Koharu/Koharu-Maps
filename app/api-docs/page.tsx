'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Key, 
  Copy, 
  Check, 
  Send, 
  Code2, 
  Terminal, 
  Zap, 
  Globe, 
  Compass, 
  Navigation, 
  Layers, 
  Info,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface EndpointDoc {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  category: string;
  description: string;
  params: {
    name: string;
    type: string;
    required: boolean;
    default?: string;
    desc: string;
  }[];
  examples: {
    curl: string;
    js: string;
    python: string;
    sdk: string;
  };
  sampleResponse: any;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: 'search',
    name: '장소 및 랜드마크 검색 (POI Search)',
    method: 'GET',
    path: '/api/v1/search',
    category: '지오코딩 & 검색',
    description: '전 세계 국가, 대도시 및 대한민국 행정구역, 랜드마크, 도로명 주소를 역색인(Inverted Index) 및 바이그램(Bi-gram) 유사도 분석을 통해 밀리초 단위로 초고속 검색합니다.',
    params: [
      { name: 'q', type: 'string', required: true, desc: '검색 키워드 (예: "강남역", "뉴욕", "도쿄", "광화문", "세종대로")' },
      { name: 'limit', type: 'number', required: false, default: '10', desc: '반환할 최대 결과 수 (1 ~ 50)' },
      { name: 'center_lon', type: 'number', required: false, desc: '중심 경도 (WGS84). 입력 시 해당 좌표와의 거리 근접도 가중치 부여' },
      { name: 'center_lat', type: 'number', required: false, desc: '중심 위도 (WGS84). 입력 시 해당 좌표와의 거리 근접도 가중치 부여' },
    ],
    examples: {
      curl: `curl -X GET "https://map.koharu.live/api/v1/search?q=강남역&limit=5" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      js: `// JavaScript (Fetch API) / TypeScript
const res = await fetch('https://map.koharu.live/api/v1/search?q=강남역&limit=5', {
  method: 'GET',
  headers: {
    'X-API-Key': 'YOUR_API_KEY'
  }
});
const data = await res.json();
console.log(data.results);`,
      python: `# Python 3 (requests)
import requests

url = "https://map.koharu.live/api/v1/search"
params = { "q": "강남역", "limit": 5 }
headers = { "X-API-Key": "YOUR_API_KEY" }

response = requests.get(url, params=params, headers=headers)
data = response.json()
print(data["results"])`,
      sdk: `// Koharu Maps JavaScript SDK
import { KoharuMapsClient } from '@koharu/maps-sdk';

const client = new KoharuMapsClient({ apiKey: 'YOUR_API_KEY' });
const result = await client.search('강남역', { limit: 5 });
console.log(result.results);`,
    },
    sampleResponse: {
      status: 'success',
      query: '강남역',
      count: 1,
      results: [
        {
          id: 'p_6',
          name: '강남역',
          category: '교통/상업',
          address: '서울특별시 강남구 강남대로 396',
          location: { lon: 127.028, lat: 37.498 },
          score: 100
        }
      ]
    }
  },
  {
    id: 'reverse-geocode',
    name: '좌표 역지오코딩 (Reverse Geocoding)',
    method: 'GET',
    path: '/api/v1/reverse-geocode',
    category: '지오코딩 & 검색',
    description: '지정된 WGS84 위도(lat)와 경도(lon) 좌표에서 구면 하버사인(Haversine) 최단 거리 알고리즘을 수행하여 가장 인접한 도로명 주소, 행정동 명칭 및 거리를 반환합니다.',
    params: [
      { name: 'lon', type: 'number', required: true, desc: '경도 (Longitude, WGS84 기준: -180 ~ 180)' },
      { name: 'lat', type: 'number', required: true, desc: '위도 (Latitude, WGS84 기준: -90 ~ 90)' },
      { name: 'max_dist_m', type: 'number', required: false, default: '5000', desc: '검색 최대 허용 반경 (미터 단위)' },
    ],
    examples: {
      curl: `curl -X GET "https://map.koharu.live/api/v1/reverse-geocode?lon=126.9784&lat=37.5663" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      js: `// JavaScript (Fetch API) / TypeScript
const res = await fetch('https://map.koharu.live/api/v1/reverse-geocode?lon=126.9784&lat=37.5663', {
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
});
const data = await res.json();
console.log(data.place);`,
      python: `# Python 3 (requests)
import requests

url = "https://map.koharu.live/api/v1/reverse-geocode"
params = { "lon": 126.9784, "lat": 37.5663 }
headers = { "X-API-Key": "YOUR_API_KEY" }

response = requests.get(url, params=params, headers=headers)
print(response.json())`,
      sdk: `// Koharu Maps JavaScript SDK
import { KoharuMapsClient } from '@koharu/maps-sdk';

const client = new KoharuMapsClient({ apiKey: 'YOUR_API_KEY' });
const place = await client.reverseGeocode(126.9784, 37.5663);
console.log(place);`,
    },
    sampleResponse: {
      status: 'success',
      found: true,
      place: {
        id: 'p_2',
        name: '서울시청',
        category: '공공기관',
        address: '서울특별시 중구 세종대로 110',
        lon: 126.9784,
        lat: 37.5663,
        distanceM: 0
      }
    }
  },
  {
    id: 'route',
    name: 'A* 최적 경로 탐색 (Turn-by-Turn Routing)',
    method: 'GET',
    path: '/api/v1/route',
    category: '내비게이션 & 라우팅',
    description: '출발지와 목적지 좌표를 도로망 노드에 투영(Snap)한 후, A* (A-Star) 휴리스틱 최단 경로 알고리즘을 구동하여 주행 궤적 좌표열, 총 주행 거리, 예상 소요 시간 및 교차로별 주행 지침을 생성합니다.',
    params: [
      { name: 'start', type: 'string', required: true, desc: '출발지 좌표 ("lon,lat") 또는 장소명 (예: "126.9768,37.5750" 또는 "광화문")' },
      { name: 'target', type: 'string', required: true, desc: '목적지 좌표 ("lon,lat") 또는 장소명 (예: "127.0280,37.4980" 또는 "강남역")' },
      { name: 'algorithm', type: 'string', required: false, default: 'a_star', desc: '경로 탐색 알고리즘 식별자' },
    ],
    examples: {
      curl: `curl -X GET "https://map.koharu.live/api/v1/route?start=126.9768,37.5750&target=127.0280,37.4980" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      js: `// JavaScript (Fetch API) / TypeScript
const res = await fetch('https://map.koharu.live/api/v1/route?start=126.9768,37.5750&target=127.0280,37.4980', {
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
});
const data = await res.json();
console.log(\`총 거리: \${data.route.distanceM}m, 소요시간: \${data.route.durationMin}분\`);`,
      python: `# Python 3 (requests)
import requests

url = "https://map.koharu.live/api/v1/route"
params = {
    "start": "126.9768,37.5750",
    "target": "127.0280,37.4980"
}
headers = { "X-API-Key": "YOUR_API_KEY" }

response = requests.get(url, params=params, headers=headers)
route_data = response.json()
print("총 주행 거리:", route_data["route"]["distanceM"])`,
      sdk: `// Koharu Maps JavaScript SDK
import { KoharuMapsClient } from '@koharu/maps-sdk';

const client = new KoharuMapsClient({ apiKey: 'YOUR_API_KEY' });
const route = await client.calculateRoute(
  [126.9768, 37.5750], 
  [127.0280, 37.4980]
);
console.log(route.instructions);`,
    },
    sampleResponse: {
      status: 'success',
      algorithm: 'a_star',
      route: {
        distanceM: 10540,
        durationSec: 780,
        durationMin: 13,
        coordinates: [
          [126.9768, 37.575],
          [126.977, 37.566],
          [127.028, 37.498]
        ],
        instructions: [
          { type: 'depart', message: '세종대로 방면으로 출발합니다.', distanceM: 1000 },
          { type: 'turn-right', message: '강남대로 방면으로 우회전입니다.', distanceM: 1500 },
          { type: 'arrive', message: '목적지에 도착했습니다.' }
        ]
      }
    }
  },
  {
    id: 'features',
    name: '벡터 지리 피처 조회 (Cartographic Features)',
    method: 'GET',
    path: '/api/v1/features',
    category: '카토그래피 & 벡터 레이어',
    description: '대륙 경계선, 국가 영역, 해양 레이어, 수계, 도로망 링크, 랜드마크 포인트 등 지도를 구성하는 원시 지리정보 벡터 데이터를 GeoJSON 형식으로 스트리밍합니다.',
    params: [
      { name: 'limit', type: 'number', required: false, default: '1000', desc: '반환할 최대 피처 레코드 수 (최대 2000)' },
    ],
    examples: {
      curl: `curl -X GET "https://map.koharu.live/api/v1/features?limit=10" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      js: `// JavaScript (Fetch API) / TypeScript
const res = await fetch('https://map.koharu.live/api/v1/features?limit=10', {
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
});
const data = await res.json();
console.log(data.features);`,
      python: `# Python 3 (requests)
import requests

url = "https://map.koharu.live/api/v1/features"
params = { "limit": 10 }
headers = { "X-API-Key": "YOUR_API_KEY" }

response = requests.get(url, params=params, headers=headers)
print("반환된 피처 수:", response.json()["count"])`,
      sdk: `// Koharu Maps JavaScript SDK
import { KoharuMapsClient } from '@koharu/maps-sdk';

const client = new KoharuMapsClient({ apiKey: 'YOUR_API_KEY' });
const res = await client.getFeatures({ limit: 10 });
console.log(res.features);`,
    },
    sampleResponse: {
      status: 'success',
      count: 10,
      features: [
        {
          id: 'country_kr',
          type: 'Feature',
          layer: 'country',
          properties: { name: '대한민국', nameEn: 'South Korea', minZoom: 2 },
          geometry: { type: 'Point', coordinates: [127.7669, 35.9078] }
        }
      ]
    }
  },
  {
    id: 'metadata',
    name: '카토그래픽 엔진 메타데이터 (System Metadata)',
    method: 'GET',
    path: '/api/v1/metadata',
    category: '시스템 & 정보',
    description: 'Koharu Maps 카토그래픽 엔진의 빌드 버전, 지원 공간 좌표계(CRS: EPSG:4326, EPSG:3857, EPSG:5186) 및 활성화된 벡터 레이어 목록을 반환합니다.',
    params: [],
    examples: {
      curl: `curl -X GET "https://map.koharu.live/api/v1/metadata"`,
      js: `// JavaScript (Fetch API) / TypeScript
const res = await fetch('https://map.koharu.live/api/v1/metadata');
const meta = await res.json();
console.log(meta);`,
      python: `# Python 3 (requests)
import requests

response = requests.get("https://map.koharu.live/api/v1/metadata")
print(response.json())`,
      sdk: `// Koharu Maps JavaScript SDK
import { KoharuMapsClient } from '@koharu/maps-sdk';

const client = new KoharuMapsClient();
const metadata = await client.getMetadata();
console.log(metadata);`,
    },
    sampleResponse: {
      status: 'success',
      engine: 'Koharu Maps Standalone GIS & Cartographic Engine',
      version: '1.0.0',
      domain: 'https://map.koharu.live',
      crs: ['EPSG:4326', 'EPSG:3857', 'EPSG:5186'],
      layers: ['continent', 'country', 'ocean', 'water', 'green', 'road', 'building', 'place']
    }
  }
];

export default function ApiDocsPage() {
  const [activeLang, setActiveLang] = useState<Record<string, 'curl' | 'js' | 'python' | 'sdk'>>({
    search: 'curl',
    'reverse-geocode': 'curl',
    route: 'curl',
    features: 'curl',
    metadata: 'curl',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Interactive API Runner state
  const [testEndpoint, setTestEndpoint] = useState('/api/v1/search?q=강남역');
  const [testApiKey, setTestApiKey] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [testLatency, setTestLatency] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunLiveTest = async () => {
    setTestLoading(true);
    setTestResponse('요청 전송 중...');
    setTestStatus(null);
    setTestLatency(null);

    const startTime = performance.now();
    try {
      const headers: Record<string, string> = {};
      if (testApiKey.trim()) {
        headers['X-API-Key'] = testApiKey.trim();
      }

      // Actual fetch to the live API endpoint
      const res = await fetch(testEndpoint, { headers });
      const elapsed = (performance.now() - startTime).toFixed(1);
      const data = await res.json();

      setTestStatus(res.status);
      setTestLatency(`${elapsed} ms`);
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestStatus(0);
      setTestResponse(JSON.stringify({ error: err.message, note: '요청 실패' }, null, 2));
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 20px 90px 20px', minHeight: '100vh' }}>
      {/* Top Header Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap',
        gap: 16,
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: 22, 
        marginBottom: 28 
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.svg" alt="Koharu Maps Logo" width="30" height="30" />
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Koharu Maps REST API Reference
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
            Official RESTful API Documentation & Live Testing Console &middot; 개발: KCS - Koharu Coding Server
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/developer" className="btn btn-primary">
            <Key size={15} />
            <span>무료 API 키 발급</span>
          </Link>
          <Link href="/" className="btn btn-outline">
            <ArrowLeft size={15} />
            <span>지도로 돌아가기</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* API Basics & Rate Limits Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--accent)" />
            <span>기본 규격 및 인증 가이드</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
            Koharu Maps API는 전 세계 대륙, 해양, 국가, 도시, 도로망 및 행정구역 데이터를 순수 자체 구축 공간 엔진으로 서비스합니다.
            모든 요청은 표준 HTTPS 프로토콜을 사용하며, 응답은 <code>application/json; charset=utf-8</code> 형식으로 반환됩니다.
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 12,
            background: 'var(--bg-primary)',
            padding: 14,
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            border: '1px solid var(--border-color)',
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>기본 URL:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>https://map.koharu.live/api/v1</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>인증 헤더:</span>{' '}
              <code style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4 }}>
                X-API-Key: YOUR_API_KEY
              </code>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>공간 좌표계:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>WGS84 (EPSG:4326), Web Mercator (EPSG:3857)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>기술 및 운영 문의:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>admin@koharu.live</strong> (KCS 관리진)
            </div>
          </div>
        </div>

        {/* Live Interactive API Runner (실시간 실제 API 테스터) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={18} color="var(--accent)" />
                <span>실시간 대화형 API 테스트 콘솔 (Live Interactive Runner)</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                실제 Next.js 백엔드 엔드포인트를 실시간으로 호출하고 왕복 응답 속도와 실제 JSON 페이로드를 검증합니다.
              </p>
            </div>
            <span className="badge badge-green" style={{ fontSize: 11 }}>
              LIVE ENGINE ACTIVE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  엔드포인트 및 쿼리 프리셋 선택
                </label>
                <select
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="input-text"
                  style={{ width: '100%', fontSize: 13 }}
                >
                  <option value="/api/v1/search?q=강남역&limit=5">장소 검색: /api/v1/search?q=강남역</option>
                  <option value="/api/v1/search?q=뉴욕&limit=5">글로벌 도시 검색: /api/v1/search?q=뉴욕</option>
                  <option value="/api/v1/reverse-geocode?lon=126.9784&lat=37.5663">역지오코딩: /api/v1/reverse-geocode (서울시청)</option>
                  <option value="/api/v1/reverse-geocode?lon=139.6917&lat=35.6895">역지오코딩: /api/v1/reverse-geocode (도쿄)</option>
                  <option value="/api/v1/route?start=126.9768,37.5750&target=127.0280,37.4980">길찾기: 광화문 → 강남역 (A*)</option>
                  <option value="/api/v1/features?limit=5">벡터 피처 조회: /api/v1/features?limit=5</option>
                  <option value="/api/v1/metadata">시스템 메타데이터: /api/v1/metadata</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  요청 URL 직접 편집
                </label>
                <input
                  type="text"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="input-text"
                  style={{ width: '100%', fontSize: 12, fontFamily: 'monospace' }}
                  placeholder="/api/v1/..."
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  X-API-Key 헤더 (선택 사항)
                </label>
                <input
                  type="text"
                  value={testApiKey}
                  onChange={(e) => setTestApiKey(e.target.value)}
                  className="input-text"
                  style={{ width: '100%', fontSize: 12, fontFamily: 'monospace' }}
                  placeholder="미입력 시 공개 게스트 모드로 즉시 호출됩니다."
                />
              </div>

              <button
                onClick={handleRunLiveTest}
                disabled={testLoading}
                className="btn btn-primary"
                style={{ marginTop: 4, height: 40 }}
              >
                <Send size={15} />
                <span>{testLoading ? '실시간 호출 실행 중...' : '실시간 API 호출 실행 (Send Request)'}</span>
              </button>
            </div>

            {/* Right Output Panel */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  실제 응답 결과 (HTTP Response)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {testStatus !== null && (
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: 4,
                      background: testStatus === 200 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: testStatus === 200 ? 'var(--success)' : 'var(--danger)'
                    }}>
                      HTTP {testStatus}
                    </span>
                  )}
                  {testLatency && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      왕복 지연시간: {testLatency}
                    </span>
                  )}
                  {testResponse && (
                    <button
                      onClick={() => handleCopy(testResponse, 'runner-copy')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      title="결과 복사"
                    >
                      {copiedId === 'runner-copy' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <pre style={{
                flex: 1,
                minHeight: 220,
                maxHeight: 280,
                background: '#090d16',
                color: '#38bdf8',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                fontSize: 12,
                fontFamily: 'monospace',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                margin: 0,
              }}>
                {testResponse || '// 상단의 "실시간 API 호출 실행" 버튼을 누르면 실제 서버 응답이 여기에 출력됩니다.'}
              </pre>
            </div>
          </div>
        </div>

        {/* Detailed API Endpoints Specification */}
        {ENDPOINTS.map((ep, idx) => {
          const currentLang = activeLang[ep.id] || 'curl';
          const codeSnippet = ep.examples[currentLang];

          return (
            <div
              key={ep.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Endpoint Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: ep.method === 'GET' ? '#10b981' : '#3b82f6',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {ep.path}
                  </code>
                </div>
                <span className="badge badge-blue">
                  {ep.category}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                {idx + 1}. {ep.name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                {ep.description}
              </p>

              {/* Parameters Table */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  요청 파라미터 (Query Parameters)
                </div>
                {ep.params.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                    필수 또는 선택 요청 파라미터가 없습니다.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px 10px' }}>파라미터</th>
                          <th style={{ padding: '8px 10px' }}>타입</th>
                          <th style={{ padding: '8px 10px' }}>필수 여부</th>
                          <th style={{ padding: '8px 10px' }}>기본값</th>
                          <th style={{ padding: '8px 10px' }}>설명</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ep.params.map(p => (
                          <tr key={p.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}><code>{p.name}</code></td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{p.type}</td>
                            <td style={{ padding: '8px 10px' }}>
                              {p.required ? (
                                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>필수</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>선택</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{p.default || '-'}</td>
                            <td style={{ padding: '8px 10px' }}>{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Code Examples with Multi-Language Switcher */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    호출 코드 예제 (Code Examples)
                  </div>
                  {/* Language Tabs */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['curl', 'js', 'python', 'sdk'] as const).map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLang(prev => ({ ...prev, [ep.id]: lang }))}
                        style={{
                          background: currentLang === lang ? 'var(--accent)' : 'var(--bg-primary)',
                          color: currentLang === lang ? '#ffffff' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 4,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {lang === 'curl' ? 'cURL' : lang === 'js' ? 'JavaScript' : lang === 'python' ? 'Python' : 'Maps SDK'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <pre style={{
                    background: '#090d16',
                    color: '#f1f5f9',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    border: '1px solid var(--border-color)',
                    margin: 0,
                  }}>
                    {codeSnippet}
                  </pre>
                  <button
                    onClick={() => handleCopy(codeSnippet, `code-${ep.id}-${currentLang}`)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 4,
                      color: '#fff',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                    }}
                    title="코드 복사"
                  >
                    {copiedId === `code-${ep.id}-${currentLang}` ? (
                      <>
                        <Check size={12} color="var(--success)" />
                        <span>복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sample Response */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  응답 JSON 스키마 및 예시 (Response 200 OK)
                </div>
                <pre style={{
                  background: '#090d16',
                  color: '#38bdf8',
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  border: '1px solid var(--border-color)',
                  margin: 0,
                }}>
                  {JSON.stringify(ep.sampleResponse, null, 2)}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
