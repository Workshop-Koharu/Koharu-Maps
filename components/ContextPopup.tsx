'use client';

import React from 'react';
import { X, CircleDot, Flag, Bookmark, Share2, Copy } from 'lucide-react';

interface ContextPopupProps {
  point: {
    lon: number;
    lat: number;
    name: string;
    address: string;
  } | null;
  position: [number, number] | null;
  onClose: () => void;
  onSetStart: (p: any) => void;
  onSetTarget: (p: any) => void;
  onAddFavorite: (p: any) => void;
  onShare?: (url: string) => void;
}

export default function ContextPopup({
  point,
  position,
  onClose,
  onSetStart,
  onSetTarget,
  onAddFavorite,
  onShare,
}: ContextPopupProps) {
  if (!point || !position) return null;

  const [x, y] = position;
  const clampedX = Math.min(typeof window !== 'undefined' ? window.innerWidth - 270 : 600, Math.max(10, x - 130));
  const clampedY = Math.min(typeof window !== 'undefined' ? window.innerHeight - 250 : 600, Math.max(70, y - 200));

  const handleCopyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://map.koharu.live';
    const shareUrl = `${origin}/?lat=${point.lat.toFixed(5)}&lon=${point.lon.toFixed(5)}&zoom=15`;
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch {}
    if (onShare) {
      onShare(shareUrl);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: clampedX,
        top: clampedY,
        width: 260,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        overflow: 'hidden',
        animation: 'modalFadeIn 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
          }}
          title="닫기"
        >
          <X size={14} />
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', paddingRight: 20 }}>
          {point.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
          {point.address}
        </div>
        <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4, fontFamily: 'monospace' }}>
          {point.lon.toFixed(5)}, {point.lat.toFixed(5)}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button
          onClick={() => {
            onSetStart(point);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border-color)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <CircleDot size={14} color="#10b981" />
          <span>출발지로 지정</span>
        </button>

        <button
          onClick={() => {
            onSetTarget(point);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border-color)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Flag size={14} color="#ef4444" />
          <span>도착지로 지정</span>
        </button>

        <button
          onClick={() => {
            onAddFavorite(point);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border-color)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Bookmark size={14} color="var(--accent)" />
          <span>즐겨찾기에 등록</span>
        </button>

        <button
          onClick={handleCopyShareLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'none',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Share2 size={14} color="#38bdf8" />
          <span>좌표 공유 링크 복사</span>
        </button>
      </div>
    </div>
  );
}
