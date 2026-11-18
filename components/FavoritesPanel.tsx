'use client';

import React from 'react';
import { Bookmark, X, Trash2, MapPin, LogIn } from 'lucide-react';

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  favorites: any[];
  onFlyToCoord: (lon: number, lat: number) => void;
  onDeleteFavorite: (id: string) => void;
  onOpenAuth: () => void;
}

export default function FavoritesPanel({
  isOpen,
  onClose,
  user,
  favorites,
  onFlyToCoord,
  onDeleteFavorite,
  onOpenAuth,
}: FavoritesPanelProps) {
  if (!isOpen) return null;

  return (
    <aside style={{
      position: 'absolute',
      top: 74,
      left: 14,
      width: 360,
      maxWidth: 'calc(100vw - 28px)',
      maxHeight: 'calc(100vh - 120px)',
      background: 'var(--bg-surface-glass)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
          <Bookmark size={16} color="var(--accent)" />
          <span>내 즐겨찾기</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 16, overflowY: 'auto' }}>
        {!user ? (
          <div style={{ textAlign: 'center', padding: '32px 10px', color: 'var(--text-secondary)' }}>
            <Bookmark size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ fontSize: 13, marginBottom: 16 }}>즐겨찾기 보관함을 이용하려면 로그인이 필요합니다.</p>
            <button className="btn btn-primary" onClick={onOpenAuth} style={{ width: '100%' }}>
              <LogIn size={15} />
              <span>로그인 및 회원가입</span>
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 10px', color: 'var(--text-secondary)' }}>
            <MapPin size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>저장된 즐겨찾기가 없습니다.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>지도의 원하는 위치를 클릭하여 즐겨찾기에 등록해보세요.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {favorites.map(f => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => onFlyToCoord(f.lon, f.lat)}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.address || `${f.lon.toFixed(4)}, ${f.lat.toFixed(4)}`}
                  </div>
                  {f.memo && (
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3 }}>
                      {f.memo}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFavorite(f.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    padding: 6,
                    display: 'flex',
                  }}
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
