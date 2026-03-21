import { NextRequest, NextResponse } from 'next/server';

const ML_SERVICE_PORT = 3001;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `http://localhost:${ML_SERVICE_PORT}/api/recommend-interventions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to get recommendations', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to ML service', details: String(error) },
      { status: 503 }
    );
  }
}
