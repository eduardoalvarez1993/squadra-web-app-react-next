import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { marcarFalta } from '@/services/ponto';
import { SquadraAuthError } from '@/services/squadra-client';

const BodySchema = z.object({
  idUsuario: z.number().int().positive(),
  data:      z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/), // DD/MM/YYYY
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await marcarFalta(parsed.data.idUsuario, parsed.data.data, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[POST /api/gestao/membro/[id]/marcar-falta]', err);
    return NextResponse.json({ error: 'Erro ao marcar falta' }, { status: 500 });
  }
}
