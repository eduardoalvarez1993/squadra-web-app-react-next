import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { buscarProjetosHml } from '@/services/gestao';
import { SquadraAuthError } from '@/services/squadra-client';

// Busca de projetos em HML — exclusiva da aba Gestão de Projeto.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const q = new URL(req.url).searchParams.get('q') ?? '';
  if (q.length < 3) return NextResponse.json({ error: 'Mínimo 3 caracteres' }, { status: 400 });

  try {
    const data = await buscarProjetosHml(q, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/gestao/projetos-busca]', err);
    return NextResponse.json({ error: 'Erro ao buscar projetos' }, { status: 500 });
  }
}
