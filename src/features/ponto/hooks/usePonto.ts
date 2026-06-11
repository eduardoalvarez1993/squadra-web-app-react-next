'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user';
import type { MesPonto, PontoDia, ProjetoAlocado, DiasSemApontamentoItem, ApontamentoSqHora, ApontamentosDiaResult } from '@/services/squadra-client';

export type { DiasSemApontamentoItem, ApontamentoSqHora };

export type FaltaStatus = 'aprovado' | 'recusado' | 'pendente' | 'nao_solicitado';

export type PontoDiaPendente = {
  dia:   PontoDia;
  tipo:  'registrar' | 'solicitar' | 'aguardar' | 'apontar';
  label: string;
  heExtra?: boolean;  // pendência específica de registrar hora extra aprovada
};

export type Periodo = { horaInicio: string; horaFinal: string };

export type NovoApontamentoClientInput = {
  data:            string;
  periodos:        Periodo[];
  projetoId:       number;
  subprojetoId?:   number;
  tipoApropriacao: 'JORNADA' | 'HORA_EXTRA';
  justificativa?:  string;
};

// Minutos de hora extra APROVADA (statusSolicitacao === 3) pendentes de registro no dia.
// O dadosHoraExtra usa códigos próprios: 3 = aprovada, 5 = pendente do gestor.
export function horaExtraAprovadaMin(dia: PontoDia): number {
  return (dia.dadosHoraExtra ?? [])
    .filter((he) => he.statusSolicitacao === 3)
    .reduce((acc, he) => acc + Math.round(he.qtdadeHoras * 60), 0);
}

// Abono REAL do dia. O backend às vezes manda `isAbono: true` sem dados de abono
// (horasAbono "00:00" e sem descrição) — flag espúria que não deve bloquear o
// apontamento. Discrimina pelos DADOS do abono (horas + descrição), não pelas flags
// `isAbono`/`isFalta`, que se mostraram não-confiáveis.
export function isAbonoReal(dia: PontoDia): boolean {
  return !!dia.horasAbono && dia.horasAbono !== '00:00' && !!dia.descricaoTipoAbono;
}

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
    const dataDate = parseDMY(dia.data);
    if (dataDate > hoje) continue;

    // Hora extra APROVADA e ainda não registrada tem prioridade — vale inclusive em
    // fim de semana ou dia com abono. `dia.horaExtra` reflete o que já foi lançado
    // como extra; enquanto for menor que o aprovado, o dia fica registrável e some
    // assim que a HE for batida.
    const heAprovMin = horaExtraAprovadaMin(dia);
    if (heAprovMin > toMin(dia.horaExtra)) {
      result.push({ dia, tipo: 'registrar', label: 'H.Extra liberada', heExtra: true });
      continue;
    }

    if (dia.fimDeSemana) continue;

    const prevMin = toMin(dia.horasPrevistas);
    const realMin = toMin(dia.horasRealizadas);

    if (prevMin === 0) continue;
    if (isAbonoReal(dia)) continue;

    // Dia incompleto (sem batida OU com menos horas que o previsto) → permite registrar/corrigir.
    if (!dia.isFalta && realMin < prevMin) {
      result.push({ dia, tipo: 'registrar', label: realMin === 0 ? 'Sem apontamento' : 'Apontamento incompleto' });
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
    mutationFn: async ({ idFalta, data }: { idFalta: number; data?: string }) => {
      const res = await fetch('/api/ponto/liberacao', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idFalta, data }),
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
    liberacao:         (idFalta: number, data?: string) => liberacaoMutation.mutateAsync({ idFalta, data }),
    isLiberando:       liberacaoMutation.isPending,
    liberacaoError:    liberacaoMutation.error?.message ?? null,
  };
}

export type DeletarApontamentoInput = { id: number; tipo: string; data: string };

// Apontamentos já lançados de um dia (YYYY-MM-DD) + exclusão individual.
// Usado para editar/remover no próprio dia.
export function useApontamentosDia(dataISO: string | null, enabled: boolean) {
  const qc = useQueryClient();

  const query = useQuery<ApontamentosDiaResult>({
    queryKey: ['ponto', 'apontamentos-dia', dataISO],
    queryFn:  () => fetchJson(`/api/ponto/apontamentos-dia?data=${dataISO}`),
    enabled:  enabled && !!dataISO,
    staleTime: 0,
  });

  const sqHoras = query.data?.sqHoras ?? [];
  const rmCount = query.data?.rmCount ?? 0;
  // Falha de sincronização APP × ERP: um lado tem lançamentos e o outro não.
  const temSyncError = (sqHoras.length > 0 && rmCount === 0) || (rmCount > 0 && sqHoras.length === 0);

  const deletarMutation = useMutation({
    mutationFn: async (input: DeletarApontamentoInput) => {
      const res = await fetch('/api/ponto/apontamento', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao excluir apontamento');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ponto', 'apontamentos-dia', dataISO] });
      qc.invalidateQueries({ queryKey: ['ponto'] }); // atualiza calendário/pendências
    },
  });

  return {
    apontamentos: sqHoras,
    temSyncError,
    isLoading:    query.isLoading,
    isError:      query.isError,
    deletar:      (input: DeletarApontamentoInput) => deletarMutation.mutateAsync(input),
    isDeletando:  deletarMutation.isPending,
    deletarError: deletarMutation.error?.message ?? null,
  };
}
