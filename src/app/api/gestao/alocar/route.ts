import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { alocarColaborador } from '@/services/gestao';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const AlocarSchema = z.object({
  colaboradorId: z.number(),
  projetoId:     z.number(),
  subProjetoId:  z.number(),
  papelId:       z.number(),
  dataInicio:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataFim:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = AlocarSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await alocarColaborador({ ...parsed.data, gestorId: session.gestorId }, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Alocação rejeitada pela API' }, { status: 422 });
    console.error('[POST /api/gestao/alocar]', err);
    return NextResponse.json({ error: 'Erro ao criar alocação' }, { status: 500 });
  }
}
