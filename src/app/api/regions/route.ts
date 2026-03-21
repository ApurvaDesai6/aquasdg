import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const ML_SERVICE_PORT = 3001;

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const riskLevel = searchParams.get('risk_level');
    const minPopulation = searchParams.get('min_population');
    const limit = searchParams.get('limit') || '100';

    const params = new URLSearchParams();
    if (country) params.set('country', country);
    if (riskLevel) params.set('risk_level', riskLevel);
    if (minPopulation) params.set('min_population', minPopulation);
    params.set('limit', limit);

    console.log(`[API Regions] Fetching from ML service: http://127.0.0.1:${ML_SERVICE_PORT}/api/regions?${params.toString()}`);
    
    const response = await fetch(
      `http://127.0.0.1:${ML_SERVICE_PORT}/api/regions?${params.toString()}`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[API Regions] Error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch regions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Regions] Success in ${Date.now() - start}ms`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Regions] Exception after ${Date.now() - start}ms:`, error);
    return NextResponse.json(
      { error: 'Failed to connect to ML service', details: String(error) },
      { status: 503 }
    );
  }
}
