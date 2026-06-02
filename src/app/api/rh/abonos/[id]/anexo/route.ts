import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { downloadAbonoAnexo } from '@/services/rh';
import { SquadraAuthError } from '@/services/squadra-client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.perfilDP) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const data = await downloadAbonoAnexo(id, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/rh/abonos/[id]/anexo]', err);
    return NextResponse.json({ error: 'Erro ao buscar anexo' }, { status: 500 });
  }
}
