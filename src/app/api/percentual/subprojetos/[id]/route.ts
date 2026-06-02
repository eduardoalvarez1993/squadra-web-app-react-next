import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSubprojetos } from '@/services/percentual';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  try {
    const data = await getSubprojetos(id, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/percentual/subprojetos/[id]]', err);
    return NextResponse.json({ error: 'Erro ao buscar subprojetos' }, { status: 500 });
  }
}
