import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getHoleriteAno } from '@/services/holerite';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const ano = Number(new URL(req.url).searchParams.get('ano')) || new Date().getFullYear();

  try {
    const data = await getHoleriteAno(ano, session.token);
    console.info(`[audit] holerite visualizado — user=${session.login} ano=${ano}`);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/holerite]', err);
    return NextResponse.json({ error: 'Erro ao buscar holerite' }, { status: 500 });
  }
}
