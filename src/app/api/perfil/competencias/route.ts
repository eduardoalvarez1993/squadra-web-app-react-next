import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { salvarCompetencias } from '@/services/perfil';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const SkillListSchema = z.record(z.string(), z.array(z.string()));

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.pessoaId) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = SkillListSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });

  try {
    await salvarCompetencias(session.pessoaId, parsed.data, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: err.message.slice(0, 200) }, { status: err.status });
    console.error('[PUT /api/perfil/competencias]', err);
    return NextResponse.json({ error: 'Erro ao salvar competências' }, { status: 500 });
  }
}
