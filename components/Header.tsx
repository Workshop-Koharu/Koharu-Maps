'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LanguageSelector from './LanguageSelector';
import { 
  Globe, 
  Search, 
  X, 
  Navigation, 
  Bookmark, 
  Code2, 
  Sun, 
  Moon, 
  User as UserIcon, 
  Settings, 
  LogIn,
  MapPin,
  Menu,
  FileText,
  Shield,
  Layers,
  Satellite
} from 'lucide-react';

interface HeaderProps {
  onSearchSelect: (place: any) => void;
  onToggleRoute: () => void;
  onToggleFavorites: () => void;
  onOpenAuth: () => void;
  user: any;
  theme: string;
  onToggleTheme: () => void;
}

export default function Header({
  onSearchSelect,
  onToggleRoute,
  onToggleFavorites,
  onOpenAuth,
  user,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          gap: 12,
          pointerEvents: 'none',
        }}
      >
        {/* Brand Logo & Title */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-surface-glass)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '7px 14px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            flexShrink: 0,
          }}
        >
          <img src="/logo.svg" alt="Koharu Maps Logo" width="22" height="22" />
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'var(--text-primary)',
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: '-0.4px',
            }}
          >
            Koharu Maps
          </Link>
          <span className="badge badge-blue" style={{ display: 'none' }}>
            GIS
          </span>
        </div>

        {/* Global Search Bar (Responsive) */}
        <div
          ref={searchRef}
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            flex: 1,
            maxWidth: 460,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-glass)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '0 14px',
              height: 44,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Search size={16} color="var(--text-muted)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="도시, 장소, 지명 검색 (예: 서울역, 도쿄타워, 뉴욕)"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                color: 'var(--text-primary)',
                minWidth: 0,
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  padding: 4,
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 50,
                left: 0,
                right: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                maxHeight: 360,
                overflowY: 'auto',
                zIndex: 1000,
              }}
            >
              {results.length === 0 ? (
                <div style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                  검색 결과가 없습니다.
                </div>
              ) : (
                results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSearchSelect(item);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <MapPin size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}{' '}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          {item.category}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.address}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Desktop Header Actions */}
        <div
          className="desktop-header-actions"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <button className="btn btn-outline" onClick={onToggleRoute} title="경로 탐색 및 길찾기">
            <Navigation size={15} />
            <span>길찾기</span>
          </button>

          <button className="btn btn-outline" onClick={onToggleFavorites} title="내 즐겨찾기">
            <Bookmark size={15} />
            <span>즐겨찾기</span>
          </button>

          <Link href="/developer" className="btn btn-outline" title="무료 API 키 발급 및 개발자 포털">
            <Code2 size={15} />
            <span>개발자</span>
          </Link>

          <LanguageSelector />

          <button
            className="btn btn-outline"
            onClick={onToggleTheme}
            title="테마 전환"
            style={{ width: 38, padding: 0 }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user ? (
            <Link href="/settings" className="btn btn-outline" title="계정 설정">
              <UserIcon size={15} />
              <span>{user.name}</span>
            </Link>
          ) : (
            <button className="btn btn-primary" onClick={onOpenAuth}>
              <LogIn size={15} />
              <span>로그인</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div
          className="mobile-header-actions"
          style={{
            pointerEvents: 'auto',
            display: 'none',
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ width: 42, height: 42, padding: 0, borderRadius: 'var(--radius-md)' }}
            title="전체 메뉴"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Quick Action Floating Chips (Below Search) */}
      <div
        className="mobile-quick-chips"
        style={{
          position: 'absolute',
          top: 66,
          left: 18,
          right: 18,
          zIndex: 90,
          display: 'none',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          pointerEvents: 'auto',
        }}
      >
        <button
          className="btn btn-outline btn-sm"
          onClick={onToggleRoute}
          style={{ borderRadius: '20px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)' }}
        >
          <Navigation size={13} style={{ color: 'var(--accent)' }} />
          <span>길찾기</span>
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={onToggleFavorites}
          style={{ borderRadius: '20px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)' }}
        >
          <Bookmark size={13} style={{ color: '#f59e0b' }} />
          <span>즐겨찾기</span>
        </button>

        <Link
          href="/legal"
          className="btn btn-outline btn-sm"
          style={{ borderRadius: '20px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)' }}
        >
          <Shield size={13} style={{ color: 'var(--text-secondary)' }} />
          <span>11대 정책</span>
        </Link>
      </div>

      {/* Mobile Slide-over Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ zIndex: 9999, justifyContent: 'flex-end', padding: 0 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '85%',
              maxWidth: 320,
              height: '100%',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              animation: 'slideInRight 0.22s ease-out',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: 16,
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/logo.svg" alt="Koharu Maps Logo" width="24" height="24" />
                  <span style={{ fontWeight: 800, fontSize: 16 }}>Koharu Maps</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* User Section */}
              <div style={{ marginBottom: 20 }}>
                {user ? (
                  <Link
                    href="/settings"
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserIcon size={16} />
                    <div style={{ textAlign: 'left', marginLeft: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                  </Link>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '11px 14px' }}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                  >
                    <LogIn size={15} />
                    <span>로그인 및 회원가입</span>
                  </button>
                )}
              </div>

              {/* Navigation Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onToggleRoute();
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <Navigation size={15} style={{ color: 'var(--accent)' }} />
                  <span>길찾기 (내비게이션)</span>
                </button>

                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onToggleFavorites();
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <Bookmark size={15} style={{ color: '#f59e0b' }} />
                  <span>저장된 즐겨찾기</span>
                </button>

                <Link
                  href="/developer"
                  className="btn btn-outline"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <Code2 size={15} />
                  <span>개발자 포털 & 무료 API 키</span>
                </Link>

                <Link
                  href="/api-docs"
                  className="btn btn-outline"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <FileText size={15} />
                  <span>REST API 명세서</span>
                </Link>

                <Link
                  href="/legal"
                  className="btn btn-outline"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <Shield size={15} />
                  <span>11대 법적 고지 및 정책 허브</span>
                </Link>
              </div>
            </div>

            {/* Bottom Controls */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <LanguageSelector />
                <button
                  className="btn btn-outline"
                  onClick={onToggleTheme}
                  title="테마 전환"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  <span style={{ fontSize: 12 }}>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
                </button>
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                개발: KCS - Koharu Coding Server
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS for Header */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-header-actions {
            display: none !important;
          }
          .mobile-header-actions {
            display: flex !important;
          }
          .mobile-quick-chips {
            display: flex !important;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
