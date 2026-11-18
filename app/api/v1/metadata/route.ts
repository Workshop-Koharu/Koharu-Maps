import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    engine: 'Koharu Maps Standalone GIS & Cartographic Engine',
    version: '1.0.0',
    domain: 'https://map.koharu.live',
    crs: ['EPSG:4326', 'EPSG:3857', 'EPSG:5186'],
    layers: ['continent', 'water', 'green', 'road', 'building', 'place'],
  });
}
