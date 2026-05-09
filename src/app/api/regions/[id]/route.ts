import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { classifyRegion, getRecommendation, getDeepInsights } from '@/lib/classifier';
import { getSatelliteWaterData, getPrecipitationTrend } from '@/lib/google-earth-engine';
import { getFloodRiskProfile } from '@/lib/flood-data';
import { getWaterInfrastructure } from '@/lib/infrastructure-data';

async function withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T | null> {
  try { return await Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r('timeout'), ms))]); }
  catch { return null; }
}

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

  const base = {
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
  };

  const enriched = request.nextUrl.searchParams.get('enriched') === 'true';
  if (!enriched) return NextResponse.json(base);

  const { lat, lng } = region.coordinates;
  const [satellite, precipitation, floods, infrastructure] = await Promise.all([
    withTimeout(getSatelliteWaterData(lat, lng, id)),
    withTimeout(getPrecipitationTrend(lat, lng, id)),
    withTimeout(getFloodRiskProfile(id, region.country)),
    withTimeout(getWaterInfrastructure(lat, lng, id, region.population)),
  ]);

  return NextResponse.json({
    ...base,
    enriched: { satellite, precipitation, floods, infrastructure },
    dataSource: 'Multi-source: World Bank + JRC + Open-Meteo + GDACS + OpenStreetMap',
    lastUpdated: new Date().toISOString(),
  });
}
