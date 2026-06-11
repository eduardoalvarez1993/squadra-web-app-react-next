import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { squadra } from '@/services/squadra-client';

export async function GET() {
  const session = await getSession();

  if (!session.token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // foto não fica no cookie (excede 4 KB) — busca do upstream a cada boot do app
  // staleTime: Infinity no TanStack Query = só 1 chamada por sessão de browser
  // Durante simulação usa getById(pessoaId) para buscar a foto do simulado, não do gestor
  let foto: string | null = null;
  try {
    if (session.simulando && session.pessoaId) {
      const pessoaData = await squadra.perfil.getById(session.pessoaId, session.token);
      foto = (pessoaData as Record<string, unknown>)['foto'] as string | null ?? null;
    } else {
      const pessoa = await squadra.auth.pessoa(session.token);
      foto = pessoa.foto;
    }
  } catch { /* foto fica null — AvatarGradient usa iniciais */ }

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
  });
}
