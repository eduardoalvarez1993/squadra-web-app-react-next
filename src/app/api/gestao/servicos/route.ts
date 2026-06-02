import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServicos } from '@/services/gestao';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET() {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  try {
    const data = await getServicos(session.gestorId, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/gestao/servicos]', err);
    return NextResponse.json({ error: 'Erro ao buscar serviços' }, { status: 500 });
  }
}
