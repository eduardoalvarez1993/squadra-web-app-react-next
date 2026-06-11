import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getApontamentosDia } from '@/services/ponto';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token)   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.bateRep) return NextResponse.json({ error: 'Sem permissão' },   { status: 403 });

  const data = new URL(req.url).searchParams.get('data') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ error: 'data obrigatória (YYYY-MM-DD)' }, { status: 400 });
  }

  try {
    const itens = await getApontamentosDia(session.pessoaId, data, session.token);
    return NextResponse.json(itens);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/ponto/apontamentos-dia]', err);
    return NextResponse.json({ error: 'Erro ao buscar apontamentos do dia' }, { status: 500 });
  }
}
