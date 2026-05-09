import { NextRequest, NextResponse } from 'next/server';
import { fetchAllRegions } from '@/lib/data';
import { classifyRegion } from '@/lib/classifier';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const riskLevelFilter = searchParams.get('risk_level');
    const limit = parseInt(searchParams.get('limit') || '100');

    const regions = await fetchAllRegions();

    const results = regions
      .filter(r => !country || r.country === country)
      .map(r => {
        const { riskLevel, compositeScore } = classifyRegion(r);
        return {
          id: r.id, name: r.name, country: r.country, region_type: r.regionType,
          coordinates: { lat: r.coordinates.lat, lng: r.coordinates.lng },
          population: r.population, risk_level: riskLevel,
          composite_risk_score: Math.round(compositeScore * 100 * 10) / 10,
          water_access_pct: r.waterAccess.safelyManagedPct,
          flood_risk_score: Math.round(r.floodRiskScore * 100 * 10) / 10,
          water_stress_index: Math.round(r.waterStressIndex * 100 * 10) / 10,
          drought_risk_score: Math.round(r.droughtRiskScore * 100 * 10) / 10,
          climate_vulnerability: Math.round(r.climateVulnerability * 100 * 10) / 10,
          infrastructure_gap: Math.round(r.infrastructureGap * 100 * 10) / 10,
          sanitation_pct: Math.round(r.waterAccess.safelyManagedPct * 0.9 * 10) / 10,
          policy_index: Math.round((100 - compositeScore * 50) * 10) / 10,
        };
      })
      .filter(r => !riskLevelFilter || r.risk_level === riskLevelFilter)
      .slice(0, limit);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch regions', details: String(error) }, { status: 500 });
  }
}
