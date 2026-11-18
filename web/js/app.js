/**
 * Koharu Maps - Main Application Controller
 * Connects Canvas Map Engine with UI panels, search, routing, and favorites.
 */

window.KoharuApp = (function () {
  'use strict';

  let map = null;
  let currentSearchResults = [];
  let navStartPoint = null; // { lon, lat, name }
  let navTargetPoint = null; // { lon, lat, name }
  let activeTheme = 'light';

  async function init() {
    // 1. Initialize Canvas Vector Map Engine
    map = new KoharuMapEngine('map-viewport', {
      center: [126.9784, 37.5663], // Seoul City Hall / Gwanghwamun
      zoom: 13,
      theme: activeTheme,
    });

    // 2. Load Vector Features from Local API
    await loadMapFeatures();

    // 3. Bind UI Controls
    _bindSearchUI();
    _bindRoutingUI();
    _bindMapControls();
    _bindSidebarToggles();
    _bindMapClickInteractions();

    // 4. Update status indicator
    map.onMove((center, zoom) => {
      const coordEl = document.getElementById('status-coordinates');
      const zoomEl = document.getElementById('status-zoom');
      if (coordEl) coordEl.textContent = `${center[0].toFixed(5)}, ${center[1].toFixed(5)}`;
      if (zoomEl) zoomEl.textContent = `Z: ${zoom.toFixed(1)}`;
    });
  }

  async function loadMapFeatures() {
    try {
      const res = await fetch('/api/v1/features?limit=1000');
      if (res.ok) {
        const data = await res.json();
        if (data.features) {
          map.setFeatures(data.features);
        }
      }
    } catch (e) {
      console.warn('Failed to load local map features:', e);
    }
  }

  // =========================================================================
  // Search UI
  // =========================================================================
  function _bindSearchUI() {
    const searchInput = document.getElementById('global-search-input');
    const searchResultsDropdown = document.getElementById('search-dropdown');
    let debounceTimer = null;

    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if (!query) {
        searchResultsDropdown.style.display = 'none';
        return;
      }
      debounceTimer = setTimeout(() => executeSearch(query), 200);
    });

    document.getElementById('search-clear-btn')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
      map.clearMarkers();
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-container')) {
        if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
      }
    });
  }

  async function executeSearch(query) {
    const dropdown = document.getElementById('search-dropdown');
    try {
      const [cLon, cLat] = map.center;
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&center_lon=${cLon}&center_lat=${cLat}`);
      if (res.ok) {
        const data = await res.json();
        renderSearchDropdown(data.results || []);
      }
    } catch (e) {
      console.warn('Search error:', e);
    }
  }

  function renderSearchDropdown(results) {
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '';
    if (results.length === 0) {
      dropdown.innerHTML = '<div class="dropdown-item empty">검색 결과가 없습니다.</div>';
      dropdown.style.display = 'block';
      return;
    }

    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'dropdown-item';
      div.innerHTML = `
        <div class="item-icon"></div>
        <div class="item-info">
          <div class="item-title">${escapeHtml(item.name)} <span class="item-category">${escapeHtml(item.category || '')}</span></div>
          <div class="item-address">${escapeHtml(item.address || '')}</div>
        </div>
      `;
      div.addEventListener('click', () => {
        selectSearchResult(item);
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(div);
    });

    dropdown.style.display = 'block';
  }

  function selectSearchResult(item) {
    const { lon, lat } = item.location;
    map.clearMarkers();
    map.addMarker({ lon, lat, title: item.name, color: '#2563eb' });
    map.flyTo(lon, lat, 15);
    showToast(`'${item.name}' 위치로 이동했습니다.`);
  }

  // =========================================================================
  // Routing & Navigation UI
  // =========================================================================
  function _bindRoutingUI() {
    const routePanel = document.getElementById('route-panel');
    const startInput = document.getElementById('route-start-input');
    const targetInput = document.getElementById('route-target-input');
    const calcBtn = document.getElementById('btn-calc-route');
    const clearBtn = document.getElementById('btn-clear-route');
    const swapBtn = document.getElementById('btn-swap-route');

    calcBtn?.addEventListener('click', runRouteCalculation);
    clearBtn?.addEventListener('click', clearRoute);

    swapBtn?.addEventListener('click', () => {
      const tempPoint = navStartPoint;
      navStartPoint = navTargetPoint;
      navTargetPoint = tempPoint;

      const tempVal = startInput.value;
      startInput.value = targetInput.value;
      targetInput.value = tempVal;

      if (navStartPoint && navTargetPoint) {
        runRouteCalculation();
      }
    });

    // Preset quick destination buttons
    document.querySelectorAll('.route-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lon = parseFloat(btn.dataset.lon);
        const lat = parseFloat(btn.dataset.lat);
        const name = btn.dataset.name;
        setNavTarget({ lon, lat, name });
      });
    });
  }

  function setNavStart(point) {
    navStartPoint = point;
    const startInput = document.getElementById('route-start-input');
    if (startInput) startInput.value = point.name || `${point.lon.toFixed(4)}, ${point.lat.toFixed(4)}`;
    openRoutePanel();
    if (navStartPoint && navTargetPoint) {
      runRouteCalculation();
    }
  }

  function setNavTarget(point) {
    navTargetPoint = point;
    const targetInput = document.getElementById('route-target-input');
    if (targetInput) targetInput.value = point.name || `${point.lon.toFixed(4)}, ${point.lat.toFixed(4)}`;
    openRoutePanel();
    if (navStartPoint && navTargetPoint) {
      runRouteCalculation();
    }
  }

  async function runRouteCalculation() {
    if (!navStartPoint || !navTargetPoint) {
      showToast('출발지와 도착지를 모두 설정해주세요.');
      return;
    }

    const startCoord = `${navStartPoint.lon},${navStartPoint.lat}`;
    const targetCoord = `${navTargetPoint.lon},${navTargetPoint.lat}`;
    const resultContainer = document.getElementById('route-instructions-container');

    if (resultContainer) {
      resultContainer.innerHTML = '<div class="loading-spinner">자체 도로망 최단 경로 계산 중...</div>';
    }

    try {
      const res = await fetch(`/api/v1/route?start=${startCoord}&target=${targetCoord}&algorithm=a_star&weight=time`);
      const data = await res.json();

      if (res.ok && data.route) {
        map.setRoute(data.route);
        renderRouteResults(data);
        showToast(`경로 탐색 완료: ${formatDistance(data.route.distance_m)} (${data.route.duration_min}분)`);
      } else {
        if (resultContainer) {
          resultContainer.innerHTML = `<div class="error-msg">${data.detail || '경로를 찾을 수 없습니다.'}</div>`;
        }
      }
    } catch (e) {
      if (resultContainer) {
        resultContainer.innerHTML = '<div class="error-msg">경로 계산 중 오류가 발생했습니다.</div>';
      }
    }
  }

  function renderRouteResults(data) {
    const container = document.getElementById('route-instructions-container');
    if (!container) return;

    const r = data.route;
    let html = `
      <div class="route-summary-box">
        <div class="summary-metric">
          <span class="metric-val">${r.duration_min}</span>
          <span class="metric-unit">분</span>
        </div>
        <div class="summary-sub">
          <span>총 거리: <strong>${formatDistance(r.distance_m)}</strong></span>
          <span>알고리즘: <strong>A* (Topological)</strong></span>
        </div>
      </div>
      <div class="instructions-list">
    `;

    r.instructions.forEach((ins, idx) => {
      let icon = '⬆️';
      if (ins.type === 'turn-left') icon = '⬅️';
      else if (ins.type === 'turn-right') icon = '️';
      else if (ins.type === 'slight-left') icon = '↖️';
      else if (ins.type === 'slight-right') icon = '↗️';
      else if (ins.type === 'u-turn') icon = '↩️';
      else if (ins.type === 'depart') icon = '';
      else if (ins.type === 'arrive') icon = '';

      html += `
        <div class="instruction-row" onclick="KoharuApp.flyToCoord(${ins.location[0]}, ${ins.location[1]})">
          <div class="ins-icon">${icon}</div>
          <div class="ins-body">
            <div class="ins-msg">${escapeHtml(ins.message)}</div>
            ${ins.distance_m > 0 ? `<div class="ins-sub">${formatDistance(ins.distance_m)} 이동</div>` : ''}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  function clearRoute() {
    map.clearRoute();
    navStartPoint = null;
    navTargetPoint = null;
    const startInput = document.getElementById('route-start-input');
    const targetInput = document.getElementById('route-target-input');
    const resultContainer = document.getElementById('route-instructions-container');
    if (startInput) startInput.value = '';
    if (targetInput) targetInput.value = '';
    if (resultContainer) resultContainer.innerHTML = '';
  }

  function openRoutePanel() {
    const routePanel = document.getElementById('route-panel');
    const favoritesPanel = document.getElementById('favorites-panel');
    if (favoritesPanel) favoritesPanel.style.display = 'none';
    if (routePanel) routePanel.style.display = 'flex';
  }

  function closeRoutePanel() {
    const routePanel = document.getElementById('route-panel');
    if (routePanel) routePanel.style.display = 'none';
  }

  // =========================================================================
  // Map Controls (Zoom, Bearing, Pitch, GPS, Theme)
  // =========================================================================
  function _bindMapControls() {
    document.getElementById('ctrl-zoom-in')?.addEventListener('click', () => {
      map.zoom = Math.min(map.maxZoom, map.zoom + 1);
      map.render();
    });

    document.getElementById('ctrl-zoom-out')?.addEventListener('click', () => {
      map.zoom = Math.max(map.minZoom, map.zoom - 1);
      map.render();
    });

    document.getElementById('ctrl-compass')?.addEventListener('click', () => {
      map.bearing = 0;
      map.render();
      showToast('지도를 북쪽 방향으로 정렬했습니다.');
    });

    document.getElementById('ctrl-pitch-toggle')?.addEventListener('click', () => {
      map.pitch = map.pitch === 0 ? 45 : 0;
      map.render();
      showToast(map.pitch > 0 ? '2.5D 입체 뷰 활성화' : '2D 평면 뷰 활성화');
    });

    document.getElementById('ctrl-current-location')?.addEventListener('click', () => {
      // Default to Seoul City Hall on offline/desktop
      map.flyTo(126.9784, 37.5663, 14);
      showToast('현재 기본 위치(서울)로 이동했습니다.');
    });

    // Theme Switcher Button
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      const themes = ['light', 'dark', 'high_contrast'];
      const nextIdx = (themes.indexOf(activeTheme) + 1) % themes.length;
      activeTheme = themes[nextIdx];
      map.setTheme(activeTheme);
      document.body.setAttribute('data-theme', activeTheme);
      showToast(`지도 테마: ${activeTheme.toUpperCase()}`);
    });
  }

  // =========================================================================
  // Sidebar Toggles & Favorites
  // =========================================================================
  function _bindSidebarToggles() {
    // Navigation toggle button in header
    document.getElementById('nav-toggle-btn')?.addEventListener('click', () => {
      const routePanel = document.getElementById('route-panel');
      if (routePanel.style.display === 'flex') {
        closeRoutePanel();
      } else {
        openRoutePanel();
      }
    });

    document.getElementById('close-route-panel-btn')?.addEventListener('click', closeRoutePanel);

    // Favorites toggle button in header
    document.getElementById('favorites-toggle-btn')?.addEventListener('click', () => {
      // REQUIREMENT: Check authentication! If not logged in, show auth modal!
      if (!KoharuAuth.isLoggedIn()) {
        KoharuAuth.openAuthModal('login', '즐겨찾기 목록을 확인하고 동기화하려면 로그인이 필요합니다.');
        return;
      }

      const favPanel = document.getElementById('favorites-panel');
      const routePanel = document.getElementById('route-panel');
      if (routePanel) routePanel.style.display = 'none';

      if (favPanel.style.display === 'flex') {
        favPanel.style.display = 'none';
      } else {
        favPanel.style.display = 'flex';
        refreshFavoritesList();
      }
    });

    document.getElementById('close-fav-panel-btn')?.addEventListener('click', () => {
      const favPanel = document.getElementById('favorites-panel');
      if (favPanel) favPanel.style.display = 'none';
    });
  }

  async function refreshFavoritesList() {
    const listEl = document.getElementById('favorites-list-container');
    if (!listEl) return;

    if (!KoharuAuth.isLoggedIn()) {
      listEl.innerHTML = `
        <div class="fav-empty-state">
          <p>즐겨찾기 기능을 이용하려면 로그인이 필요합니다.</p>
          <button class="btn btn-primary" onclick="KoharuAuth.openAuthModal('login')">로그인 / 회원가입</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '<div class="loading-spinner">즐겨찾기 목록 불러오는 중...</div>';
    const favs = await KoharuAuth.getFavorites();

    if (!favs || favs.length === 0) {
      listEl.innerHTML = `
        <div class="fav-empty-state">
          <p>등록된 즐겨찾기가 없습니다.</p>
          <p class="sub">지도 화면을 클릭하여 원하는 장소를 즐겨찾기에 등록해보세요!</p>
        </div>
      `;
      return;
    }

    let html = '';
    favs.forEach(f => {
      html += `
        <div class="fav-card">
          <div class="fav-card-body" onclick="KoharuApp.flyToCoord(${f.lon}, ${f.lat})">
            <div class="fav-title"> ${escapeHtml(f.title)}</div>
            <div class="fav-address">${escapeHtml(f.address || `${f.lon.toFixed(4)}, ${f.lat.toFixed(4)}`)}</div>
            ${f.memo ? `<div class="fav-memo">${escapeHtml(f.memo)}</div>` : ''}
          </div>
          <button class="fav-delete-btn" onclick="KoharuApp.removeFavorite(${f.id})" title="삭제"></button>
        </div>
      `;
    });
    listEl.innerHTML = html;
  }

  async function removeFavorite(favId) {
    if (confirm('이 즐겨찾기를 삭제하시겠습니까?')) {
      const ok = await KoharuAuth.deleteFavorite(favId);
      if (ok) {
        showToast('즐겨찾기에서 삭제되었습니다.');
        refreshFavoritesList();
      }
    }
  }

  // =========================================================================
  // Map Click Interactions (Context Popup)
  // =========================================================================
  function _bindMapClickInteractions() {
    const popup = document.getElementById('map-context-popup');

    map.onClick(async (geo, screenPos) => {
      const [lon, lat] = geo;

      // Reverse geocode clicked location
      let placeName = `${lon.toFixed(4)}, ${lat.toFixed(4)}`;
      let placeAddress = '위도/경도 지정 위치';

      try {
        const res = await fetch(`/api/v1/reverse-geocode?lon=${lon}&lat=${lat}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.place) {
            placeName = data.place.name;
            placeAddress = data.place.address || data.place.road_name || placeAddress;
          }
        }
      } catch (e) {}

      showContextPopup(screenPos[0], screenPos[1], {
        lon, lat, name: placeName, address: placeAddress
      });
    });

    document.getElementById('popup-set-start')?.addEventListener('click', () => {
      const p = popup.currentPoint;
      if (p) setNavStart(p);
      hideContextPopup();
    });

    document.getElementById('popup-set-target')?.addEventListener('click', () => {
      const p = popup.currentPoint;
      if (p) setNavTarget(p);
      hideContextPopup();
    });

    document.getElementById('popup-add-favorite')?.addEventListener('click', async () => {
      const p = popup.currentPoint;
      if (!p) return;

      // Check login!
      if (!KoharuAuth.isLoggedIn()) {
        hideContextPopup();
        KoharuAuth.openAuthModal('login', '즐겨찾기를 등록하려면 먼저 로그인해야 합니다.');
        return;
      }

      const memo = prompt(`'${p.name}'에 대한 메모를 남기시겠습니까?`, '');
      const ok = await KoharuAuth.addFavorite(p.name, p.lon, p.lat, p.address, '사용자 지정', memo || '');
      if (ok) {
        showToast(`'${p.name}'을(를) 즐겨찾기에 추가했습니다.`);
        refreshFavoritesList();
      }
      hideContextPopup();
    });

    document.getElementById('popup-close-btn')?.addEventListener('click', hideContextPopup);
  }

  function showContextPopup(x, y, point) {
    const popup = document.getElementById('map-context-popup');
    if (!popup) return;

    popup.currentPoint = point;
    document.getElementById('popup-title').textContent = point.name;
    document.getElementById('popup-address').textContent = point.address;
    document.getElementById('popup-coords').textContent = `${point.lon.toFixed(5)}, ${point.lat.toFixed(5)}`;

    popup.style.left = `${Math.min(window.innerWidth - 260, Math.max(10, x - 120))}px`;
    popup.style.top = `${Math.min(window.innerHeight - 200, Math.max(70, y - 160))}px`;
    popup.style.display = 'block';
  }

  function hideContextPopup() {
    const popup = document.getElementById('map-context-popup');
    if (popup) popup.style.display = 'none';
  }

  // Toast Utility
  function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  function formatDistance(meters) {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  return {
    init,
    flyToCoord: (lon, lat) => map.flyTo(lon, lat, 15),
    showToast,
    refreshFavoritesList,
    removeFavorite,
    setNavStart,
    setNavTarget,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  KoharuApp.init();
});
