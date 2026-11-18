/**
 * Koharu Maps - Authentication & User State Controller
 * Manages JWT storage, modals, login/register, social logins, and favorites.
 */

const KoharuAuth = (function () {
  'use strict';

  const TOKEN_KEY = 'kmap_jwt_token';
  let currentUser = null;

  function init() {
    // Check if token in URL hash (e.g. from social login redirect /#token=...)
    if (window.location.hash.includes('token=')) {
      const match = window.location.hash.match(/token=([^&]+)/);
      if (match && match[1]) {
        localStorage.setItem(TOKEN_KEY, match[1]);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const token = getToken();
    if (token) {
      fetchProfile();
    } else {
      updateUserUI(null);
    }

    _bindAuthModalEvents();
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      fetchProfile();
    } else {
      localStorage.removeItem(TOKEN_KEY);
      currentUser = null;
      updateUserUI(null);
    }
  }

  function logout() {
    setToken(null);
    if (window.KoharuApp) {
      window.KoharuApp.showToast('로그아웃되었습니다.');
      window.KoharuApp.refreshFavoritesList();
    }
  }

  async function fetchProfile() {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        updateUserUI(currentUser);
        if (window.KoharuApp) {
          window.KoharuApp.refreshFavoritesList();
        }
      } else {
        // Token expired
        setToken(null);
      }
    } catch (e) {
      console.warn('Profile fetch error:', e);
    }
  }

  function updateUserUI(user) {
    const authBtn = document.getElementById('auth-action-btn');
    const userMenu = document.getElementById('user-profile-menu');
    const userNameLabel = document.getElementById('user-name-label');

    if (user) {
      if (authBtn) authBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
      if (userNameLabel) userNameLabel.textContent = user.name;
    } else {
      if (authBtn) authBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  function openAuthModal(mode = 'login', noticeMsg = '') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    modal.classList.add('active');
    switchAuthTab(mode);

    const noticeEl = document.getElementById('auth-notice-message');
    if (noticeEl) {
      if (noticeMsg) {
        noticeEl.textContent = noticeMsg;
        noticeEl.style.display = 'block';
      } else {
        noticeEl.style.display = 'none';
      }
    }
  }

  function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
  }

  function switchAuthTab(tab) {
    const loginTab = document.getElementById('tab-login-btn');
    const registerTab = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form-container');
    const registerForm = document.getElementById('register-form-container');

    if (tab === 'login') {
      loginTab?.classList.add('active');
      registerTab?.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
    } else {
      registerTab?.classList.add('active');
      loginTab?.classList.remove('active');
      if (registerForm) registerForm.style.display = 'block';
      if (loginForm) loginForm.style.display = 'none';
    }
  }

  function _bindAuthModalEvents() {
    // Tab switching
    document.getElementById('tab-login-btn')?.addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tab-register-btn')?.addEventListener('click', () => switchAuthTab('register'));

    // Modal close
    document.getElementById('close-auth-modal')?.addEventListener('click', closeAuthModal);
    document.getElementById('auth-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'auth-modal') closeAuthModal();
    });

    // Login Form Submit
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error-msg');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          setToken(data.token);
          closeAuthModal();
          if (window.KoharuApp) window.KoharuApp.showToast('성공적으로 로그인되었습니다.');
        } else {
          if (errorEl) {
            errorEl.textContent = data.detail || '로그인에 실패했습니다.';
            errorEl.style.display = 'block';
          }
        }
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = '네트워크 통신 중 오류가 발생했습니다.';
          errorEl.style.display = 'block';
        }
      }
    });

    // Register Form Submit
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const errorEl = document.getElementById('register-error-msg');

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          setToken(data.token);
          closeAuthModal();
          if (window.KoharuApp) window.KoharuApp.showToast('회원가입 및 로그인이 완료되었습니다!');
        } else {
          if (errorEl) {
            errorEl.textContent = data.detail || '회원가입에 실패했습니다.';
            errorEl.style.display = 'block';
          }
        }
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = '네트워크 통신 중 오류가 발생했습니다.';
          errorEl.style.display = 'block';
        }
      }
    });

    // Social Login Buttons
    document.querySelectorAll('.social-login-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const provider = btn.getAttribute('data-provider');
        try {
          const res = await fetch(`/api/auth/social/${provider}`);
          const data = await res.json();
          if (data.auth_url) {
            window.location.href = data.auth_url;
          } else {
            alert(data.detail || `${provider} 로그인을 위한 설정이 누락되었습니다 (.env 확인).`);
          }
        } catch (e) {
          alert('소셜 로그인 시작 중 오류가 발생했습니다.');
        }
      });
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', logout);
  }

  // Favorites API helpers
  async function getFavorites() {
    const token = getToken();
    if (!token) return null;
    const res = await fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.favorites;
    }
    return null;
  }

  async function addFavorite(title, lon, lat, address = '', category = '장소', memo = '') {
    const token = getToken();
    if (!token) {
      openAuthModal('login', '즐겨찾기를 저장하려면 먼저 로그인해야 합니다.');
      return false;
    }

    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, lon, lat, address, category, memo })
    });
    return res.ok;
  }

  async function deleteFavorite(favId) {
    const token = getToken();
    if (!token) return false;
    const res = await fetch(`/api/favorites/${favId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  }

  return {
    init,
    getToken,
    getCurrentUser: () => currentUser,
    isLoggedIn: () => !!currentUser,
    openAuthModal,
    closeAuthModal,
    logout,
    getFavorites,
    addFavorite,
    deleteFavorite
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  KoharuAuth.init();
});
