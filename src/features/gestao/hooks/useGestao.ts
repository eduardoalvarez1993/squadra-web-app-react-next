'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MembroEquipe, HoraExtraItem, ApropriacaoItem, AbonoEquipeItem, FeriasRHItem, ServicoGestor, Papel } from '@/services/squadra-client';
import type { SolicitacoesGestao, ColaboradorPendencia } from '@/services/gestao';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export type { MembroEquipe, HoraExtraItem, ApropriacaoItem, AbonoEquipeItem, FeriasRHItem, ServicoGestor, Papel, SolicitacoesGestao, ColaboradorPendencia };

export type AprovarInput = {
  id:               number;
  idFalta?:         number;
  tipo:             'hora_extra' | 'apropriacao' | 'ferias' | 'abono';
  acao:             'A' | 'R';
  tipoAprovacao?:   string;
  observacaoGestor?: string;
  projeto?:         number;
  justificativa?:   string;
};

export type AlocarInput = {
  colaboradorId: number;
  projetoId:     number;
  subProjetoId:  number;
  papelId:       number;
  dataInicio:    string;
  dataFim:       string;
};

export function useGestao() {
  const qc = useQueryClient();

  const equipeQuery = useQuery<MembroEquipe[]>({
    queryKey: ['gestao', 'equipe'],
    queryFn:  () => fetchJson('/api/gestao/equipe'),
    staleTime: 5 * 60 * 1000,
  });

  const pendenciasQuery = useQuery<ColaboradorPendencia[]>({
    queryKey: ['gestao', 'pendencias'],
    queryFn:  () => fetchJson('/api/gestao/pendencias'),
    staleTime: 2 * 60 * 1000,
  });

  const solicitacoesQuery = useQuery<SolicitacoesGestao>({
    queryKey: ['gestao', 'solicitacoes'],
    queryFn:  () => fetchJson('/api/gestao/solicitacoes'),
    staleTime: 2 * 60 * 1000,
  });

  const servicosQuery = useQuery<ServicoGestor[]>({
    queryKey: ['gestao', 'servicos'],
    queryFn:  () => fetchJson('/api/gestao/servicos'),
    staleTime: 15 * 60 * 1000,
  });

  const papeisQuery = useQuery<Papel[]>({
    queryKey: ['gestao', 'papeis'],
    queryFn:  () => fetchJson('/api/gestao/papeis'),
    staleTime: 30 * 60 * 1000,
  });

  const aprovarMutation = useMutation({
    mutationFn: async (input: AprovarInput) => {
      const res = await fetch('/api/gestao/aprovar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao processar aprovação');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gestao', 'pendencias'] });
      qc.invalidateQueries({ queryKey: ['gestao', 'solicitacoes'] });
    },
  });

  const alocarMutation = useMutation({
    mutationFn: async (input: AlocarInput) => {
      const res = await fetch('/api/gestao/alocar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao criar alocação');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gestao', 'equipe'] }),
  });

  return {
    equipe:           equipeQuery.data     ?? [],
    pendencias:       pendenciasQuery.data ?? null,
    isPendenciasLoading: pendenciasQuery.isLoading,
    isPendenciasError:   pendenciasQuery.isError,
    refetchPendencias:   pendenciasQuery.refetch,
    solicitacoes:     solicitacoesQuery.data ?? null,
    servicos:         servicosQuery.data   ?? [],
    papeis:           papeisQuery.data     ?? [],
    isLoading:        equipeQuery.isLoading,
    isError:          equipeQuery.isError,
    refetchEquipe:    equipeQuery.refetch,
    aprovar:       (input: AprovarInput) => aprovarMutation.mutateAsync(input),
    isAprovando:   aprovarMutation.isPending,
    aprovarError:  aprovarMutation.error?.message ?? null,
    alocar:        (input: AlocarInput) => alocarMutation.mutateAsync(input),
    isAlocando:    alocarMutation.isPending,
    alocarError:   alocarMutation.error?.message ?? null,
  };
}
