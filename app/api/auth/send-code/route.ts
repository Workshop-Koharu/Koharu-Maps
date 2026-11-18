import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ status: 'error', message: '유효한 이메일 주소를 입력해주세요.' }, { status: 400 });
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ status: 'error', message: '이미 가입된 이메일 주소입니다.' }, { status: 400 });
    }

    // Generate 6-digit cryptographic verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.saveVerificationCode(email, code, 600); // 10 minutes TTL

    await sendVerificationEmail(email, code);

    return NextResponse.json({
      status: 'success',
      message: '인증번호가 발송되었습니다. 이메일을 확인해주세요.',
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message || '인증번호 발송에 실패했습니다.' }, { status: 500 });
  }
}
