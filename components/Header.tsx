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
  MapPin
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
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      position: 'absolute',
      top: 14,
      left: 14,
      right: 14,
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      {/* Brand Logo & Title */}
      <div style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(10px)',
        padding: '8px 16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <Globe size={18} color="var(--accent)" />
        <Link href="/" style={{
          textDecoration: 'none',
          color: 'var(--text-primary)',
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: '-0.3px',
        }}>
          Koharu Maps
        </Link>
        <span className="badge badge-blue">GLOBAL</span>
      </div>

      {/* Global Search Bar */}
      <div ref={searchRef} style={{ pointerEvents: 'auto', position: 'relative', width: 380, maxWidth: '40vw' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-surface-glass)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '0 12px',
          height: 46,
          boxShadow: 'var(--shadow-md)',
        }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: 8 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="도시, 장소, 도로명 검색 (예: 서울역, 뉴욕, 도쿄)"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 13,
              color: 'var(--text-primary)',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setIsOpen(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: 52,
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: 360,
            overflowY: 'auto',
          }}>
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
                  <MapPin size={16} color="var(--accent)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.category}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.address}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <span>API 서비스</span>
        </Link>

        <LanguageSelector />

        <button className="btn btn-outline" onClick={onToggleTheme} title="테마 전환" style={{ width: 38, padding: 0 }}>
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
    </header>
  );
}
