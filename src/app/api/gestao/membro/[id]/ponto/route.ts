import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { getDadosColab } from '@/services/ponto';
import { squadra, SquadraAuthError, SquadraClientError, SquadraServerError } from '@/services/squadra-client';

const QuerySchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fim:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  login:  z.string().min(1).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.permissoes?.gerenteFuncional) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id: idParam } = await params;
  const memberId = Number(idParam);
  if (!memberId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    inicio: searchParams.get('inicio'),
    fim:    searchParams.get('fim'),
    login:  searchParams.get('login') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });

  // Tenta com o ID da URL; se 404 e login disponível, tenta resolver o sqhorasId pelo login
  const tryFetch = async (id: number) =>
    getDadosColab(id, parsed.data.inicio, parsed.data.fim, session.token);

  try {
    try {
      const data = await tryFetch(memberId);
      return NextResponse.json(data);
    } catch (firstErr) {
      if (
        firstErr instanceof SquadraClientError &&
        firstErr.status === 404 &&
        parsed.data.login
      ) {
        // Fallback: resolve o ID correto via login e tenta novamente
        const resolvedId = await squadra.gestao.resolveLogin(parsed.data.login, session.token);
        if (resolvedId && resolvedId !== memberId) {
          const data = await tryFetch(resolvedId);
          return NextResponse.json(data);
        }
      }
      throw firstErr;
    }
  } catch (err) {
    if (err instanceof SquadraAuthError)
      return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError)
      return NextResponse.json({ error: `Upstream ${err.status}: ${err.message.slice(0, 200)}` }, { status: err.status });
    if (err instanceof SquadraServerError)
      return NextResponse.json({ error: 'Erro no servidor Squadra' }, { status: 502 });
    console.error('[GET /api/gestao/membro/[id]/ponto]', err);
    return NextResponse.json({ error: 'Erro ao buscar ponto do colaborador' }, { status: 500 });
  }
}
