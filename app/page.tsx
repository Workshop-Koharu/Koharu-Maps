'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import MapViewport from '@/components/MapViewport';
import RoutePanel from '@/components/RoutePanel';
import FavoritesPanel from '@/components/FavoritesPanel';
import AuthModal from '@/components/AuthModal';
import ContextPopup from '@/components/ContextPopup';

export default function MainPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [center, setCenter] = useState<[number, number]>([126.9784, 37.5663]); // Seoul
  const [zoom, setZoom] = useState(13);
  const [features, setFeatures] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [routeData, setRouteData] = useState<any>(null);

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
    fetch('/api/v1/features?limit=1000')
      .then(res => res.json())
      .then(data => {
        if (data.features) setFeatures(data.features);
      })
      .catch(console.error);
  }, [fetchUser]);

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

  // Search Select handler
  const handleSearchSelect = (place: any) => {
    setCenter([place.lon, place.lat]);
    setZoom(15);
    setMarkers([{ lon: place.lon, lat: place.lat, title: place.name, color: '#2563eb' }]);
    showToast(`'${place.name}' 위치로 이동했습니다.`);
  };

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
          category: '사용자 지정',
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

  // Map Click handler (Reverse Geocoding & Context Popup)
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

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 1. Header Navigation */}
      <Header
        onSearchSelect={handleSearchSelect}
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

      {/* 2. Vector Map Canvas Viewport */}
      <MapViewport
        theme={theme}
        features={features}
        route={routeData}
        markers={markers}
        center={center}
        zoom={zoom}
        onCenterChange={(c, z) => { setCenter(c); setZoom(z); }}
        onMapClick={handleMapClick}
      />

      {/* 3. Route Navigation Panel */}
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

      {/* 4. Favorites Panel */}
      <FavoritesPanel
        isOpen={isFavOpen}
        onClose={() => setIsFavOpen(false)}
        user={user}
        favorites={favorites}
        onFlyToCoord={(lon, lat) => { setCenter([lon, lat]); setZoom(15); }}
        onDeleteFavorite={handleDeleteFavorite}
        onOpenAuth={() => { setAuthNotice('즐겨찾기 보관함을 이용하려면 로그인이 필요합니다.'); setIsAuthOpen(true); }}
      />

      {/* 5. Map Click Context Popup */}
      <ContextPopup
        point={contextPoint}
        position={contextPos}
        onClose={() => { setContextPoint(null); setContextPos(null); }}
        onSetStart={(p) => { setStartPoint(p); setIsRouteOpen(true); }}
        onSetTarget={(p) => { setTargetPoint(p); setIsRouteOpen(true); }}
        onAddFavorite={handleAddFavorite}
      />

      {/* 6. Auth Modal (Resend + Social 3) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(newUser) => {
          setUser(newUser);
          showToast(`${newUser.name}님 환영합니다!`);
        }}
        noticeMessage={authNotice}
      />

      {/* 7. Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
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
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
