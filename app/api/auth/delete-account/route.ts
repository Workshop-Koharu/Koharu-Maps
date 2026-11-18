import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ status: 'error', message: '인증되지 않았습니다.' }, { status: 401 });
  }

  // Permanently delete user and cascade associated records
  await db.deleteUser(user.id);

  const response = NextResponse.json({
    status: 'success',
    message: '계정 및 관련 모든 데이터가 영구적으로 삭제되었습니다.',
  });

  // Clear session cookie
  response.cookies.delete('kmap_token');
  return response;
}
