'use client';

import { useQuery } from '@tanstack/react-query';
import type { HistoricoSalarialItem } from '@/services/squadra-client';

export function useHistoricoSalarial() {
  return useQuery<HistoricoSalarialItem[]>({
    queryKey: ['holerite', 'historico'],
    queryFn:  async () => {
      const res = await fetch('/api/holerite/historico');
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
  });
}
