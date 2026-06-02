import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getDiasSemApontamento } from '@/services/ponto';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET() {
  const session = await getSession();
  if (!session.token)   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.bateRep) return NextResponse.json({ error: 'Sem permissão' },   { status: 403 });

  try {
    const data = await getDiasSemApontamento(session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/ponto/dias-sem-apontamento]', err);
    return NextResponse.json([], { status: 200 }); // falha silenciosa — seção simplesmente some
  }
}
