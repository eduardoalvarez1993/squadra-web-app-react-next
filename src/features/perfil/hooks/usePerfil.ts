'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PerfilData } from '@/services/squadra-client';

export function usePerfil() {
  const qc = useQueryClient();

  const perfilQuery = useQuery<PerfilData>({
    queryKey: ['perfil'],
    queryFn:  async () => {
      const res = await fetch('/api/perfil');
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const atualizarMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/perfil', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao atualizar perfil');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perfil'] });
    },
  });

  return {
    perfil:       perfilQuery.data,
    isLoading:    perfilQuery.isLoading,
    isError:      perfilQuery.isError,
    refetch:      () => perfilQuery.refetch(),
    atualizar:    (data: Record<string, unknown>) => atualizarMutation.mutateAsync(data),
    isAtualizando: atualizarMutation.isPending,
    atualizarError: atualizarMutation.error?.message ?? null,
  };
}
