'use client';

import { useQuery } from '@tanstack/react-query';
import type { HoleriteAno } from '@/services/squadra-client';

export function useHolerite(ano: number) {
  return useQuery<HoleriteAno>({
    queryKey: ['holerite', ano],
    queryFn:  async () => {
      const res = await fetch(`/api/holerite?ano=${ano}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
  });
}
