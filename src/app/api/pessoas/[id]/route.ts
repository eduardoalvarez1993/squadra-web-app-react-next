import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPessoaById } from '@/services/pessoas';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const pessoaId = Number(id);
  if (!pessoaId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const data = await getPessoaById(pessoaId, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/pessoas/[id]]', err);
    return NextResponse.json({ error: 'Erro ao buscar colaborador' }, { status: 500 });
  }
}
