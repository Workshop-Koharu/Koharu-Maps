import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ status: 'error', message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const keys = await db.getApiKeysByUserId(user.id);
  return NextResponse.json({ status: 'success', keys });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ status: 'error', message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { name } = await req.json().catch(() => ({ name: '기본 무료 API 키' }));
  const newKey = await db.createApiKey(user.id, name || '기본 무료 API 키');

  return NextResponse.json({
    status: 'success',
    message: '새로운 무료 API 키가 발급되었습니다.',
    key: newKey,
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ status: 'error', message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const keyId = req.nextUrl.searchParams.get('id');
  if (!keyId) {
    return NextResponse.json({ status: 'error', message: '삭제할 키 ID를 지정해주세요.' }, { status: 400 });
  }

  const ok = await db.deleteApiKey(keyId, user.id);
  if (!ok) {
    return NextResponse.json({ status: 'error', message: 'API 키를 찾을 수 없거나 삭제 권한이 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ status: 'success', message: 'API 키가 영구 삭제되었습니다.' });
}
