import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { getWaterInfrastructure } from '@/lib/infrastructure-data';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const region = await getRegionById(id);
    if (!region) return NextResponse.json({ error: `Region '${id}' not found` }, { status: 404 });

    const infra = await Promise.race([
      getWaterInfrastructure(region.coordinates.lat, region.coordinates.lng, id, region.population),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 30000)),
    ]);

    return NextResponse.json({
      ...infra,
      dataSource: 'OpenStreetMap Overpass API',
      lastUpdated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to fetch infrastructure data', details: String(e) }, { status: 500 });
  }
}
