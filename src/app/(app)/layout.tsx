import { Shell } from '@/components/layout/Shell';
import { getSession } from '@/lib/session';
import { getEquipe } from '@/services/gestao';
import type { SessionUser } from '@/store/user';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let initialUser: SessionUser | null = null;

  if (session.token) {
    // temEquipe fica indefinido logo após o login e ao iniciar simulação (a rota
    // de simulate zera para forçar recálculo). Se hidratássemos como `false`, o
    // menu mostraria Ponto e só trocaria para Percentual quando o /me voltasse —
    // o flicker "Ponto aparece e some". Computamos aqui no servidor para o 1º
    // paint já vir correto. Após o /me salvar na sessão, este galho não roda mais.
    let temEquipe = session.temEquipe ?? false;
    if (session.temEquipe === undefined && session.permissoes?.gerenteFuncional) {
      try {
        const equipe = await getEquipe(session.gestorId, session.token);
        temEquipe = equipe.length > 0;
      } catch {
        temEquipe = false;
      }
    }

    // Hidrata o usuário direto da sessão (cookie) no servidor, para que o F5 não
    // bloqueie a UI esperando o /api/auth/me. A foto fica de fora (não cabe no
    // cookie) e é buscada depois pelo /me em background.
    initialUser = {
      gestorId:  session.gestorId  ?? 0,
      pessoaId:  session.pessoaId  ?? 0,
      sqhorasId: session.sqhorasId ?? 0,
      login:     session.login     ?? '',
      nome:      session.nome      ?? '',
      cargo:     session.cargo     ?? '',
      foto:      null, // lazy — preenchida pelo /me
      permissoes: {
        gerenteFuncional:  session.permissoes?.gerenteFuncional  ?? false,
        perfilDP:          session.permissoes?.perfilDP          ?? false,
        bateRep:           session.bateRep                       ?? false,
        perfilCoordenador: session.permissoes?.perfilCoordenador ?? false,
        perfilTI:          session.permissoes?.perfilTI          ?? false,
        perfilMarketing:   session.permissoes?.perfilMarketing   ?? false,
      },
      simulando:   session.simulando   ?? false,
      podeSimular: session.podeSimular ?? false,
      temEquipe,
    };
  }

  return <Shell initialUser={initialUser}>{children}</Shell>;
}
