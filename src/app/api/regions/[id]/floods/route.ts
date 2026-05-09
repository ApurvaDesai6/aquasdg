import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { getFloodRiskProfile } from '@/lib/flood-data';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const region = await getRegionById(id);
    if (!region) return NextResponse.json({ error: `Region '${id}' not found` }, { status: 404 });

    const profile = await Promise.race([
      getFloodRiskProfile(id, region.country),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
    ]);

    return NextResponse.json({
      ...profile,
      dataSource: 'GDACS (UN/EU GloFAS) + EM-DAT (CRED, UCLouvain)',
      lastUpdated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to fetch flood data', details: String(e) }, { status: 500 });
  }
}
