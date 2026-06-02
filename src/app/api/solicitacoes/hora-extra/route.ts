import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { solicitarHoraExtra } from '@/services/solicitacoes';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const Schema = z.object({
  projetoId:  z.number(),
  data:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFim:    z.string().regex(/^\d{2}:\d{2}$/),
  tipo:       z.string(),
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await solicitarHoraExtra({ ...parsed.data, pessoaId: session.pessoaId }, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Solicitação rejeitada pela API' }, { status: 422 });
    console.error('[POST /api/solicitacoes/hora-extra]', err);
    return NextResponse.json({ error: 'Erro ao solicitar hora extra' }, { status: 500 });
  }
}
