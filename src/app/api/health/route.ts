import { NextResponse } from 'next/server';
import { fetchAllRegions } from '@/lib/data';

export async function GET() {
  const regions = await fetchAllRegions();
  return NextResponse.json({
    status: 'active',
    service: 'aqua-sdg-serverless',
    version: '2.0.0',
    regions_loaded: regions.length,
    data_sources: ['World Bank Open Data', 'WHO/UNICEF JMP', 'FAO AQUASTAT'],
    architecture: 'Vercel Serverless Functions',
  });
}
