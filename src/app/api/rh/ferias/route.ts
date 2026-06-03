import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getRHFerias } from '@/services/rh';
import { temAcessoDP } from '@/lib/dp-access';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET() {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!temAcessoDP(session.permissoes?.perfilDP, session.cargo)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  try {
    const data = await getRHFerias(session.gestorId, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/rh/ferias]', err);
    return NextResponse.json({ error: 'Erro ao buscar férias pendentes' }, { status: 500 });
  }
}
