'use client';

import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/store/user';
import type { ColaboradorResumo, SaldoGlobalItem } from '@/services/squadra-client';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function useHome() {
  const gerenteFuncional = useUserStore((s) => s.permissoes.gerenteFuncional);

  const anivQuery = useQuery<ColaboradorResumo[]>({
    queryKey: ['home', 'aniversariantes'],
    queryFn:  () => fetchJson('/api/home/aniversariantes'),
    staleTime: 5 * 60 * 1000,
  });

  const novosQuery = useQuery<ColaboradorResumo[]>({
    queryKey: ['home', 'novosColabs'],
    queryFn:  () => fetchJson('/api/home/novos-colabs'),
    staleTime: 5 * 60 * 1000,
  });

  const saldoGlobalQuery = useQuery<SaldoGlobalItem[]>({
    queryKey: ['home', 'saldoGlobal'],
    queryFn:  () => fetchJson('/api/home/saldo-global'),
    staleTime: 5 * 60 * 1000,
    enabled:  gerenteFuncional,
  });

  return {
    aniversariantes: anivQuery.data ?? [],
    novosColabs:     novosQuery.data ?? [],
    saldoGlobal:     saldoGlobalQuery.data,
    isLoading:       anivQuery.isLoading || novosQuery.isLoading,
    isError:         anivQuery.isError   || novosQuery.isError,
    refetch:         () => { anivQuery.refetch(); novosQuery.refetch(); },
  };
}
