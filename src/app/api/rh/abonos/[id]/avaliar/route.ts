import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { avaliarAbono } from '@/services/rh';
import { temAcessoDP } from '@/lib/dp-access';
import { SquadraAuthError } from '@/services/squadra-client';

const InputSchema = z.object({
  acao:          z.enum(['A', 'R']),
  justificativa: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!temAcessoDP(session.permissoes?.perfilDP, session.cargo)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id: idParam } = await params;
  if (!/^\d+$/.test(idParam)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await avaliarAbono({ idUnico: idParam, acao: parsed.data.acao, justificativa: parsed.data.justificativa ?? '' }, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[POST /api/rh/abonos/[id]/avaliar]', err);
    return NextResponse.json({ error: 'Erro ao avaliar abono' }, { status: 500 });
  }
}
