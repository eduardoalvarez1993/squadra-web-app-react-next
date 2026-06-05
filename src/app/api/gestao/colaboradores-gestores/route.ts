import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { listarColaboradoresComGestor } from '@/services/gestao';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET() {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  try {
    const data = await listarColaboradoresComGestor(session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[GET /api/gestao/colaboradores-gestores]', detail);
    // Em dev, devolve a causa real para diagnóstico (em prod fica genérico).
    return NextResponse.json(
      process.env.NODE_ENV !== 'production'
        ? { error: 'Erro ao listar colaboradores', detail }
        : { error: 'Erro ao listar colaboradores' },
      { status: 500 },
    );
  }
}
