import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ status: 'error', message: '인증되지 않았습니다.' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'success',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLoginIp: user.lastLoginIp,
      lastLoginLocation: user.lastLoginLocation,
      lastLoginDevice: user.lastLoginDevice,
      lastLoginAt: user.lastLoginAt,
    },
  });
}
