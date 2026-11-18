'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Shield, 
  FileText, 
  MapPin, 
  Cookie, 
  HardDrive, 
  Scale, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Mail,
  Calendar,
  Lock,
  Layers,
  ExternalLink
} from 'lucide-react';
import { LEGAL_POLICIES, PolicyMetadata } from '@/lib/legal-policies';

interface LegalPolicyViewerProps {
  currentSlug: string;
}

export default function LegalPolicyViewer({ currentSlug }: LegalPolicyViewerProps) {
  const currentPolicy = LEGAL_POLICIES.find((p) => p.slug === currentSlug) || LEGAL_POLICIES[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/logo.svg" alt="Koharu Maps Logo" width="28" height="28" />
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Koharu Maps <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Legal & Policies &middot; 개발: KCS - Koharu Coding Server</span>
              </span>
            </Link>
          </div>

          <Link href="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={14} />
            <span>지도로 돌아가기</span>
          </Link>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 20px 80px 20px', display: 'flex', gap: 32 }}>
        {/* Left Sidebar: 11 Policies Navigation */}
        <aside
          style={{
            width: 300,
            flexShrink: 0,
            position: 'sticky',
            top: 80,
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            paddingRight: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 12 }}>
            전체 11개 정책 및 법적 고지 목록
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {LEGAL_POLICIES.map((policy, idx) => {
              const isActive = policy.slug === currentPolicy.slug;
              return (
                <Link
                  key={policy.slug}
                  href={`/legal/${policy.slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: isActive ? 'var(--accent-color)' : 'var(--bg-elevated)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.35 }}>{policy.title}</span>
                </Link>
              );
            })}
          </nav>

          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              <Mail size={14} style={{ color: 'var(--accent-color)' }} />
              <span>사전 고지 의무</span>
            </div>
            모든 약관 및 방침은 개정 시행 최소 <strong>30일(1개월) 전</strong> 등록된 사용자의 이메일과 서비스 공지를 통해 사전 안내됩니다.
          </div>
        </aside>

        {/* Right Content Area: Policy Text */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Policy Header Box */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 32px',
              marginBottom: 24,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-color)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              <Shield size={14} />
              <span>{currentPolicy.category} &middot; {currentPolicy.version}</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '10px 0 6px 0', letterSpacing: '-0.5px' }}>
              {currentPolicy.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
              {currentPolicy.subtitle}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid var(--border-color)',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} />
                <span>공고 일자: {currentPolicy.noticeDate}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} style={{ color: 'var(--accent-color)' }} />
                <span>시행 일자: {currentPolicy.effectiveDate}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Article Content */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 40px',
              fontSize: 14,
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {renderPolicyContent(currentPolicy.slug)}

            {/* Mandatory 30-Day Email Advance Notice Clause */}
            <div
              style={{
                marginTop: 40,
                padding: '18px 22px',
                background: 'rgba(79, 70, 229, 0.05)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--accent-color)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={15} />
                <span>개정 및 사전 고지 원칙 (1개월 전 안내 의무)</span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                본 방침의 추가, 삭제, 수정 등 중대한 변경 사항이 발생하는 경우, 회사는 개정 시행일 최소 <strong>30일(1개월) 전</strong>에 등록된 모든 이용자의 공식 이메일 주소로 개정 내역과 시행 일자 및 이의 제기 절차를 사전 발송하며, 서비스 내 공지사항 및 팝업 안내를 병행합니다.
              </p>
            </div>

            {/* Bottom Change History Log */}
            <div style={{ marginTop: 40, borderTop: '1px solid var(--border-color)', paddingTop: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>개정 및 변경 이력</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>버전</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>사전 공고일</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>시행일</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>주요 개정 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{currentPolicy.version}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{currentPolicy.noticeDate}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{currentPolicy.effectiveDate}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      글로벌 서비스 개편, 독자 GIS 엔진 배포 및 11개 약관 체계 정립
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', opacity: 0.7 }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>v1.0.0</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>2026년 09월 18일</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>2026년 10월 18일</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      Koharu Maps 초기 제정
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function renderPolicyContent(slug: string) {
  switch (slug) {
    case 'data-license':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제1조 (지도 데이터의 출처 및 귀속)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            1. Koharu Maps(https://map.koharu.live)에서 제공하는 벡터 지도, 도로망 및 건물 윤곽 데이터는 공공 데이터 포털, 대한민국 국토지리정보원 표준 데이터 및 전 세계 자발적 지리정보 기여 프로젝트인 OpenStreetMap(OSM)의 공공 데이터셋을 가공·경량화하여 생성되었습니다.<br />
            2. OpenStreetMap 기여 데이터는 <strong>Open Data Commons Open Database License (ODbL)</strong>에 따라 라이선스되며, &copy; OpenStreetMap contributors의 저작권 고지를 충실히 준수합니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제2조 (독자 벡터 타일 및 렌더링 엔진 저작권)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            1. 원천 지리 데이터를 공간 인덱싱(QuadTree), A* 최적화 그래프, 고속 바이너리/JSON 타일셋으로 자체 변환한 독자 데이터 구조 및 HTML5 Canvas 2D 카토그래픽 엔진은 Koharu Maps의 독점적 저작물입니다.<br />
            2. 이용자는 본 서비스가 제공하는 Open API 및 SDK를 통해 허가된 범위 내에서 지도 데이터를 조회하고 호출할 수 있으며, 회사의 사전 서면 승인 없이 대량의 타일 데이터를 무단 스크래핑하거나 역공학하는 행위는 엄격히 금지됩니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제3조 (오프라인 캐싱 및 이용 범위)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            이용자는 단말기의 로컬 캐시(IndexedDB 및 브라우저 캐시)에 오프라인 지도를 저장하여 개인적이고 비상업적인 내비게이션 및 지리 확인 용도로 자유롭게 활용할 수 있습니다. 단, 추출된 데이터를 타 플랫폼에 무단 재판매하거나 2차 배포할 수 없습니다.
          </p>
        </div>
      );

    case 'privacy':
      return (
        <div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Koharu Maps(이하 "서비스" 또는 "회사")는 「개인정보 보호법」 제30조 및 정보통신망법 등 관련 법령에 따라 정보주체의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제1조 (수집하는 개인정보의 항목 및 수집 방법)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
            회사는 서비스 제공을 위해 최소한의 개인정보만을 수집합니다:
          </p>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>이메일 직접 가입:</strong> 이메일 주소, 이름(닉네임), 암호화된 비밀번호(bcrypt 단방향 해시)</li>
            <li><strong>소셜 간편 로그인 (Google, Discord, GitHub):</strong> 이메일, 프로필 이름, 프로필 사진 URL, 플랫폼 고유 식별자(ID)</li>
            <li><strong>서비스 이용 및 보안 감사 과정에서 자동 수집되는 항목:</strong> 접속 IP 주소, 브라우저 User-Agent(기기 식별용), 로그인 일시, 지오로케이션(국가/도시), 즐겨찾기 장소 및 메모, API 키 사용량</li>
          </ul>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제2조 (개인정보의 이용 목적 및 보안 알림)</h2>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>회원 관리:</strong> 회원 식별, 계정 보안 감사, 설정 페이지를 통한 계정 영구 삭제 지원</li>
            <li><strong>인증 및 환영 안내:</strong> Resend 기반 6자리 이메일 인증번호 발송, 가입 완료 시 환영 이메일 발송</li>
            <li><strong>미확인 환경 로그인 보안 알림:</strong> 기존과 다른 신규 IP 또는 신규 기기/브라우저에서 로그인이 감지된 경우, 등록된 이메일로 접속 IP, 국가/도시 위치, 기기 정보를 담은 보안 경고 이메일을 즉시 발송합니다.</li>
          </ul>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제3조 (개인정보의 처리 위탁 및 국외 이전)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            회사는 원활한 이메일 통지 및 클라우드 인프라 운영을 위하여 다음과 같이 전문 업체에 처리를 위탁하고 있습니다:<br />
            &bull; <strong>이메일 발송 대행:</strong> Resend, Inc. (미국, 회원가입 인증번호 및 보안 알림 이메일 전송)<br />
            &bull; <strong>인프라 및 시스템 개발·운영:</strong> KCS - Koharu Coding Server<br />
            &bull; <strong>클라우드 데이터베이스:</strong> Supabase, Inc. (보안 인프라 호스팅 및 암호화 보관)
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제4조 (개인정보의 파기 및 계정 영구 삭제)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            이용자는 언제든지 <code>/settings</code>에서 <strong>[계정 영구 삭제]</strong> 버튼을 통해 즉시 회원 탈퇴를 요청할 수 있습니다. 삭제 시 회원의 계정 정보, 발급된 모든 API 키, 즐겨찾기 목록은 데이터베이스에서 즉시 영구 삭제되며 복구가 불가능합니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>제5조 (개인정보 침해 신고 및 권익구제 상담 기관)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>
            기타 개인정보 침해에 대한 신고나 상담이 필요한 경우에 아래 기관에 문의 가능합니다.
          </p>

          {/* User Requested Mandatory Agency Table */}
          <div style={{ overflowX: 'auto', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border-color)', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'center', width: '40%', fontWeight: 700 }}>기관명</th>
                  <th style={{ padding: '12px 18px', textAlign: 'center', width: '60%', fontWeight: 700 }}>연락처</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600 }}>개인정보분쟁조정위원회</td>
                  <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    www.kopico.go.kr / 1833-6972
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600 }}>개인정보침해신고센터</td>
                  <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    privacy.kisa.or.kr / 국번없이 118
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600 }}>대검찰청</td>
                  <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    www.spo.go.kr / 국번없이 1301
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600 }}>경찰청</td>
                  <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    ecrm.police.go.kr / 국번없이 182
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'terms':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제1조 (목적)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            본 약관은 Koharu Maps(이하 "회사")가 제공하는 글로벌 지도 서비스, 공간 데이터베이스, Open API, 클라이언트 SDK 및 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제2조 (용어의 정의)</h2>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, marginBottom: 20 }}>
            <li>"서비스"란 회사가 독자 개발한 벡터 GIS 엔진 및 카토그래픽 플랫폼(https://map.koharu.live)을 통해 제공하는 웹 애플리케이션, RESTful API 및 자바스크립트 SDK를 의미합니다.</li>
            <li>"이용자"란 본 약관에 동의하고 회사의 서비스를 이용하는 회원 및 비회원을 의미합니다.</li>
            <li>"Open API"란 회사의 지도 탐색, 주소 검색, 경로 안내 기능을 이용자의 외부 프로그램 및 서비스와 연동할 수 있도록 제공하는 공개 인터페이스를 의미합니다.</li>
          </ul>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제3조 (이용자의 의무 및 금지행위)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            이용자는 서비스를 이용함에 있어 다음 행위를 하여서는 안 됩니다:<br />
            1. 회사의 지도 데이터나 서버 인프라를 무단으로 크롤링, 스크래핑 또는 서비스 장애를 유발하는 DoS/DDoS 공격 행위<br />
            2. 타인의 명의나 이메일을 도용하여 계정을 생성하거나 인증을 우회하는 행위<br />
            3. 리버스 엔지니어링 또는 소스 코드 비인가 유출 행위
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제4조 (책임의 한계 및 면책)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            회사는 천재지변, 도로 공사, 실시간 교통 환경 변화 등으로 인해 지도 정보 및 경로 안내 결과에 일부 오차가 발생할 수 있음을 고지하며, 이용자가 제공된 경로 정보에만 의존하여 발생한 직접적·간접적 손해에 대해 회사의 고의 또는 중대한 과실이 없는 한 법적 책임을 부담하지 않습니다.
          </p>

          {/* Mandatory Dispute Resolution Clause */}
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>제5조 (준거법 및 관할 법원)</h2>
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--bg-elevated)',
              borderLeft: '4px solid var(--accent-color)',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              marginBottom: 20,
            }}
          >
            "이 약관과 관련하여 회사와 이용자 간에 분쟁이 발생한 경우, 대한민국 법을 준거법으로 하며, 분쟁에 관한 소송은 서울중앙지방법원(또는 민사소송법상 관할 법원)을 제1심 관할 법원으로 한다."
          </div>
        </div>
      );

    case 'cookie-policy':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>1. 쿠키(Cookie) 및 로컬 스토리지란?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            쿠키는 웹사이트를 방문할 때 이용자의 디바이스(PC, 스마트폰 등)에 저장되는 작은 텍스트 파일입니다. 로컬 스토리지 및 IndexedDB는 브라우저 내부의 고성능 저장 공간으로, 대용량 오프라인 지도 벡터 타일 및 사용자 맞춤 설정(테마, 선택 언어)을 영구적으로 저장하기 위해 사용됩니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>2. Koharu Maps가 사용하는 쿠키 및 저장소 항목</h2>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>필수 쿠키 (Essential Cookies):</strong><br />
              &bull; <code>kmap_token</code>: 안전한 로그인 세션 유지용 암호화 JWT 토큰 (HttpOnly, Secure)<br />
              &bull; <code>koharu_consent</code>: 이용자의 쿠키 정책 동의 여부 저장 (1년 유효)
            </li>
            <li><strong>기능 및 맞춤형 로컬 스토리지 (Functional Storage):</strong><br />
              &bull; <code>koharu_lang</code>: 100개 언어 중 이용자가 선택한 기본 인터페이스 언어<br />
              &bull; <code>koharu_maps_theme</code>: 라이트/다크 테마 환경 설정<br />
              &bull; <code>koharu_offline_tiles</code>: 네트워크 단절 환경에서도 즉시 구동되는 오프라인 벡터 타일 캐시
            </li>
          </ul>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>3. 쿠키 설정 및 거부 방법</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            이용자는 브라우저 설정을 통해 언제든지 쿠키 저장을 거부하거나 삭제할 수 있습니다. 단, 필수 쿠키를 거부할 경우 로그인 및 회원 전용 즐겨찾기, 무료 API 키 발급 기능의 이용이 제한될 수 있습니다.
          </p>
        </div>
      );

    case 'offline-content':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>1. 오프라인 모드의 정의 및 동작 원리</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Koharu Maps는 네트워크 연결이 원활하지 않거나 완전 오프라인인 환경(산간 지역, 항공기 내, 터널 등)에서도 단말 내 캐싱된 고정밀 벡터 타일과 내장 A* 알고리즘을 통해 지도 탐색 및 경로 연산을 독립적으로 수행할 수 있도록 설계되었습니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>2. 데이터 저장소 사용 및 무결성</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            오프라인 모드 데이터는 브라우저의 Cache Storage 및 IndexedDB에 저장됩니다. 이용자는 설정 화면에서 캐시 용량을 확인하고 언제든지 캐시를 삭제할 수 있으며, 캐시된 데이터는 로컬 단말 내에서만 처리됩니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>3. 2차 수정 및 재배포 금지</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            오프라인 모드를 위해 다운로드된 바이너리/JSON 지도 데이터는 오직 Koharu Maps 내에서 시각화 및 경로 계산 용도로만 이용되어야 하며, 이를 추출하여 제3자에게 배포하거나 상업적 용도로 재판매하는 행위는 금지됩니다.
          </p>
        </div>
      );

    case 'location-terms':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>1. 위치정보의 수집·이용 및 On-Device 로컬 처리 원칙</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            1. 회사는 이용자의 현재 위치를 기반으로 주변 장소 검색, 내비게이션 경로 탐색 및 지도 중심점 이동 서비스를 제공하기 위해 위치정보를 활용합니다.<br />
            2. <strong>[On-Device 로컬 처리 원칙]:</strong> 오프라인 환경 및 온라인 환경 모두에서 이용자의 단말기 GPS/GNSS 센서로부터 측정된 위도·경도 좌표는 <strong>브라우저 메모리 내에서만 실시간으로 연산 및 렌더링되며, 회사의 중앙 서버로 전송되거나 서버 데이터베이스에 영구 보관되지 않습니다.</strong>
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>2. 단말기 기기 권한 안내 (Permissions)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; 위치 권한 (Geolocation):</strong> 단말기의 GPS 및 네트워크 기반 실시간 내 위치 표출, 내비게이션 주행 경로 안내에 사용됩니다. (거부 시에도 수동 지도 검색은 자유롭게 이용 가능)
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; 저장공간 권한 (File System / IndexedDB):</strong> 오프라인 환경에서도 인터넷 연결 없이 지도를 열람할 수 있도록 벡터 타일 및 검색 색인을 로컬 단말에 저장하기 위해 사용됩니다.
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; 알림 권한 (Notification):</strong> 경로 이탈 시 알림, 목적지 도착 안내, 미확인 환경 로그인 시 보안 경고 알림 수신에 사용됩니다.
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; 카메라 권한 (Camera - 선택 시):</strong> 향후 AR(증강현실) 길안내 및 현장 POI 지리정보 QR 코드 스캔 기능 이용 시에 한하여 사용자의 개별 동의를 거쳐 활성화됩니다.
            </div>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>3. 위치정보 관리책임자</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            &bull; 부서: Koharu Maps 위치정보보호팀<br />
            &bull; 문의처: privacy@koharu.live
          </p>
        </div>
      );

    case 'open-source':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>1. 오픈소스 소프트웨어 라이선스 고지</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Koharu Maps는 신뢰할 수 있는 오픈소스 소프트웨어 생태계를 기반으로 구축되었습니다. 본 서비스에 사용된 주요 오픈소스 라이브러리와 라이선스는 다음과 같습니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; React & Next.js:</strong> MIT License &copy; Open Source Contributors
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; Lucide React Icons:</strong> ISC License &copy; Lucide Contributors
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; bcryptjs:</strong> MIT License &copy; Daniel Bikiel
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; jose (JWT/JWE):</strong> Panva MIT License &copy; Filip Skokan
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>&bull; OpenStreetMap Data:</strong> Open Data Commons Open Database License (ODbL) &copy; OpenStreetMap contributors
            </div>
          </div>
        </div>
      );

    case 'data-retention':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>1. 데이터 보관 원칙 및 즉시 파기</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            1. 회사는 원칙적으로 개인정보의 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.<br />
            2. 회원이 서비스 내 설정 페이지(<code>/settings</code>)를 통해 <strong>[계정 영구 삭제]</strong>를 요청하는 경우, 시스템은 즉시 회원의 데이터베이스 레코드, 인증 키, 즐겨찾기 데이터를 하드 딜리트(Hard Delete) 방식으로 완전 파기합니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>2. 법정 의무 보존 데이터</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            상법, 전자상거래법, 통신비밀보호법 등 관련 법령에 의해 보존 의무가 부과된 항목에 한하여 법정 기간 동안 별도의 분리된 아카이브에 안전하게 보관 후 파기합니다:<br />
            &bull; 서비스 접속 로그, IP 기록: 3개월 (통신비밀보호법)<br />
            &bull; 전자금융 거래 및 인증 기록: 5년 (전자금융거래법)<br />
            &bull; 소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>3. 서비스 변경 및 중단 시 이용자 보호</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            회사의 사업 폐지, 인프라 이전 등으로 서비스가 중단되는 경우, 중단일 최소 30일 전 등록된 회원의 이메일로 개별 통지하며, 회원이 저장한 즐겨찾기 데이터를 다운로드할 수 있는 내보내기 도구를 제공합니다.
          </p>
        </div>
      );

    case 'ugc-policy':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>1. 사용자 기여 콘텐츠(UGC)의 정의</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            이용자가 서비스 내에 등록하는 즐겨찾기 장소의 개인 메모, 장소 상세 설명, 사용자가 공유한 경로 데이터 및 지도 오류 제보 내용 등을 의미합니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>2. 금지되는 콘텐츠 유형</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            타인의 명예를 훼손하거나 사생활을 침해하는 개인 주소 폭로, 음란성 정보, 허위 사실 유포, 악성코드 배포 링크 등이 포함된 메모나 콘텐츠는 사전 통보 없이 비공개 전환되거나 삭제될 수 있습니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>3. 지적재산권 및 권리 침해 신고</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            이용자가 등록한 콘텐츠의 저작권은 해당 작성자에게 귀속됩니다. 타인의 저작권이나 권리를 침해당한 당사자는 <code>contact@koharu.live</code>로 침해 사실 소명 자료와 함께 삭제를 요청할 수 있습니다.
          </p>
        </div>
      );

    case 'map-feedback':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>1. 지도 데이터 오류 제보 접수</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Koharu Maps는 이용자의 적극적인 오류 제보를 바탕으로 지도의 정확도를 지속적으로 개선합니다. 신설 도로, 일방통행 변경, 상호 변경, 철거된 건물 등 지리정보 오류를 발견하신 경우 서비스 피드백 채널을 통해 즉시 제보하실 수 있습니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>2. 처리 절차 및 검증 기준</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            제보된 오류는 국토교통부 표준 도로망 데이터 및 공공 항공사진과의 교차 검증을 거쳐 영업일 기준 3~5일 이내에 엔진 데이터셋에 반영되며, 정기 업데이트를 통해 오프라인 벡터 타일에 동기화됩니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>3. 개인정보 노출 지리정보 삭제 요청권</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            지도 상에 개인의 사생활을 침해할 우려가 있는 특정 식별 정보나 비공개 군사·보안 구역 등이 노출된 경우 긴급 수정 요청을 접수받아 24시간 이내에 블라인드 또는 삭제 조치합니다.
          </p>
        </div>
      );

    case 'youth-protection':
      return (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>1. 청소년 보호 기본 원칙</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Koharu Maps는 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 청소년 보호법에 근거하여 모든 청소년이 안전하고 유익한 환경에서 지리 정보 서비스를 이용할 수 있도록 청소년 유해 매체물 차단 및 보호정책을 시행합니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>2. 유해 지리정보 및 유해 POI 차단 조치</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            청소년 유해업소, 사행성 시설 및 성인용 콘텐츠 관련 장소 명칭 및 검색어에 대해 자동 필터링 시스템을 적용하고 있으며, 청소년에게 유해한 지리 정보가 무분별하게 노출되지 않도록 엄격히 통제합니다.
          </p>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>3. 청소년 보호책임자 및 상담 창구</h2>
          <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: 20 }}>
            &bull; <strong>청소년 보호책임자:</strong> Koharu Maps 유해정보심의팀장<br />
            &bull; <strong>연락처 및 신고 메일:</strong> youth@koharu.live<br />
            &bull; <strong>업무 내용:</strong> 청소년 유해정보 모니터링, 이용자 고충 처리 및 피해 상담
          </div>
        </div>
      );

    default:
      return <div>정책 내용을 불러오는 중입니다.</div>;
  }
}
