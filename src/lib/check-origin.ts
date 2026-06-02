import { NextRequest, NextResponse } from 'next/server';

export function checkOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin') ?? '';
  // Suporta múltiplas origens via ALLOWED_ORIGINS (vírgula) ou APP_URL
  const raw     = process.env.ALLOWED_ORIGINS ?? process.env.APP_URL ?? '';
  const allowed = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (!allowed.length || !allowed.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
