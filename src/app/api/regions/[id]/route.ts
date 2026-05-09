import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { classifyRegion, getRecommendation, getDeepInsights } from '@/lib/classifier';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check if this is an insights request
  const isInsights = request.nextUrl.pathname.endsWith('/insights');

  const region = await getRegionById(id);
  if (!region) {
    return NextResponse.json({ error: `Region '${id}' not found` }, { status: 404 });
  }

  const { riskLevel, compositeScore, riskFactors } = classifyRegion(region);

  if (isInsights) {
    const { resilienceScore, insights, correlations, confidenceScore } = getDeepInsights(region);
    return NextResponse.json({
      region_id: id,
      timestamp: new Date().toISOString(),
      insights, correlations,
      resilience_score: resilienceScore,
      confidence_score: confidenceScore,
    });
  }

  return NextResponse.json({
    id: region.id, name: region.name, country: region.country,
    region_type: region.regionType,
    coordinates: region.coordinates,
    population: region.population,
    water_access: {
      safely_managed_pct: region.waterAccess.safelyManagedPct,
      basic_pct: region.waterAccess.basicPct,
      limited_pct: region.waterAccess.limitedPct,
      unimproved_pct: region.waterAccess.unimprovedPct,
      surface_water_pct: region.waterAccess.surfaceWaterPct,
    },
    water_stress_index: region.waterStressIndex,
    flood_risk_score: region.floodRiskScore,
    drought_risk_score: region.droughtRiskScore,
    climate_vulnerability: region.climateVulnerability,
    infrastructure_gap: region.infrastructureGap,
    data_sources: region.dataSources,
    last_updated: region.lastUpdated,
    computed: {
      risk_level: riskLevel,
      composite_risk_score: compositeScore,
      risk_factors: riskFactors,
      recommendation: getRecommendation(riskLevel, region),
    },
  });
}
