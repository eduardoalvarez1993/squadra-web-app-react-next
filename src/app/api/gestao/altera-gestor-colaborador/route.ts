import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { alteraGestorColaborador } from '@/services/gestao';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const Schema = z.object({
  coordId: z.number().int().positive(),
  recId:   z.number().int().positive(),
});

// Extrai a mensagem do envelope de erro da API ({ erros: [{ mensagem }] }).
function mensagemErro(raw: string): string | null {
  try {
    const j = JSON.parse(raw) as { erros?: Array<{ mensagem?: string }> };
    return j.erros?.[0]?.mensagem ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await alteraGestorColaborador(parsed.data.coordId, parsed.data.recId, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: mensagemErro(err.message) ?? 'Não foi possível alterar o gestor' }, { status: 422 });
    console.error('[POST /api/gestao/altera-gestor-colaborador]', err);
    return NextResponse.json({ error: 'Erro ao alterar gestor' }, { status: 500 });
  }
}
