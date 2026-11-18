'use client';

import React from 'react';
import { X, CircleDot, Flag, Bookmark, MapPin } from 'lucide-react';

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
}

export default function ContextPopup({
  point,
  position,
  onClose,
  onSetStart,
  onSetTarget,
  onAddFavorite,
}: ContextPopupProps) {
  if (!point || !position) return null;

  const [x, y] = position;
  const clampedX = Math.min(typeof window !== 'undefined' ? window.innerWidth - 260 : 600, Math.max(10, x - 120));
  const clampedY = Math.min(typeof window !== 'undefined' ? window.innerHeight - 220 : 600, Math.max(70, y - 180));

  return (
    <div style={{
      position: 'absolute',
      left: clampedX,
      top: clampedY,
      width: 250,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 85,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={14} />
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', paddingRight: 20 }}>
          {point.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
          {point.address}
        </div>
        <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>
          {point.lon.toFixed(5)}, {point.lat.toFixed(5)}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button
          onClick={() => { onSetStart(point); onClose(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 14px',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border-color)',
            fontSize: 12,
            fontWeight: 500,
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
          onClick={() => { onSetTarget(point); onClose(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 14px',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border-color)',
            fontSize: 12,
            fontWeight: 500,
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
          onClick={() => { onAddFavorite(point); onClose(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 14px',
            background: 'none',
            border: 'none',
            fontSize: 12,
            fontWeight: 500,
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
      </div>
    </div>
  );
}
