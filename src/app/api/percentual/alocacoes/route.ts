import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAlocacoesParaDistribuir } from '@/services/percentual';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mes = Number(searchParams.get('mes'));
  const ano = Number(searchParams.get('ano'));
  if (!mes || !ano) return NextResponse.json({ error: 'mes e ano obrigatórios' }, { status: 400 });

  try {
    const data = await getAlocacoesParaDistribuir(session.gestorId, mes, ano, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/percentual/alocacoes]', err);
    return NextResponse.json({ error: 'Erro ao buscar alocações' }, { status: 500 });
  }
}
