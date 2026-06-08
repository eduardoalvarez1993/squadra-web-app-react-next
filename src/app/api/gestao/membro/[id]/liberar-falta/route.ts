import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { liberarFaltaLivre } from '@/services/ponto';
import { getIdsSobGestao } from '@/services/gestao';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

// Liberação livre: remove a falta do dia direto (sem solicitação do colaborador).
// idUsuario NÃO vem do body — é o [id] da URL, validado contra a equipe do gestor.
const BodySchema = z.object({
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/), // DD/MM/YYYY
});

function mensagemErro(raw: string): string | null {
  try {
    const j = JSON.parse(raw) as { erros?: Array<{ mensagem?: string }>; mensagem?: string };
    return j.erros?.[0]?.mensagem ?? j.mensagem ?? null;
  } catch { return null; }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  const membroId = Number(id);
  if (!membroId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    // Object-level authz: só membros da própria equipe/pendências do gestor
    const idsSobGestao = await getIdsSobGestao(session.gestorId, session.token);
    if (!idsSobGestao.has(membroId)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    await liberarFaltaLivre(membroId, parsed.data.data, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) {
      return NextResponse.json({ error: mensagemErro(err.message) ?? 'Não foi possível liberar a falta' }, { status: 422 });
    }
    console.error('[POST /api/gestao/membro/[id]/liberar-falta]', err);
    return NextResponse.json({ error: 'Erro ao liberar falta' }, { status: 500 });
  }
}
