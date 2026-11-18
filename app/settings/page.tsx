'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Key, 
  Bookmark, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Globe,
  Monitor
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/');
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('kmap_jwt_token');
    document.cookie = 'kmap_token=; Max-Age=0; path=/;';
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '계정 영구 삭제') {
      alert("확인을 위해 정확히 '계정 영구 삭제'를 입력해주세요.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' });
      if (res.ok) {
        localStorage.removeItem('kmap_jwt_token');
        alert('계정 및 관련된 모든 데이터(API 키, 즐겨찾기 등)가 영구적으로 파기되었습니다.');
        router.push('/');
      } else {
        alert('계정 삭제 처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 통신 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '100px auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
        계정 설정을 불러오는 중입니다...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px 20px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 20, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>계정 및 보안 설정</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            프로필 정보, 보안 세션 확인 및 계정 관리
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleLogout} className="btn btn-outline">
            로그아웃
          </button>
          <Link href="/" className="btn btn-outline">
            <ArrowLeft size={15} />
            <span>지도로 돌아가기</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--accent)" />
            <span>프로필 정보</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>이름(닉네임)</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{user.name}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>등록 이메일</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{user.email}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>인증 수단</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, textTransform: 'capitalize' }}>
                {user.provider === 'local' ? '이메일 가입' : `${user.provider} 소셜 로그인`}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>계정 생성일</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                {user.createdAt ? user.createdAt.substring(0, 10) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access History Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="var(--accent)" />
            <span>최근 보안 및 접속 정보</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
            새로운 기기나 IP 주소에서 로그인이 발생할 때 등록된 이메일로 보안 알림이 자동 발송됩니다.
          </p>
          <div style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-md)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={15} color="var(--text-muted)" />
              <span><strong>접속 IP 및 지역:</strong> {user.lastLoginIp || '현재 접속 중'} ({user.lastLoginLocation || '대한민국'})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={15} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>접속 환경:</strong> {user.lastLoginDevice ? user.lastLoginDevice.substring(0, 70) + '...' : '브라우저 접속'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} />
            <span>위험 구역: 계정 영구 삭제</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            계정을 삭제하면 보관된 모든 즐겨찾기, 발급받은 모든 무료 API 키 및 활동 로그가 데이터베이스에서 즉시 영구적으로 파기됩니다.
            삭제된 데이터는 어떠한 경우에도 복구할 수 없습니다.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger"
          >
            <Trash2 size={15} />
            <span>계정 영구 삭제</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>계정 영구 삭제 확인</h3>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                정말로 탈퇴하시겠습니까? 본 작업은 취소할 수 없습니다. 계속 진행하시려면 아래 입력창에 <strong>'계정 영구 삭제'</strong>를 그대로 입력해주세요.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="input-text"
                placeholder="계정 영구 삭제"
                style={{ marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== '계정 영구 삭제'}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                >
                  {deleting ? '삭제 처리 중...' : '확인 및 계정 삭제'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
