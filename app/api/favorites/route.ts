import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ status: 'error', message: '즐겨찾기 목록을 확인하려면 로그인이 필요합니다.' }, { status: 401 });
  }

  const favorites = await db.getFavoritesByUserId(user.id);
  return NextResponse.json({ status: 'success', favorites });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ status: 'error', message: '즐겨찾기에 등록하려면 로그인이 필요합니다.' }, { status: 401 });
  }

  const { title, category, address, lon, lat, memo } = await req.json();

  if (!title || typeof lon !== 'number' || typeof lat !== 'number') {
    return NextResponse.json({ status: 'error', message: '장소 이름과 좌표가 올바르지 않습니다.' }, { status: 400 });
  }

  const fav = await db.addFavorite({
    userId: user.id,
    title,
    category: category || '장소',
    address: address || '',
    lon,
    lat,
    memo: memo || '',
  });

  return NextResponse.json({
    status: 'success',
    message: '즐겨찾기에 등록되었습니다.',
    favorite: fav,
  });
}
