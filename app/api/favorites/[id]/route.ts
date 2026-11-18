import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ status: 'error', message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const ok = await db.deleteFavorite(params.id, user.id);
  if (!ok) {
    return NextResponse.json({ status: 'error', message: '즐겨찾기를 찾을 수 없거나 삭제 권한이 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ status: 'success', message: '즐겨찾기에서 삭제되었습니다.' });
}
