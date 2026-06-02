'use client';

import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

type Alocacao = {
  id:          number;
  nome:        string;
  cliente:     string;
  subProjetos: Array<{ id: number; nome: string }>;
};

function fmtDate(s: string | null | undefined): string {
  if (!s) return '';
  const part = s.split('T')[0];
  const [y, m, d] = part.split('-');
  return y && m && d ? `${d}/${m}/${y}` : s;
}

export function AlocacoesTab() {
  const { data, isLoading, isError } = useQuery<Alocacao[]>({
    queryKey: ['perfil', 'alocacoes'],
    queryFn:  async () => {
      const res = await fetch('/api/perfil/alocacoes');
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height="72px" width="100%" borderRadius="12px" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 text-sm text-muted-foreground text-center">
        Não foi possível carregar as alocações.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="Nenhuma alocação ativa no momento" />;
  }

  return (
    <ul className="flex flex-col gap-3 py-2">
      {data.map((a) => (
        <li key={a.id} className="bg-white border border-border rounded-xl px-4 py-3">
          {/* Cliente */}
          {a.cliente && (
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">
              {a.cliente}
            </p>
          )}

          {/* Projeto */}
          <p className="text-sm font-semibold text-foreground">{a.nome || '—'}</p>

          {/* Subprojetos */}
          {a.subProjetos?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {a.subProjetos.map((s) => s.nome).join(', ')}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
