import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const response = await fetch(
    `https://script.google.com/macros/s/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_SCRIPT}/exec`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const text = await response.text();

  try {
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: 'Invalid response from Google Script', raw: text }, { status: 500 });
  }
}
