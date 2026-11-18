'use client';

import React, { useState } from 'react';
import { 
  Navigation, 
  X, 
  ArrowUpDown, 
  CircleDot, 
  Flag, 
  CornerUpRight, 
  CornerUpLeft, 
  ArrowUp,
  RotateCcw,
  Clock,
  Compass
} from 'lucide-react';

interface RoutePanelProps {
  isOpen: boolean;
  onClose: () => void;
  startPoint: any;
  targetPoint: any;
  onSwapPoints: () => void;
  onCalculateRoute: () => void;
  onClearRoute: () => void;
  routeData: any;
  onFlyToCoord: (lon: number, lat: number) => void;
  onSelectPreset: (point: { lon: number; lat: number; name: string }) => void;
}

export default function RoutePanel({
  isOpen,
  onClose,
  startPoint,
  targetPoint,
  onSwapPoints,
  onCalculateRoute,
  onClearRoute,
  routeData,
  onFlyToCoord,
  onSelectPreset,
}: RoutePanelProps) {
  if (!isOpen) return null;

  const presets = [
    { name: '광화문', lon: 126.9768, lat: 37.5750 },
    { name: '서울역', lon: 126.9710, lat: 37.5550 },
    { name: '강남역', lon: 127.0280, lat: 37.4980 },
    { name: '코엑스', lon: 127.0590, lat: 37.5115 },
    { name: '천안시청', lon: 127.1139, lat: 36.8151 },
  ];

  return (
    <aside style={{
      position: 'absolute',
      top: 74,
      left: 14,
      width: 380,
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
      {/* Panel Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
          <Navigation size={16} color="var(--accent)" />
          <span>길찾기 (A* 최적 경로)</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Origin & Destination Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
          }}>
            <CircleDot size={15} color="#10b981" />
            <input
              type="text"
              readOnly
              value={startPoint?.name || (startPoint ? `${startPoint.lon.toFixed(4)}, ${startPoint.lat.toFixed(4)}` : '')}
              placeholder="출발지: 지도 클릭 또는 프리셋 선택"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
            />
          </div>

          <button
            onClick={onSwapPoints}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: 28,
              height: 28,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 2,
            }}
            title="출발/도착 교환"
          >
            <ArrowUpDown size={13} color="var(--text-secondary)" />
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
          }}>
            <Flag size={15} color="#ef4444" />
            <input
              type="text"
              readOnly
              value={targetPoint?.name || (targetPoint ? `${targetPoint.lon.toFixed(4)}, ${targetPoint.lat.toFixed(4)}` : '')}
              placeholder="도착지: 지도 클릭 또는 프리셋 선택"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Quick Destination Presets */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {presets.map(p => (
            <button
              key={p.name}
              onClick={() => onSelectPreset(p)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: 'var(--text-secondary)',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onCalculateRoute}>
            경로 탐색
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClearRoute}>
            초기화
          </button>
        </div>

        {/* Route Instructions */}
        {routeData && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              background: 'var(--accent-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <div>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{routeData.durationMin}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginLeft: 3 }}>분 소요</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
                <div>총 거리: <strong>{(routeData.distanceM / 1000).toFixed(1)} km</strong></div>
                <div>알고리즘: <strong>A* Topological</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {routeData.instructions?.map((ins: any, idx: number) => {
                let Icon = ArrowUp;
                if (ins.type === 'turn-left') Icon = CornerUpLeft;
                else if (ins.type === 'turn-right') Icon = CornerUpRight;
                else if (ins.type === 'u-turn') Icon = RotateCcw;
                else if (ins.type === 'depart') Icon = CircleDot;
                else if (ins.type === 'arrive') Icon = Flag;

                return (
                  <div
                    key={idx}
                    onClick={() => onFlyToCoord(ins.location[0], ins.location[1])}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={16} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{ins.message}</div>
                      {ins.distanceM > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {ins.distanceM >= 1000 ? `${(ins.distanceM / 1000).toFixed(1)} km` : `${ins.distanceM} m`} 이동
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
