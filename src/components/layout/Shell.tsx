'use client';

import { useEffect } from 'react';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useUserStore } from '@/store/user';
import { getQueryClient } from '@/lib/query-client';
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

function AppContent({ children }: { children: React.ReactNode }) {
  const setUser      = useUserStore((s) => s.setUser);
  const clearUser    = useUserStore((s) => s.clearUser);
  const simulando    = useUserStore((s) => s.simulando);
  const fluenciaOpen = useUserStore((s) => s.fluenciaOpen);
  const setFluencia  = useUserStore((s) => s.setFluencia);

  const { data, error } = useQuery<MeResponse>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (res.status === 401) {
        clearUser();
        window.location.href = '/login';
        throw new Error('401');
      }
      return res.json();
    },
    staleTime: Infinity,
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
    }
  }, [data, setUser]);

  if (error) return null;

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

export function Shell({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent>{children}</AppContent>
    </QueryClientProvider>
  );
}
