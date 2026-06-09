import { Shell } from '@/components/layout/Shell';
import { getSession } from '@/lib/session';
import type { SessionUser } from '@/store/user';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Hidrata o usuário direto da sessão (cookie) no servidor, para que o F5 não
  // bloqueie a UI esperando o /api/auth/me. A foto fica de fora (não cabe no
  // cookie) e é buscada depois pelo /me em background.
  const initialUser: SessionUser | null = session.token
    ? {
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
        temEquipe:   session.temEquipe   ?? false,
      }
    : null;

  return <Shell initialUser={initialUser}>{children}</Shell>;
}
