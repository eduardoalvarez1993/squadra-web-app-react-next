import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { deletarApontamento } from '@/services/ponto';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';
import { extractUpstreamMsg } from '@/lib/upstream-error';

const Schema = z.object({
  id:   z.number(),
  tipo: z.string().min(1),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function DELETE(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token)   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.bateRep) return NextResponse.json({ error: 'Sem permissão' },   { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await deletarApontamento(parsed.data.id, parsed.data.tipo, session.pessoaId, parsed.data.data, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: extractUpstreamMsg(err.message, 'Não foi possível excluir o apontamento') }, { status: 422 });
    console.error('[DELETE /api/ponto/apontamento]', err);
    return NextResponse.json({ error: 'Erro ao excluir apontamento' }, { status: 500 });
  }
}
