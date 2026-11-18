'use client';

import React from 'react';
import { 
  Utensils, 
  Coffee, 
  Camera, 
  Box, 
  HardDrive, 
  Sun, 
  Moon, 
  Ruler, 
  Sparkles,
  Layers
} from 'lucide-react';

interface SmartVibeRadarBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenOfflineManager: () => void;
  is3DMode: boolean;
  timeHour: number;
  onChangeTimeHour: (h: number) => void;
  isMeasureMode: boolean;
  onToggleMeasureMode: () => void;
}

export default function SmartVibeRadarBar({
  selectedCategory,
  onSelectCategory,
  onOpenOfflineManager,
  is3DMode,
  timeHour,
  onChangeTimeHour,
  isMeasureMode,
  onToggleMeasureMode,
}: SmartVibeRadarBarProps) {
  const categories = [
    { id: 'all', label: '전체', icon: null },
    { id: 'food', label: '추천 맛집', icon: Utensils, color: '#f59e0b' },
    { id: 'cafe', label: '감성 카페', icon: Coffee, color: '#ec4899' },
    { id: 'tour', label: '문화/관광', icon: Camera, color: '#10b981' },
    { id: '3d_bldg', label: '3D 랜드마크', icon: Box, color: '#38bdf8' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 66,
        left: 18,
        right: 18,
        zIndex: 92,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Category Chips Bar (Left/Center) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          pointerEvents: 'auto',
          maxWidth: 'calc(100% - 240px)',
          scrollbarWidth: 'none',
        }}
      >
        {categories.map((c) => {
          const Icon = c.icon;
          const isSelected = selectedCategory === c.id;

          return (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: isSelected ? 700 : 500,
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                background: isSelected ? 'var(--accent)' : 'var(--bg-surface-glass)',
                color: isSelected ? '#ffffff' : 'var(--text-primary)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {Icon && <Icon size={12} color={isSelected ? '#ffffff' : c.color} />}
              <span>{c.label}</span>
            </button>
          );
        })}

        {/* Spatial Measurement Tool Button */}
        <button
          onClick={onToggleMeasureMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: isMeasureMode ? 700 : 500,
            border: isMeasureMode ? '1px solid var(--accent)' : '1px solid var(--border-color)',
            background: isMeasureMode ? 'var(--accent)' : 'var(--bg-surface-glass)',
            color: isMeasureMode ? '#ffffff' : 'var(--text-primary)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          title="지도 위 거리 및 면적 스마트 측량"
        >
          <Ruler size={12} color={isMeasureMode ? '#ffffff' : 'var(--accent)'} />
          <span>거리 측량</span>
        </button>

        {/* Offline GIS Pack Manager Pill */}
        <button
          onClick={onOpenOfflineManager}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid rgba(16, 185, 129, 0.4)',
            background: 'var(--bg-surface-glass)',
            color: '#10b981',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          title="오프라인 지도 데이터팩 관리 및 비행기 모드"
        >
          <HardDrive size={12} />
          <span>오프라인 팩</span>
        </button>
      </div>

      {/* 3D Sun Shadow Time-Machine Slider (Visible in 3D Mode or Toggled) */}
      {is3DMode && (
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-surface-glass)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: 24,
            padding: '5px 14px',
            boxShadow: 'var(--shadow-md)',
            flexShrink: 0,
          }}
        >
          <Sun size={13} color="#f59e0b" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', minWidth: 38 }}>
            {timeHour < 10 ? `0${timeHour}:00` : `${timeHour}:00`}
          </span>
          <input
            type="range"
            min="6"
            max="22"
            step="1"
            value={timeHour}
            onChange={(e) => onChangeTimeHour(parseInt(e.target.value))}
            style={{ width: 85, accentColor: 'var(--accent)', cursor: 'pointer' }}
            title="3D 태양 일조량 및 건물 그림자 시간대 조절"
          />
          <Moon size={12} color="#94a3b8" />
        </div>
      )}
    </div>
  );
}
