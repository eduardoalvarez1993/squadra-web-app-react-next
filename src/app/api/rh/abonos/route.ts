import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getRHAbonos } from '@/services/rh';
import { temAcessoDP } from '@/lib/dp-access';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!temAcessoDP(session.permissoes?.perfilDP, session.cargo)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const rawStatus = req.nextUrl.searchParams.get('status') ?? 'P';
  const status = (['P', 'A', 'R'] as const).includes(rawStatus as 'P' | 'A' | 'R')
    ? (rawStatus as 'P' | 'A' | 'R')
    : 'P';

  try {
    const data = await getRHAbonos(status, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/rh/abonos]', err);
    return NextResponse.json({ error: 'Erro ao buscar abonos' }, { status: 500 });
  }
}
