import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { criarPost, deletarPost, getPosts } from '@/services/feed';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const Schema = z.object({
  texto:          z.string().min(1).max(1000),
  tipoPublicacao: z.enum(['C', 'D', 'I', 'K']).default('C'),
  destinatarioId: z.number().int().positive().optional(),
});

export async function DELETE(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postId = Number(searchParams.get('postId') ?? '0');
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: 'postId inválido' }, { status: 400 });
  }

  // O `remetenteID` enviado pelo cliente não é confiável. Confirma o dono REAL
  // buscando o post nos mais recentes (não há endpoint getById). Posts antigos
  // fora dessa janela dependem da validação de propriedade no upstream.
  try {
    const recentes = await getPosts(1, session.token);
    const post = recentes.find((p) => p.idPost === postId);
    if (post && post.remetenteID !== session.pessoaId) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
  } catch { /* não encontrado nos recentes — segue; upstream valida o dono */ }

  try {
    await deletarPost(postId, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Operação rejeitada pela API' }, { status: 422 });
    console.error('[DELETE /api/feed/posts]', err);
    return NextResponse.json({ error: 'Erro ao deletar post' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  const { texto, tipoPublicacao, destinatarioId } = parsed.data;

  // Kudos exige destinatário
  if (tipoPublicacao === 'K' && !destinatarioId) {
    return NextResponse.json({ error: 'Kudos exige destinatário' }, { status: 400 });
  }

  try {
    await criarPost({
      pessoaId:       session.pessoaId,
      destinatarioId: destinatarioId ?? session.pessoaId,
      tipoPublicacao,
      texto,
    }, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Post rejeitado pela API' }, { status: 422 });
    console.error('[POST /api/feed/posts]', err);
    return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 });
  }
}
