import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { getDadosColab, novoApontamento } from '@/services/ponto';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const DateRangeSchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fim:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const NovoApontamentoClientSchema = z.object({
  data:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio:      z.string().regex(/^\d{2}:\d{2}$/),
  horaFinal:       z.string().regex(/^\d{2}:\d{2}$/),
  projetoId:       z.number(),
  subprojetoId:    z.number().optional(),
  tipoApropriacao: z.literal('JORNADA'),
  justificativa:   z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token)   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.bateRep) return NextResponse.json({ error: 'Sem permissão' },   { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = DateRangeSchema.safeParse({
    inicio: searchParams.get('inicio'),
    fim:    searchParams.get('fim'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'inicio e fim obrigatórios (YYYY-MM-DD)' }, { status: 400 });
  }

  const sqhorasIdParam = searchParams.get('sqhorasId');
  if (sqhorasIdParam && Number(sqhorasIdParam) !== session.sqhorasId) {
    if (!session.permissoes?.gerenteFuncional) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
  }
  const sqhorasId = sqhorasIdParam ? Number(sqhorasIdParam) : session.sqhorasId;

  try {
    const data = await getDadosColab(sqhorasId, parsed.data.inicio, parsed.data.fim, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/ponto]', detail);

    // Código 8 = Usuário não encontrado no SQHoras (conta inativa ou inexistente)
    try {
      const parsed = JSON.parse(detail);
      const codigo = parsed?.erros?.[0]?.codigo;
      if (codigo === 8) {
        return NextResponse.json({ error: 'sqhoras_not_found' }, { status: 404 });
      }
    } catch { /* não é JSON, segue para erro genérico */ }

    return NextResponse.json({ error: 'Erro ao buscar dados de ponto' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token)   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.bateRep) return NextResponse.json({ error: 'Sem permissão' },   { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = NovoApontamentoClientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await novoApontamento({ ...parsed.data, usuarioId: session.pessoaId, login: session.login }, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Apontamento rejeitado pela API' }, { status: 422 });
    console.error('[POST /api/ponto]', err);
    return NextResponse.json({ error: 'Erro ao registrar apontamento' }, { status: 500 });
  }
}
