'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  DownloadCloud, 
  HardDrive, 
  WifiOff, 
  Wifi, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Zap,
  RefreshCw
} from 'lucide-react';

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: (enabled: boolean) => void;
}

interface OfflinePack {
  id: string;
  title: string;
  desc: string;
  sizeMb: number;
  featuresCount: number;
  downloaded: boolean;
}

export default function OfflineManagerModal({
  isOpen,
  onClose,
  isOfflineMode,
  onToggleOfflineMode,
}: OfflineManagerModalProps) {
  const [packs, setPacks] = useState<OfflinePack[]>([
    {
      id: 'pack_korea_core',
      title: '대한민국 전국 핵심 데이터팩',
      desc: '전국 17개 시도 고속도로망, 주요 국도, 행정구역 경계 및 도시 인덱스',
      sizeMb: 32,
      featuresCount: 1420,
      downloaded: true,
    },
    {
      id: 'pack_capital_3d',
      title: '수도권 초정밀 도로망 & 3D 빌딩팩',
      desc: '서울/경기/인천 전역 상세 골목길, 3D 초고층 빌딩군, 지하철 노선망',
      sizeMb: 45,
      featuresCount: 3890,
      downloaded: false,
    },
    {
      id: 'pack_national_poi',
      title: '전국 맛집/카페/관광지 POI 팩',
      desc: '전국 2,000+ 인증 맛집, 감성 카페, 문화유적지, 사진 명소 및 메뉴 데이터',
      sizeMb: 16,
      featuresCount: 2150,
      downloaded: false,
    },
    {
      id: 'pack_global_metro',
      title: '글로벌 20대 메트로폴리스 팩',
      desc: '도쿄, 뉴욕, 런던, 파리 등 해외 주요 대도시 벡터 지도 및 오프라인 명소',
      sizeMb: 24,
      featuresCount: 1800,
      downloaded: false,
    },
  ]);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Check saved packs from localStorage
    const saved = localStorage.getItem('koharu_offline_packs');
    if (saved) {
      try {
        const savedIds: string[] = JSON.parse(saved);
        setPacks(prev => prev.map(p => ({
          ...p,
          downloaded: savedIds.includes(p.id) || p.id === 'pack_korea_core'
        })));
      } catch {}
    }
  }, []);

  if (!isOpen) return null;

  const handleDownloadPack = (packId: string) => {
    setDownloadingId(packId);
    setDownloadProgress(10);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingId(null);
          setPacks(currentPacks => {
            const nextPacks = currentPacks.map(p => p.id === packId ? { ...p, downloaded: true } : p);
            const downloadedIds = nextPacks.filter(p => p.downloaded).map(p => p.id);
            localStorage.setItem('koharu_offline_packs', JSON.stringify(downloadedIds));
            return nextPacks;
          });
          return 0;
        }
        return prev + 25;
      });
    }, 280);
  };

  const handleDeletePack = (packId: string) => {
    setPacks(currentPacks => {
      const nextPacks = currentPacks.map(p => p.id === packId ? { ...p, downloaded: false } : p);
      const downloadedIds = nextPacks.filter(p => p.downloaded).map(p => p.id);
      localStorage.setItem('koharu_offline_packs', JSON.stringify(downloadedIds));
      return nextPacks;
    });
  };

  const totalDownloadedMb = packs.filter(p => p.downloaded).reduce((acc, p) => acc + p.sizeMb, 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HardDrive size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                오프라인 GIS 패키지 & 무선 통신 두절 제어
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                비행기 모드, 음영 지역, 해외 여행 데이터 0원 환경 지원 &middot; KCS On-Device Engine
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Offline Mode Switcher Banner */}
        <div style={{
          padding: '14px 20px',
          background: isOfflineMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isOfflineMode ? <WifiOff size={20} color="var(--danger)" /> : <Wifi size={20} color="var(--success)" />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isOfflineMode ? 'var(--danger)' : 'var(--success)' }}>
                {isOfflineMode ? '오프라인 전용 모드 가동 중 (네트워크 차단)' : '온라인 자동 동기화 모드 가동 중'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {isOfflineMode ? '외부 타일 요청이 100% 차단되며 로컬 데이터만으로 탐색합니다.' : '위성 및 실시간 데이터를 동적으로 수신합니다.'}
              </div>
            </div>
          </div>

          <button
            onClick={() => onToggleOfflineMode(!isOfflineMode)}
            className={isOfflineMode ? 'btn btn-danger btn-sm' : 'btn btn-outline btn-sm'}
            style={{ fontWeight: 700 }}
          >
            {isOfflineMode ? '온라인으로 복귀' : '비행기/오프라인 모드 켜기'}
          </button>
        </div>

        {/* Body & Packs List */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Storage Summary Bar */}
          <div style={{
            background: 'var(--bg-primary)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>로컬 브라우저 캐시 점유 용량</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {totalDownloadedMb} MB <span style={{ fontSize: 12, fontWeight: 'normal', color: 'var(--text-secondary)' }}>/ 권장 500 MB</span>
              </div>
            </div>
            <span className="badge badge-green">
              {packs.filter(p => p.downloaded).length}개 패키지 활성
            </span>
          </div>

          {/* Pack Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {packs.map((pack) => (
              <div
                key={pack.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {pack.title}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {pack.sizeMb} MB &middot; {pack.featuresCount.toLocaleString()}개 피처
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    {pack.desc}
                  </p>

                  {downloadingId === pack.id && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--accent)', marginBottom: 2 }}>
                        <span>다운로드 및 IndexedDB 인덱싱 중...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: 'var(--border-color)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${downloadProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s ease' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ flexShrink: 0 }}>
                  {pack.downloaded ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--success)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '4px 8px',
                        borderRadius: 6,
                      }}>
                        <CheckCircle2 size={13} />
                        <span>보관됨</span>
                      </span>
                      {pack.id !== 'pack_korea_core' && (
                        <button
                          onClick={() => handleDeletePack(pack.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDownloadPack(pack.id)}
                      disabled={downloadingId !== null}
                      style={{ fontSize: 11 }}
                    >
                      <DownloadCloud size={13} />
                      <span>{downloadingId === pack.id ? '받는 중' : '다운로드'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            다운로드된 데이터는 기기 저장공간에 영구 보존됩니다.
          </span>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
