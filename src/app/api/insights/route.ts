import { NextResponse } from 'next/server';
import { fetchAllRegions } from '@/lib/data';
import { getSatelliteWaterData } from '@/lib/google-earth-engine';
import { getFloodRiskProfile } from '@/lib/flood-data';

async function withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T | null> {
  try { return await Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r('timeout'), ms))]); }
  catch { return null; }
}

export async function GET() {
  try {
    const regions = await fetchAllRegions();

    // Satellite data is fast (no external API for JRC), flood data uses GDACS
    const enriched = await Promise.all(regions.map(async (r) => {
      const { lat, lng } = r.coordinates;
      const [sat, flood] = await Promise.all([
        withTimeout(getSatelliteWaterData(lat, lng, r.id)),
        withTimeout(getFloodRiskProfile(r.id, r.country)),
      ]);
      return {
        id: r.id, name: r.name, country: r.country,
        waterChange: sat?.waterChangePercent10yr,
        floodFreq: flood?.avgEventsPerYear,
        infraGap: r.infrastructureGap,
        population: r.population,
        need: r.waterStressIndex,
        suitability: r.groundwaterPotential === 'high' ? 0.9 : r.groundwaterPotential === 'moderate' ? 0.6 : 0.3,
      };
    }));

    const withWater = enriched.filter(r => r.waterChange != null).sort((a, b) => (a.waterChange ?? 0) - (b.waterChange ?? 0));
    const withInfra = [...enriched].sort((a, b) => b.infraGap - a.infraGap);
    const withFlood = enriched.filter(r => r.floodFreq != null).sort((a, b) => (b.floodFreq ?? 0) - (a.floodFreq ?? 0));
    const investmentScore = (r: typeof enriched[0]) => r.need * r.suitability * (1 - r.infraGap) * 100;
    const withInvestment = [...enriched].sort((a, b) => investmentScore(b) - investmentScore(a));

    return NextResponse.json({
      surfaceWaterLoss: withWater.slice(0, 5).map(r => ({ id: r.id, name: r.name, country: r.country, waterChangePercent10yr: r.waterChange })),
      worstInfrastructure: withInfra.slice(0, 5).map(r => ({ id: r.id, name: r.name, country: r.country, infrastructureGap: r.infraGap })),
      highestFloodFrequency: withFlood.slice(0, 5).map(r => ({ id: r.id, name: r.name, country: r.country, avgEventsPerYear: r.floodFreq })),
      bestInvestmentOpportunities: withInvestment.slice(0, 5).map(r => ({ id: r.id, name: r.name, country: r.country, score: Math.round(investmentScore(r)) })),
      totalRegionsAnalyzed: enriched.length,
      dataSource: 'JRC Global Surface Water + GDACS + WRI Aqueduct',
      lastUpdated: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to compute insights', details: String(e) }, { status: 500 });
  }
}
