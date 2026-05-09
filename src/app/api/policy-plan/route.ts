import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { classifyRegion, getRecommendation } from '@/lib/classifier';
import { getRecommendations } from '@/lib/interventions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regionId, budget, timeHorizon, apiKey } = body;

    const region = await getRegionById(regionId);
    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });

    const { riskLevel, compositeScore } = classifyRegion(region);
    const recommendation = getRecommendation(riskLevel, region);
    const interventions = getRecommendations(region, budget);

    // If API key provided, use AI for policy brief generation
    if (apiKey) {
      const prompt = `Generate a concise policy brief for water infrastructure investment in ${region.name}, ${region.country}.
Risk Level: ${riskLevel} (score: ${Math.round(compositeScore * 100)}%)
Population: ${region.population.toLocaleString()}
Water Access: ${region.waterAccess.safelyManagedPct}% safely managed
Budget: $${(budget || 1000000).toLocaleString()}
Top intervention: ${interventions[0]?.name || 'TBD'}
Format as JSON: {"executive_summary":"","key_findings":[],"recommended_actions":[],"budget_allocation":[],"timeline":"","expected_impact":""}`;

      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = text.replace(/```\w*\n?/g, '').match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return NextResponse.json({ success: true, policy: JSON.parse(jsonMatch[0]), ai_generated: true });
          }
        }
      } catch {}
    }

    // Fallback: generate structured policy from data
    return NextResponse.json({
      success: true,
      ai_generated: false,
      policy: {
        executive_summary: recommendation,
        key_findings: [
          `${region.name} has ${region.waterAccess.safelyManagedPct}% safely managed water access`,
          `Water stress index: ${Math.round(region.waterStressIndex * 100)}%`,
          `Infrastructure gap: ${Math.round(region.infrastructureGap * 100)}%`,
          `Climate vulnerability: ${Math.round(region.climateVulnerability * 100)}%`,
        ],
        recommended_actions: interventions.slice(0, 3).map(i => `${i.name}: ${i.justification}`),
        budget_allocation: interventions.slice(0, 3).map(i => ({
          intervention: i.name,
          estimated_cost: `$${i.estimatedCostMin.toLocaleString()} - $${i.estimatedCostMax.toLocaleString()}`,
          population_served: `${i.populationServedMin.toLocaleString()} - ${i.populationServedMax.toLocaleString()}`,
        })),
        timeline: `${timeHorizon || 5} year implementation plan`,
        expected_impact: `Projected to serve ${interventions.slice(0, 3).reduce((s, i) => s + i.populationServedMin, 0).toLocaleString()}+ people`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Policy generation failed', details: String(error) }, { status: 500 });
  }
}
