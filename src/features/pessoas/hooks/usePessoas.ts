'use client';

import { useQuery } from '@tanstack/react-query';
import type { PessoaData } from '@/services/squadra-client';

export function usePessoas(query: string) {
  return useQuery<PessoaData[]>({
    queryKey: ['pessoas', 'busca', query],
    queryFn:  async () => {
      const res = await fetch(`/api/pessoas?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    enabled:   query.length >= 3,
  });
}

export function usePessoa(id: number) {
  return useQuery<PessoaData>({
    queryKey: ['pessoas', id],
    queryFn:  async () => {
      const res = await fetch(`/api/pessoas/${id}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled:   id > 0,
  });
}
