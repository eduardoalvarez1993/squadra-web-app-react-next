import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getComunicados } from '@/services/feed';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET() {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const data = await getComunicados(session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/feed/comunicados]', err);
    return NextResponse.json({ error: 'Erro ao buscar comunicados' }, { status: 500 });
  }
}
