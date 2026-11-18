import { NextRequest, NextResponse } from 'next/server';
import { getMasterData } from '@/lib/global-data';
import { verifyApiKey } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  verifyApiKey(req);
  const { features } = getMasterData();
  const limit = Math.min(2000, parseInt(req.nextUrl.searchParams.get('limit') || '1000'));

  return NextResponse.json({
    status: 'success',
    count: Math.min(features.length, limit),
    features: features.slice(0, limit),
  });
}
