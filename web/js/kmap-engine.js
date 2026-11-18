/**
 * Koharu Maps - Zero-Dependency Standalone Vector Map Engine
 * Pure HTML5 Canvas 2D Cartographic Renderer.
 * Absolutely NO external map SDKs (No Leaflet, No MapLibre, No OpenLayers, No Google).
 */

(function (global) {
  'use strict';

  // WGS84 & Web Mercator Constants
  const WGS84_A = 6378137.0;
  const MERCATOR_MAX_LAT = 85.0511287798066;
  const ORIGIN_SHIFT = Math.PI * WGS84_A; // ~20037508.342789244
  const TILE_SIZE = 256;

  // Coordinate Conversion Functions
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function lonLatToWorldMercator(lon, lat) {
    lat = clamp(lat, -MERCATOR_MAX_LAT, MERCATOR_MAX_LAT);
    const x = (lon * ORIGIN_SHIFT) / 180.0;
    const latRad = (lat * Math.PI) / 180.0;
    const y = Math.log(Math.tan(Math.PI / 4.0 + latRad / 2.0)) * WGS84_A;
    return [x, y];
  }

  function worldMercatorToLonLat(x, y) {
    const lon = (x / ORIGIN_SHIFT) * 180.0;
    const latRad = 2.0 * Math.atan(Math.exp(y / WGS84_A)) - Math.PI / 2.0;
    const lat = (latRad * 180.0) / Math.PI;
    return [lon, clamp(lat, -MERCATOR_MAX_LAT, MERCATOR_MAX_LAT)];
  }

  function lonLatToPixel(lon, lat, zoom) {
    const n = Math.pow(2, zoom);
    const x = ((lon + 180.0) / 360.0) * n * TILE_SIZE;
    const latRad = (clamp(lat, -MERCATOR_MAX_LAT, MERCATOR_MAX_LAT) * Math.PI) / 180.0;
    const y = (1.0 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2.0 * n * TILE_SIZE;
    return [x, y];
  }

  function pixelToLonLat(px, py, zoom) {
    const n = Math.pow(2, zoom);
    const totalPx = n * TILE_SIZE;
    const lon = (px / totalPx) * 360.0 - 180.0;
    const latRad = Math.atan(Math.sinh(Math.PI * (1.0 - (2.0 * py) / totalPx)));
    const lat = (latRad * 180.0) / Math.PI;
    return [lon, clamp(lat, -MERCATOR_MAX_LAT, MERCATOR_MAX_LAT)];
  }

  // Theme Palettes
  const THEMES = {
    light: {
      background: '#f4f3f0',
      water: '#aad3df',
      waterOutline: '#91c2cf',
      green: '#cce6c7',
      greenOutline: '#b5d9af',
      building: '#e4dfd8',
      buildingOutline: '#c8c2b9',
      buildingShadow: 'rgba(0,0,0,0.06)',
      roadMotorway: '#f9a825',
      roadPrimary: '#ffc107',
      roadSecondary: '#ffffff',
      roadCasing: '#d7ccc8',
      text: '#2c3e50',
      textHalo: '#ffffff',
      routeLine: '#2563eb',
      routeHalo: '#93c5fd',
    },
    dark: {
      background: '#1a1d24',
      water: '#1e293b',
      waterOutline: '#0f172a',
      green: '#1e382b',
      greenOutline: '#13281e',
      building: '#2d333f',
      buildingOutline: '#3d4452',
      buildingShadow: 'rgba(0,0,0,0.3)',
      roadMotorway: '#ea580c',
      roadPrimary: '#d97706',
      roadSecondary: '#475569',
      roadCasing: '#0f172a',
      text: '#e2e8f0',
      textHalo: '#0f172a',
      routeLine: '#38bdf8',
      routeHalo: '#0369a1',
    },
    high_contrast: {
      background: '#ffffff',
      water: '#0055ff',
      waterOutline: '#0033aa',
      green: '#00aa44',
      greenOutline: '#006622',
      building: '#cccccc',
      buildingOutline: '#333333',
      buildingShadow: 'rgba(0,0,0,0.2)',
      roadMotorway: '#ff0000',
      roadPrimary: '#ff8800',
      roadSecondary: '#ffffff',
      roadCasing: '#000000',
      text: '#000000',
      textHalo: '#ffffff',
      routeLine: '#9900ff',
      routeHalo: '#ffffff',
    }
  };

  class KoharuMapEngine {
    constructor(container, options = {}) {
      if (typeof container === 'string') {
        this.container = document.getElementById(container);
      } else {
        this.container = container;
      }

      if (!this.container) {
        throw new Error('KoharuMapEngine: Container element not found.');
      }

      // Initial Camera State
      this.center = options.center || [126.9784, 37.5663]; // Default: Seoul
      this.zoom = options.zoom || 13;
      this.bearing = options.bearing || 0; // rotation in degrees
      this.pitch = options.pitch || 0; // pitch in degrees [0, 60]
      this.minZoom = options.minZoom || 4;
      this.maxZoom = options.maxZoom || 20;
      this.theme = options.theme || 'light';

      // Feature Data Store
      this.features = [];
      this.route = null;
      this.markers = []; // { lon, lat, title, type, color }

      // Create Canvas
      this.canvas = document.createElement('canvas');
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';
      this.container.innerHTML = '';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d', { alpha: false });

      // Resize observer
      this.width = this.container.clientWidth || 800;
      this.height = this.container.clientHeight || 600;
      this._updateCanvasSize();

      // Bind Interaction Events
      this._bindEvents();

      // Animation & Render
      this.animFrame = null;
      this.render();

      window.addEventListener('resize', () => {
        this._updateCanvasSize();
        this.render();
      });
    }

    _updateCanvasSize() {
      const rect = this.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.width = Math.max(100, Math.floor(rect.width));
      this.height = Math.max(100, Math.floor(rect.height));
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
    }

    setTheme(themeName) {
      if (THEMES[themeName]) {
        this.theme = themeName;
        this.render();
      }
    }

    setFeatures(features) {
      this.features = features || [];
      this.render();
    }

    setRoute(routeData) {
      this.route = routeData;
      this.render();
    }

    clearRoute() {
      this.route = null;
      this.render();
    }

    addMarker(marker) {
      this.markers.push(marker);
      this.render();
    }

    clearMarkers() {
      this.markers = [];
      this.render();
    }

    flyTo(lon, lat, targetZoom = null) {
      const startLon = this.center[0];
      const startLat = this.center[1];
      const startZoom = this.zoom;
      const endZoom = targetZoom !== null ? targetZoom : this.zoom;
      const duration = 600;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        this.center = [
          startLon + (lon - startLon) * ease,
          startLat + (lat - startLat) * ease
        ];
        this.zoom = startZoom + (endZoom - startZoom) * ease;
        this.render();

        if (progress < 1.0) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }

    // Coordinate Projection to Canvas
    project(lon, lat) {
      const centerPx = lonLatToPixel(this.center[0], this.center[1], this.zoom);
      const targetPx = lonLatToPixel(lon, lat, this.zoom);

      let dx = targetPx[0] - centerPx[0];
      let dy = targetPx[1] - centerPx[1];

      // Bearing Rotation
      if (this.bearing !== 0) {
        const rad = (-this.bearing * Math.PI) / 180.0;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        dx = rx;
        dy = ry;
      }

      // Pitch transform (2.5D tilt)
      if (this.pitch > 0) {
        const pitchRad = (this.pitch * Math.PI) / 180.0;
        dy = dy * Math.cos(pitchRad);
      }

      return [this.width / 2.0 + dx, this.height / 2.0 + dy];
    }

    unproject(screenX, screenY) {
      let dx = screenX - this.width / 2.0;
      let dy = screenY - this.height / 2.0;

      if (this.pitch > 0) {
        const pitchRad = (this.pitch * Math.PI) / 180.0;
        dy = dy / Math.cos(pitchRad);
      }

      if (this.bearing !== 0) {
        const rad = (this.bearing * Math.PI) / 180.0;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        dx = rx;
        dy = ry;
      }

      const centerPx = lonLatToPixel(this.center[0], this.center[1], this.zoom);
      const targetPx = [centerPx[0] + dx, centerPx[1] + dy];
      return pixelToLonLat(targetPx[0], targetPx[1], this.zoom);
    }

    // Interactive Event Handlers
    _bindEvents() {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startCenter = [...this.center];

      this.canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startCenter = [...this.center];
        this.canvas.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Invert delta to find new center
        const currCenterScreen = [this.width / 2.0, this.height / 2.0];
        const newCenterLonLat = this.unproject(currCenterScreen[0] - dx, currCenterScreen[1] - dy);
        this.center = newCenterLonLat;
        this.render();

        startX = e.clientX;
        startY = e.clientY;

        if (this.onMoveCallback) {
          this.onMoveCallback(this.center, this.zoom);
        }
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          this.canvas.style.cursor = 'grab';
        }
      });

      this.canvas.style.cursor = 'grab';

      // Wheel Zoom
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Coordinate before zoom
        const mouseGeo = this.unproject(mouseX, mouseY);

        const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
        const newZoom = clamp(this.zoom + zoomDelta, this.minZoom, this.maxZoom);

        if (newZoom !== this.zoom) {
          this.zoom = newZoom;
          // Adjust center so mouse point remains stationary
          const newMousePx = this.project(mouseGeo[0], mouseGeo[1]);
          const centerScreen = [this.width / 2.0, this.height / 2.0];
          const shiftX = newMousePx[0] - mouseX;
          const shiftY = newMousePx[1] - mouseY;
          this.center = this.unproject(centerScreen[0] + shiftX, centerScreen[1] + shiftY);
          this.render();

          if (this.onMoveCallback) {
            this.onMoveCallback(this.center, this.zoom);
          }
        }
      }, { passive: false });

      // Double Click Zoom
      this.canvas.addEventListener('dblclick', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const targetGeo = this.unproject(mouseX, mouseY);
        this.flyTo(targetGeo[0], targetGeo[1], Math.min(this.maxZoom, Math.floor(this.zoom + 1)));
      });

      // Canvas Click -> Emit Map Click Event
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const geo = this.unproject(mouseX, mouseY);
        if (this.onClickCallback) {
          this.onClickCallback(geo, [mouseX, mouseY]);
        }
      });
    }

    onMove(callback) {
      this.onMoveCallback = callback;
    }

    onClick(callback) {
      this.onClickCallback = callback;
    }

    // Main Vector Map Rendering Pipeline
    render() {
      const ctx = this.ctx;
      const palette = THEMES[this.theme] || THEMES.light;
      const w = this.width;
      const h = this.height;

      // 1. Clear & Background
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, w, h);

      // Label collision bounds collector
      const labelBoxes = [];

      // 2. Separate Layers from features
      const layers = {
        water: [],
        green: [],
        building: [],
        road: [],
        place: [],
      };

      for (let i = 0; i < this.features.length; i++) {
        const f = this.features[i];
        if (f.min_zoom && this.zoom < f.min_zoom) continue;
        if (f.max_zoom && this.zoom > f.max_zoom) continue;

        const lName = f.layer || 'road';
        if (layers[lName]) {
          layers[lName].push(f);
        }
      }

      // 3. Render Water Polygons
      for (const feat of layers.water) {
        this._renderPolygon(ctx, feat, palette.water, palette.waterOutline, 1.5);
      }

      // 4. Render Green / Park Polygons
      for (const feat of layers.green) {
        this._renderPolygon(ctx, feat, palette.green, palette.greenOutline, 1.0);
      }

      // 5. Render Buildings (2.5D effect)
      for (const feat of layers.building) {
        if (this.zoom >= 11) {
          this._renderBuilding(ctx, feat, palette);
        }
      }

      // 6. Render Roads
      // Sort roads by hierarchy: residential -> secondary -> primary -> motorway
      const roadPriority = { motorway: 4, trunk: 3, primary: 2, secondary: 1, residential: 0 };
      layers.road.sort((a, b) => {
        const pa = roadPriority[a.properties?.type] || 0;
        const pb = roadPriority[b.properties?.type] || 0;
        return pa - pb;
      });

      // Pass 1: Road Casing
      for (const feat of layers.road) {
        this._renderRoad(ctx, feat, palette, true);
      }
      // Pass 2: Road Inner Fill
      for (const feat of layers.road) {
        this._renderRoad(ctx, feat, palette, false);
      }

      // 7. Render Route Overlay if active
      if (this.route && this.route.coordinates && this.route.coordinates.length > 1) {
        this._renderNavigationRoute(ctx, this.route.coordinates, palette);
      }

      // 8. Render POI Markers & Icons
      for (const marker of this.markers) {
        this._renderMarker(ctx, marker, palette);
      }

      // 9. Render Place & Road Labels with Collision Detection
      if (this.zoom >= 9) {
        for (const feat of layers.place) {
          this._renderLabel(ctx, feat, palette, labelBoxes);
        }
      }
    }

    _renderPolygon(ctx, feat, fillColor, strokeColor, strokeWidth) {
      const coords = feat.geometry.coordinates;
      if (!coords || !coords[0]) return;

      const ring = coords[0];
      if (ring.length < 3) return;

      ctx.beginPath();
      for (let i = 0; i < ring.length; i++) {
        const pt = this.project(ring[i][0], ring[i][1]);
        if (i === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
      }
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.fill();

      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth || 1;
        ctx.stroke();
      }
    }

    _renderBuilding(ctx, feat, palette) {
      const ring = feat.geometry.coordinates[0];
      if (!ring || ring.length < 3) return;

      const levels = feat.properties?.levels || 5;
      const heightOffset = Math.min(24, Math.max(3, levels * (this.zoom / 14.0) * 1.5));

      // 2.5D Roof points
      const basePts = [];
      const roofPts = [];

      for (let i = 0; i < ring.length; i++) {
        const b = this.project(ring[i][0], ring[i][1]);
        basePts.push(b);
        roofPts.push([b[0], b[1] - heightOffset]);
      }

      // Draw Wall Sides
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

      // Draw Roof
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

    _renderRoad(ctx, feat, palette, isCasing) {
      const pts = feat.geometry.coordinates;
      if (!pts || pts.length < 2) return;

      const rtype = feat.properties?.type || 'residential';
      let baseWidth = 2;
      let fillColor = palette.roadSecondary;

      if (rtype === 'motorway') {
        baseWidth = 6;
        fillColor = palette.roadMotorway;
      } else if (rtype === 'trunk' || rtype === 'primary') {
        baseWidth = 4.5;
        fillColor = palette.roadPrimary;
      } else if (rtype === 'secondary') {
        baseWidth = 3;
        fillColor = palette.roadSecondary;
      }

      const zoomFactor = Math.pow(1.15, this.zoom - 12);
      const width = Math.max(1.5, baseWidth * zoomFactor);

      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const p = this.project(pts[i][0], pts[i][1]);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (isCasing) {
        ctx.strokeStyle = palette.roadCasing;
        ctx.lineWidth = width + 2.5;
        ctx.stroke();
      } else {
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = width;
        ctx.stroke();
      }
    }

    _renderNavigationRoute(ctx, coordinates, palette) {
      if (coordinates.length < 2) return;

      // Glow Halo
      ctx.beginPath();
      for (let i = 0; i < coordinates.length; i++) {
        const p = this.project(coordinates[i][0], coordinates[i][1]);
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = palette.routeHalo;
      ctx.lineWidth = 10;
      ctx.stroke();

      // Main Route Line
      ctx.strokeStyle = palette.routeLine;
      ctx.lineWidth = 6;
      ctx.stroke();

      // Start Pin
      const startP = this.project(coordinates[0][0], coordinates[0][1]);
      this._drawPin(ctx, startP[0], startP[1], '#10b981', '출발');

      // End Pin
      const endP = this.project(coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]);
      this._drawPin(ctx, endP[0], endP[1], '#ef4444', '도착');
    }

    _drawPin(ctx, x, y, color, label) {
      ctx.save();
      // Drop shadow
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 6, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();

      // Pin head
      ctx.beginPath();
      ctx.arc(x, y - 14, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pin needle
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 10);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 5, y - 10);
      ctx.fillStyle = color;
      ctx.fill();

      // Inner white dot
      ctx.beginPath();
      ctx.arc(x, y - 14, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      if (label) {
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(label, x, y + 6);
        ctx.fillText(label, x, y + 6);
      }
      ctx.restore();
    }

    _renderMarker(ctx, m, palette) {
      const p = this.project(m.lon, m.lat);
      const color = m.color || '#3b82f6';
      this._drawPin(ctx, p[0], p[1], color, m.title);
    }

    _renderLabel(ctx, feat, palette, labelBoxes) {
      const name = feat.properties?.name;
      if (!name) return;

      const p = this.project(feat.geometry.coordinates[0], feat.geometry.coordinates[1]);

      // Viewport culling
      if (p[0] < -50 || p[0] > this.width + 50 || p[1] < -50 || p[1] > this.height + 50) {
        return;
      }

      ctx.font = '500 12px "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textMetrics = ctx.measureText(name);
      const textWidth = textMetrics.width;
      const textHeight = 14;

      const bbox = {
        minX: p[0] - textWidth / 2 - 4,
        maxX: p[0] + textWidth / 2 + 4,
        minY: p[1] + 6,
        maxY: p[1] + 6 + textHeight,
      };

      // Collision Detection with previous labels
      for (const box of labelBoxes) {
        if (!(bbox.maxX < box.minX || bbox.minX > box.maxX || bbox.maxY < box.minY || bbox.minY > box.maxY)) {
          return; // Collision detected, suppress label
        }
      }

      labelBoxes.push(bbox);

      // Render Label Halo & Text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = palette.textHalo;
      ctx.lineWidth = 3;
      ctx.strokeText(name, p[0], p[1] + 6);

      ctx.fillStyle = palette.text;
      ctx.fillText(name, p[0], p[1] + 6);
    }
  }

  global.KoharuMapEngine = KoharuMapEngine;
})(window);
