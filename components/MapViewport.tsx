'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, Minus, Layers, Crosshair, Globe, Satellite, Map as MapIcon, Box } from 'lucide-react';
import { lonLatToPixel, pixelToLonLat, haversineDistance } from '@/lib/gis-engine';

export type LayerMode = 'hybrid' | 'satellite' | 'vector' | '3d';

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
  timeHour?: number;
  onSelectPlace?: (place: any) => void;
  isMeasureMode?: boolean;
  measurePoints?: [number, number][];
  onAddMeasurePoint?: (point: [number, number]) => void;
  onClearMeasure?: () => void;
  isOfflineMode?: boolean;
}

const THEMES: Record<string, any> = {
  light: {
    bg: '#050811',
    ocean: '#bae6fd',
    land: '#fcfbf7',
    landStroke: '#7dd3fc',
    water: '#38bdf8',
    green: '#dcfce7',
    greenStroke: '#86efac',
    buildingRoof: '#cbd5e1',
    buildingWallFront: '#94a3b8',
    buildingWallSide: '#64748b',
    roadMotorway: '#f59e0b',
    roadPrimary: '#ffffff',
    roadSecondary: '#f1f5f9',
    roadCasing: '#cbd5e1',
    text: '#0f172a',
    textHalo: '#ffffff',
    routeLine: '#2563eb',
  },
  dark: {
    bg: '#050811',
    ocean: '#090e1a',
    land: '#162032',
    landStroke: '#1e3a8a',
    water: '#0284c7',
    green: '#14532d',
    greenStroke: '#166534',
    buildingRoof: '#475569',
    buildingWallFront: '#334155',
    buildingWallSide: '#1e293b',
    roadMotorway: '#f59e0b',
    roadPrimary: '#334155',
    roadSecondary: '#1e293b',
    roadCasing: '#090e1a',
    text: '#f8fafc',
    textHalo: '#090d16',
    routeLine: '#38bdf8',
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
  timeHour = 14,
  onSelectPlace,
  isMeasureMode = false,
  measurePoints = [],
  onAddMeasurePoint,
  onClearMeasure,
  isOfflineMode = false,
}: MapViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pitch, setPitch] = useState(layerMode === '3d' ? 55 : 0);
  const [internalMode, setInternalMode] = useState<LayerMode>(layerMode);
  const [isLocating, setIsLocating] = useState(false);

  const activeMode = onLayerModeChange ? layerMode : internalMode;

  const handleModeSwitch = (mode: LayerMode) => {
    if (mode === '3d') {
      setPitch(55);
    } else if (activeMode === '3d') {
      setPitch(0);
    }
    if (onLayerModeChange) {
      onLayerModeChange(mode);
    } else {
      setInternalMode(mode);
    }
  };

  // Convert Lon/Lat to screen projection with horizontal wrap awareness & 3D tilt
  const project = useCallback(
    (lon: number, lat: number, width: number, height: number): [number, number] => {
      const cPx = lonLatToPixel(center[0], center[1], zoom);
      const tPx = lonLatToPixel(lon, lat, zoom);
      const worldSize = 256 * Math.pow(2, zoom);

      let dx = tPx[0] - cPx[0];
      // Keep within nearest world copy
      while (dx > worldSize / 2) dx -= worldSize;
      while (dx < -worldSize / 2) dx += worldSize;

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
      const geo = pixelToLonLat(cPx[0] + dx, cPx[1] + dy, zoom);
      // Normalize longitude to [-180, 180]
      geo[0] = ((((geo[0] + 180) % 360) + 360) % 360) - 180;
      return geo;
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
    const isSatelliteBase = activeMode === 'satellite' || activeMode === 'hybrid' || activeMode === '3d';

    // =========================================================================
    // 1. BASE BACKGROUND & TERRAIN (Distinct across modes)
    // =========================================================================
    if (activeMode === 'vector') {
      // Vector Mode: Sky-blue or Deep Navy Cartographic Ocean Base
      ctx.fillStyle = palette.ocean;
      ctx.fillRect(0, 0, w, h);

      // Continental Landmass Polygons
      for (const f of features) {
        if (f.layer === 'continent' && f.coordinates) {
          ctx.beginPath();
          const rings = f.coordinates;
          for (let r = 0; r < rings.length; r++) {
            const ring = rings[r];
            for (let i = 0; i < ring.length; i++) {
              const p = project(ring[i][0], ring[i][1], w, h);
              if (i === 0) ctx.moveTo(p[0], p[1]);
              else ctx.lineTo(p[0], p[1]);
            }
          }
          ctx.closePath();
          ctx.fillStyle = palette.land;
          ctx.fill();
          ctx.strokeStyle = palette.landStroke;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // Water Features (Rivers/Lakes)
      for (const f of features) {
        if (f.layer === 'water' && f.coordinates) {
          ctx.beginPath();
          const rings = f.coordinates;
          for (let r = 0; r < rings.length; r++) {
            const ring = rings[r];
            for (let i = 0; i < ring.length; i++) {
              const p = project(ring[i][0], ring[i][1], w, h);
              if (i === 0) ctx.moveTo(p[0], p[1]);
              else ctx.lineTo(p[0], p[1]);
            }
          }
          ctx.closePath();
          ctx.fillStyle = palette.water;
          ctx.fill();
        }
      }

      // Green Parks
      for (const f of features) {
        if (f.layer === 'green' && f.coordinates) {
          ctx.beginPath();
          const rings = f.coordinates;
          for (let r = 0; r < rings.length; r++) {
            const ring = rings[r];
            for (let i = 0; i < ring.length; i++) {
              const p = project(ring[i][0], ring[i][1], w, h);
              if (i === 0) ctx.moveTo(p[0], p[1]);
              else ctx.lineTo(p[0], p[1]);
            }
          }
          ctx.closePath();
          ctx.fillStyle = palette.green;
          ctx.fill();
          ctx.strokeStyle = palette.greenStroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    } else {
      // Satellite, Hybrid, and 3D Modes: Space Backdrop & High-Res Satellite Tiles
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, w, h);

      const tileZ = Math.min(19, Math.max(0, Math.floor(zoom)));
      const worldSize = 256 * Math.pow(2, zoom);
      const cPx = lonLatToPixel(center[0], center[1], zoom);

      const numTiles = Math.pow(2, tileZ);
      const tileSizeOnScreen = (1 / numTiles) * worldSize;

      const minWorldX = cPx[0] - w / 2;
      const maxWorldX = cPx[0] + w / 2;
      let minWorldY = cPx[1] - (pitch > 0 ? h / (2 * Math.cos((pitch * Math.PI) / 180)) : h / 2);
      let maxWorldY = cPx[1] + (pitch > 0 ? h / (2 * Math.cos((pitch * Math.PI) / 180)) : h / 2);

      const minTileX = Math.floor((minWorldX / worldSize) * numTiles) - 2;
      const maxTileX = Math.ceil((maxWorldX / worldSize) * numTiles) + 2;
      const minTileY = Math.max(0, Math.floor((minWorldY / worldSize) * numTiles) - 1);
      const maxTileY = Math.min(numTiles - 1, Math.ceil((maxWorldY / worldSize) * numTiles) + 1);

      for (let tx = minTileX; tx <= maxTileX; tx++) {
        // Infinite Horizontal Modulo Wrap
        const wrappedTx = ((tx % numTiles) + numTiles) % numTiles;

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

          const tileKey = `${tileZ}/${wrappedTx}/${ty}`;
          const cachedImg = tileCache.get(tileKey);

          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            ctx.drawImage(cachedImg, sx, sy, sWidth + 0.5, sHeight + 0.5);
          } else if (!isOfflineMode) {
            // Parent LOD interpolation for seamless loading
            if (tileZ > 0) {
              const pZ = tileZ - 1;
              const pNum = Math.pow(2, pZ);
              const pX = ((Math.floor(wrappedTx / 2) % pNum) + pNum) % pNum;
              const pY = Math.floor(ty / 2);
              const parentKey = `${pZ}/${pX}/${pY}`;
              const parentImg = tileCache.get(parentKey);
              if (parentImg && parentImg.complete) {
                const subX = (wrappedTx % 2) * 128;
                const subY = (ty % 2) * 128;
                ctx.drawImage(parentImg, subX, subY, 128, 128, sx, sy, sWidth + 0.5, sHeight + 0.5);
              }
            }

            if (!loadingTiles.has(tileKey)) {
              loadingTiles.add(tileKey);
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tileZ}/${ty}/${wrappedTx}`;
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
    }

    // =========================================================================
    // 2. 3D ATMOSPHERIC HORIZON & SKY GRADIENT
    // =========================================================================
    if (pitch > 25 || activeMode === '3d') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.32);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.7)');
      skyGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.32);
    }

    // =========================================================================
    // 3. ROADS & HIGHWAYS (Skipped in pure Satellite mode; Zoom-Filtered)
    // =========================================================================
    // Road zoom threshold: zoom < 6: hidden, 6..8: motorway only, 9..11: primary+, 12+: all
    if (activeMode !== 'satellite' && zoom >= 6) {
      const roadFeatures = features.filter((f) => {
        if (f.layer !== 'road') return false;
        const kind = f.properties?.kind || 'secondary';
        if (kind === 'motorway') return zoom >= 6;
        if (kind === 'primary') return zoom >= 9;
        return zoom >= 12;
      });

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Casing
      for (const f of roadFeatures) {
        const coords = f.geometry ? f.geometry.coordinates : f.coordinates;
        if (!coords || coords.length < 2) continue;
        const kind = f.properties?.kind || 'secondary';
        const baseWidth = kind === 'motorway' 
          ? (zoom >= 15 ? 9 : zoom >= 12 ? 6 : zoom >= 9 ? 3.5 : 2)
          : (zoom >= 15 ? 6 : zoom >= 12 ? 4 : 2);

        ctx.beginPath();
        for (let i = 0; i < coords.length; i++) {
          const p = project(coords[i][0], coords[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = activeMode === 'vector' ? palette.roadCasing : 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = baseWidth + (zoom >= 11 ? 2.5 : 1.2);
        ctx.stroke();
      }

      // Inner Road Surface
      for (const f of roadFeatures) {
        const coords = f.geometry ? f.geometry.coordinates : f.coordinates;
        if (!coords || coords.length < 2) continue;
        const kind = f.properties?.kind || 'secondary';
        const baseWidth = kind === 'motorway' 
          ? (zoom >= 15 ? 9 : zoom >= 12 ? 6 : zoom >= 9 ? 3.5 : 2)
          : (zoom >= 15 ? 6 : zoom >= 12 ? 4 : 2);

        ctx.beginPath();
        for (let i = 0; i < coords.length; i++) {
          const p = project(coords[i][0], coords[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        if (activeMode === 'vector') {
          ctx.strokeStyle = kind === 'motorway' ? palette.roadMotorway : palette.roadPrimary;
        } else {
          // Hybrid & 3D: High-contrast neon gold / crisp white
          ctx.strokeStyle = kind === 'motorway' ? '#fbbf24' : '#ffffff';
        }
        ctx.lineWidth = baseWidth;
        ctx.stroke();
      }
    }

    // =========================================================================
    // 4. 3D EXTRUDED SKYSCRAPER PRISMS (3D Mode or Tilt)
    // =========================================================================
    if (activeMode === '3d' || (pitch > 20 && zoom >= 10)) {
      const bldgFeatures = features.filter((f) => f.layer === 'building');
      // Sort back-to-front by latitude for proper depth ordering
      bldgFeatures.sort((a, b) => {
        const aLat = a.coordinates?.[0]?.[0]?.[1] || 0;
        const bLat = b.coordinates?.[0]?.[0]?.[1] || 0;
        return bLat - aLat;
      });

      const metersPerPixel = (Math.cos((center[1] * Math.PI) / 180) * 40075016.686) / (256 * Math.pow(2, zoom));
      const pitchRad = (pitch * Math.PI) / 180.0;

      // 3D Sun Shadow Time-Machine: Calculate dynamic sunlight angle based on timeHour (06:00 ~ 22:00)
      const sunHour = timeHour ?? 14;
      const sunAngle = ((sunHour - 12) / 6) * (Math.PI / 2);
      const shadowFactor = 0.5 + Math.abs(sunHour - 12) * 0.12;
      const sunDirX = Math.sin(sunAngle);
      const sunDirY = -Math.cos(sunAngle);

      for (const b of bldgFeatures) {
        const coords = b.coordinates?.[0];
        if (!coords || coords.length < 4) continue;

        const heightM = b.properties?.height || 120;
        const extrudePx = Math.min(260, Math.max(12, (heightM / metersPerPixel) * Math.sin(pitchRad) * 1.6));

        const basePoints = coords.map((c: [number, number]) => project(c[0], c[1], w, h));
        const roofPoints = basePoints.map((p: [number, number]) => [p[0], p[1] - extrudePx] as [number, number]);

        // 1. Dynamic Sun Shadow Time-Machine Ground Shadow
        const shadowLength = extrudePx * shadowFactor;
        const shadowDx = -sunDirX * shadowLength;
        const shadowDy = Math.cos(sunAngle) * shadowLength * 0.45;

        ctx.beginPath();
        for (let i = 0; i < basePoints.length; i++) {
          if (i === 0) ctx.moveTo(basePoints[i][0] + shadowDx, basePoints[i][1] + shadowDy);
          else ctx.lineTo(basePoints[i][0] + shadowDx, basePoints[i][1] + shadowDy);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.fill();

        // 2. Extruded Side Walls with Sunlight Illumination
        const wallColor = b.properties?.wallColor || palette.buildingWallFront;
        const sideShadow = palette.buildingWallSide;

        for (let i = 0; i < basePoints.length - 1; i++) {
          const p1 = basePoints[i];
          const p2 = basePoints[i + 1];
          const r1 = roofPoints[i];
          const r2 = roofPoints[i + 1];

          // Face normal dot product with sun ray vector
          const edgeDx = p2[0] - p1[0];
          const edgeDy = p2[1] - p1[1];
          const nx = -edgeDy;
          const ny = edgeDx;
          const dot = nx * sunDirX + ny * sunDirY;

          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.lineTo(r2[0], r2[1]);
          ctx.lineTo(r1[0], r1[1]);
          ctx.closePath();

          ctx.fillStyle = dot > 0 ? wallColor : sideShadow;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // 3. Top Roof Face
        ctx.beginPath();
        for (let i = 0; i < roofPoints.length; i++) {
          if (i === 0) ctx.moveTo(roofPoints[i][0], roofPoints[i][1]);
          else ctx.lineTo(roofPoints[i][0], roofPoints[i][1]);
        }
        ctx.closePath();
        ctx.fillStyle = b.properties?.roofColor || palette.buildingRoof;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 4. Floating 3D Landmark Label
        if (b.properties?.name && zoom >= 12) {
          const rx = roofPoints[0][0];
          const ry = roofPoints[0][1] - 8;

          ctx.font = '700 11px sans-serif';
          const title = `${b.properties.name} (${heightM}m)`;
          const tw = ctx.measureText(title).width;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(rx - tw / 2 - 6, ry - 14, tw + 12, 18, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.textAlign = 'center';
          ctx.fillText(title, rx, ry);
        }
      }
    }

    // =========================================================================
    // 5. NAVIGATION ROUTE LINE (3D Elevated Ribbon in 3D Mode)
    // =========================================================================
    if (route && route.path && route.path.length >= 2) {
      if (activeMode === '3d') {
        // Ground Shadow
        ctx.beginPath();
        for (let i = 0; i < route.path.length; i++) {
          const p = project(route.path[i][0], route.path[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0] + 4, p[1] + 4);
          else ctx.lineTo(p[0] + 4, p[1] + 4);
        }
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 10;
        ctx.stroke();
      }

      ctx.beginPath();
      for (let i = 0; i < route.path.length; i++) {
        const p = project(route.path[i][0], route.path[i][1], w, h);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < route.path.length; i++) {
        const p = project(route.path[i][0], route.path[i][1], w, h);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 7;
      ctx.stroke();

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

    // =========================================================================
    // 5.1 SPATIAL DISTANCE & AREA MEASUREMENT TOOL
    // =========================================================================
    if (measurePoints && measurePoints.length > 0) {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < measurePoints.length; i++) {
        const p = project(measurePoints[i][0], measurePoints[i][1], w, h);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      let totalDistM = 0;
      for (let i = 0; i < measurePoints.length; i++) {
        const pt = measurePoints[i];
        const p = project(pt[0], pt[1], w, h);
        if (i > 0) {
          const prev = measurePoints[i - 1];
          const d = haversineDistance(prev[0], prev[1], pt[0], pt[1]);
          totalDistM += d;

          // Segment distance pill
          const prevP = project(prev[0], prev[1], w, h);
          const midX = (prevP[0] + p[0]) / 2;
          const midY = (prevP[1] + p[1]) / 2;
          const segText = d >= 1000 ? `${(d / 1000).toFixed(2)} km` : `${Math.round(d)} m`;
          ctx.font = '700 11px sans-serif';
          const tw = ctx.measureText(segText).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(midX - tw / 2 - 5, midY - 10, tw + 10, 18, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#f59e0b';
          ctx.textAlign = 'center';
          ctx.fillText(segText, midX, midY + 3);
        }

        // Point anchor
        ctx.beginPath();
        ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (measurePoints.length >= 2) {
        const lastP = project(measurePoints[measurePoints.length - 1][0], measurePoints[measurePoints.length - 1][1], w, h);
        const totalText = `총 측량 거리: ${(totalDistM / 1000).toFixed(2)} km`;
        ctx.font = '800 12px sans-serif';
        const tw = ctx.measureText(totalText).width;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(lastP[0] + 12, lastP[1] - 12, tw + 16, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(totalText, lastP[0] + 20, lastP[1] + 4);
      }
      ctx.restore();
    }

    // =========================================================================
    // 6. MARKERS (3D Standing Pin in 3D Mode)
    // =========================================================================
    for (const m of markers) {
      const p = project(m.lon, m.lat, w, h);
      if (p[0] < -40 || p[0] > w + 40 || p[1] < -40 || p[1] > h + 40) continue;

      ctx.save();

      if (activeMode === '3d') {
        // Ground Anchor Shadow
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 8, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();

        // Pin Vertical Stem
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(p[0], p[1] - 18);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const pinY = activeMode === '3d' ? p[1] - 22 : p[1] - 14;

      ctx.beginPath();
      ctx.arc(p[0], pinY, 11, 0, Math.PI * 2);
      ctx.fillStyle = m.color || '#2563eb';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p[0], pinY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      if (m.title) {
        ctx.font = '700 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.strokeText(m.title, p[0], pinY + 28);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(m.title, p[0], pinY + 28);
      }
      ctx.restore();
    }

    // =========================================================================
    // 7. HIERARCHICAL LABELS (Distinct styling across modes)
    // =========================================================================
    const labelBoxes: { minX: number; maxX: number; minY: number; maxY: number }[] = [];

    const visibleLabelFeatures = features.filter((f) => {
      const kind = f.properties?.kind || f.layer;
      if (zoom < 5) {
        return kind === 'country' || kind === 'ocean';
      }
      if (zoom >= 5 && zoom < 10) {
        return kind === 'country' || kind === 'city';
      }
      return kind === 'city' || kind === 'poi' || f.layer === 'place';
    });

    for (const f of visibleLabelFeatures) {
      const name = f.properties?.name;
      if (!name) continue;
      const coords = f.coordinates || (f.geometry ? f.geometry.coordinates : null);
      if (!coords || !Array.isArray(coords)) continue;

      const p = project(coords[0], coords[1], w, h);
      if (p[0] < -40 || p[0] > w + 40 || p[1] < -40 || p[1] > h + 40) continue;

      const isCountry = f.properties?.kind === 'country';
      const isOcean = f.properties?.kind === 'ocean';

      if (isCountry) {
        ctx.font = '800 13px sans-serif';
      } else if (isOcean) {
        ctx.font = '600 12px sans-serif';
      } else {
        ctx.font = zoom >= 13 ? '700 12px sans-serif' : '600 11px sans-serif';
      }

      const tw = ctx.measureText(name).width;
      const bbox = { minX: p[0] - tw / 2 - 8, maxX: p[0] + tw / 2 + 8, minY: p[1] - 10, maxY: p[1] + 18 };

      let collision = false;
      for (const b of labelBoxes) {
        if (!(bbox.maxX < b.minX || bbox.minX > b.maxX || bbox.maxY < b.minY || bbox.minY > b.maxY)) {
          collision = true;
          break;
        }
      }
      if (collision) continue;
      labelBoxes.push(bbox);

      // In Hybrid mode: draw dark translucent badge pill behind text for high legibility
      if (activeMode === 'hybrid' && !isOcean) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.roundRect(p[0] - tw / 2 - 6, p[1] - 10, tw + 12, 20, 10);
        ctx.fill();
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      if (activeMode === 'vector') {
        ctx.strokeStyle = palette.textHalo;
        ctx.lineWidth = 3.5;
        ctx.strokeText(name, p[0], p[1] + 4);
        ctx.fillStyle = palette.text;
        ctx.fillText(name, p[0], p[1] + 4);
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = isCountry ? 4 : 3;
        ctx.strokeText(name, p[0], p[1] + 4);

        if (isOcean) {
          ctx.fillStyle = '#7dd3fc';
        } else if (isCountry) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#f8fafc';
        }
        ctx.fillText(name, p[0], p[1] + 4);
      }
    }

    ctx.restore();
  }, [theme, features, route, markers, project, zoom, center, pitch, activeMode, timeHour, measurePoints, isOfflineMode]);

  useEffect(() => {
    let animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  // Touch and Mouse Gesture Handling
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<[number, number]>([0, 0]);
  const centerStartRef = useRef<[number, number]>([0, 0]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only drag on left click (button === 0)
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = [e.clientX, e.clientY];
    centerStartRef.current = [...center];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dx = e.clientX - dragStartRef.current[0];
    let dy = e.clientY - dragStartRef.current[1];
    if (pitch > 0) {
      dy = dy / Math.cos((pitch * Math.PI) / 180);
    }

    const cPx = lonLatToPixel(centerStartRef.current[0], centerStartRef.current[1], zoom);
    const newGeo = pixelToLonLat(cPx[0] - dx, cPx[1] - dy, zoom);
    onCenterChange(newGeo, zoom);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dragDist = Math.hypot(e.clientX - dragStartRef.current[0], e.clientY - dragStartRef.current[1]);
    if (dragDist < 6 && e.button === 0) {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const geo = unproject(screenX, screenY, rect.width, rect.height);

      if (isMeasureMode && onAddMeasurePoint) {
        onAddMeasurePoint(geo);
        return;
      }

      // Check click collision with POI features or buildings
      if (onSelectPlace) {
        let hitPlace: any = null;
        let minD = 28;

        for (const f of features) {
          if (f.layer === 'place' || f.properties?.kind === 'poi') {
            const coords = f.coordinates || f.geometry?.coordinates;
            if (coords) {
              const p = project(coords[0], coords[1], rect.width, rect.height);
              const d = Math.hypot(screenX - p[0], screenY - p[1]);
              if (d < minD) {
                minD = d;
                hitPlace = {
                  id: f.id,
                  name: f.properties?.name || '선택한 장소',
                  category: f.properties?.category || '일반',
                  subCategory: f.properties?.subCategory,
                  address: f.properties?.address || `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`,
                  lon: coords[0],
                  lat: coords[1],
                  rating: f.properties?.rating,
                  reviewCount: f.properties?.reviewCount,
                  photo: f.properties?.photo,
                  phone: f.properties?.phone,
                  hours: f.properties?.hours,
                  menu: f.properties?.menu,
                  facilities: f.properties?.facilities,
                  reviews: f.properties?.reviews,
                };
              }
            }
          }
        }

        // Search Buildings within footprint or 30px
        if (!hitPlace) {
          for (const b of features) {
            if (b.layer === 'building' && b.coordinates?.[0]) {
              const basePoints = b.coordinates[0].map((c: [number, number]) => project(c[0], c[1], rect.width, rect.height));
              const centerPxX = basePoints.reduce((acc: number, cur: [number, number]) => acc + cur[0], 0) / basePoints.length;
              const centerPxY = basePoints.reduce((acc: number, cur: [number, number]) => acc + cur[1], 0) / basePoints.length;
              const d = Math.hypot(screenX - centerPxX, screenY - centerPxY);
              if (d < 35) {
                const c0 = b.coordinates[0][0];
                hitPlace = {
                  id: b.id,
                  name: b.properties?.name || '3D 랜드마크 빌딩',
                  category: '3D 랜드마크',
                  subCategory: '초고층 건축물',
                  address: b.properties?.address || '대한민국 중심 업무지구',
                  lon: c0[0],
                  lat: c0[1],
                  rating: 4.8,
                  reviewCount: 324,
                  photo: b.properties?.photo,
                  hours: '24시간 운영',
                  phone: '02-120',
                  facilities: ['주차가능', '초고속Wi-Fi', '엘리베이터', '전망대'],
                };
                break;
              }
            }
          }
        }

        if (hitPlace) {
          onSelectPlace(hitPlace);
        }
      }
    }
  };

  // Smooth Wheel Zoom directed at mouse cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const mouseGeoBefore = unproject(cursorX, cursorY, rect.width, rect.height);
    const zoomDelta = -e.deltaY * 0.0025;
    const nextZoom = Math.min(19, Math.max(1.2, zoom + zoomDelta));

    const worldSizeAfter = 256 * Math.pow(2, nextZoom);
    const mPxAfter = lonLatToPixel(mouseGeoBefore[0], mouseGeoBefore[1], nextZoom);

    let screenDx = cursorX - rect.width / 2.0;
    let screenDy = cursorY - rect.height / 2.0;
    if (pitch > 0) {
      screenDy = screenDy / Math.cos((pitch * Math.PI) / 180);
    }

    const newCenterPxX = mPxAfter[0] - screenDx;
    const newCenterPxY = mPxAfter[1] - screenDy;
    const newCenter = pixelToLonLat(newCenterPxX, newCenterPxY, nextZoom);

    onCenterChange(newCenter, nextZoom);
  };

  // Right-Click Context Menu Trigger
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const geo = unproject(screenX, screenY, rect.width, rect.height);
    onMapClick(geo, [e.clientX, e.clientY]);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      />

      {/* Floating Layer Switcher Pill (Mac Style, Positioned cleanly below Header) */}
      <div className="floating-layer-switcher">
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
          title="고해상도 위성 영상 + 고대비 도로망 및 뱃지 하이브리드"
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
          title="순수 실시간 위성 항공 사진 (도로망 제외)"
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
          title="애플 지도 스타일 정밀 벡터 카토그래피"
        >
          <MapIcon size={13} />
          <span>벡터</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch('3d')}
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
            background: activeMode === '3d' ? 'var(--accent)' : 'transparent',
            color: activeMode === '3d' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
          title="3D 입체 투영 및 스카이라인 빌딩군"
        >
          <Box size={13} />
          <span>3D 입체</span>
        </button>
      </div>

      {/* Floating Navigation Controls */}
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
          onClick={() => setPitch(pitch === 0 ? 55 : 0)}
          style={{
            width: 42,
            height: 42,
            padding: 0,
            borderRadius: '50%',
            boxShadow: 'var(--shadow-md)',
            background: pitch > 0 ? 'var(--accent-light)' : undefined,
            color: pitch > 0 ? 'var(--accent)' : undefined,
          }}
          title="2.5D / 3D 각도 전환 (0도 / 55도)"
        >
          <Layers size={17} />
        </button>
      </div>

      {/* Bottom Status & Precision Legal Bar (Combined Single '서비스 정책' Link) */}
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
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 14px',
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
        <span>모드: {activeMode.toUpperCase()}{pitch > 0 ? ` (3D ${pitch}°)` : ''}</span>
        {isOfflineMode && (
          <span style={{ color: '#10b981', fontWeight: 700 }}>[오프라인 전용 모드]</span>
        )}
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <a href="/legal" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
          서비스 정책
        </a>
        <span style={{ color: 'var(--text-muted)' }}>&copy; KCS Satellite Imagery</span>
      </div>
    </div>
  );
}
