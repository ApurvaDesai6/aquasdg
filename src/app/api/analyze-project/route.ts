import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { getRecommendations } from '@/lib/interventions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const regionId = body.region?.regionId;
    if (!regionId) return NextResponse.json({ error: 'regionId required' }, { status: 400 });

    const region = await getRegionById(regionId);
    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 });

    const recs = getRecommendations(region);
    const top = recs[0];

    return NextResponse.json({
      status: 'success',
      project: {
        id: `proj-${regionId}`,
        title: `Freshwater Resilience Initiative: ${region.name}`,
        type: top?.name || 'Infrastructure Development',
        description: top?.description || 'Strategic water access enhancement.',
        budget: {
          estimated: top?.estimatedCostMin || 500000,
          breakdown: [
            { category: 'Construction', amount: Math.round((top?.estimatedCostMin || 500000) * 0.7), percentage: 70 },
            { category: 'Engineering', amount: Math.round((top?.estimatedCostMin || 500000) * 0.2), percentage: 20 },
            { category: 'Community Outreach', amount: Math.round((top?.estimatedCostMin || 500000) * 0.1), percentage: 10 },
          ],
        },
        timeline: {
          phases: [
            { name: 'Site Assessment', duration: '2 months', milestones: ['Survey completed', 'Soil testing'] },
            { name: 'Procurement', duration: '3 months', milestones: ['Contractors hired', 'Materials sourced'] },
            { name: 'Construction', duration: '9 months', milestones: ['Foundation set', 'System tested'] },
          ],
          totalDuration: '14 months',
        },
        impact: {
          beneficiaries: region.population,
          waterAccessImprovement: 25,
          riskReduction: 30,
          sdgContribution: [
            { target: 'SDG 6.1', contribution: 'Safely managed drinking water' },
            { target: 'SDG 9.1', contribution: 'Resilient infrastructure' },
          ],
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed', details: String(error) }, { status: 500 });
  }
}
