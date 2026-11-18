# Koharu Maps — 환경 설정 및 Vercel / Supabase 배포 마스터 가이드

본 문서는 **Koharu Maps**의 모든 클라우드 인프라(Supabase PostgreSQL, Resend 이메일 인증, Google·Discord·GitHub OAuth 2.0), 커스텀 도메인(`https://map.koharu.live`), 100개 언어 지원 체계, 쿠키 정책 및 **Vercel 프로덕션 배포**를 완벽하게 세팅하기 위한 공식 마스터 가이드입니다.

---

## 1. 개요 및 필수 환경 변수 명세

로컬 개발 환경에서는 `.env` 파일에, Vercel 배포 시에는 **Vercel Dashboard > Project Settings > Environment Variables**에 아래 환경 변수들을 등록합니다.

| 환경 변수명 | 필수 여부 | 설명 | 예시 값 |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | **필수** | 서비스 정식 운영 커스텀 도메인 (Clean URL) | `https://map.koharu.live` |
| `JWT_SECRET` | **필수** | 14일 세션 토큰 및 JWT 서명용 대칭 비밀키 | `koharu_maps_super_secret_production_key_2026` |
| `NEXT_PUBLIC_SUPABASE_URL` | **필수** | Supabase 프로젝트 API 기본 URL | `https://xxxxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **필수** | Supabase 브라우저 공개 Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **필수** | 서버 전용 Service Role Key (RLS 우회 관리자) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `RESEND_API_KEY` | **필수** | Resend 이메일 발송용 API Key | `re_123456789...` |
| `RESEND_FROM_EMAIL` | **필수** | 인증코드/환영/보안알림 이메일 발신자 | `Koharu Maps <onboarding@resend.dev>` 또는 `noreply@map.koharu.live` |
| `GOOGLE_CLIENT_ID` | 선택 | Google Cloud Console OAuth 2.0 Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | 선택 | Google Cloud Console OAuth 2.0 Client Secret | `GOCSPX-xxxx` |
| `DISCORD_CLIENT_ID` | 선택 | Discord Developer Portal Application ID | `123456789012345678` |
| `DISCORD_CLIENT_SECRET` | 선택 | Discord Application Client Secret | `abcdef123456...` |
| `GITHUB_CLIENT_ID` | 선택 | GitHub Settings OAuth Apps Client ID | `Ov23li...` |
| `GITHUB_CLIENT_SECRET` | 선택 | GitHub Settings OAuth Apps Client Secret | `1a2b3c4d5e...` |

---

## 2. Supabase (PostgreSQL) 데이터베이스 세팅 가이드

Koharu Maps는 무서버 환경(Vercel Edge/Serverless)과의 최적화된 연동을 위해 **Supabase PostgreSQL**을 기본 데이터베이스 엔진으로 사용합니다.

### 2.1 Supabase 프로젝트 생성
1. [Supabase 공식 콘솔](https://supabase.com/)에 로그인하고 **New Project**를 클릭합니다.
2. 조직(Organization) 및 프로젝트 이름(예: `koharu-maps`), 안전한 데이터베이스 비밀번호를 지정하고 지역(Region)을 **Seoul (ap-northeast-2)**로 선택합니다.
3. 생성이 완료될 때까지 약 1~2분 대기합니다.

### 2.2 DDL 스키마 적용 (테이블 및 인덱스 일괄 생성)
1. Supabase 좌측 네비게이션 메뉴에서 **SQL Editor**를 클릭합니다.
2. **New query** 버튼을 누릅니다.
3. 프로젝트 내 `supabase/schema.sql` 파일의 전체 내용을 복사하여 쿼리 편집기에 붙여넣습니다.
4. 우측 하단의 **Run** 버튼을 클릭하여 실행합니다.
5. 아래 5개의 테이블과 성능 최적화 인덱스, 트리거가 자동 생성됩니다:
   - `users`: 회원 정보 (이메일, 비밀번호 해시, 마지막 접속 IP/위치/기기, 소셜 공급자 정보)
   - `api_keys`: 무료 Open API 키 발급 및 사용량 추적 테이블
   - `favorites`: 사용자 관심 장소 즐겨찾기, 좌표(WGS84 lon/lat), 메모 저장
   - `verification_codes`: Resend 6자리 일회용 인증코드 (10분 만료)
   - `policy_notice_logs`: 30일(1개월) 전 약관 개정 이메일 사전 공지 감사 로그

### 2.3 API 자격 증명 복사
1. Supabase 좌측 하단 **Project Settings (톱니바퀴) > API**로 이동합니다.
2. 다음 3개 항목을 복사하여 `.env` 및 Vercel 환경 변수에 입력합니다:
   - **Project URL** &rarr; `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Keys > `anon` `public`** &rarr; `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API Keys > `service_role` `secret`** &rarr; `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Resend 이메일 API 세팅 (인증 / 환영 / 보안 알림)

Koharu Maps는 Resend SDK를 통해 다음 3단계 보안 이메일을 자동 발송합니다:
1. **회원가입 6자리 인증코드 메일:** 10분 유효 시간 동안 1회용 인증 번호 발송
2. **4종 가입 환영 메일:** 이메일 가입 및 Google, Discord, GitHub 최초 로그인 시 환영 메시지 자동 발송
3. **새 기기/신규 IP 보안 접속 알림 메일:** 기존과 다른 IP 주소나 미확인 브라우저/기기(User-Agent)에서 로그인이 감지되면 즉시 접속 IP와 국가/도시 지오로케이션 정보를 포함한 보안 알림 메일 발송

### 3.1 API Key 발급
1. [Resend 공식 사이트](https://resend.com/)에 로그인합니다.
2. 좌측 메뉴 **API Keys > Create API Key**를 클릭합니다.
3. Key Name을 `KoharuMaps-Live`로 입력하고 권한을 `Full Access`로 발급받습니다.
4. 발급된 `re_...` 문자열을 `RESEND_API_KEY`에 등록합니다.
5. `RESEND_FROM_EMAIL`을 지정합니다. (도메인 미인증 시 `Koharu Maps <onboarding@resend.dev>`, 도메인 인증 후 `noreply@map.koharu.live` 사용 가능)

---

## 4. 소셜 간편 로그인 (Google / Discord / GitHub) 세팅

모든 소셜 인증의 콜백 리다이렉트 URI는 **`https://map.koharu.live/api/auth/social/callback/{provider}`** 형식으로 지정합니다.

### 4.1 Google OAuth 2.0
1. [Google Cloud Console](https://console.cloud.google.com/) 접속 &gt; 프로젝트 선택.
2. **API 및 서비스 > OAuth 동의 화면** 설정 (외부 선택, 앱 이름: `Koharu Maps`).
3. **API 및 서비스 > 사용자 인증 정보 > 사용자 인증 정보 만들기 > OAuth 클라이언트 ID** (웹 애플리케이션).
4. **승인된 리디렉션 URI** 추가:
   - `https://map.koharu.live/api/auth/social/callback/google`
   - `http://localhost:3000/api/auth/social/callback/google` (로컬 테스트용)
5. `GOOGLE_CLIENT_ID` 및 `GOOGLE_CLIENT_SECRET` 등록.

### 4.2 Discord OAuth 2.0
1. [Discord Developer Portal](https://discord.com/developers/applications) &gt; **New Application**.
2. **OAuth2 > Redirects > Add Redirect**:
   - `https://map.koharu.live/api/auth/social/callback/discord`
   - `http://localhost:3000/api/auth/social/callback/discord`
3. `DISCORD_CLIENT_ID` 및 `DISCORD_CLIENT_SECRET` 등록.

### 4.3 GitHub OAuth App
1. [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers) &gt; **New OAuth App**.
2. **Homepage URL:** `https://map.koharu.live`
3. **Authorization callback URL:**
   - `https://map.koharu.live/api/auth/social/callback/github`
   - `http://localhost:3000/api/auth/social/callback/github`
4. `GITHUB_CLIENT_ID` 및 `GITHUB_CLIENT_SECRET` 등록.

---

## 5. Vercel 배포 및 커스텀 도메인 (`https://map.koharu.live`) 세팅

### 5.1 Vercel 프로젝트 생성
1. 본 프로젝트 코드를 GitHub 저장소에 푸시합니다.
2. [Vercel Dashboard](https://vercel.com/) 접속 &gt; **Add New... > Project** 클릭.
3. 저장소를 선택하여 Import합니다.
4. Framework Preset은 **Next.js**가 자동 감지됩니다.
5. **Environment Variables**에 본 가이드 1번 항목의 환경 변수를 모두 추가합니다.
6. **Deploy** 버튼을 누르면 배포가 완료됩니다.

### 5.2 커스텀 도메인 연결 (Clean URL & Trailing Slash 보장)
1. Vercel 프로젝트 대시보드 &gt; **Settings > Domains**로 이동합니다.
2. `map.koharu.live`를 입력하고 **Add**를 누릅니다.
3. Vercel이 지시하는 DNS CNAME 레코드를 등록합니다:
   - **타입:** `CNAME`
   - **이름(호스트):** `map`
   - **값(대상):** `cname.vercel-dns.com`
4. 도메인 등록 후 Vercel이 전 세계 Edge CDN에 고유 SSL(HTTPS) 인증서를 1분 내로 발급합니다.
5. `next.config.js` 및 `vercel.json`에 의해 `.html` 확장자가 제거된 정갈한 Clean URL과 일관된 슬래시 라우팅이 자동 적용됩니다.

---

## 6. 전 세계 100개 언어 (i18n) 및 쿠키 정책 아키텍처

- **100개 언어 지원 (`lib/i18n.ts` & `components/LanguageSelector.tsx`):**
  한국어, 영어, 일본어, 중국어(간체/번체), 스페인어, 프랑스어, 독일어, 러시아어, 아랍어, 힌디어 등 전 세계 100개 공용어를 완벽하게 지원합니다. 우측 상단의 언어 선택기를 통해 실시간으로 변경 가능하며, `localStorage('koharu_lang')`에 영구 보존됩니다.
- **쿠키 동의 배너 및 쿠키 정책 (`components/CookieConsent.tsx` & `/legal/cookie-policy`):**
  첫 방문 시 하단에 플로팅 배너가 표출되며, "필수 쿠키만 허용", "모두 동의", "쿠키 정책 보기" 버튼을 제공합니다. 동의 상태는 `localStorage`와 브라우저 쿠키에 안전하게 동기화됩니다.

---

## 7. 11대 법적 고지 및 약관 개정 30일(1개월) 전 사전 이메일 공지 의무

Koharu Maps는 법률 준수 및 사용자 권익 보호를 위해 11가지의 세부 정책 문서를 제공하며, 모든 약관 및 방침 변경 시 **시행일 최소 30일(1개월) 전에 등록된 사용자의 공식 이메일로 개정 사항을 사전 발송**합니다.

### 7.1 전체 11대 정책 링크
1. [오프라인 지도 데이터 라이선스 및 출처 고지](https://map.koharu.live/legal/data-license)
2. [개인정보 처리방침](https://map.koharu.live/legal/privacy) *(개인정보분쟁조정위원회 1833-6972, 침해신고센터 118, 대검찰청 1301, 경찰청 182 등 공식 구제기관 명시)*
3. [서비스 이용약관](https://map.koharu.live/legal/terms) *(대한민국 준거법 및 서울중앙지방법원 제1심 관할 법원 합의 조항 필수 명시)*
4. [쿠키 정책](https://map.koharu.live/legal/cookie-policy)
5. [오프라인 콘텐츠·데이터 이용 정책](https://map.koharu.live/legal/offline-content)
6. [위치정보 이용약관 및 기기 권한 안내](https://map.koharu.live/legal/location-terms) *(On-Device 로컬 GPS/GNSS 실시간 렌더링 원칙 및 파일/카메라/알림 권한 안내)*
7. [오픈소스 소프트웨어 라이선스 고지](https://map.koharu.live/legal/open-source)
8. [데이터 보관·파기 및 서비스 변경/중단 안내 정책](https://map.koharu.live/legal/data-retention)
9. [커뮤니티/사용자 기여 콘텐츠(UGC) 정책](https://map.koharu.live/legal/ugc-policy)
10. [지도 오류 제보 및 데이터 수정·삭제 요청 정책](https://map.koharu.live/legal/map-feedback)
11. [청소년 보호정책](https://map.koharu.live/legal/youth-protection)

---

## 8. 로컬 실행 및 테스트 검증

```powershell
# Koharu Maps 디렉터리로 이동
cd "c:\Users\L\Downloads\Koharu\KCS\Koharu Maps"

# 빌드 테스트 (Next.js 14 Production Build)
npm run build

# 프로덕션 모드 로컬 실행
npm start
```
