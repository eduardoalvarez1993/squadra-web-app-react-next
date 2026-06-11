import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { solicitarLiberacaoFalta } from '@/services/ponto';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';
import { isPeriodoFechado } from '@/lib/periodo-fechado';

const LiberacaoSchema = z.object({
  idFalta: z.number(),
  // Opcional: enviado pelo front p/ reforçar o bloqueio de mês fechado no servidor.
  data:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token)   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.bateRep) return NextResponse.json({ error: 'Sem permissão' },   { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = LiberacaoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'idFalta obrigatório' }, { status: 400 });

  // Mês fechado (12:00 BRT do dia 1º do mês seguinte): solicitação bloqueada.
  if (parsed.data.data && isPeriodoFechado(parsed.data.data)) {
    return NextResponse.json({ error: 'Período fechado — mês já computado.' }, { status: 422 });
  }

  try {
    await solicitarLiberacaoFalta(parsed.data.idFalta, session.sqhorasId, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Solicitação rejeitada' }, { status: 422 });
    console.error('[POST /api/ponto/liberacao]', err);
    return NextResponse.json({ error: 'Erro ao solicitar liberação' }, { status: 500 });
  }
}
