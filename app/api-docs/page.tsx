'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Key, ExternalLink, Check, Copy } from 'lucide-react';

export default function ApiDocsPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px 20px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 20, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Koharu Maps REST API Reference</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Official Documentation & Specification for https://map.koharu.live &middot; 개발: KCS - Koharu Coding Server
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/developer" className="btn btn-outline">
            <Key size={15} />
            <span>무료 API 키 발급</span>
          </Link>
          <Link href="/" className="btn btn-outline">
            <ArrowLeft size={15} />
            <span>지도로 돌아가기</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Intro Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>인증 및 엔드포인트 기본 규격</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            모든 API 요청은 표준 HTTPS 프로토콜을 사용하며, 응답 데이터는 JSON 형식(UTF-8)으로 반환됩니다.
            인증 헤더는 선택 사항이며, 발급받은 무료 API 키를 헤더에 포함할 경우 사용량 통계가 집계됩니다.
          </p>
          <div style={{ marginTop: 12, background: 'var(--accent-light)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--accent)' }}>
            <strong>기본 URL:</strong> <code>https://map.koharu.live/api/v1</code> &middot; <strong>헤더:</strong> <code>X-API-Key: YOUR_API_KEY</code>
          </div>
        </div>

        {/* 1. Search API */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>GET</span>
            <code style={{ fontSize: 15, fontWeight: 700 }}>/api/v1/search</code>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            전 세계 대도시 및 대한민국 행정구역, 랜드마크, 도로명 주소를 역색인(Inverted Index) 기반으로 초고속 검색합니다.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 10px' }}>파라미터</th>
                <th style={{ padding: '8px 10px' }}>타입</th>
                <th style={{ padding: '8px 10px' }}>필수</th>
                <th style={{ padding: '8px 10px' }}>설명</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 10px' }}><code>q</code></td>
                <td style={{ padding: '8px 10px' }}>string</td>
                <td style={{ padding: '8px 10px', color: 'var(--danger)' }}>필수</td>
                <td style={{ padding: '8px 10px' }}>검색 키워드 (예: "강남역", "뉴욕", "도쿄", "세종대로")</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 10px' }}><code>limit</code></td>
                <td style={{ padding: '8px 10px' }}>number</td>
                <td style={{ padding: '8px 10px' }}>선택</td>
                <td style={{ padding: '8px 10px' }}>최대 반환 개수 (기본값: 10, 최대: 50)</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 10px' }}><code>center_lon</code> / <code>center_lat</code></td>
                <td style={{ padding: '8px 10px' }}>number</td>
                <td style={{ padding: '8px 10px' }}>선택</td>
                <td style={{ padding: '8px 10px' }}>현재 뷰포트 중심 좌표 (거리 근접도 가중치 부여)</td>
              </tr>
            </tbody>
          </table>
          <pre style={{ background: '#090d16', color: '#38bdf8', padding: 14, borderRadius: 'var(--radius-md)', fontSize: 12, fontFamily: 'monospace' }}>
{`{
  "status": "success",
  "query": "강남역",
  "count": 1,
  "results": [
    {
      "id": "p_6",
      "name": "강남역",
      "category": "교통/상업",
      "address": "서울특별시 강남구 강남대로 396",
      "location": { "lon": 127.0280, "lat": 37.4980 },
      "score": 100
    }
  ]
}`}
          </pre>
        </div>

        {/* 2. Reverse Geocode */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>GET</span>
            <code style={{ fontSize: 15, fontWeight: 700 }}>/api/v1/reverse-geocode</code>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            지정된 WGS84 위도와 경도에서 가장 가까운 도로명 주소, 랜드마크 명칭 및 거리를 반환합니다.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 10px' }}>파라미터</th>
                <th style={{ padding: '8px 10px' }}>타입</th>
                <th style={{ padding: '8px 10px' }}>필수</th>
                <th style={{ padding: '8px 10px' }}>설명</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '8px 10px' }}><code>lon</code></td>
                <td style={{ padding: '8px 10px' }}>number</td>
                <td style={{ padding: '8px 10px', color: 'var(--danger)' }}>필수</td>
                <td style={{ padding: '8px 10px' }}>경도 (Longitude, WGS84)</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 10px' }}><code>lat</code></td>
                <td style={{ padding: '8px 10px' }}>number</td>
                <td style={{ padding: '8px 10px', color: 'var(--danger)' }}>필수</td>
                <td style={{ padding: '8px 10px' }}>위도 (Latitude, WGS84)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Routing API */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>GET</span>
            <code style={{ fontSize: 15, fontWeight: 700 }}>/api/v1/route</code>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            출발지와 도착지 좌표를 도로망에 스냅하여 A* 알고리즘으로 최적 경로, 총 거리, 예상 소요 시간 및 턴바이턴 주행 안내를 생성합니다.
          </p>
          <pre style={{ background: '#090d16', color: '#38bdf8', padding: 14, borderRadius: 'var(--radius-md)', fontSize: 12, fontFamily: 'monospace' }}>
{`// 요청 예시
GET https://map.koharu.live/api/v1/route?start=126.9768,37.5750&target=127.0280,37.4980

// 응답 예시
{
  "status": "success",
  "algorithm": "a_star",
  "route": {
    "distanceM": 10540,
    "durationSec": 780,
    "durationMin": 13,
    "coordinates": [[126.9768, 37.575], [126.977, 37.566]],
    "instructions": [
      { "type": "depart", "message": "세종대로 방면으로 출발합니다.", "distanceM": 1000 },
      { "type": "turn-right", "message": "강남대로 방면으로 우회전입니다.", "distanceM": 1500 },
      { "type": "arrive", "message": "목적지에 도착했습니다." }
    ]
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
