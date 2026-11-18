# Koharu Maps

**Zero-Dependency Standalone GIS & Offline Cartographic Engine**  
**개발: KCS - Koharu Coding Server**  
**공식 서비스 도메인:** `https://map.koharu.live`  
**GitHub 저장소:** `https://github.com/Workshop-Koharu/Koharu-Maps.git`

기존 상용 지도 서비스(Google Maps, Naver Maps, Kakao Maps, Mapbox, Leaflet, OpenLayers 등)에 일체 의존하지 않는 **100% 완전 독립형 오프라인 GIS 소프트웨어 및 무료 오픈 API 플랫폼**입니다.

---

## 1. 핵심 특징

1. **완전 독립형 지도 렌더링 엔진 (Zero-Dependency)**
   - Leaflet, MapLibre, OpenLayers, Google Maps, Mapbox API/SDK 일체 배제
   - HTML5 Canvas 2D 기반 순수 자체 벡터 렌더러
   - WGS84 (EPSG:4326), Web Mercator (EPSG:3857) 정밀 수학 공식 직접 구현
   - 뷰포트 컬링, 2.5D 건물 입체 렌더링, 도로 계층화(casing + fill), 수계/녹지 폴리곤, 스마트 라벨 충돌 회피 알고리즘 내장
2. **자체 공간 데이터베이스 & 인덱싱**
   - QuadTree 공간 분할 트리 알고리즘 구현
   - 대규모 지리정보 공간 질의(Range query) 및 최근접 이웃(k-NN) 고속 탐색
3. **독립형 내비게이션 엔진**
   - 위상학적 도로망 그래프(RoadGraph) 구축
   - A* 최단시간/최단거리 탐색 알고리즘
   - 진입, 좌/우회전, 유턴, 직진, 도착 등 턴바이턴(Turn-by-turn) 실시간 주행 안내 문장 생성
4. **로컬 지오코딩 & 장소 검색 엔진**
   - 외부 지오코딩 API 없는 로컬 역색인(Inverted Index) 및 한글 자모/음절 바이그램(Bi-gram) 검색
   - 순수 로컬 역지오코딩 (위도/경도 -> 최근접 도로명 주소 및 랜드마크 자동 역변환)
5. **무료 API 서비스 & API 키 발급 시스템**
   - 상업적/비상업적 제한 없는 무료 Open API 서비스 제공
   - 개발자 포털(`/developer`)에서 무료 API 키(`kmap_live_...`) 즉시 발급 및 사용량 추적
   - 브라우저 기반 대화형 실시간 API 테스터 지원
6. **전 세계 100개 언어 (i18n) 지원**
   - 한국어, 영어, 일본어, 중국어 등 전 세계 100개 공용어 인터페이스 지원
   - 실시간 언어 검색 및 즉각 반영
7. **쿠키 정책 & 동의 관리 배너**
   - 필수 쿠키만 허용, 모두 동의, 쿠키 정책 확인 옵션 제공
8. **11대 종합 법적 고지 및 약관 허브 (`/legal`)**
   - 개인정보 처리방침 (개인정보분쟁조정위원회, 대검찰청, 경찰청 신고 기관 명시)
   - 서비스 이용약관 (대한민국 법률 준거법 및 서울중앙지방법원 관할 합의)
   - 위치정보 이용약관 및 기기 권한 안내 (On-Device 로컬 GPS 연산 원칙)
   - 약관 및 방침 변경 시 최소 30일(1개월) 전 등록 이용자 이메일 사전 공지 의무 준수
9. **회원 인증 & 보안 알림 (Resend & Supabase)**
   - 이메일 회원가입 6자리 일회용 인증코드 발송 (10분 만료)
   - 신규 가입 시 4종(이메일, Google, Discord, GitHub) 환영 이메일 자동 발송
   - 새로운 IP 또는 새로운 기기(User-Agent) 로그인 감지 시 실시간 보안 경고 이메일 발송
   - 설정 화면(`/settings`)에서 계정 영구 삭제 지원

---

## 2. 프로젝트 구조

```
Koharu Maps/
├── app/                           # Next.js 14 App Router
│   ├── page.tsx                   # 메인 지도 인터페이스 (Canvas 2D 렌더러)
│   ├── layout.tsx                 # 루트 레이아웃 & 쿠키 동의 배너
│   ├── developer/page.tsx         # 개발자 포털 & 무료 API 키 관리
│   ├── api-docs/page.tsx          # 대화형 REST API 명세서
│   ├── settings/page.tsx          # 계정 설정 & 영구 삭제
│   ├── terms/page.tsx             # 서비스 이용약관
│   ├── privacy/page.tsx           # 개인정보 처리방침
│   ├── legal/                     # 11대 법적 고지 및 정책 허브
│   └── api/                       # RESTful API 엔드포인트
├── components/                    # 재사용 가능한 UI 컴포넌트 (Lucide 아이콘 기반)
│   ├── Header.tsx                 # 상단 헤더 & 검색바
│   ├── MapViewport.tsx            # HTML5 Canvas 2D 벡터 렌더러 뷰포트
│   ├── RoutePanel.tsx             # 길찾기 및 A* 경로 탐색 패널
│   ├── FavoritesPanel.tsx         # 관심 장소 즐겨찾기 패널
│   ├── AuthModal.tsx              # Resend 인증코드 & 소셜 로그인 모달
│   ├── ContextPopup.tsx           # 지도 우클릭 컨텍스트 메뉴
│   ├── CookieConsent.tsx          # 쿠키 동의 플로팅 배너
│   └── LanguageSelector.tsx       # 100개 언어 실시간 선택기
├── lib/                           # 핵심 엔진 및 유틸리티
│   ├── gis-engine.ts              # 좌표 변환, A* 라우팅, QuadTree 인덱서
│   ├── global-data.ts             # 전 세계 대륙 및 주요 도시/도로망 데이터
│   ├── i18n.ts                    # 100개 언어 번역 엔진
│   ├── legal-policies.ts          # 11대 법적 고지 메타데이터 및 정책
│   ├── supabase.ts                # Supabase 클라이언트 싱글톤
│   ├── db.ts                      # 비동기 데이터베이스 엔진 (Supabase/로컬)
│   ├── auth.ts                    # JWT 세션 & 접속 환경 파서
│   └── email.ts                   # Resend 이메일 발송 모듈
├── public/
│   ├── logo.svg                   # 자체 로고 SVG
│   ├── favicon.svg                # 파비콘 SVG
│   └── sdk/koharu-maps.js         # 독립형 브라우저 클라이언트 SDK
├── sdk/                           # 독립형 NPM/TS SDK 패키지
├── supabase/                      # Supabase DDL 스키마
│   └── schema.sql                 # PostgreSQL 테이블/인덱스/트리거
├── setting.md                     # 클라우드 인프라 세팅 마스터 가이드
└── package.json                   # 의존성 및 스크립트 정의
```

---

## 3. 빠른 시작 및 실행

### 필수 환경 변수 (`.env`)
`.env.example`을 참고하여 `.env`를 구성합니다.

```ini
NEXT_PUBLIC_APP_URL=https://map.koharu.live
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=Koharu Maps <onboarding@resend.dev>
```

### 실행 명령어

```powershell
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드 및 실행
npm run build
npm start
```

---

## 4. 라이선스 및 크레딧

- **개발 및 운영:** KCS - Koharu Coding Server
- **지도 데이터 및 위성 영상 출처:** KCS 독자 측지 데이터베이스 & 고해상도 위성 영상 (Satellite Imagery)
- **아이콘:** Lucide Icons (ISC License)
