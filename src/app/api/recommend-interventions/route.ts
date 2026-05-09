import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { getRecommendations } from '@/lib/interventions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region_id, budget_limit } = body;

    const region = await getRegionById(region_id);
    if (!region) return NextResponse.json({ error: `Region '${region_id}' not found` }, { status: 404 });

    const recommendations = getRecommendations(region, budget_limit);
    return NextResponse.json({
      region_id, region_name: region.name, country: region.country,
      recommendations: recommendations.map(r => ({
        intervention_type: r.type, name: r.name, description: r.description,
        suitability_score: r.suitabilityScore, justification: r.justification,
        estimated_cost_min: r.estimatedCostMin, estimated_cost_max: r.estimatedCostMax,
        population_served_min: r.populationServedMin, population_served_max: r.populationServedMax,
        reliability_score: r.reliabilityScore,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate recommendations', details: String(error) }, { status: 500 });
  }
}
