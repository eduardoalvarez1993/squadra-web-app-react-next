import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { comentar, getComentarios, deletarComentario } from '@/services/feed';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const PostSchema = z.object({
  postId: z.number().positive(),
  texto:  z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const postId = Number(new URL(req.url).searchParams.get('postId') ?? '0');
  if (!postId) return NextResponse.json({ error: 'postId obrigatório' }, { status: 400 });

  try {
    const data = await getComentarios(postId, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    // API retorna 4xx quando post não tem comentários — tratar como lista vazia
    if (err instanceof SquadraClientError) return NextResponse.json([]);
    console.error('[GET /api/feed/comentarios]', err);
    return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await comentar(parsed.data.postId, parsed.data.texto, session.pessoaId, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Comentário rejeitado' }, { status: 422 });
    console.error('[POST /api/feed/comentarios]', err);
    return NextResponse.json({ error: 'Erro ao comentar' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id') ?? '0');
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  const postId = Number(searchParams.get('postId') ?? '0');
  if (!postId) return NextResponse.json({ error: 'postId obrigatório' }, { status: 400 });

  // Verifica autoria buscando os comentários do post e conferindo idAutor
  let comentariosParaVerificar: Awaited<ReturnType<typeof getComentarios>>;
  try {
    comentariosParaVerificar = await getComentarios(postId, session.token);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[DELETE /api/feed/comentarios] Erro ao verificar autoria', err);
    return NextResponse.json({ error: 'Não foi possível verificar autoria' }, { status: 503 });
  }

  const comentario = comentariosParaVerificar.find((c) => c.id === id);
  if (!comentario) return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
  if (comentario.idAutor !== session.pessoaId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  try {
    await deletarComentario(id, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Operação rejeitada pela API' }, { status: 422 });
    console.error('[DELETE /api/feed/comentarios]', err);
    return NextResponse.json({ error: 'Erro ao deletar comentário' }, { status: 500 });
  }
}
