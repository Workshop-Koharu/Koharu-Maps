'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, Minus, Compass, Layers, Crosshair } from 'lucide-react';
import { lonLatToPixel, pixelToLonLat, clampLat, wrapLon } from '@/lib/gis-engine';

interface MapViewportProps {
  theme: string;
  features: any[];
  route: any;
  markers: any[];
  center: [number, number];
  zoom: number;
  onCenterChange: (center: [number, number], zoom: number) => void;
  onMapClick: (geo: [number, number], screenPos: [number, number]) => void;
}

const THEMES: Record<string, any> = {
  light: {
    bg: '#f8fafc',
    water: '#93c5fd',
    green: '#bbf7d0',
    continent: '#e2e8f0',
    building: '#cbd5e1',
    buildingOutline: '#94a3b8',
    roadMotorway: '#f59e0b',
    roadPrimary: '#fbbf24',
    roadSecondary: '#ffffff',
    roadCasing: '#cbd5e1',
    text: '#0f172a',
    textHalo: '#ffffff',
    routeLine: '#2563eb',
    routeHalo: '#93c5fd',
  },
  dark: {
    bg: '#090d16',
    water: '#1e293b',
    green: '#143022',
    continent: '#1e2532',
    building: '#2d3748',
    buildingOutline: '#3d495d',
    roadMotorway: '#d97706',
    roadPrimary: '#b45309',
    roadSecondary: '#334155',
    roadCasing: '#0f172a',
    text: '#f1f5f9',
    textHalo: '#090d16',
    routeLine: '#38bdf8',
    routeHalo: '#0284c7',
  },
};

export default function MapViewport({
  theme,
  features,
  route,
  markers,
  center,
  zoom,
  onCenterChange,
  onMapClick,
}: MapViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);

  const project = useCallback((lon: number, lat: number, width: number, height: number): [number, number] => {
    const cPx = lonLatToPixel(center[0], center[1], zoom);
    const tPx = lonLatToPixel(lon, lat, zoom);
    let dx = tPx[0] - cPx[0];
    let dy = tPx[1] - cPx[1];

    if (pitch > 0) {
      dy = dy * Math.cos((pitch * Math.PI) / 180.0);
    }
    return [width / 2.0 + dx, height / 2.0 + dy];
  }, [center, zoom, pitch]);

  const unproject = useCallback((screenX: number, screenY: number, width: number, height: number): [number, number] => {
    let dx = screenX - width / 2.0;
    let dy = screenY - height / 2.0;
    if (pitch > 0) {
      dy = dy / Math.cos((pitch * Math.PI) / 180.0);
    }
    const cPx = lonLatToPixel(center[0], center[1], zoom);
    return pixelToLonLat(cPx[0] + dx, cPx[1] + dy, zoom);
  }, [center, zoom, pitch]);

  // Main Render Loop
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
      ctx.scale(dpr, dpr);
    }

    const palette = THEMES[theme] || THEMES.light;

    // Clear Background
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);

    // Layer 1: Continents & Landmasses
    for (const f of features) {
      if (f.layer === 'continent') {
        const ring = f.coordinates[0];
        if (!ring || ring.length < 3) continue;
        ctx.beginPath();
        for (let i = 0; i < ring.length; i++) {
          const p = project(ring[i][0], ring[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
        ctx.fillStyle = palette.continent;
        ctx.fill();
      }
    }

    // Layer 2: Water Bodies
    for (const f of features) {
      if (f.layer === 'water') {
        const ring = f.coordinates[0];
        if (!ring || ring.length < 3) continue;
        ctx.beginPath();
        for (let i = 0; i < ring.length; i++) {
          const p = project(ring[i][0], ring[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
        ctx.fillStyle = palette.water;
        ctx.fill();
      }
    }

    // Layer 3: Parks & Greenery
    for (const f of features) {
      if (f.layer === 'green') {
        const ring = f.coordinates[0];
        if (!ring || ring.length < 3) continue;
        ctx.beginPath();
        for (let i = 0; i < ring.length; i++) {
          const p = project(ring[i][0], ring[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
        ctx.fillStyle = palette.green;
        ctx.fill();
      }
    }

    // Layer 4: Buildings (2.5D Roof & Walls)
    if (zoom >= 11) {
      for (const f of features) {
        if (f.layer === 'building') {
          const ring = f.coordinates[0];
          if (!ring || ring.length < 3) continue;
          const levels = f.properties?.levels || 5;
          const heightOffset = Math.min(22, Math.max(3, levels * (zoom / 14.0) * 1.5));

          const basePts: [number, number][] = [];
          const roofPts: [number, number][] = [];

          for (let i = 0; i < ring.length; i++) {
            const b = project(ring[i][0], ring[i][1], w, h);
            basePts.push(b);
            roofPts.push([b[0], b[1] - heightOffset]);
          }

          // Wall sides
          ctx.fillStyle = palette.buildingOutline;
          for (let i = 0; i < ring.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(basePts[i][0], basePts[i][1]);
            ctx.lineTo(roofPts[i][0], roofPts[i][1]);
            ctx.lineTo(roofPts[i + 1][0], roofPts[i + 1][1]);
            ctx.lineTo(basePts[i + 1][0], basePts[i + 1][1]);
            ctx.closePath();
            ctx.fill();
          }

          // Roof
          ctx.beginPath();
          for (let i = 0; i < roofPts.length; i++) {
            if (i === 0) ctx.moveTo(roofPts[i][0], roofPts[i][1]);
            else ctx.lineTo(roofPts[i][0], roofPts[i][1]);
          }
          ctx.closePath();
          ctx.fillStyle = palette.building;
          ctx.fill();
          ctx.strokeStyle = palette.buildingOutline;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Layer 5: Roads (Casing then fill)
    for (const f of features) {
      if (f.layer === 'road') {
        const pts = f.coordinates;
        if (!pts || pts.length < 2) continue;
        const isMotorway = f.properties?.type === 'motorway';
        const width = isMotorway ? 5.5 : 3.0;

        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = project(pts[i][0], pts[i][1], w, h);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Road Casing
        ctx.strokeStyle = palette.roadCasing;
        ctx.lineWidth = width + 2;
        ctx.stroke();

        // Road Inner Fill
        ctx.strokeStyle = isMotorway ? palette.roadMotorway : palette.roadPrimary;
        ctx.lineWidth = width;
        ctx.stroke();
      }
    }

    // Layer 6: Navigation Route Overlay
    if (route && route.coordinates && route.coordinates.length > 1) {
      const coords = route.coordinates;
      ctx.beginPath();
      for (let i = 0; i < coords.length; i++) {
        const p = project(coords[i][0], coords[i][1], w, h);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Glow halo
      ctx.strokeStyle = palette.routeHalo;
      ctx.lineWidth = 10;
      ctx.stroke();

      // Main Route
      ctx.strokeStyle = palette.routeLine;
      ctx.lineWidth = 5;
      ctx.stroke();

      // Start Pin
      const sp = project(coords[0][0], coords[0][1], w, h);
      ctx.beginPath();
      ctx.arc(sp[0], sp[1], 6, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Target Pin
      const ep = project(coords[coords.length - 1][0], coords[coords.length - 1][1], w, h);
      ctx.beginPath();
      ctx.arc(ep[0], ep[1], 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Layer 7: Markers & POI Labels
    for (const m of markers) {
      const p = project(m.lon, m.lat, w, h);
      const col = m.color || '#2563eb';

      ctx.save();
      ctx.beginPath();
      ctx.arc(p[0], p[1] - 12, 6, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (m.title) {
        ctx.font = '600 12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = palette.textHalo;
        ctx.lineWidth = 3;
        ctx.strokeText(m.title, p[0], p[1] + 6);
        ctx.fillStyle = palette.text;
        ctx.fillText(m.title, p[0], p[1] + 6);
      }
      ctx.restore();
    }

    // Layer 8: Place Labels with Collision Avoidance
    if (zoom >= 3) {
      const labelBoxes: { minX: number; maxX: number; minY: number; maxY: number }[] = [];
      for (const f of features) {
        if (f.layer === 'place') {
          const name = f.properties?.name;
          if (!name) continue;
          const p = project(f.coordinates[0], f.coordinates[1], w, h);

          if (p[0] < -50 || p[0] > w + 50 || p[1] < -50 || p[1] > h + 50) continue;

          ctx.font = '500 11px -apple-system, sans-serif';
          const tw = ctx.measureText(name).width;
          const bbox = { minX: p[0] - tw / 2 - 4, maxX: p[0] + tw / 2 + 4, minY: p[1] + 4, maxY: p[1] + 18 };

          let collision = false;
          for (const box of labelBoxes) {
            if (!(bbox.maxX < box.minX || bbox.minX > box.maxX || bbox.maxY < box.minY || bbox.minY > box.maxY)) {
              collision = true;
              break;
            }
          }
          if (collision) continue;
          labelBoxes.push(bbox);

          ctx.textAlign = 'center';
          ctx.strokeStyle = palette.textHalo;
          ctx.lineWidth = 3;
          ctx.strokeText(name, p[0], p[1] + 5);
          ctx.fillStyle = palette.text;
          ctx.fillText(name, p[0], p[1] + 5);
        }
      }
    }
  }, [theme, features, route, markers, project, zoom]);

  useEffect(() => {
    render();
  }, [render]);

  // Mouse Interactivity
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let moved = false;

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
      const delta = e.deltaY < 0 ? 0.3 : -0.3;
      const nextZoom = Math.max(1, Math.min(20, zoom + delta));
      onCenterChange(center, nextZoom);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [center, zoom, onCenterChange, onMapClick, unproject]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }} />

      {/* Map Control Toolbar */}
      <div style={{
        position: 'absolute',
        right: 18,
        bottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 80,
      }}>
        <button
          className="btn btn-outline"
          onClick={() => onCenterChange(center, Math.min(20, zoom + 1))}
          style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }}
          title="확대"
        >
          <Plus size={16} />
        </button>
        <button
          className="btn btn-outline"
          onClick={() => onCenterChange(center, Math.max(1, zoom - 1))}
          style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }}
          title="축소"
        >
          <Minus size={16} />
        </button>
        <button
          className="btn btn-outline"
          onClick={() => setPitch(pitch === 0 ? 45 : 0)}
          style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }}
          title="2.5D 기울기 전환"
        >
          <Layers size={16} />
        </button>
        <button
          className="btn btn-outline"
          onClick={() => onCenterChange([126.9784, 37.5663], 13)}
          style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }}
          title="기본 위치 (서울)로 이동"
        >
          <Crosshair size={16} />
        </button>
      </div>

      {/* Bottom Status & Legal Bar */}
      <div style={{
        position: 'absolute',
        left: 18,
        bottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '5px 14px',
        fontSize: 11,
        color: 'var(--text-secondary)',
        zIndex: 80,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
        <span style={{ fontWeight: 700 }}>Koharu Maps</span>
        <span style={{ color: 'var(--text-muted)' }}>개발: KCS - Koharu Coding Server</span>
        <span>Z: {zoom.toFixed(1)}</span>
        <span>{center[0].toFixed(4)}, {center[1].toFixed(4)}</span>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <a href="/legal/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>이용약관</a>
        <a href="/legal/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>개인정보방침</a>
        <a href="/legal/cookie-policy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>쿠키정책</a>
        <a href="/legal" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>정책 전체보기 (11개)</a>
        <span style={{ color: 'var(--text-muted)' }}>&copy; OpenStreetMap</span>
      </div>
    </div>
  );
}
