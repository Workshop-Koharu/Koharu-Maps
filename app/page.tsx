'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import MapViewport, { LayerMode } from '@/components/MapViewport';
import RoutePanel from '@/components/RoutePanel';
import FavoritesPanel from '@/components/FavoritesPanel';
import AuthModal from '@/components/AuthModal';
import ContextPopup from '@/components/ContextPopup';
import PlaceDetailSheet from '@/components/PlaceDetailSheet';
import SmartVibeRadarBar from '@/components/SmartVibeRadarBar';
import OfflineManagerModal from '@/components/OfflineManagerModal';
import { SearchPlace } from '@/lib/global-data';

export default function MainPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [layerMode, setLayerMode] = useState<LayerMode>('hybrid');
  const [center, setCenter] = useState<[number, number]>([126.9784, 37.5663]); // Seoul
  const [zoom, setZoom] = useState(13);
  const [features, setFeatures] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [routeData, setRouteData] = useState<any>(null);

  // Killer Feature 1: Place Detail Sheet & Review System (Naver/Kakao style)
  const [selectedPlace, setSelectedPlace] = useState<SearchPlace | null>(null);

  // Killer Feature 2: Smart Vibe Radar Theme Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Killer Feature 3: 3D Sun Shadow Time-Machine Simulator (06:00 ~ 22:00)
  const [timeHour, setTimeHour] = useState<number>(14);

  // Killer Feature 4: Spatial Distance & Area Measurement Tool
  const [isMeasureMode, setIsMeasureMode] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  // Killer Feature 5: 100% Pure Offline GIS Data Pack Manager
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Panels
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [isFavOpen, setIsFavOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState('');

  // Routing points
  const [startPoint, setStartPoint] = useState<any>(null);
  const [targetPoint, setTargetPoint] = useState<any>(null);

  // Context Click Popup
  const [contextPoint, setContextPoint] = useState<any>(null);
  const [contextPos, setContextPos] = useState<[number, number] | null>(null);

  // User & Favorites
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }, []);

  // Fetch Current User
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // Fetch Favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUser();
    // Load features
    fetch('/api/v1/features?limit=1500')
      .then((res) => res.json())
      .then((data) => {
        if (data.features) setFeatures(data.features);
      })
      .catch(console.error);

    // Parse URL Coordinates from shared link
    try {
      const params = new URLSearchParams(window.location.search);
      const lat = parseFloat(params.get('lat') || '');
      const lon = parseFloat(params.get('lon') || '');
      const z = parseFloat(params.get('zoom') || '');
      if (!isNaN(lat) && !isNaN(lon)) {
        setCenter([lon, lat]);
        if (!isNaN(z)) setZoom(z);
        setMarkers([{ lon, lat, title: '공유된 위치', color: '#38bdf8' }]);
        showToast('공유된 좌표 위치로 이동했습니다.');
      }
    } catch {}
  }, [fetchUser, showToast]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user, fetchFavorites]);

  // Theme switch effect
  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.body.setAttribute('data-theme', next);
    showToast(`테마: ${next.toUpperCase()}`);
  };

  // Place Selection Handler (from Search or Map POI click)
  const handleSelectPlace = useCallback((place: any) => {
    setSelectedPlace(place as SearchPlace);
    setCenter([place.lon, place.lat]);
    setZoom((prev) => Math.max(prev, 15));
    setMarkers([{ lon: place.lon, lat: place.lat, title: place.name, color: '#2563eb' }]);
    showToast(`'${place.name}' 세부 정보`);
  }, [showToast]);

  // Category Theme Selection Handler
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === '3d_bldg') {
      setLayerMode('3d');
      showToast('3D 랜드마크 스카이라인 모드로 전환되었습니다.');
    } else if (cat === 'food') {
      showToast('추천 맛집 레이더 필터가 적용되었습니다.');
    } else if (cat === 'cafe') {
      showToast('감성 카페 레이더 필터가 적용되었습니다.');
    } else if (cat === 'tour') {
      showToast('문화 및 관광 명소 레이더 필터가 적용되었습니다.');
    } else {
      showToast('전체 지도 레이어로 복귀했습니다.');
    }
  };

  // Spatial Measurement Tool Toggle
  const handleToggleMeasureMode = () => {
    const next = !isMeasureMode;
    setIsMeasureMode(next);
    if (next) {
      setMeasurePoints([]);
      showToast('스마트 측량 모드 활성화: 지도 위를 클릭하여 지점을 연결하세요.');
    } else {
      setMeasurePoints([]);
      showToast('측량 모드가 종료되었습니다.');
    }
  };

  const handleAddMeasurePoint = (pt: [number, number]) => {
    setMeasurePoints((prev) => [...prev, pt]);
  };

  // Filter features based on selectedCategory
  const displayedFeatures = useMemo(() => {
    if (selectedCategory === 'all') return features;
    return features.filter((f) => {
      if (f.layer !== 'place' && f.properties?.kind !== 'poi') return true;
      const cat = f.properties?.category || '';
      if (selectedCategory === 'food') return cat.includes('음식') || cat.includes('맛집') || cat.includes('식당');
      if (selectedCategory === 'cafe') return cat.includes('카페') || cat.includes('디저트');
      if (selectedCategory === 'tour') return cat.includes('관광') || cat.includes('문화') || cat.includes('랜드마크') || cat.includes('공원');
      if (selectedCategory === '3d_bldg') return f.layer === 'building' || cat.includes('랜드마크');
      return true;
    });
  }, [features, selectedCategory]);

  // Route calculation handler
  const handleCalculateRoute = async () => {
    if (!startPoint || !targetPoint) {
      showToast('출발지와 도착지를 모두 설정해주세요.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/route?start=${startPoint.lon},${startPoint.lat}&target=${targetPoint.lon},${targetPoint.lat}`);
      const data = await res.json();
      if (res.ok && data.route) {
        setRouteData(data.route);
        showToast(`경로 탐색 완료: ${(data.route.distanceM / 1000).toFixed(1)} km (${data.route.durationMin}분)`);
      } else {
        showToast(data.message || '경로를 찾을 수 없습니다.');
      }
    } catch {
      showToast('경로 탐색 중 오류가 발생했습니다.');
    }
  };

  // Add Favorite handler
  const handleAddFavorite = async (point: any) => {
    if (!user) {
      setAuthNotice('즐겨찾기 보관 기능을 이용하려면 먼저 로그인해주세요.');
      setIsAuthOpen(true);
      return;
    }

    const memo = window.prompt(`'${point.name}'에 메모를 추가하시겠습니까?`, '') || '';
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: point.name,
          category: point.category || '사용자 지정',
          address: point.address,
          lon: point.lon,
          lat: point.lat,
          memo,
        }),
      });
      if (res.ok) {
        showToast(`'${point.name}'을(를) 즐겨찾기에 등록했습니다.`);
        fetchFavorites();
      }
    } catch {
      showToast('즐겨찾기 저장 중 오류가 발생했습니다.');
    }
  };

  // Delete Favorite handler
  const handleDeleteFavorite = async (favId: string) => {
    if (!window.confirm('이 즐겨찾기 항목을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/favorites/${favId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('즐겨찾기에서 삭제되었습니다.');
        fetchFavorites();
      }
    } catch {
      showToast('삭제 중 오류가 발생했습니다.');
    }
  };

  // Map Click handler (Right-Click Context Popup)
  const handleMapClick = async (geo: [number, number], screenPos: [number, number]) => {
    const [lon, lat] = geo;
    let name = `${lon.toFixed(4)}, ${lat.toFixed(4)}`;
    let address = '위도/경도 지정 위치';

    try {
      const res = await fetch(`/api/v1/reverse-geocode?lon=${lon}&lat=${lat}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.place) {
          name = data.place.name;
          address = data.place.address || data.place.road_name || address;
        }
      }
    } catch {}

    setContextPoint({ lon, lat, name, address });
    setContextPos(screenPos);
  };

  // Copy Share Coordinate Link
  const handleCopyShareLink = (place: any) => {
    const shareUrl = `https://map.koharu.live/?lat=${place.lat.toFixed(5)}&lon=${place.lon.toFixed(5)}&zoom=16`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('장소 공유 좌표 링크가 복사되었습니다!');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. Header Navigation */}
      <Header
        onSearchSelect={handleSelectPlace}
        onToggleRoute={() => { setIsRouteOpen(!isRouteOpen); setIsFavOpen(false); }}
        onToggleFavorites={() => {
          if (!user) {
            setAuthNotice('즐겨찾기 보관함을 확인하려면 먼저 로그인해주세요.');
            setIsAuthOpen(true);
            return;
          }
          setIsFavOpen(!isFavOpen);
          setIsRouteOpen(false);
        }}
        onOpenAuth={() => { setAuthNotice(''); setIsAuthOpen(true); }}
        user={user}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Smart Vibe Radar Bar (Quick Category Filter & 3D Sun Shadow Time-Machine Slider) */}
      <SmartVibeRadarBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onOpenOfflineManager={() => setIsOfflineModalOpen(true)}
        is3DMode={layerMode === '3d'}
        timeHour={timeHour}
        onChangeTimeHour={setTimeHour}
        isMeasureMode={isMeasureMode}
        onToggleMeasureMode={handleToggleMeasureMode}
      />

      {/* 3. Vector & Satellite Map Canvas Viewport */}
      <MapViewport
        theme={theme}
        layerMode={layerMode}
        onLayerModeChange={setLayerMode}
        features={displayedFeatures}
        route={routeData}
        markers={markers}
        center={center}
        zoom={zoom}
        onCenterChange={(c, z) => { setCenter(c); setZoom(z); }}
        onMapClick={handleMapClick}
        timeHour={timeHour}
        onSelectPlace={handleSelectPlace}
        isMeasureMode={isMeasureMode}
        measurePoints={measurePoints}
        onAddMeasurePoint={handleAddMeasurePoint}
        onClearMeasure={() => setMeasurePoints([])}
        isOfflineMode={isOfflineMode}
      />

      {/* 4. Naver/Kakao Style Place Detail Sheet & Review System */}
      <PlaceDetailSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onSetStart={(p) => {
          setStartPoint(p);
          setIsRouteOpen(true);
          showToast(`출발지: '${p.name}' 설정 완료`);
        }}
        onSetTarget={(p) => {
          setTargetPoint(p);
          setIsRouteOpen(true);
          showToast(`도착지: '${p.name}' 설정 완료`);
        }}
        onAddFavorite={handleAddFavorite}
        onCopyShareLink={handleCopyShareLink}
        currentUser={user}
      />

      {/* 5. 100% Pure Offline GIS Data Pack Manager Modal */}
      <OfflineManagerModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        isOfflineMode={isOfflineMode}
        onToggleOfflineMode={(enabled) => {
          setIsOfflineMode(enabled);
          showToast(enabled ? '비행기/오프라인 전용 모드가 활성화되었습니다. (외부 타일 차단)' : '온라인 실시간 모드로 복귀했습니다.');
        }}
      />

      {/* 6. Route Navigation Panel */}
      <RoutePanel
        isOpen={isRouteOpen}
        onClose={() => setIsRouteOpen(false)}
        startPoint={startPoint}
        targetPoint={targetPoint}
        onSwapPoints={() => {
          const temp = startPoint;
          setStartPoint(targetPoint);
          setTargetPoint(temp);
        }}
        onCalculateRoute={handleCalculateRoute}
        onClearRoute={() => {
          setStartPoint(null);
          setTargetPoint(null);
          setRouteData(null);
        }}
        routeData={routeData}
        onFlyToCoord={(lon, lat) => { setCenter([lon, lat]); setZoom(15); }}
        onSelectPreset={(p) => setTargetPoint(p)}
      />

      {/* 7. Favorites Panel */}
      <FavoritesPanel
        isOpen={isFavOpen}
        onClose={() => setIsFavOpen(false)}
        user={user}
        favorites={favorites}
        onFlyToCoord={(lon, lat) => { setCenter([lon, lat]); setZoom(15); }}
        onDeleteFavorite={handleDeleteFavorite}
        onOpenAuth={() => { setAuthNotice('즐겨찾기 보관함을 이용하려면 로그인이 필요합니다.'); setIsAuthOpen(true); }}
      />

      {/* 8. Map Right-Click Context Popup */}
      <ContextPopup
        point={contextPoint}
        position={contextPos}
        onClose={() => { setContextPoint(null); setContextPos(null); }}
        onSetStart={(p) => { setStartPoint(p); setIsRouteOpen(true); }}
        onSetTarget={(p) => { setTargetPoint(p); setIsRouteOpen(true); }}
        onAddFavorite={handleAddFavorite}
        onShare={() => showToast('좌표 공유 링크가 클립보드에 복사되었습니다!')}
      />

      {/* 9. Auth Modal (Resend + Social 3) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(newUser) => {
          setUser(newUser);
          showToast(`${newUser.name}님 환영합니다!`);
        }}
        noticeMessage={authNotice}
      />

      {/* 10. Floating Measure Bar if Measure Mode Active */}
      {isMeasureMode && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-surface-glass)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--accent)',
            borderRadius: 30,
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 95,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
            거리 측량 중 (클릭 지점: {measurePoints.length}개)
          </span>
          <button
            onClick={() => setMeasurePoints([])}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: 11, height: 28 }}
          >
            지점 초기화
          </button>
          <button
            onClick={handleToggleMeasureMode}
            className="btn btn-primary"
            style={{ padding: '4px 12px', fontSize: 11, height: 28 }}
          >
            측량 종료
          </button>
        </div>
      )}

      {/* 11. Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: isMeasureMode ? 70 : 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: 30,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
