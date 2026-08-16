import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/reports/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || 'Failed to create report' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Report submission error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/reports/?skip=${skip}&limit=${limit}`);

    if (!response.ok) {
      return NextResponse.json(
        { detail: 'Failed to fetch reports' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}