'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PercentualData, PercentualItem, ProjetoBuscaItem, SubprojetoPercentual } from '@/services/percentual';

export type { PercentualData, PercentualItem, ProjetoBuscaItem, SubprojetoPercentual };

export type LancarInput = {
  subProjetoId: number;
  mes:          number;
  ano:          number;
  horas:        number;
  percentual:   number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function usePercentual(mes: number, ano: number) {
  const qc = useQueryClient();

  const dadosQuery = useQuery<PercentualData>({
    queryKey: ['percentual', { mes, ano }],
    queryFn:  () => fetchJson(`/api/percentual?mes=${mes}&ano=${ano}`),
    staleTime: 2 * 60 * 1000,
  });

  const lancarMutation = useMutation({
    mutationFn: async (input: LancarInput) => {
      const res = await fetch('/api/percentual', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao lançar');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['percentual', { mes, ano }] }),
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await fetch(`/api/percentual/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao deletar');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['percentual', { mes, ano }] }),
  });

  const fecharMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/percentual/fechar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mes, ano }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao fechar');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['percentual', { mes, ano }] }),
  });

  return {
    dados:      dadosQuery.data ?? null,
    isLoading:  dadosQuery.isLoading,
    isError:    dadosQuery.isError,
    refetch:    dadosQuery.refetch,
    lancar:     (input: LancarInput) => lancarMutation.mutateAsync(input),
    isLancando: lancarMutation.isPending,
    lancarError: lancarMutation.error?.message ?? null,
    deletar:    (id: string | number) => deletarMutation.mutateAsync(id),
    isDeletando: deletarMutation.isPending,
    fechar:     () => fecharMutation.mutateAsync(),
    isFechando: fecharMutation.isPending,
    fecharError: fecharMutation.error?.message ?? null,
  };
}

export function useProjetosBusca(q: string) {
  return useQuery<ProjetoBuscaItem[]>({
    queryKey: ['percentual', 'projetos', q],
    queryFn:  () => fetchJson(`/api/percentual/projetos?q=${encodeURIComponent(q)}`),
    enabled:  q.length >= 3,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSubprojetos(projetoId: string | number | null) {
  return useQuery<SubprojetoPercentual[]>({
    queryKey: ['percentual', 'subprojetos', projetoId],
    queryFn:  () => fetchJson(`/api/percentual/subprojetos/${projetoId}`),
    enabled:  !!projetoId,
    staleTime: 5 * 60 * 1000,
  });
}
