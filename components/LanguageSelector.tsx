'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Languages, Search, Check, X } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getCurrentLanguage, setAppLanguage, LanguageInfo } from '@/lib/i18n';

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('ko');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentLang(getCurrentLanguage());

    const handleLangChange = (e: any) => {
      if (e.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };

    window.addEventListener('koharu_language_changed', handleLangChange);
    return () => window.removeEventListener('koharu_language_changed', handleLangChange);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLanguageObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const handleSelect = (code: string) => {
    setAppLanguage(code);
    setCurrentLang(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 600,
        }}
        title="언어 변경 (Change Language / 100 Languages Supported)"
      >
        <Languages size={14} />
        <span>{activeLanguageObj.nativeName}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            maxHeight: 460,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Languages size={15} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>전 세계 100개 언어 지원</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Search Input */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-elevated)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="언어 검색 (Search 100 languages)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Language List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: 340,
              padding: '4px',
            }}
          >
            {filteredLanguages.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                일치하는 언어가 없습니다.
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isSelected ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                      color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 13,
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isSelected ? 700 : 500 }}>{lang.nativeName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {lang.name} &middot; {lang.code}
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--accent-color)' }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
