import { NextResponse } from 'next/server';
import { fetchAllRegions } from '@/lib/data';

export async function GET() {
  const regions = await fetchAllRegions();
  const countries = [...new Set(regions.map(r => r.country))].sort();
  return NextResponse.json(countries);
}
