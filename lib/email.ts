/**
 * Koharu Maps - Resend Email Integration
 * Handles:
 * 1. 6-digit verification code for email registration
 * 2. Welcome email upon account creation across all 4 sign-up providers
 * 3. Security alert email when a login is detected from a new device or IP/location
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Koharu Maps <onboarding@resend.dev>';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendVerificationEmail(toEmail: string, code: string): Promise<boolean> {
  if (!resend) {
    console.log(`[Resend Mock] Verification code for ${toEmail}: ${code}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: '[Koharu Maps] 회원가입 이메일 인증번호',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Koharu Maps</h2>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Zero-Dependency Standalone GIS Platform</p>
          </div>
          <h3 style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">이메일 주소 인증</h3>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Koharu Maps 계정 생성을 요청하셨습니다. 아래의 6자리 인증번호를 가입 창에 입력하여 인증을 완료해주세요.
          </p>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px; text-align: center; margin-bottom: 20px;">
            <span style="font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f172a;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 24px 0;">
            * 본 인증번호는 발송 후 10분간 유효합니다.<br>
            * 본인이 요청하지 않은 경우 본 이메일을 무시하셔도 안전합니다.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 11px;">
            Koharu Maps Cartographic Systems &middot; https://map.koharu.live
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Failed to send verification email:', err);
    return false;
  }
}

export async function sendWelcomeEmail(toEmail: string, userName: string, provider: string): Promise<boolean> {
  if (!resend) {
    console.log(`[Resend Mock] Welcome email for ${toEmail} (${userName}, provider: ${provider})`);
    return true;
  }

  const providerNames: Record<string, string> = {
    local: '이메일 가입',
    google: 'Google 소셜 계정',
    discord: 'Discord 소셜 계정',
    github: 'GitHub 소셜 계정',
  };
  const providerLabel = providerNames[provider] || provider;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: '[Koharu Maps] 환영합니다! 계정 생성이 완료되었습니다.',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Koharu Maps</h2>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Zero-Dependency Standalone GIS Platform</p>
          </div>
          <h3 style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">환영합니다, ${userName}님!</h3>
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            Koharu Maps 서비스 가입이 성공적으로 완료되었습니다. 상용 지도 엔진에 의존하지 않는 순수 독립형 벡터 지도 서비스를 편리하게 경험해보세요.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; color: #334155;">
            <div style="margin-bottom: 6px;">&bull; <strong>등록 이메일:</strong> ${toEmail}</div>
            <div style="margin-bottom: 6px;">&bull; <strong>가입 경로:</strong> ${providerLabel}</div>
            <div>&bull; <strong>서비스 도메인:</strong> <a href="https://map.koharu.live" style="color: #2563eb; text-decoration: none;">https://map.koharu.live</a></div>
          </div>
          <p style="color: #334155; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
            로그인 상태에서는 관심 장소 즐겨찾기 보관, 무료 Open API 키 발급 및 자체 개발 애플리케이션 연동이 가능합니다.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 11px;">
            Koharu Maps Cartographic Systems &middot; https://map.koharu.live
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    return false;
  }
}

export async function sendSecurityAlertEmail(
  toEmail: string,
  userName: string,
  ipAddress: string,
  location: string,
  userAgent: string
): Promise<boolean> {
  if (!resend) {
    console.log(`[Resend Mock] Security alert for ${toEmail}: new login from IP=${ipAddress}, Location=${location}`);
    return true;
  }

  const loginTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: '[Koharu Maps] 보안 알림: 새로운 환경에서의 로그인 감지',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Koharu Maps 보안 알림</h2>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Security Notification Service</p>
          </div>
          <h3 style="color: #0f172a; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">새로운 환경에서 계정 로그인이 감지되었습니다.</h3>
          <p style="color: #334155; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
            ${userName}님의 계정이 평소와 다른 기기 또는 새로운 IP 주소에서 로그인되었습니다. 아래 세부 정보를 확인해주세요.
          </p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; color: #991b1b;">
            <div style="margin-bottom: 6px;">&bull; <strong>접속 IP 주소:</strong> ${ipAddress || '알 수 없음'}</div>
            <div style="margin-bottom: 6px;">&bull; <strong>추정 접속 지역:</strong> ${location || '알 수 없음'}</div>
            <div style="margin-bottom: 6px;">&bull; <strong>접속 환경(User-Agent):</strong> <span style="font-family: monospace; font-size: 11px;">${userAgent || '알 수 없음'}</span></div>
            <div>&bull; <strong>로그인 일시:</strong> ${loginTime} (KST)</div>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 20px 0;">
            본인의 로그인이 맞다면 추가 조치를 취하실 필요가 없습니다.<br>
            만약 본인의 활동이 아니라면 즉시 설정 페이지에서 비밀번호를 변경하거나 계정을 점검하시기 바랍니다.
          </p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 11px;">
            Koharu Maps Cartographic Systems &middot; https://map.koharu.live
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Failed to send security alert email:', err);
    return false;
  }
}
