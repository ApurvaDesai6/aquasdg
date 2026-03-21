import { NextResponse } from 'next/server';

const ML_SERVICE_PORT = 3001;

export async function GET() {
  try {
    const response = await fetch(
      `http://localhost:${ML_SERVICE_PORT}/api/countries`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch countries' },
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
