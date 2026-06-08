import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { aprovarSolicitacao } from '@/services/gestao';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

// Extrai a mensagem real do corpo de erro da API Squadra ({ erros: [{ mensagem }] }).
function mensagemErro(raw: string): string | null {
  try {
    const j = JSON.parse(raw) as { erros?: Array<{ mensagem?: string }>; mensagem?: string };
    return j.erros?.[0]?.mensagem ?? j.mensagem ?? null;
  } catch { return null; }
}

const AprovarSchema = z.object({
  id:               z.number(),
  idFalta:          z.number().optional(),
  tipo:             z.enum(['hora_extra', 'apropriacao', 'ferias', 'abono']),
  acao:             z.enum(['A', 'R']),
  tipoAprovacao:    z.string().optional(),
  observacaoGestor: z.string().optional(),
  projeto:          z.number().optional(),
  justificativa:    z.string().optional(),
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = AprovarSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await aprovarSolicitacao(parsed.data.tipo, parsed.data, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) {
      return NextResponse.json({ error: mensagemErro(err.message) ?? 'Aprovação rejeitada pela API' }, { status: 422 });
    }
    console.error('[POST /api/gestao/aprovar]', err);
    return NextResponse.json({ error: 'Erro ao processar aprovação' }, { status: 500 });
  }
}
