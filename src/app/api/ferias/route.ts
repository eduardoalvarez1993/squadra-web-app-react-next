import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { getFeriasDados, solicitarFerias } from '@/services/ferias';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const SolicitarInputSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataFim:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET() {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const data = await getFeriasDados(session.gestorId, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/ferias]', err);
    return NextResponse.json({ error: 'Erro ao buscar dados de férias' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = SolicitarInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await solicitarFerias(session.gestorId, parsed.data.dataInicio, parsed.data.dataFim, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Solicitação rejeitada pela API' }, { status: 422 });
    console.error('[POST /api/ferias]', err);
    return NextResponse.json({ error: 'Erro ao solicitar férias' }, { status: 500 });
  }
}
