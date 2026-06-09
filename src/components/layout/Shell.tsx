'use client';

import { useEffect, useRef } from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useUserStore, type SessionUser } from '@/store/user';
import { getQueryClient } from '@/lib/query-client';
import { redirectToLogin } from '@/lib/auth-redirect';
import { getFotoCache, setFotoCache } from '@/lib/foto-cache';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { SimulandoBanner } from '@/components/shared/SimulandoBanner';
import { FluenciaModal } from '@/components/shared/FluenciaModal';

interface MeResponse {
  ok: boolean;
  id: number;
  pessoaId: number;
  sqhorasId: number;
  login: string;
  nome: string;
  cargo: string;
  foto: string | null;
  permissoes: {
    gerenteFuncional:  boolean;
    perfilDP:          boolean;
    bateRep:           boolean;
    perfilCoordenador: boolean;
    perfilTI:          boolean;
    perfilMarketing:   boolean;
  };
  bateRep:     boolean;
  simulando:   boolean;
  podeSimular: boolean;
  temEquipe:   boolean;
}

function AppContent({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: SessionUser | null;
}) {
  const setUser      = useUserStore((s) => s.setUser);
  const clearUser    = useUserStore((s) => s.clearUser);
  const simulando    = useUserStore((s) => s.simulando);
  const fluenciaOpen = useUserStore((s) => s.fluenciaOpen);
  const setFluencia  = useUserStore((s) => s.setFluencia);

  // Hidrata o store a partir da sessão do servidor já no primeiro render do
  // cliente — UI aparece sem esperar o /me. A foto vem do cache de sessão
  // (sessionStorage, por pessoaId) quando existe, então nem o avatar pisca no
  // F5; senão fica null (iniciais) até o /me. Guardado por ref + window para
  // não vazar entre requests no SSR (store é singleton de módulo).
  const hydratedRef = useRef(false);
  if (typeof window !== 'undefined' && !hydratedRef.current && initialUser) {
    setUser({ ...initialUser, foto: getFotoCache(initialUser.pessoaId) });
    hydratedRef.current = true;
  }

  const { data, error } = useQuery<MeResponse>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        clearUser();
        redirectToLogin();
        throw new Error('401');
      }
      return res.json();
    },
    // refetch em background ao montar (busca a foto), mas sem bloquear a UI:
    // o store já foi hidratado pela sessão acima.
    staleTime: Infinity,
    refetchOnMount: 'always',
    retry: false,
  });

  useEffect(() => {
    if (data?.ok) {
      setUser({
        gestorId:    data.id,
        pessoaId:    data.pessoaId,
        sqhorasId:   data.sqhorasId,
        login:       data.login,
        nome:        data.nome,
        cargo:       data.cargo,
        foto:        data.foto,
        permissoes:  data.permissoes,
        simulando:   data.simulando,
        podeSimular: data.podeSimular,
        temEquipe:   data.temEquipe,
      });
      // Revalida o cache de sessão para o pessoaId atual (cobre simulação:
      // a chave muda junto com o pessoaId do simulado).
      setFotoCache(data.pessoaId, data.foto);
    }
  }, [data, setUser]);

  // 401 já dispara redirectToLogin no queryFn. Só apaga a tela se não houver
  // sessão hidratada do servidor — assim um erro transitório do /me (ex.: foto)
  // não derruba a UInteira de quem está logado.
  if (error && !initialUser) return null;

  return (
    <div className={`flex min-h-dvh${simulando ? ' is-simulating' : ''}`}>
      {/* Sidebar — coluna própria full-height, só desktop */}
      <Sidebar />

      {/* Coluna de conteúdo */}
      <div className="flex flex-col flex-1 min-w-0">
        <SimulandoBanner />
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-[#f5f7fa]">
          {children}
        </main>
        <BottomNav />
      </div>

      <FluenciaModal open={fluenciaOpen} onClose={() => setFluencia(false)} />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export function Shell({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: SessionUser | null;
}) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent initialUser={initialUser}>{children}</AppContent>
    </QueryClientProvider>
  );
}
