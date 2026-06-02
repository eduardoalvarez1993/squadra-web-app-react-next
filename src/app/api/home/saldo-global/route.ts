import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSaldoGlobal } from '@/services/home';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET() {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional)
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  try {
    const data = await getSaldoGlobal(session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/home/saldo-global]', err);
    return NextResponse.json({ error: 'Erro ao buscar saldo global' }, { status: 500 });
  }
}
