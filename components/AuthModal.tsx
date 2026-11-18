'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  noticeMessage?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  noticeMessage,
}: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCode, setRegCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeSending, setCodeSending] = useState(false);

  // Status & error states
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Send Resend 6-digit verification code
  const handleSendCode = async () => {
    if (!regEmail || !regEmail.includes('@')) {
      setErrorMsg('유효한 이메일 주소를 입력해주세요.');
      return;
    }
    setErrorMsg('');
    setCodeSending(true);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodeSent(true);
        setInfoMsg('인증번호 6자리가 발송되었습니다. 수신함을 확인해주세요.');
      } else {
        setErrorMsg(data.message || '인증번호 발송 실패');
      }
    } catch (err: any) {
      setErrorMsg('네트워크 통신 오류가 발생했습니다.');
    } finally {
      setCodeSending(false);
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.token) localStorage.setItem('kmap_jwt_token', data.token);
        onSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!codeSent) {
      setErrorMsg('먼저 이메일 인증번호를 발송해주세요.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          code: regCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.token) localStorage.setItem('kmap_jwt_token', data.token);
        onSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setErrorMsg('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Social Login
  const handleSocialLogin = async (provider: string) => {
    try {
      const res = await fetch(`/api/auth/social/${provider}`);
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setErrorMsg(data.message || `${provider} 연동 설정이 누락되었습니다.`);
      }
    } catch {
      setErrorMsg('소셜 로그인 시작 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Koharu Maps 계정</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Notice Message Banner */}
        {noticeMessage && (
          <div style={{
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            padding: '10px 18px',
            fontSize: 12,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={15} />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => { setTab('login'); setErrorMsg(''); setInfoMsg(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: tab === 'login' ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === 'login' ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            로그인
          </button>
          <button
            onClick={() => { setTab('register'); setErrorMsg(''); setInfoMsg(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: tab === 'register' ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: tab === 'register' ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            이메일 회원가입
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: 20 }}>
          {errorMsg && (
            <div style={{
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--success)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <CheckCircle2 size={14} />
              <span>{infoMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>이메일</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-text"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>비밀번호</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-text"
                  placeholder="비밀번호 입력"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 4 }}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>이름</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="input-text"
                  placeholder="이름 (닉네임)"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>이메일 (Resend 인증)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="input-text"
                    placeholder="name@example.com"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={codeSending}
                    className="btn btn-outline"
                    style={{ whiteSpace: 'nowrap', fontSize: 12 }}
                  >
                    {codeSending ? '발송 중...' : (codeSent ? '재발송' : '인증번호 발송')}
                  </button>
                </div>
              </div>

              {codeSent && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>6자리 인증번호</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value)}
                    className="input-text"
                    placeholder="수신된 6자리 코드"
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>비밀번호 (6자 이상)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="input-text"
                  placeholder="비밀번호 설정"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 4 }}>
                {loading ? '가입 처리 중...' : '회원가입 완료'}
              </button>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>
                가입 시 Koharu Maps의{' '}
                <a href="/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>
                  서비스 이용약관
                </a>{' '}
                및{' '}
                <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>
                  개인정보 처리방침
                </a>
                에 동의하게 됩니다.
              </div>
            </form>
          )}

          {/* Social Logins Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            margin: '20px 0 14px 0',
            color: 'var(--text-muted)',
            fontSize: 11,
          }}>
            <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }} />
            <span style={{ padding: '0 10px' }}>또는 소셜 계정으로 계속</span>
            <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }} />
          </div>

          {/* Social Login Buttons (Google, Discord, GitHub) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google 계정으로 계속</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('discord')}
              style={{
                width: '100%',
                background: '#5865f2',
                color: '#ffffff',
                border: 'none',
              }}
              className="btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Discord 계정으로 계속</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              style={{
                width: '100%',
                background: '#24292e',
                color: '#ffffff',
                border: 'none',
              }}
              className="btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>GitHub 계정으로 계속</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
