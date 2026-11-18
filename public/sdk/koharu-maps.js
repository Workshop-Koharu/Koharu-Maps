/**
 * Koharu Maps Standalone Client SDK v1.0.0
 * Zero-Dependency Vector Map & Cartographic API Client.
 * Official Endpoint: https://map.koharu.live
 * (C) Koharu Maps Cartographic Systems.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KoharuMap = factory().KoharuMap;
    root.KoharuClient = factory().KoharuClient;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const WGS84_A = 6378137.0;
  const MERCATOR_MAX_LAT = 85.0511287798066;
  const ORIGIN_SHIFT = Math.PI * WGS84_A;
  const TILE_SIZE = 256;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
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

  const THEMES = {
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
    }
  };

  class KoharuClient {
    constructor(options = {}) {
      this.baseUrl = options.baseUrl || 'https://map.koharu.live';
      this.apiKey = options.apiKey || '';
    }

    _headers() {
      const h = { 'Content-Type': 'application/json' };
      if (this.apiKey) h['X-API-Key'] = this.apiKey;
      return h;
    }

    async search(query, options = {}) {
      let url = `${this.baseUrl}/api/v1/search?q=${encodeURIComponent(query)}`;
      if (options.limit) url += `&limit=${options.limit}`;
      if (options.center) url += `&center_lon=${options.center[0]}&center_lat=${options.center[1]}`;
      const res = await fetch(url, { headers: this._headers() });
      return res.json();
    }

    async reverseGeocode(lon, lat, maxDistM = 5000) {
      const url = `${this.baseUrl}/api/v1/reverse-geocode?lon=${lon}&lat=${lat}&max_dist_m=${maxDistM}`;
      const res = await fetch(url, { headers: this._headers() });
      return res.json();
    }

    async calculateRoute(start, target) {
      const s = Array.isArray(start) ? `${start[0]},${start[1]}` : start;
      const t = Array.isArray(target) ? `${target[0]},${target[1]}` : target;
      const url = `${this.baseUrl}/api/v1/route?start=${s}&target=${t}`;
      const res = await fetch(url, { headers: this._headers() });
      return res.json();
    }

    async getFeatures(limit = 1000) {
      const url = `${this.baseUrl}/api/v1/features?limit=${limit}`;
      const res = await fetch(url, { headers: this._headers() });
      return res.json();
    }
  }

  class KoharuMap {
    constructor(options = {}) {
      const containerEl = typeof options.container === 'string'
        ? document.getElementById(options.container)
        : options.container;

      if (!containerEl) throw new Error('[KoharuMap] Container element required.');

      this.container = containerEl;
      this.center = options.center || [126.9784, 37.5663];
      this.zoom = options.zoom || 13;
      this.theme = options.theme || 'light';
      this.client = new KoharuClient(options);

      this.features = [];
      this.markers = [];
      this.route = null;

      this._initCanvas();
      this._bindEvents();
      this.render();

      if (options.autoload !== false) {
        this.loadFeatures();
      }
    }

    async loadFeatures() {
      try {
        const data = await this.client.getFeatures(1000);
        if (data.features) {
          this.features = data.features;
          this.render();
        }
      } catch (e) {
        console.warn('[KoharuMap] Failed to load features:', e);
      }
    }

    _initCanvas() {
      this.container.innerHTML = '';
      this.canvas = document.createElement('canvas');
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d', { alpha: false });
      this._resize();
      window.addEventListener('resize', () => {
        this._resize();
        this.render();
      });
    }

    _resize() {
      const rect = this.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.width = Math.max(50, Math.floor(rect.width));
      this.height = Math.max(50, Math.floor(rect.height));
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
    }

    setTheme(theme) {
      if (THEMES[theme]) {
        this.theme = theme;
        this.render();
      }
    }

    flyTo(lon, lat, zoom = null) {
      this.center = [lon, lat];
      if (zoom !== null) this.zoom = zoom;
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

    setRoute(routeData) {
      this.route = routeData;
      this.render();
    }

    clearRoute() {
      this.route = null;
      this.render();
    }

    project(lon, lat) {
      const cPx = lonLatToPixel(this.center[0], this.center[1], this.zoom);
      const tPx = lonLatToPixel(lon, lat, this.zoom);
      return [this.width / 2.0 + (tPx[0] - cPx[0]), this.height / 2.0 + (tPx[1] - cPx[1])];
    }

    unproject(x, y) {
      const cPx = lonLatToPixel(this.center[0], this.center[1], this.zoom);
      const tPx = [cPx[0] + (x - this.width / 2.0), cPx[1] + (y - this.height / 2.0)];
      return pixelToLonLat(tPx[0], tPx[1], this.zoom);
    }

    _bindEvents() {
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      this.canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const cPx = [this.width / 2.0 - dx, this.height / 2.0 - dy];
        this.center = this.unproject(cPx[0], cPx[1]);
        startX = e.clientX;
        startY = e.clientY;
        this.render();
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          this.canvas.style.cursor = 'grab';
        }
      });

      this.canvas.style.cursor = 'grab';

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.3 : -0.3;
        this.zoom = clamp(this.zoom + delta, 1, 20);
        this.render();
      }, { passive: false });
    }

    render() {
      const ctx = this.ctx;
      const palette = THEMES[this.theme] || THEMES.light;
      const w = this.width;
      const h = this.height;

      // Background
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, w, h);

      // Render features by layer
      for (const f of this.features) {
        if (f.minZoom && this.zoom < f.minZoom) continue;
        if (f.maxZoom && this.zoom > f.maxZoom) continue;

        if (f.layer === 'continent' || f.layer === 'water' || f.layer === 'green' || f.layer === 'building') {
          const ring = f.coordinates[0];
          if (!ring || ring.length < 3) continue;

          ctx.beginPath();
          for (let i = 0; i < ring.length; i++) {
            const p = this.project(ring[i][0], ring[i][1]);
            if (i === 0) ctx.moveTo(p[0], p[1]);
            else ctx.lineTo(p[0], p[1]);
          }
          ctx.closePath();

          let fill = palette.continent;
          if (f.layer === 'water') fill = palette.water;
          else if (f.layer === 'green') fill = palette.green;
          else if (f.layer === 'building') fill = palette.building;

          ctx.fillStyle = fill;
          ctx.fill();
        } else if (f.layer === 'road') {
          const pts = f.coordinates;
          if (!pts || pts.length < 2) continue;

          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const p = this.project(pts[i][0], pts[i][1]);
            if (i === 0) ctx.moveTo(p[0], p[1]);
            else ctx.lineTo(p[0], p[1]);
          }
          ctx.lineCap = 'round';
          ctx.strokeStyle = f.properties?.type === 'motorway' ? palette.roadMotorway : palette.roadPrimary;
          ctx.lineWidth = f.properties?.type === 'motorway' ? 4 : 2.5;
          ctx.stroke();
        }
      }

      // Route
      if (this.route && this.route.coordinates && this.route.coordinates.length > 1) {
        const coords = this.route.coordinates;
        ctx.beginPath();
        for (let i = 0; i < coords.length; i++) {
          const p = this.project(coords[i][0], coords[i][1]);
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = palette.routeHalo;
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.strokeStyle = palette.routeLine;
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Markers (Lucide styled clean pin)
      for (const m of this.markers) {
        const p = this.project(m.lon, m.lat);
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
          ctx.font = '600 11px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = palette.text;
          ctx.fillText(m.title, p[0], p[1] + 6);
        }
        ctx.restore();
      }
    }
  }

  return { KoharuMap, KoharuClient };
});
