import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, code } = await req.json();

    if (!name || !email || !password || !code) {
      return NextResponse.json({ status: 'error', message: '모든 필수 항목을 입력해주세요.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ status: 'error', message: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 });
    }

    // Verify 6-digit code
    const isCodeValid = await db.verifyCode(email, code);
    if (!isCodeValid) {
      return NextResponse.json({ status: 'error', message: '인증번호가 일치하지 않거나 만료되었습니다.' }, { status: 400 });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ status: 'error', message: '이미 가입된 이메일 주소입니다.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.createUser({
      name,
      email,
      passwordHash,
      provider: 'local',
    });

    // Send welcome email upon registration
    await sendWelcomeEmail(user.email, user.name, 'local');

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      status: 'success',
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
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
    return NextResponse.json({ status: 'error', message: err.message || '회원가입 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
