import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/data';
import { getDeepInsights } from '@/lib/classifier';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const region = await getRegionById(id);
  if (!region) return NextResponse.json({ error: `Region '${id}' not found` }, { status: 404 });

  const { resilienceScore, insights, correlations, confidenceScore } = getDeepInsights(region);
  return NextResponse.json({
    region_id: id,
    timestamp: new Date().toISOString(),
    insights, correlations,
    resilience_score: resilienceScore,
    confidence_score: confidenceScore,
  });
}
