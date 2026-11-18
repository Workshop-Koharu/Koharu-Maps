/**
 * Koharu Maps - 11 Comprehensive Legal Policies & Regulatory Framework
 * Compliant with Republic of Korea and International GIS/Location Data Regulations.
 */

export interface PolicyMetadata {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  version: string;
  effectiveDate: string;
  noticeDate: string;
  category: string;
}

export const LEGAL_POLICIES: PolicyMetadata[] = [
  {
    id: '1',
    slug: 'data-license',
    title: '오프라인 지도 데이터 라이선스 및 출처 고지',
    subtitle: '국가 지리원, OpenStreetMap ODbL 라이선스 및 독자 벡터 타일 저작권 고지',
    version: 'v1.4.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Cartography & Licensing',
  },
  {
    id: '2',
    slug: 'privacy',
    title: '개인정보 처리방침',
    subtitle: '개인정보보호법에 따른 수집, 이용, 위탁, 새 기기 로그인 보안 알림 및 파기 절차',
    version: 'v2.1.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Privacy & Security',
  },
  {
    id: '3',
    slug: 'terms',
    title: '서비스 이용약관',
    subtitle: '서비스 이용 조건, 권리와 의무, Open API 및 대한민국 준거법·서울중앙지방법원 관할 합의',
    version: 'v2.0.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'General Terms',
  },
  {
    id: '4',
    slug: 'cookie-policy',
    title: '쿠키 정책',
    subtitle: '쿠키, 로컬 스토리지, 인덱스드DB 사용 목적, 제어 방법 및 거부 권리 고지',
    version: 'v1.2.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Cookies & Storage',
  },
  {
    id: '5',
    slug: 'offline-content',
    title: '오프라인 콘텐츠·데이터 이용 정책',
    subtitle: '단말 로컬 캐싱, 오프라인 모드 데이터 무결성 보장 및 2차 배포 금지 규정',
    version: 'v1.1.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Offline Services',
  },
  {
    id: '6',
    slug: 'location-terms',
    title: '위치정보 이용약관 및 기기 권한 안내',
    subtitle: '위치정보법 준수, On-Device 로컬 GPS/GNSS 센서 처리, 파일·카메라·알림 권한 안내',
    version: 'v1.5.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Location & Device',
  },
  {
    id: '7',
    slug: 'open-source',
    title: '오픈소스 소프트웨어 라이선스 고지',
    subtitle: '서드파티 오픈소스 소프트웨어 명세 및 저작권·라이선스 전문',
    version: 'v1.0.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Open Source',
  },
  {
    id: '8',
    slug: 'data-retention',
    title: '데이터 보관·파기 및 서비스 변경/중단 안내 정책',
    subtitle: '계정 영구 삭제 시 즉시 파기 원칙, 법정 의무 보관 기준 및 서비스 변경 30일 전 고지',
    version: 'v1.3.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Data Lifecycle',
  },
  {
    id: '9',
    slug: 'ugc-policy',
    title: '커뮤니티/사용자 기여 콘텐츠(UGC) 정책',
    subtitle: '즐겨찾기 메모, POI 사용자 피드백, 공유 경로 작성 기준 및 불법 게시물 제재 조치',
    version: 'v1.1.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'User Contributions',
  },
  {
    id: '10',
    slug: 'map-feedback',
    title: '지도 오류 제보 및 데이터 수정·삭제 요청 정책',
    subtitle: '도로 폐쇄, 명칭 오류, 지번 정정 및 개인 식별 지리정보 권리 침해 신고 처리 절차',
    version: 'v1.2.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Map Verification',
  },
  {
    id: '11',
    slug: 'youth-protection',
    title: '청소년 보호정책',
    subtitle: '유해 지리정보 및 유해 콘텐츠 차단, 청소년 보호책임자 지정 및 피해 상담 체계',
    version: 'v1.0.0',
    effectiveDate: '2026년 11월 18일',
    noticeDate: '2026년 10월 18일',
    category: 'Youth Protection',
  },
];
