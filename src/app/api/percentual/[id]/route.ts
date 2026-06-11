import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { deletar } from '@/services/percentual';
import { podeAlterarMes } from '@/features/percentual/regras';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  // Janela de alteração baseada no mês da alocação (mês corrente, ou até o dia 6 do
  // mês seguinte). Sem mes/ano não dá pra validar → segue (o front já bloqueia).
  const { searchParams } = new URL(req.url);
  const mes = Number(searchParams.get('mes'));
  const ano = Number(searchParams.get('ano'));
  if (mes && ano && !podeAlterarMes(mes, ano)) {
    return NextResponse.json({ error: 'Prazo encerrado para alteração por percentual' }, { status: 403 });
  }

  try {
    await deletar(id, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Deleção rejeitada pela API' }, { status: 422 });
    console.error('[DELETE /api/percentual/[id]]', err);
    return NextResponse.json({ error: 'Erro ao deletar alocação' }, { status: 500 });
  }
}
