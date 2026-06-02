import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { addLike, removeLike } from '@/services/feed';
import { SquadraAuthError } from '@/services/squadra-client';

const Schema = z.object({ postId: z.number() });

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'postId obrigatório' }, { status: 400 });

  try {
    await addLike(parsed.data.postId, session.gestorId, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[POST /api/feed/like]', err);
    return NextResponse.json({ error: 'Erro ao curtir' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const postId = Number(new URL(req.url).searchParams.get('postId') ?? '0');
  if (!postId) return NextResponse.json({ error: 'postId obrigatório' }, { status: 400 });

  try {
    await removeLike(postId, session.gestorId, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[DELETE /api/feed/like]', err);
    return NextResponse.json({ error: 'Erro ao remover curtida' }, { status: 500 });
  }
}
