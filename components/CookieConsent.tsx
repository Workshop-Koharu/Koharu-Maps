'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, Shield, Check, X } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('koharu_cookie_consent');
      if (!consent) {
        setIsVisible(true);
      }
    } catch {}
  }, []);

  const handleConsent = (level: 'all' | 'essential') => {
    try {
      localStorage.setItem('koharu_cookie_consent', level);
      document.cookie = `koharu_consent=${level}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)',
        maxWidth: 720,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '18px 24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'fadeInUp 0.25s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(79, 70, 229, 0.1)',
              color: 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cookie size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              개인 맞춤형 지도 경험 및 필수 쿠키 동의 안내
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.6 }}>
              Koharu Maps는 이용자의 즐겨찾기 보관, 독자 렌더러 캐시 가속, 보안 인증 세션 유지 및 맞춤형 지리 정보 제공을 위해 쿠키와 로컬 스토리지를 활용합니다. 선택하신 설정은 언제든지 쿠키 정책 및 브라우저 설정을 통해 변경하실 수 있습니다.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleConsent('essential')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
          title="닫기"
        >
          <X size={16} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          borderTop: '1px solid var(--border-color)',
          paddingTop: 12,
        }}
      >
        <Link
          href="/legal/cookie-policy"
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textDecoration: 'underline',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Shield size={13} />
          <span>쿠키 정책 및 세부 항목 상세 보기</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleConsent('essential')}
            style={{ fontSize: 12, padding: '7px 14px' }}
          >
            필수 쿠키만 허용
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleConsent('all')}
            style={{ fontSize: 12, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Check size={14} />
            <span>모두 동의</span>
          </button>
        </div>
      </div>
    </div>
  );
}
