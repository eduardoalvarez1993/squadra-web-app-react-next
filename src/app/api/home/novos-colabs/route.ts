import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getNovosColabs } from '@/services/home';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET() {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const data = await getNovosColabs(session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/home/novos-colabs]', err);
    return NextResponse.json({ error: 'Erro ao buscar novos colaboradores' }, { status: 500 });
  }
}
