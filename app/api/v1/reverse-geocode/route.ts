import { NextRequest, NextResponse } from 'next/server';
import { getMasterData } from '@/lib/global-data';
import { haversineDistance } from '@/lib/gis-engine';
import { verifyApiKey } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  verifyApiKey(req);

  const lon = parseFloat(req.nextUrl.searchParams.get('lon') || '');
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') || '');
  const maxDistM = parseFloat(req.nextUrl.searchParams.get('max_dist_m') || '5000');

  if (isNaN(lon) || isNaN(lat)) {
    return NextResponse.json({ status: 'error', message: '경도(lon)와 위도(lat)를 올바르게 전달해주세요.' }, { status: 400 });
  }

  const { searchIndex } = getMasterData();
  let bestPlace = null;
  let minDist = Infinity;

  for (const place of searchIndex) {
    const d = haversineDistance(lon, lat, place.lon, place.lat);
    if (d < minDist && d <= maxDistM) {
      minDist = d;
      bestPlace = place;
    }
  }

  if (bestPlace) {
    return NextResponse.json({
      status: 'success',
      found: true,
      place: {
        ...bestPlace,
        distanceM: Math.round(minDist),
      },
    });
  }

  return NextResponse.json({
    status: 'success',
    found: false,
    message: '해당 반경 내에 등록된 랜드마크 정보가 없습니다.',
    location: { lon, lat },
  });
}
