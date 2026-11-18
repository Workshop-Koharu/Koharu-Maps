'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, Minus, Compass, Layers, Crosshair, Globe, Satellite, Map as MapIcon } from 'lucide-react';
import { lonLatToPixel, pixelToLonLat } from '@/lib/gis-engine';

export type LayerMode = 'hybrid' | 'satellite' | 'vector';

interface MapViewportProps {
  theme: string;
  features: any[];
  route: any;
  markers: any[];
  center: [number, number];
  zoom: number;
  onCenterChange: (center: [number, number], zoom: number) => void;
  onMapClick: (geo: [number, number], screenPos: [number, number]) => void;
  layerMode?: LayerMode;
  onLayerModeChange?: (mode: LayerMode) => void;
}

const THEMES: Record<string, any> = {
  light: {
    bg: '#0f172a',
    vectorBg: '#f8fafc',
    water: '#93c5fd',
    green: '#bbf7d0',
    continent: '#e2e8f0',
    building: '#cbd5e1',
    buildingOutline: '#94a3b8',
    roadMotorway: '#f59e0b',
    roadPrimary: '#fbbf24',
    roadSecondary: '#ffffff',
    roadCasing: '#94a3b8',
    text: '#0f172a',
    textHalo: '#ffffff',
    routeLine: '#2563eb',
    routeHalo: '#93c5fd',
  },
  dark: {
    bg: '#050811',
    vectorBg: '#090d16',
    water: '#1e293b',
    green: '#143022',
    continent: '#1e2532',
    building: '#2d3748',
    buildingOutline: '#3d495d',
    roadMotorway: '#f59e0b',
    roadPrimary: '#d97706',
    roadSecondary: '#334155',
    roadCasing: '#0f172a',
    text: '#f8fafc',
    textHalo: '#090d16',
    routeLine: '#38bdf8',
    routeHalo: '#0284c7',
  },
};

// Global Tile In-Memory Cache
const tileCache = new Map<string, HTMLImageElement>();
const loadingTiles = new Set<string>();

export default function MapViewport({
  theme,
  features,
  route,
  markers,
  center,
  zoom,
  onCenterChange,
  onMapClick,
  layerMode = 'hybrid',
  onLayerModeChange,
}: MapViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pitch, setPitch] = useState(0);
  const [internalMode, setInternalMode] = useState<LayerMode>(layerMode);
  const [isLocating, setIsLocating] = useState(false);

  const activeMode = onLayerModeChange ? layerMode : internalMode;

  const handleModeSwitch = (mode: LayerMode) => {
    if (onLayerModeChange) {
      onLayerModeChange(mode);
    } else {
      setInternalMode(mode);
    }
  };

  // Convert Lon/Lat to screen projection
  const project = useCallback(
    (lon: number, lat: number, width: number, height: number): [number, number] => {
      const cPx = lonLatToPixel(center[0], center[1], zoom);
      const tPx = lonLatToPixel(lon, lat, zoom);
      let dx = tPx[0] - cPx[0];
      let dy = tPx[1] - cPx[1];

      if (pitch > 0) {
        dy = dy * Math.cos((pitch * Math.PI) / 180.0);
      }
      return [width / 2.0 + dx, height / 2.0 + dy];
    },
    [center, zoom, pitch]
  );

  const unproject = useCallback(
    (screenX: number, screenY: number, width: number, height: number): [number, number] => {
      let dx = screenX - width / 2.0;
      let dy = screenY - height / 2.0;
      if (pitch > 0) {
        dy = dy / Math.cos((pitch * Math.PI) / 180.0);
      }
      const cPx = lonLatToPixel(center[0], center[1], zoom);
      return pixelToLonLat(cPx[0] + dx, cPx[1] + dy, zoom);
    },
    [center, zoom, pitch]
  );

  // GPS My Location
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert('위치 정보를 지원하지 않는 브라우저입니다.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onCenterChange([pos.coords.longitude, pos.coords.latitude], 16);
      },
      () => {
        setIsLocating(false);
        // Fallback default: Seoul Station
        onCenterChange([126.9707, 37.555], 15);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Main Render Routine
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const palette = THEMES[theme] || THEMES.light;
    const isSatelliteOrHybrid = activeMode === 'satellite' || activeMode === 'hybrid';

    // 1. Base Background
    ctx.fillStyle = isSatelliteOrHybrid ? '#050811' : palette.vectorBg;
    ctx.fillRect(0, 0, w, h);

    // 2. High-Resolution Satellite Raster Tile Layer
    if (isSatelliteOrHybrid) {
      const tileZ = Math.min(19, Math.max(0, Math.floor(zoom)));
      const worldSize = 256 * Math.pow(2, zoom);
      const cPx = lonLatToPixel(center[0], center[1], zoom);

      const numTiles = Math.pow(2, tileZ);
      const tileSizeOnScreen = (1 / numTiles) * worldSize;

      // Find visible tile ranges
      const minWorldX = cPx[0] - w / 2;
      const maxWorldX = cPx[0] + w / 2;
      let minWorldY = cPx[1] - (pitch > 0 ? h / (2 * Math.cos((pitch * Math.PI) / 180)) : h / 2);
      let maxWorldY = cPx[1] + (pitch > 0 ? h / (2 * Math.cos((pitch * Math.PI) / 180)) : h / 2);

      const minTileX = Math.max(0, Math.floor((minWorldX / worldSize) * numTiles) - 1);
      const maxTileX = Math.min(numTiles - 1, Math.ceil((maxWorldX / worldSize) * numTiles) + 1);
      const minTileY = Math.max(0, Math.floor((minWorldY / worldSize) * numTiles) - 1);
      const maxTileY = Math.min(numTiles - 1, Math.ceil((maxWorldY / worldSize) * numTiles) + 1);

      let needsRedraw = false;

      for (let tx = minTileX; tx <= maxTileX; tx++) {
        for (let ty = minTileY; ty <= maxTileY; ty++) {
          const tileWorldPx = (tx / numTiles) * worldSize;
          const tileWorldPy = (ty / numTiles) * worldSize;

          let sx = w / 2 + (tileWorldPx - cPx[0]);
          let sy = h / 2 + (tileWorldPy - cPx[1]);

          if (pitch > 0) {
            const dy = sy - h / 2;
            sy = h / 2 + dy * Math.cos((pitch * Math.PI) / 180);
          }

          const sWidth = tileSizeOnScreen;
          const sHeight = pitch > 0 ? tileSizeOnScreen * Math.cos((pitch * Math.PI) / 180) : tileSizeOnScreen;

          const tileKey = `${tileZ}/${tx}/${ty}`;
          const cachedImg = tileCache.get(tileKey);

          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            ctx.drawImage(cachedImg, sx, sy, sWidth + 0.5, sHeight + 0.5);
          } else {
            // Check parent tile for smooth seamless LOD
            if (tileZ > 0) {
              const pZ = tileZ - 1;
              const pX = Math.floor(tx / 2);
              const pY = Math.floor(ty / 2);
              const parentKey = `${pZ}/${pX}/${pY}`;
              const parentImg = tileCache.get(parentKey);
              if (parentImg && parentImg.complete) {
                const subX = (tx % 2) * 128;
                const subY = (ty % 2) * 128;
                ctx.drawImage(parentImg, subX, subY, 128, 128, sx, sy, sWidth + 0.5, sHeight + 0.5);
              }
            }

            // Fetch high-res satellite imagery tile
            if (!loadingTiles.has(tileKey)) {
              loadingTiles.add(tileKey);
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tileZ}/${ty}/${tx}`;
              img.onload = () => {
                tileCache.set(tileKey, img);
                loadingTiles.delete(tileKey);
                render();
              };
              img.onerror = () => {
                loadingTiles.delete(tileKey);
              };
            }
          }
        }
      }
    } else {
      // 2-B. Pure Vector Cartography (Continent Polygons)
      for (const f of features) {
        if (f.layer === 'continent' && f.geometry?.type === 'Polygon') {
          ctx.beginPath();
          const rings = f.geometry.coordinates;
          for (let r = 0; r < rings.length; r++) {
            const ring = rings[r];
            for (let i = 0; i < ring.length; i++) {
              const p = project(ring[i][0], ring[i][1], w, h);
              if (i === 0) ctx.moveTo(p[0], p[1]);
              else ctx.lineTo(p[0], p[1]);
            }
          }
          ctx.closePath();
          ctx.fillStyle = palette.continent;
          ctx.fill();
          ctx.strokeStyle = palette.roadCasing;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // 3. Roads & Highways (Rendered in Vector & Hybrid mode)
    if (activeMode !== 'satellite') {
      const roadFeatures = features.filter((f) => f.layer === 'road');

      // Road Casing
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const f of roadFeatures) {
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const kind = f.properties?.kind || 'secondary';
        const baseWidth = kind === 'motorway' ? (zoom >= 14 ? 10 : 6) : zoom >= 14 ? 7 : 4;

        ctx.beginPath();
        for (let i = 0; i < coords.length; i++) {
          const p = project(coords[i][0], coords[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = activeMode === 'hybrid' ? 'rgba(0, 0, 0, 0.7)' : palette.roadCasing;
        ctx.lineWidth = baseWidth + 2;
        ctx.stroke();
      }

      // Road Inner Fill
      for (const f of roadFeatures) {
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const kind = f.properties?.kind || 'secondary';
        const baseWidth = kind === 'motorway' ? (zoom >= 14 ? 10 : 6) : zoom >= 14 ? 7 : 4;

        ctx.beginPath();
        for (let i = 0; i < coords.length; i++) {
          const p = project(coords[i][0], coords[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        if (activeMode === 'hybrid') {
          ctx.strokeStyle = kind === 'motorway' ? '#fbbf24' : '#ffffff';
        } else {
          ctx.strokeStyle = kind === 'motorway' ? palette.roadMotorway : palette.roadSecondary;
        }
        ctx.lineWidth = baseWidth;
        ctx.stroke();
      }
    }

    // 4. Active Navigation Route Path with High-Visibility Glow
    if (route && route.path && route.path.length >= 2) {
      // Glow Outer Halo
      ctx.beginPath();
      for (let i = 0; i < route.path.length; i++) {
        const p = project(route.path[i][0], route.path[i][1], w, h);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Main Route Line
      ctx.beginPath();
      for (let i = 0; i < route.path.length; i++) {
        const p = project(route.path[i][0], route.path[i][1], w, h);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 7;
      ctx.stroke();

      // Core Highlight
      ctx.beginPath();
      for (let i = 0; i < route.path.length; i++) {
        const p = project(route.path[i][0], route.path[i][1], w, h);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 5. Markers & Pins
    for (const m of markers) {
      const p = project(m.lon, m.lat, w, h);
      if (p[0] < -40 || p[0] > w + 40 || p[1] < -40 || p[1] > h + 40) continue;

      ctx.save();
      // Drop Shadow
      ctx.beginPath();
      ctx.ellipse(p[0], p[1] + 2, 7, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();

      // Outer Pin Circle
      ctx.beginPath();
      ctx.arc(p[0], p[1] - 14, 11, 0, Math.PI * 2);
      ctx.fillStyle = m.color || '#2563eb';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Inner White Dot
      ctx.beginPath();
      ctx.arc(p[0], p[1] - 14, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Marker Label
      if (m.title) {
        ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.strokeText(m.title, p[0], p[1] + 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(m.title, p[0], p[1] + 16);
      }
      ctx.restore();
    }

    // 6. Place Labels with Smart Anti-Collision
    if (zoom >= 3) {
      const labelBoxes: { minX: number; maxX: number; minY: number; maxY: number }[] = [];
      const placeFeatures = features.filter((f) => f.layer === 'place');

      for (const f of placeFeatures) {
        const name = f.properties?.name;
        if (!name) continue;
        const p = project(f.coordinates[0], f.coordinates[1], w, h);
        if (p[0] < -40 || p[0] > w + 40 || p[1] < -40 || p[1] > h + 40) continue;

        ctx.font = zoom >= 13 ? '700 12px sans-serif' : '600 11px sans-serif';
        const tw = ctx.measureText(name).width;
        const bbox = { minX: p[0] - tw / 2 - 6, maxX: p[0] + tw / 2 + 6, minY: p[1] - 8, maxY: p[1] + 16 };

        let collision = false;
        for (const b of labelBoxes) {
          if (!(bbox.maxX < b.minX || bbox.minX > b.maxX || bbox.maxY < b.minY || bbox.minY > b.maxY)) {
            collision = true;
            break;
          }
        }
        if (collision) continue;
        labelBoxes.push(bbox);

        ctx.textAlign = 'center';
        ctx.strokeStyle = isSatelliteOrHybrid ? 'rgba(0, 0, 0, 0.9)' : palette.textHalo;
        ctx.lineWidth = 3;
        ctx.strokeText(name, p[0], p[1] + 5);
        ctx.fillStyle = isSatelliteOrHybrid ? '#ffffff' : palette.text;
        ctx.fillText(name, p[0], p[1] + 5);
      }
    }

    ctx.restore();
  }, [theme, features, route, markers, project, zoom, center, pitch, activeMode]);

  useEffect(() => {
    let animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  // Touch and Mouse Gesture Handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let moved = false;

    // Mouse handlers
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      canvas.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;

      const rect = canvas.getBoundingClientRect();
      const newCenter = unproject(rect.width / 2.0 - dx, rect.height / 2.0 - dy, rect.width, rect.height);
      onCenterChange(newCenter, zoom);
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'grab';
        if (!moved) {
          const rect = canvas.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const geo = unproject(clickX, clickY, rect.width, rect.height);
          onMapClick(geo, [clickX, clickY]);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.35 : -0.35;
      const nextZoom = Math.max(1, Math.min(19, zoom + delta));
      onCenterChange(center, nextZoom);
    };

    // Mobile Touch Handlers (Single finger pan & 2-finger pinch-to-zoom)
    let initialTouchDist = 0;
    let initialTouchZoom = zoom;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        moved = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialTouchZoom = zoom;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;

        const rect = canvas.getBoundingClientRect();
        const newCenter = unproject(rect.width / 2.0 - dx, rect.height / 2.0 - dy, rect.width, rect.height);
        onCenterChange(newCenter, zoom);
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else if (e.touches.length === 2 && initialTouchDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDist / initialTouchDist;
        const nextZoom = Math.max(1, Math.min(19, initialTouchZoom + Math.log2(factor)));
        onCenterChange(center, nextZoom);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isDragging && !moved && e.changedTouches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.changedTouches[0].clientX - rect.left;
        const clickY = e.changedTouches[0].clientY - rect.top;
        const geo = unproject(clickX, clickY, rect.width, rect.height);
        onMapClick(geo, [clickX, clickY]);
      }
      isDragging = false;
      initialTouchDist = 0;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);

      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [center, zoom, onCenterChange, onMapClick, unproject]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }} />

      {/* Floating Layer Switcher Pill (Top Right or Bottom Left) */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          zIndex: 85,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-surface-glass)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-color)',
          borderRadius: '30px',
          padding: '3px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <button
          type="button"
          onClick={() => handleModeSwitch('hybrid')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: '20px',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeMode === 'hybrid' ? 'var(--accent)' : 'transparent',
            color: activeMode === 'hybrid' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
          title="고해상도 위성 영상 + 도로망 및 지명 하이브리드"
        >
          <Satellite size={13} />
          <span>하이브리드</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch('satellite')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: '20px',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeMode === 'satellite' ? 'var(--accent)' : 'transparent',
            color: activeMode === 'satellite' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
          title="순수 실시간 위성 항공 영상"
        >
          <Globe size={13} />
          <span>위성</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch('vector')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: '20px',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeMode === 'vector' ? 'var(--accent)' : 'transparent',
            color: activeMode === 'vector' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
          title="경량 벡터 지도"
        >
          <MapIcon size={13} />
          <span>벡터</span>
        </button>
      </div>

      {/* Floating Navigation Controls (Right Edge - Desktop & Mobile thumb-friendly) */}
      <div
        style={{
          position: 'absolute',
          right: 18,
          bottom: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 85,
        }}
      >
        <button
          className="btn btn-outline"
          onClick={() => onCenterChange(center, Math.min(19, zoom + 1))}
          style={{ width: 42, height: 42, padding: 0, borderRadius: '50%', boxShadow: 'var(--shadow-md)' }}
          title="확대"
        >
          <Plus size={17} />
        </button>

        <button
          className="btn btn-outline"
          onClick={() => onCenterChange(center, Math.max(1, zoom - 1))}
          style={{ width: 42, height: 42, padding: 0, borderRadius: '50%', boxShadow: 'var(--shadow-md)' }}
          title="축소"
        >
          <Minus size={17} />
        </button>

        <button
          className="btn btn-outline"
          onClick={handleMyLocation}
          style={{ width: 42, height: 42, padding: 0, borderRadius: '50%', boxShadow: 'var(--shadow-md)' }}
          title="내 위치 (GPS GNSS)"
        >
          <Crosshair size={17} style={{ color: isLocating ? 'var(--accent)' : 'inherit' }} />
        </button>

        <button
          className="btn btn-outline"
          onClick={() => setPitch(pitch === 0 ? 45 : 0)}
          style={{ width: 42, height: 42, padding: 0, borderRadius: '50%', boxShadow: 'var(--shadow-md)' }}
          title="2.5D 입체 각도 전환"
        >
          <Layers size={17} />
        </button>
      </div>

      {/* Bottom Status & Precision Legal Bar */}
      <div
        className="map-status-bar"
        style={{
          position: 'absolute',
          left: 18,
          bottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-surface-glass)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '5px 12px',
          fontSize: 11,
          color: 'var(--text-secondary)',
          zIndex: 80,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
        <span style={{ fontWeight: 700 }}>Koharu Maps</span>
        <span style={{ color: 'var(--text-muted)' }}>개발: KCS - Koharu Coding Server</span>
        <span>Z: {zoom.toFixed(1)}</span>
        <span>{center[0].toFixed(4)}, {center[1].toFixed(4)}</span>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <a href="/legal/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>이용약관</a>
        <a href="/legal/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>개인정보방침</a>
        <a href="/legal" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>11대 정책 허브</a>
        <span style={{ color: 'var(--text-muted)' }}>&copy; KCS Satellite Imagery</span>
      </div>
    </div>
  );
}
