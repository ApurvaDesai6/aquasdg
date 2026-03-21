import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const ML_SERVICE_PORT = 3001;

export async function GET() {
  const start = Date.now();
  try {
    console.log(`[API Statistics] Fetching from ML service: http://127.0.0.1:${ML_SERVICE_PORT}/api/statistics`);
    
    const response = await fetch(
      `http://127.0.0.1:${ML_SERVICE_PORT}/api/statistics`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[API Statistics] Error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Statistics] Success in ${Date.now() - start}ms`);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Statistics] Exception after ${Date.now() - start}ms:`, error);
    return NextResponse.json(
      { error: 'Failed to connect to ML service', details: String(error) },
      { status: 503 }
    );
  }
}
