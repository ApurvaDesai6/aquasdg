import { NextRequest, NextResponse } from 'next/server';
import { fetchAllRegions } from '@/lib/data';

export async function GET(request: NextRequest) {
  const regions = await fetchAllRegions();
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;
  const slice = regions.slice(offset, offset + limit);

  return NextResponse.json(slice.map((r, i) => ({
    record_index: offset + i,
    geometry_summary: `Point (${r.coordinates.lat.toFixed(2)}, ${r.coordinates.lng.toFixed(2)})`,
    area_km2: Math.round(r.population / Math.max(1, r.populationDensity)),
    start_date: '2020-01-01',
    end_date: r.lastUpdated.split('T')[0],
  })));
}
