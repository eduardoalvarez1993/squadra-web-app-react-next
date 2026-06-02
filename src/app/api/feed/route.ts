import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPosts } from '@/services/feed';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const offset = Number(new URL(req.url).searchParams.get('offset') ?? '1');

  try {
    const data = await getPosts(offset, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/feed]', err);
    return NextResponse.json({ error: 'Erro ao buscar feed' }, { status: 500 });
  }
}
