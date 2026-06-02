import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { SquadraAuthError } from '@/services/squadra-client';
import { squadra } from '@/services/squadra-client';

// Payload salvo para restaurar sessão original
type OrigSession = {
  token:      string;
  gestorId:   number;
  pessoaId:   number;
  sqhorasId:  number;
  login:      string;
  nome:       string;
  cargo:      string;
  bateRep:    boolean;
  permissoes: Record<string, boolean>;
};

const IniciarSchema = z.object({ id: z.number().positive() });

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.podeSimular) return NextResponse.json({ error: 'Sem permissão para simular' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = IniciarSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  const { id } = parsed.data;
  if (id === session.gestorId) return NextResponse.json({ error: 'Não é possível simular a si mesmo' }, { status: 400 });

  try {
    // Buscar permissões do alvo
    const [permissoesResult] = await Promise.allSettled([
      squadra.auth.permissoes(id, session.token),
    ]);

    // Salvar sessão original (sem _sim_orig) para rollback
    const orig: OrigSession = {
      token:      session.token,
      gestorId:   session.gestorId,
      pessoaId:   session.pessoaId,
      sqhorasId:  session.sqhorasId,
      login:      session.login,
      nome:       session.nome,
      cargo:      session.cargo,
      bateRep:    session.bateRep,
      permissoes: { ...session.permissoes },
    };

    const permissoes = permissoesResult.status === 'fulfilled'
      ? permissoesResult.value
      : { gerenteFuncional: false, perfilDP: false, bateRep: false, perfilCoordenador: false, perfilTI: false, perfilMarketing: false };

    // Buscar sqhorasId do alvo via /v1/usuarios/{login}
    let sqhorasId = id;
    let nome      = String(id);
    let cargo     = '';

    // Tentar buscar pelo login do alvo
    try {
      const pessoaAlvo = await squadra.pessoas.getById(id, session.token);
      nome  = pessoaAlvo.nome  || nome;
      cargo = pessoaAlvo.cargo || cargo;
      if (pessoaAlvo.login) {
        const usuarios = await squadra.auth.usuarios(pessoaAlvo.login, session.token);
        sqhorasId = usuarios.sqhorasId || id;
      }
    } catch { /* prossegue com dados parciais */ }

    // Sobrescrever sessão com dados do alvo (foto omitida — não armazenada no cookie)
    session.gestorId   = id;
    session.pessoaId   = id;
    session.sqhorasId  = sqhorasId;
    session.nome       = nome;
    session.cargo      = cargo;
    session.bateRep    = permissoes.bateRep;
    session.permissoes = permissoes;
    session.simulando   = true;
    session.podeSimular = false;
    session.temEquipe   = undefined; // força recálculo no próximo /api/auth/me
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (session as any)._simOrig = orig;

    await session.save();

    return NextResponse.json({ ok: true, nome });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[POST /api/auth/simulate]', err);
    return NextResponse.json({ error: 'Erro ao iniciar simulação' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.simulando) return NextResponse.json({ error: 'Não está simulando' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orig = (session as any)._simOrig as OrigSession | undefined;
  if (!orig) return NextResponse.json({ error: 'Sessão original não encontrada' }, { status: 500 });

  // Restaurar sessão original
  session.token      = orig.token;
  session.gestorId   = orig.gestorId;
  session.pessoaId   = orig.pessoaId;
  session.sqhorasId  = orig.sqhorasId;
  session.login      = orig.login;
  session.nome       = orig.nome;
  session.cargo      = orig.cargo;
  session.bateRep    = orig.bateRep;
  session.permissoes = orig.permissoes as typeof session.permissoes;
  session.simulando  = false;
  session.podeSimular = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (session as any)._simOrig;

  await session.save();

  return NextResponse.json({ ok: true });
}
