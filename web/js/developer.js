/**
 * Koharu Maps - Developer Portal & Free API Key Manager
 */

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('kmap_jwt_token');
  const authPrompt = document.getElementById('dev-auth-prompt');
  const devDashboard = document.getElementById('dev-dashboard');

  if (!token) {
    if (authPrompt) authPrompt.style.display = 'block';
    if (devDashboard) devDashboard.style.display = 'none';
    return;
  }

  if (authPrompt) authPrompt.style.display = 'none';
  if (devDashboard) devDashboard.style.display = 'block';

  loadApiKeys();

  document.getElementById('create-key-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-key-name');
    const name = nameInput.value.trim() || '내 서비스용 API 키';

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        alert('무료 API 키가 성공적으로 발급되었습니다!');
        nameInput.value = '';
        loadApiKeys();
      } else {
        alert(data.detail || 'API 키 발급에 실패했습니다.');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    }
  });

  // Interactive Live API Tester
  document.getElementById('btn-test-api')?.addEventListener('click', async () => {
    const endpoint = document.getElementById('test-endpoint-select').value;
    const key = document.getElementById('test-api-key').value.trim();
    const resultBox = document.getElementById('test-result-output');

    resultBox.textContent = 'API 요청 전송 중...';

    try {
      const headers = key ? { 'X-API-Key': key } : {};
      const startTime = performance.now();
      const res = await fetch(endpoint, { headers });
      const elapsed = (performance.now() - startTime).toFixed(1);
      const data = await res.json();

      resultBox.textContent = `// HTTP ${res.status} ${res.statusText} (${elapsed}ms)\n` + JSON.stringify(data, null, 2);
    } catch (e) {
      resultBox.textContent = `요청 실패: ${e.message}`;
    }
  });
});

async function loadApiKeys() {
  const token = localStorage.getItem('kmap_jwt_token');
  const listEl = document.getElementById('api-keys-tbody');
  if (!listEl) return;

  try {
    const res = await fetch('/api/keys', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      renderKeyRows(data.keys || []);
    }
  } catch (e) {
    console.error(e);
  }
}

function renderKeyRows(keys) {
  const tbody = document.getElementById('api-keys-tbody');
  if (!tbody) return;

  if (keys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">발급된 API 키가 없습니다. 위에서 새로 발급받으세요.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  keys.forEach(k => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(k.name)}</strong></td>
      <td><code class="key-token">${k.key}</code></td>
      <td><span class="badge ${k.is_active ? 'badge-success' : 'badge-danger'}">${k.is_active ? '정상 작동' : '정지됨'}</span></td>
      <td>${k.usage_count}회</td>
      <td>${k.created_at ? k.created_at.substring(0, 10) : '-'}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="copyToClipboard('${k.key}')">복사</button>
        <button class="btn btn-sm btn-danger" onclick="deleteApiKey(${k.id})">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);

    // Auto-fill tester with first key
    const testerKeyInput = document.getElementById('test-api-key');
    if (testerKeyInput && !testerKeyInput.value) {
      testerKeyInput.value = k.key;
    }
  });
}

async function deleteApiKey(keyId) {
  if (!confirm('이 API 키를 영구 삭제하시겠습니까? 연결된 서비스의 조회가 중단될 수 있습니다.')) return;
  const token = localStorage.getItem('kmap_jwt_token');
  try {
    const res = await fetch(`/api/keys/${keyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      alert('API 키가 삭제되었습니다.');
      loadApiKeys();
    }
  } catch (e) {
    alert('삭제 중 오류가 발생했습니다.');
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('API 키가 클립보드에 복사되었습니다.');
  });
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}
