'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user';
import type { MesPonto, PontoDia, ProjetoAlocado, DiasSemApontamentoItem } from '@/services/squadra-client';

export type { DiasSemApontamentoItem };

export type FaltaStatus = 'aprovado' | 'recusado' | 'pendente' | 'nao_solicitado';

export type PontoDiaPendente = {
  dia:   PontoDia;
  tipo:  'registrar' | 'solicitar' | 'aguardar' | 'apontar';
  label: string;
};

export type NovoApontamentoClientInput = {
  data:            string;
  horaInicio:      string;
  horaFinal:       string;
  projetoId:       number;
  subprojetoId?:   number;
  tipoApropriacao: 'JORNADA';
  justificativa?:  string;
};

export function toMin(t: string): number {
  const [h = 0, m = 0] = (t ?? '').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

// Abreviação do dia da semana — compartilhada entre calendário e pendentes
export const SEM_ABREV: Record<string, string> = {
  'Segunda-Feira': 'Seg', 'Terça-Feira': 'Ter', 'Quarta-Feira': 'Qua',
  'Quinta-Feira': 'Qui', 'Sexta-Feira': 'Sex', 'Sabado': 'Sáb', 'Domingo': 'Dom',
};

export function computeFaltaStatus(dia: PontoDia): FaltaStatus {
  if (dia.statusLiberacaoFalta === 'A') return 'aprovado';
  if (dia.statusLiberacaoFalta === 'R') return 'recusado';
  if (dia.statusLiberacaoFalta === 'P') return 'pendente';
  if (dia.liberacaoGestor === 'S')      return 'aprovado';
  if (dia.solicitacaoLiberacaoFaltaId > 0) return 'pendente';
  return 'nao_solicitado';
}

export function parseDMY(dmy: string): Date {
  const [d, m, y] = dmy.split('/').map(Number);
  return new Date(y, m - 1, d);
}

export function computePendentes(dias: PontoDia[]): PontoDiaPendente[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const result: PontoDiaPendente[] = [];

  for (const dia of dias) {
    if (dia.fimDeSemana) continue;

    const dataDate = parseDMY(dia.data);
    if (dataDate > hoje) continue;

    const prevMin = toMin(dia.horasPrevistas);
    const realMin = toMin(dia.horasRealizadas);

    if (prevMin === 0) continue;
    if (dia.isAbono)   continue;

    if (!dia.isFalta && realMin === 0) {
      result.push({ dia, tipo: 'registrar', label: 'Sem apontamento' });
      continue;
    }

    if (dia.isFalta) {
      const st = computeFaltaStatus(dia);
      if (st === 'nao_solicitado') {
        result.push({ dia, tipo: 'solicitar', label: 'Solicitar liberação' });
      } else if (st === 'pendente') {
        result.push({ dia, tipo: 'aguardar', label: 'Aguardando gestor' });
      } else if (st === 'aprovado' && realMin === 0) {
        result.push({ dia, tipo: 'apontar', label: 'Liberado — bater ponto' });
      } else if (st === 'recusado') {
        result.push({ dia, tipo: 'solicitar', label: 'Recusado — solicitar novamente' });
      }
    }
  }

  return result.sort((a, b) => parseDMY(b.dia.data).getTime() - parseDMY(a.dia.data).getTime());
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body?.error ?? String(res.status));
  }
  return res.json();
}

export function usePonto(inicio: string, fim: string, sqhorasId?: number) {
  const qc        = useQueryClient();
  const simulando = useUserStore((s) => s.simulando);

  const pontoUrl = sqhorasId
    ? `/api/ponto?inicio=${inicio}&fim=${fim}&sqhorasId=${sqhorasId}`
    : `/api/ponto?inicio=${inicio}&fim=${fim}`;

  const pontoQuery = useQuery<MesPonto[]>({
    queryKey: ['ponto', { inicio, fim, sqhorasId }],
    queryFn:  () => fetchJson(pontoUrl),
    staleTime: 2 * 60 * 1000,
  });

  const projetosQuery = useQuery<ProjetoAlocado[]>({
    queryKey: ['ponto', 'projetos'],
    queryFn:  () => fetchJson('/api/ponto/projetos'),
    staleTime: 30 * 60 * 1000,
  });

  // Dias sem apontamento — apenas para o próprio usuário
  const diasSemQuery = useQuery<DiasSemApontamentoItem[]>({
    queryKey: ['ponto', 'dias-sem-apontamento'],
    queryFn:  () => fetchJson('/api/ponto/dias-sem-apontamento'),
    staleTime: 10 * 60 * 1000,
    enabled:  !sqhorasId && !simulando, // desabilita ao ver outro usuário ou durante simulação
  });

  const meses     = pontoQuery.data ?? [];
  const dias      = meses.flatMap((m) => m.dados);
  const pendentes = computePendentes(dias);

  const registrarMutation = useMutation({
    mutationFn: async (input: NovoApontamentoClientInput) => {
      const res = await fetch('/api/ponto', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao registrar apontamento');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ponto', { inicio, fim, sqhorasId }] }),
  });

  const liberacaoMutation = useMutation({
    mutationFn: async (idFalta: number) => {
      const res = await fetch('/api/ponto/liberacao', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idFalta }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao solicitar liberação');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ponto', { inicio, fim, sqhorasId }] });
      qc.invalidateQueries({ queryKey: ['ponto', 'dias-sem-apontamento'] });
    },
  });

  return {
    meses,
    dias,
    pendentes,
    projetos:          projetosQuery.data ?? [],
    diasSemApontamento: diasSemQuery.data ?? [],
    isLoading:         pontoQuery.isLoading,
    isError:           pontoQuery.isError,
    errorCode:         pontoQuery.error instanceof Error ? pontoQuery.error.message : null,
    registrar:         (input: NovoApontamentoClientInput) => registrarMutation.mutateAsync(input),
    isRegistrando:     registrarMutation.isPending,
    registrarError:    registrarMutation.error?.message ?? null,
    liberacao:         (idFalta: number) => liberacaoMutation.mutateAsync(idFalta),
    isLiberando:       liberacaoMutation.isPending,
    liberacaoError:    liberacaoMutation.error?.message ?? null,
  };
}
