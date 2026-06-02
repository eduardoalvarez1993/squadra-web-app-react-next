import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { fechar } from '@/services/percentual';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const Schema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2020),
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'mes e ano obrigatórios' }, { status: 400 });

  try {
    await fechar(session.gestorId, parsed.data.mes, parsed.data.ano, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Fechamento rejeitado pela API' }, { status: 422 });
    console.error('[POST /api/percentual/fechar]', err);
    return NextResponse.json({ error: 'Erro ao fechar mês' }, { status: 500 });
  }
}
