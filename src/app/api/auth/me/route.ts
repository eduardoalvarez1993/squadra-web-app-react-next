import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { squadra } from '@/services/squadra-client';
import { getEquipe } from '@/services/gestao';

export async function GET() {
  const session = await getSession();

  if (!session.token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // foto não fica no cookie (excede 4 KB) — busca do upstream a cada boot do app
  // staleTime: Infinity no TanStack Query = só 1 chamada por sessão de browser
  let foto: string | null = null;
  try {
    const pessoa = await squadra.auth.pessoa(session.token);
    foto = pessoa.foto;
  } catch { /* foto fica null — AvatarGradient usa iniciais */ }

  // temEquipe: cached in session — populated lazily on first call when gerenteFuncional
  let temEquipe = session.temEquipe ?? false;
  if (session.temEquipe === undefined && session.permissoes?.gerenteFuncional) {
    try {
      const equipe = await getEquipe(session.gestorId!, session.token);
      temEquipe = equipe.length > 0;
      session.temEquipe = temEquipe;
      await session.save();
    } catch {
      temEquipe = false;
    }
  }

  return NextResponse.json({
    ok:         true,
    id:         session.gestorId,
    pessoaId:   session.pessoaId,
    sqhorasId:  session.sqhorasId,
    login:      session.login,
    nome:       session.nome,
    cargo:      session.cargo,
    foto,
    permissoes: {
      perfilDP:          session.permissoes?.perfilDP          ?? false,
      gerenteFuncional:  session.permissoes?.gerenteFuncional  ?? false,
      bateRep:           session.bateRep                       ?? false,
      perfilCoordenador: session.permissoes?.perfilCoordenador ?? false,
      perfilTI:          session.permissoes?.perfilTI          ?? false,
      perfilMarketing:   session.permissoes?.perfilMarketing   ?? false,
    },
    bateRep:     session.bateRep     ?? false,
    simulando:   session.simulando   ?? false,
    podeSimular: session.podeSimular ?? false,
    temEquipe,
  });
}
