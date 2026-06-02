'use client';

import { useQuery } from '@tanstack/react-query';

export function useSaldoProprio() {
  return useQuery<{ saldoHoras: number }>({
    queryKey: ['home', 'saldoProprio'],
    queryFn:  async () => {
      const res = await fetch('/api/home/saldo-proprio');
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
