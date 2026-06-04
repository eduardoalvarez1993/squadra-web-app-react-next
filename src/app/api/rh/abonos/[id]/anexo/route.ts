import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { downloadAbonoAnexo } from '@/services/rh';
import { temAcessoDP } from '@/lib/dp-access';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!temAcessoDP(session.permissoes?.perfilDP, session.cargo)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const rawStatus = req.nextUrl.searchParams.get('status') ?? 'P';
  const status = (['P', 'A', 'R'] as const).includes(rawStatus as 'P' | 'A' | 'R')
    ? (rawStatus as 'P' | 'A' | 'R')
    : 'P';

  try {
    const data = await downloadAbonoAnexo(id, status, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/rh/abonos/[id]/anexo]', err);
    return NextResponse.json({ error: 'Erro ao buscar anexo' }, { status: 500 });
  }
}
