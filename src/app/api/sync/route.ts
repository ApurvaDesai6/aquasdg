import { NextResponse } from 'next/server';
import { invalidateCache, fetchAllRegions } from '@/lib/data';

export async function POST() {
  try {
    invalidateCache();
    const regions = await fetchAllRegions();
    return NextResponse.json({
      status: 'success',
      message: 'Live sync completed. Data refreshed from World Bank, WHO/UNICEF JMP, and FAO AQUASTAT.',
      regions_synced: regions.length,
      timestamp: new Date().toISOString(),
      sources: ['World Bank Open Data API', 'WHO/UNICEF JMP', 'FAO AQUASTAT'],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed', details: String(error) }, { status: 500 });
  }
}
