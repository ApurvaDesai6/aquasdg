import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { getSatelliteWaterData, getPrecipitationTrend } from '@/lib/google-earth-engine';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const region = await getRegionById(id);
    if (!region) return NextResponse.json({ error: `Region '${id}' not found` }, { status: 404 });

    const { lat, lng } = region.coordinates;
    const timeout = (p: Promise<unknown>) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))]);

    let satellite = null, precipitation = null;
    try { satellite = await timeout(getSatelliteWaterData(lat, lng, id)); } catch {}
    try { precipitation = await timeout(getPrecipitationTrend(lat, lng, id)); } catch {}

    return NextResponse.json({
      regionId: id,
      satellite,
      precipitation,
      dataSource: 'JRC Global Surface Water + Open-Meteo Historical Weather API',
      lastUpdated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to fetch satellite data', details: String(e) }, { status: 500 });
  }
}
