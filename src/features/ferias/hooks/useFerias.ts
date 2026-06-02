'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeriasDados, FeriasHistoricoItem } from '@/services/squadra-client';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function useFerias() {
  const qc = useQueryClient();

  const dadosQuery = useQuery<FeriasDados>({
    queryKey: ['ferias', 'dados'],
    queryFn:  () => fetchJson('/api/ferias'),
    staleTime: 5 * 60 * 1000,
  });

  const historicoQuery = useQuery<FeriasHistoricoItem[]>({
    queryKey: ['ferias', 'historico'],
    queryFn:  () => fetchJson('/api/ferias/historico'),
    staleTime: 5 * 60 * 1000,
  });

  const solicitarMutation = useMutation({
    mutationFn: async ({ dataInicio, dataFim }: { dataInicio: string; dataFim: string }) => {
      const res = await fetch('/api/ferias', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ dataInicio, dataFim }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao solicitar férias');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ferias'] });
    },
  });

  return {
    saldo:         dadosQuery.data,
    historico:     historicoQuery.data ?? [],
    isLoading:     dadosQuery.isLoading,
    isError:       dadosQuery.isError,
    solicitar:     (dataInicio: string, dataFim: string) => solicitarMutation.mutateAsync({ dataInicio, dataFim }),
    isSolicitando: solicitarMutation.isPending,
    solicitarError: solicitarMutation.error?.message ?? null,
  };
}
