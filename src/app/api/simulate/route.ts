import { NextRequest, NextResponse } from 'next/server';
import { fetchAllRegions } from '@/lib/data';
import { runSimulation } from '@/lib/simulation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { total_budget, time_horizon_years = 5, target_regions, priority = 'population', include_maintenance = true } = body;

    if (!target_regions || target_regions.length === 0) {
      return NextResponse.json({ error: 'At least one target region is required' }, { status: 400 });
    }

    const regions = await fetchAllRegions();
    const validIds = new Set(regions.map(r => r.id));
    const invalid = target_regions.filter((id: string) => !validIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid region IDs: ${invalid.join(', ')}` }, { status: 400 });
    }

    const result = runSimulation(regions, total_budget, target_regions, time_horizon_years, priority, include_maintenance);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Simulation failed', details: String(error) }, { status: 500 });
  }
}
