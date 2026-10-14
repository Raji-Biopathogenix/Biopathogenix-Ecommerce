import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/config/env';

// The Traceable Pathogen panel landing pages are static HTML in /public, so they cannot
// read NEXT_PUBLIC_API_BASE_URL themselves. They post here and this forwards the request
// to the backend, the same way the site's other forms reach it.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/panel-assessment/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error('Failed to reach panel assessment API', err);
    return NextResponse.json(
      { message: 'Failed to send your request. Please try again shortly.' },
      { status: 502 },
    );
  }
}
