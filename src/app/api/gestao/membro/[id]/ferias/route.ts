import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { squadra } from '@/services/squadra-client';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  const membroId = Number(id);
  if (!membroId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const data = await squadra.ferias.getDados(membroId, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/gestao/membro/[id]/ferias]', err);
    return NextResponse.json({ error: 'Erro ao buscar férias' }, { status: 500 });
  }
}
