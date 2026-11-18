import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createToken, getClientConnectionInfo } from '@/lib/auth';
import { sendSecurityAlertEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ status: 'error', message: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const user = await db.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return NextResponse.json({ status: 'error', message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ status: 'error', message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    // Inspect client connection environment
    const { ip, location, userAgent } = getClientConnectionInfo(req);

    // Check if this is a new IP or device compared to previous login
    const isNewEnvironment = user.lastLoginIp && (user.lastLoginIp !== ip || user.lastLoginDevice !== userAgent);

    if (isNewEnvironment) {
      // Send security alert email
      await sendSecurityAlertEmail(user.email, user.name, ip, location, userAgent);
    }

    // Update user login history
    await db.updateUser(user.id, {
      lastLoginIp: ip,
      lastLoginLocation: location,
      lastLoginDevice: userAgent,
      lastLoginAt: new Date().toISOString(),
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      status: 'success',
      message: '로그인에 성공했습니다.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        avatarUrl: user.avatarUrl,
      },
    });

    response.cookies.set('kmap_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message || '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
