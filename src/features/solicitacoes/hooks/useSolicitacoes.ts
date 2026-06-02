'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AbonoItem, TipoAbono } from '@/services/squadra-client';
import type { ProjetoAlocado } from '@/services/squadra-client';

export type { AbonoItem, TipoAbono };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function normalizeTipo(v: string) {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

function isDayoff(item: AbonoItem): boolean {
  const text = normalizeTipo([item.descricao, item.motivo].filter(Boolean).join(' '));
  return text.includes('DAY OFF') || text.includes('DAY-OFF') || text.includes('FOLGA');
}

export type SolicitarAbonoInput = {
  tipoAbonoId:   number;
  data:          string;
  qtdadeHoras:   number;
  justificativa: string;
};

export type SolicitarDayOffInput = {
  data:          string;
  qtdadeHoras:   number;
  justificativa: string;
};

export type SolicitarHoraExtraInput = {
  projetoId:  number;
  data:       string;
  horaInicio: string;
  horaFim:    string;
  tipo:       string;
};

export function useSolicitacoes() {
  const qc = useQueryClient();

  const abonosQuery = useQuery<AbonoItem[]>({
    queryKey: ['solicitacoes', 'abonos'],
    queryFn:  () => fetchJson('/api/solicitacoes/abonos'),
    staleTime: 2 * 60 * 1000,
  });

  const tiposQuery = useQuery<TipoAbono[]>({
    queryKey: ['solicitacoes', 'tipos'],
    queryFn:  () => fetchJson('/api/solicitacoes/tipos-abono'),
    staleTime: 30 * 60 * 1000,
  });

  const projetosQuery = useQuery<ProjetoAlocado[]>({
    queryKey: ['solicitacoes', 'projetos'],
    queryFn:  () => fetchJson('/api/solicitacoes/projetos'),
    staleTime: 10 * 60 * 1000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['solicitacoes', 'abonos'] });

  const abonoMutation = useMutation({
    mutationFn: async (input: SolicitarAbonoInput) => {
      const res = await fetch('/api/solicitacoes/abono', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao solicitar abono');
      }
    },
    onSuccess: invalidate,
  });

  const dayoffMutation = useMutation({
    mutationFn: async (input: SolicitarDayOffInput) => {
      const res = await fetch('/api/solicitacoes/dayoff', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao solicitar day-off');
      }
    },
    onSuccess: invalidate,
  });

  const horaExtraMutation = useMutation({
    mutationFn: async (input: SolicitarHoraExtraInput) => {
      const res = await fetch('/api/solicitacoes/hora-extra', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao solicitar hora extra');
      }
    },
    onSuccess: invalidate,
  });

  const allAbonos = abonosQuery.data ?? [];

  return {
    // listas
    abonos:         allAbonos.filter((a) => !isDayoff(a)),
    dayoffs:        allAbonos.filter(isDayoff),
    tiposAbono:     tiposQuery.data  ?? [],
    projetos:       projetosQuery.data ?? [],

    // estados
    isLoading:      abonosQuery.isLoading,
    isError:        abonosQuery.isError,
    refetch:        abonosQuery.refetch,

    // abono
    solicitarAbono: (input: SolicitarAbonoInput) => abonoMutation.mutateAsync(input),
    isSolicitando:  abonoMutation.isPending,
    abonoError:     abonoMutation.error?.message ?? null,

    // dayoff
    solicitarDayoff: (input: SolicitarDayOffInput) => dayoffMutation.mutateAsync(input),
    isSolicitandoDO: dayoffMutation.isPending,
    dayoffError:     dayoffMutation.error?.message ?? null,

    // hora extra
    solicitarHoraExtra: (input: SolicitarHoraExtraInput) => horaExtraMutation.mutateAsync(input),
    isEnviandoHE:   horaExtraMutation.isPending,
    heError:        horaExtraMutation.error?.message ?? null,
  };
}
