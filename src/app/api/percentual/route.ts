import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { getDados, lancar } from '@/services/percentual';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const LancarSchema = z.object({
  subProjetoId: z.number(),
  mes:          z.number().int().min(1).max(12),
  ano:          z.number().int().min(2020),
  horas:        z.number().min(0),
  percentual:   z.number().min(0).max(100),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mes = Number(searchParams.get('mes'));
  const ano = Number(searchParams.get('ano'));
  if (!mes || !ano) return NextResponse.json({ error: 'mes e ano obrigatórios' }, { status: 400 });

  try {
    const data = await getDados(session.gestorId, mes, ano, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/percentual]', err);
    return NextResponse.json({ error: 'Erro ao buscar percentual' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = LancarSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await lancar({ ...parsed.data, gestorId: session.gestorId }, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Lançamento rejeitado pela API' }, { status: 422 });
    console.error('[POST /api/percentual]', err);
    return NextResponse.json({ error: 'Erro ao lançar percentual' }, { status: 500 });
  }
}
