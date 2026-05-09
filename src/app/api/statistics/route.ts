import { NextResponse } from 'next/server';
import { fetchAllRegions } from '@/lib/data';
import { classifyRegion } from '@/lib/classifier';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const regions = await fetchAllRegions();
    const totalPop = regions.reduce((s, r) => s + r.population, 0);
    const avgSafelyManaged = regions.reduce((s, r) => s + r.waterAccess.safelyManagedPct, 0) / regions.length;

    const riskCounts = { critical: 0, high: 0, moderate: 0, low: 0 };
    const countryStats: Record<string, { regions: number; population: number }> = {};

    for (const r of regions) {
      const { riskLevel } = classifyRegion(r);
      riskCounts[riskLevel]++;
      if (!countryStats[r.country]) countryStats[r.country] = { regions: 0, population: 0 };
      countryStats[r.country].regions++;
      countryStats[r.country].population += r.population;
    }

    return NextResponse.json({
      total_regions: regions.length,
      total_population: totalPop,
      average_safely_managed_pct: Math.round(avgSafelyManaged * 100) / 100,
      risk_level_distribution: riskCounts,
      countries: Object.keys(countryStats).length,
      country_statistics: countryStats,
      data_sources: ['World Bank Open Data', 'WHO/UNICEF JMP', 'FAO AQUASTAT'],
      last_updated: new Date().toISOString(),
      averages: {
        water_access: Math.round(avgSafelyManaged * 100) / 100,
        sanitation: Math.round(avgSafelyManaged * 0.9 * 100) / 100,
        water_stress: Math.round(regions.reduce((s, r) => s + r.waterStressIndex, 0) / regions.length * 100) / 100,
        flood_risk: Math.round(regions.reduce((s, r) => s + r.floodRiskScore, 0) / regions.length * 100 * 100) / 100,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to compute statistics', details: String(error) }, { status: 500 });
  }
}
