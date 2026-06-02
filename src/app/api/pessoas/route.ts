import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { buscarPessoas } from '@/services/pessoas';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const q = new URL(req.url).searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json([]);

  try {
    const data = await buscarPessoas(q, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/pessoas]', err);
    return NextResponse.json({ error: 'Erro ao buscar pessoas' }, { status: 500 });
  }
}
