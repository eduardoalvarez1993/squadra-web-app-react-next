import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, clearSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { loginUpstream, getPermissoes } from '@/services/auth';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const LoginInputSchema = z.object({
  usuario: z.string().min(1),
  senha:   z.string().min(1),
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const parsed = LoginInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const { usuario, senha } = parsed.data;

  try {
    const upstream = await loginUpstream(usuario, senha);

    // API retornou sucesso:false com HTTP 200 — token vazio indica falha de autenticação
    if (!upstream.token) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
    }

    const permissoes = await getPermissoes(upstream.id, upstream.token).catch(() => ({
      perfilDP:          false,
      gerenteFuncional:  false,
      bateRep:           false,
      perfilCoordenador: false,
      perfilTI:          false,
      perfilMarketing:   false,
    }));

    const session = await getSession();

    session.token       = upstream.token;
    session.gestorId    = upstream.id;
    session.pessoaId    = upstream.pessoaId;
    session.sqhorasId   = upstream.sqhorasId ?? upstream.id;
    session.login       = upstream.login;
    session.nome        = upstream.nome;
    session.cargo       = upstream.cargo;
    // foto NÃO vai para o cookie — base64 excederia 4 KB
    // bateRep: /v1/pessoa é fonte primária (igual ao PHP), permissoes é fallback
    session.bateRep     = upstream.bateRepPessoa || permissoes.bateRep;
    session.permissoes  = permissoes;
    session.simulando   = false;
    session.podeSimular = upstream.id === 995;
    session.temEquipe   = undefined;

    await session.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Squadra retorna 400 (não 401) para credenciais inválidas
    if (err instanceof SquadraAuthError || err instanceof SquadraClientError) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
    }
    console.error('[POST /api/auth] erro inesperado:', err);
    return NextResponse.json({ error: 'Algo deu errado. Tente novamente.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  await clearSession(session);
  return NextResponse.json({ ok: true });
}
