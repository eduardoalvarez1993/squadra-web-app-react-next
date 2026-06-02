'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AbonoRH, FeriasRHItem } from '@/services/squadra-client';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Erro na operação');
  }
}

export function useRH() {
  const qc = useQueryClient();
  const [statusAbono, setStatusAbono] = useState<'P' | 'A' | 'R'>('P');

  const abonosQuery = useQuery<AbonoRH[]>({
    queryKey: ['rh', 'abonos', statusAbono],
    queryFn:  () => fetchJson(`/api/rh/abonos?status=${statusAbono}`),
    staleTime: 2 * 60 * 1000,
  });

  const feriasQuery = useQuery<FeriasRHItem[]>({
    queryKey: ['rh', 'ferias'],
    queryFn:  () => fetchJson('/api/rh/ferias'),
    staleTime: 2 * 60 * 1000,
  });

  const avaliarAbonoMutation = useMutation({
    mutationFn: ({ id, acao, justificativa }: { id: string | number; acao: 'A' | 'R'; justificativa?: string }) =>
      postJson(`/api/rh/abonos/${id}/avaliar`, { acao, justificativa }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rh', 'abonos'] }),
  });

  const avaliarFeriasMutation = useMutation({
    mutationFn: ({ id, acao, observacao }: { id: number; acao: 'A' | 'R'; observacao?: string }) =>
      postJson(`/api/rh/ferias/${id}/avaliar`, { acao, observacao }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rh', 'ferias'] }),
  });

  return {
    abonos:          abonosQuery.data ?? [],
    ferias:          feriasQuery.data ?? [],
    isLoadingAbonos: abonosQuery.isLoading,
    isLoadingFerias: feriasQuery.isLoading,
    isError:         abonosQuery.isError || feriasQuery.isError,
    statusAbono,
    setStatusAbono,
    avaliarAbono:  (id: string | number, acao: 'A' | 'R', justificativa?: string) =>
      avaliarAbonoMutation.mutateAsync({ id, acao, justificativa }),
    isAprovando:   avaliarAbonoMutation.isPending,
    avaliarFerias: (id: number, acao: 'A' | 'R', observacao?: string) =>
      avaliarFeriasMutation.mutateAsync({ id, acao, observacao }),
  };
}
