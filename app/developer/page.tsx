'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Send, 
  Code2, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';

export default function DeveloperPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [snippetLang, setSnippetLang] = useState<'curl' | 'js' | 'python' | 'sdk'>('curl');

  // Live Tester
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/v1/search?q=강남역');
  const [testApiKey, setTestApiKey] = useState('');
  const [testOutput, setTestOutput] = useState('// API 호출 결과가 여기에 출력됩니다.');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          loadKeys();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        if (data.keys?.length > 0 && !testApiKey) {
          setTestApiKey(data.keys[0].key);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok) {
        setNewKeyName('');
        loadKeys();
      }
    } catch (err) {
      alert('API 키 생성 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('이 API 키를 삭제하시겠습니까? 연결된 서비스의 조회가 즉시 중단됩니다.')) return;
    try {
      const res = await fetch(`/api/keys?id=${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        loadKeys();
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunTest = async () => {
    setTesting(true);
    setTestOutput('요청 전송 중...');
    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {};
      if (testApiKey) headers['X-API-Key'] = testApiKey;

      const res = await fetch(selectedEndpoint, { headers });
      const elapsed = (performance.now() - startTime).toFixed(1);
      const data = await res.json();

      setTestOutput(`// HTTP ${res.status} ${res.statusText} (${elapsed}ms)\n` + JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestOutput(`// 요청 실패: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px 20px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 20, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Koharu Maps Developer Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Zero-Dependency Standalone GIS & Cartographic Open API &middot; 개발: KCS - Koharu Coding Server
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/api-docs" className="btn btn-outline">
            <FileText size={15} />
            <span>API 명세서</span>
          </Link>
          <Link href="/" className="btn btn-outline">
            <ArrowLeft size={15} />
            <span>지도로 돌아가기</span>
          </Link>
        </div>
      </div>

      {!user && !loading ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <Key size={36} color="var(--accent)" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>로그인이 필요합니다</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6, marginBottom: 20 }}>
            무료 API 키를 발급받고 사용량을 모니터링하려면 Koharu Maps 계정으로 로그인해주세요.
          </p>
          <Link href="/" className="btn btn-primary">
            지도로 이동하여 로그인하기
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 1: Create Key */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} color="var(--accent)" />
              <span>무료 API 키 발급</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              외부 웹/모바일 서비스 및 애플리케이션에서 호출 가능한 독립형 API 키를 무료로 생성합니다.
            </p>
            <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: 10, maxWidth: 500 }}>
              <input
                type="text"
                required
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="input-text"
                placeholder="키 식별 이름 (예: 프로덕션 웹앱)"
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                <Plus size={15} />
                <span>키 발급</span>
              </button>
            </form>
          </div>

          {/* Section 2: Key List */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>내 API 키 목록</h2>
            {keys.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>발급된 API 키가 없습니다. 위에서 새로 발급받으세요.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 14px' }}>이름</th>
                      <th style={{ padding: '10px 14px' }}>API 키 토큰</th>
                      <th style={{ padding: '10px 14px' }}>상태</th>
                      <th style={{ padding: '10px 14px' }}>누적 호출</th>
                      <th style={{ padding: '10px 14px' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map(k => (
                      <tr key={k.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{k.name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <code style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                            {k.key}
                          </code>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="badge badge-green">정상</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>{k.usageCount}회</td>
                        <td style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleCopy(k.key, k.id)}
                            className="btn btn-outline btn-sm"
                            title="복사"
                          >
                            {copiedId === k.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                            <span>{copiedId === k.id ? '복사됨' : '복사'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteKey(k.id)}
                            className="btn btn-danger btn-sm"
                            title="삭제"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Live Interactive Tester */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>실시간 API 인터랙티브 테스터</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              브라우저에서 직접 엔드포인트를 호출하고 JSON 응답 속도를 측정해보세요.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    엔드포인트
                  </label>
                  <select
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    className="input-text"
                  >
                    <option value="/api/v1/search?q=강남역">장소 검색: /api/v1/search?q=강남역</option>
                    <option value="/api/v1/search?q=뉴욕">글로벌 검색: /api/v1/search?q=뉴욕</option>
                    <option value="/api/v1/reverse-geocode?lon=126.9784&lat=37.5663">역지오코딩: /api/v1/reverse-geocode (서울시청)</option>
                    <option value="/api/v1/route?start=126.9768,37.5750&target=127.0280,37.4980">길찾기: 광화문 → 강남역 (A*)</option>
                    <option value="/api/v1/features?limit=10">피처 조회: /api/v1/features</option>
                    <option value="/api/v1/metadata">메타데이터: /api/v1/metadata</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    X-API-Key 헤더
                  </label>
                  <input
                    type="text"
                    value={testApiKey}
                    onChange={(e) => setTestApiKey(e.target.value)}
                    className="input-text"
                    placeholder="kmap_live_..."
                  />
                </div>

                <button onClick={handleRunTest} disabled={testing} className="btn btn-primary">
                  <Send size={14} />
                  <span>{testing ? '호출 중...' : '호출 실행'}</span>
                </button>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  응답 결과 (JSON)
                </label>
                <pre style={{
                  background: '#090d16',
                  color: '#38bdf8',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  height: 220,
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                }}>
                  {testOutput}
                </pre>
              </div>
            </div>
          </div>

          {/* Section 4: Quick Integration Snippets */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Code2 size={18} color="var(--accent)" />
                <span>클라이언트 SDK 및 코드 예제</span>
              </h2>
              <Link href="/api-docs" className="btn btn-outline btn-sm">
                <FileText size={13} />
                <span>전체 API 상세 명세서 보기 &rarr;</span>
              </Link>
            </div>

            {/* Language Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['curl', 'js', 'python', 'sdk'] as const).map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSnippetLang(lang)}
                  style={{
                    background: snippetLang === lang ? 'var(--accent)' : 'var(--bg-primary)',
                    color: snippetLang === lang ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'curl' ? 'cURL' : lang === 'js' ? 'JavaScript / Fetch' : lang === 'python' ? 'Python (requests)' : 'Maps Web SDK'}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <pre style={{
                background: '#090d16',
                color: '#f1f5f9',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontFamily: 'monospace',
                overflowX: 'auto',
                border: '1px solid var(--border-color)',
                margin: 0,
              }}>
                {snippetLang === 'curl' && `curl -X GET "https://map.koharu.live/api/v1/search?q=광화문&limit=5" \\
  -H "X-API-Key: ${testApiKey || 'YOUR_API_KEY'}"`}

                {snippetLang === 'js' && `// JavaScript (Fetch API) / TypeScript
const res = await fetch('https://map.koharu.live/api/v1/search?q=광화문&limit=5', {
  headers: {
    'X-API-Key': '${testApiKey || 'YOUR_API_KEY'}'
  }
});
const data = await res.json();
console.log(data.results);`}

                {snippetLang === 'python' && `# Python 3 (requests)
import requests

url = "https://map.koharu.live/api/v1/search"
params = { "q": "광화문", "limit": 5 }
headers = { "X-API-Key": "${testApiKey || 'YOUR_API_KEY'}" }

response = requests.get(url, params=params, headers=headers)
print(response.json()["results"])`}

                {snippetLang === 'sdk' && `<!-- HTML Standalone SDK -->
<script src="https://map.koharu.live/sdk/koharu-maps.js"></script>
<div id="map" style="width: 100%; height: 500px;"></div>
<script>
  const map = new KoharuMap({
    container: 'map',
    center: [126.9784, 37.5663],
    zoom: 13,
    apiKey: '${testApiKey || 'YOUR_API_KEY'}'
  });
</script>`}
              </pre>
              <button
                onClick={() => {
                  const text = snippetLang === 'curl'
                    ? `curl -X GET "https://map.koharu.live/api/v1/search?q=광화문&limit=5" -H "X-API-Key: ${testApiKey || 'YOUR_API_KEY'}"`
                    : snippetLang === 'js'
                    ? `const res = await fetch('https://map.koharu.live/api/v1/search?q=광화문&limit=5', { headers: { 'X-API-Key': '${testApiKey || 'YOUR_API_KEY'}' } }); const data = await res.json(); console.log(data.results);`
                    : snippetLang === 'python'
                    ? `import requests\nresponse = requests.get("https://map.koharu.live/api/v1/search", params={"q": "광화문", "limit": 5}, headers={"X-API-Key": "${testApiKey || 'YOUR_API_KEY'}"})\nprint(response.json()["results"])`
                    : `<script src="https://map.koharu.live/sdk/koharu-maps.js"></script>\n<div id="map" style="width: 100%; height: 500px;"></div>\n<script>\n  const map = new KoharuMap({ container: 'map', center: [126.9784, 37.5663], zoom: 13, apiKey: '${testApiKey || 'YOUR_API_KEY'}' });\n</script>`;
                  handleCopy(text, 'snippet-copy');
                }}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  color: '#fff',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
                title="코드 복사"
              >
                {copiedId === 'snippet-copy' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                <span>{copiedId === 'snippet-copy' ? '복사됨' : '복사'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
