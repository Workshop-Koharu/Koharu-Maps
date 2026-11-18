import { NextRequest, NextResponse } from 'next/server';
import { getMasterData } from '@/lib/global-data';
import { haversineDistance } from '@/lib/gis-engine';
import { verifyApiKey } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  verifyApiKey(req); // Optional tracking

  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '10')));
  const centerLon = parseFloat(req.nextUrl.searchParams.get('center_lon') || '');
  const centerLat = parseFloat(req.nextUrl.searchParams.get('center_lat') || '');

  if (!q) {
    return NextResponse.json({ status: 'success', count: 0, results: [] });
  }

  const { searchIndex } = getMasterData();
  const qLower = q.toLowerCase();

  const scored = searchIndex
    .map(place => {
      let score = 0;
      const nameLower = place.name.toLowerCase();
      const addrLower = place.address.toLowerCase();

      if (nameLower === qLower) score += 100;
      else if (nameLower.startsWith(qLower)) score += 50;
      else if (nameLower.includes(qLower)) score += 30;
      else if (addrLower.includes(qLower)) score += 15;

      // Korean syllable bi-gram match
      for (let i = 0; i < qLower.length - 1; i++) {
        const bi = qLower.substring(i, i + 2);
        if (nameLower.includes(bi)) score += 4;
        if (addrLower.includes(bi)) score += 2;
      }

      let distanceKm: number | undefined;
      if (!isNaN(centerLon) && !isNaN(centerLat)) {
        const distM = haversineDistance(centerLon, centerLat, place.lon, place.lat);
        distanceKm = Math.round((distM / 1000.0) * 10) / 10;
        // proximity bonus
        if (distanceKm < 50) score += (50 - distanceKm) * 0.2;
      }

      return {
        ...place,
        location: { lon: place.lon, lat: place.lat },
        score,
        distanceKm,
      };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({
    status: 'success',
    query: q,
    count: scored.length,
    results: scored,
  });
}
