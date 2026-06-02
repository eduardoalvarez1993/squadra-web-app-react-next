'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DrawerForm } from '@/components/shared/DrawerForm';
import { TabNav } from '@/components/shared/TabNav';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { Skeleton } from '@/components/shared/Skeleton';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { Button } from '@/components/ui/button';
import { PontoCalendar, PontoLoading } from '@/features/ponto/components/PontoCalendar';
import { computeFaltaStatus, parseDMY } from '@/features/ponto/hooks/usePonto';
import type { MembroEquipe, ColaboradorPendencia } from '@/features/gestao/hooks/useGestao';
import type { FeriasDados, PessoaData, MesPonto, PontoDia } from '@/services/squadra-client';

interface Props {
  membro:    MembroEquipe | null;
  pendencia: ColaboradorPendencia | null;
  onClose:   () => void;
  onAlocar?: () => void;
}

const open_ = (m: MembroEquipe | null, p: ColaboradorPendencia | null) => m !== null || p !== null;

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function fmtData(s: string | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtSaldo(v: number): string {
  return `${v >= 0 ? '+' : ''}${v}h`;
}

function toMin(t: string): number {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
}

// ── Banco de Horas ─────────────────────────────────────────────────────────────

function BancoTab({ membro, pendencia }: { membro: MembroEquipe | null; pendencia: ColaboradorPendencia | null }) {
  const saldo = pendencia ? pendencia.bancoHorasColaborador : parseFloat(membro?.saldoHoras ?? '0');
  const cor   = saldo < 0 ? 'text-red-500' : 'text-green-600';
  const projetos = pendencia
    ? pendencia.projetosAlocados
    : membro?.ultimoProjeto ? [{ nome: membro.ultimoProjeto, dataTermino: '' }] : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Saldo de Horas</p>
        <p className={`text-3xl font-bold tabular-nums ${cor}`}>{fmtSaldo(saldo)}</p>
        {saldo < 0 && <p className="text-xs text-red-400 mt-1">Banco de horas negativo</p>}
        {saldo > 0 && <p className="text-xs text-muted-foreground mt-1">Banco de horas positivo</p>}
      </div>
      {projetos.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Projetos alocados</p>
          {projetos.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
              <span className="text-sm truncate flex-1 mr-2">{p.nome}</span>
              {p.dataTermino && <span className="text-xs text-muted-foreground flex-shrink-0">até {fmtData(p.dataTermino)}</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Sem projetos alocados</p>
      )}
    </div>
  );
}

// ── Férias ────────────────────────────────────────────────────────────────────

function FeriasTab({ memberId }: { memberId: number }) {
  const { data, isLoading, isError, refetch } = useQuery<FeriasDados>({
    queryKey: ['gestao', 'membro', memberId, 'ferias'],
    queryFn:  async () => {
      const res = await fetch(`/api/gestao/membro/${memberId}/ferias`);
      if (!res.ok) throw new Error('Erro ao buscar férias');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <div className="flex flex-col gap-3">
      <Skeleton height="80px" width="100%" />
      <Skeleton height="48px" width="100%" />
      <Skeleton height="48px" width="100%" />
    </div>
  );
  if (isError || !data) return <ErrorSection message="Não foi possível carregar as férias." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Saldo de Férias</p>
        <p className="text-3xl font-bold">{data.saldoFeriasColaborador}d</p>
      </div>
      <div className="flex flex-col gap-3">
        {(data.inicioFeriasPlanejadaColaborador || data.terminoFeriasPlanejadaColaborador) && (
          <div className="flex flex-col gap-1 bg-card border border-border rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground">Férias planejadas</span>
            <span className="text-sm font-medium">
              {fmtData(data.inicioFeriasPlanejadaColaborador)} → {fmtData(data.terminoFeriasPlanejadaColaborador)}
            </span>
          </div>
        )}
        {(data.inicioPeriodoDeGozoColaborador || data.terminoPeriodoDeGozoColaborador) && (
          <div className="flex flex-col gap-1 bg-card border border-border rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground">Período de gozo</span>
            <span className="text-sm font-medium">
              {fmtData(data.inicioPeriodoDeGozoColaborador)} → {fmtData(data.terminoPeriodoDeGozoColaborador)}
            </span>
          </div>
        )}
        {data.dataLimiteFerias && (
          <div className="flex flex-col gap-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-xs text-amber-700">Data limite para solicitar</span>
            <span className="text-sm font-semibold text-amber-800">{fmtData(data.dataLimiteFerias)}</span>
          </div>
        )}
        {!data.inicioFeriasPlanejadaColaborador && !data.inicioPeriodoDeGozoColaborador && !data.dataLimiteFerias && (
          <p className="text-sm text-muted-foreground text-center py-4">Sem períodos de férias registrados</p>
        )}
      </div>
    </div>
  );
}

// ── Perfil ────────────────────────────────────────────────────────────────────

function PerfilTab({ memberId, nome, foto }: { memberId: number; nome: string; foto: string | null }) {
  const { data, isLoading, isError, refetch } = useQuery<PessoaData>({
    queryKey: ['pessoas', memberId],
    queryFn:  async () => {
      const res = await fetch(`/api/pessoas/${memberId}`);
      if (!res.ok) throw new Error('Erro ao buscar perfil');
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton height="56px" width="56px" borderRadius="50%" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton height="16px" width="60%" />
          <Skeleton height="12px" width="40%" />
        </div>
      </div>
      <Skeleton height="48px" width="100%" />
      <Skeleton height="48px" width="100%" />
    </div>
  );
  if (isError || !data) return <ErrorSection message="Não foi possível carregar o perfil." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-3 bg-card border border-border rounded-lg p-3">
      <InfoRow label="Cargo"   value={data.cargo} />
      <InfoRow label="E-mail"  value={data.email} />
      <InfoRow label="Celular" value={data.celular} />
      <InfoRow label="Login"   value={data.login} />
    </div>
  );
}

// ── Ponto ─────────────────────────────────────────────────────────────────────

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function PontoTab({ memberId, login }: { memberId: number; login: string }) {
  const qc    = useQueryClient();
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const inicio  = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const fim     = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: meses, isLoading, isError, refetch } = useQuery<MesPonto[]>({
    queryKey: ['gestao', 'membro', memberId, 'ponto', { inicio, fim }],
    queryFn:  async () => {
      const loginParam = login ? `&login=${encodeURIComponent(login)}` : '';
      const res = await fetch(
        `/api/gestao/membro/${memberId}/ponto?inicio=${inicio}&fim=${fim}${loginParam}`
      );
      if (!res.ok) throw new Error('Erro ao buscar ponto');
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const dias: PontoDia[] = (meses ?? []).flatMap((m) => m.dados);

  // Marcar falta
  const marcarMutation = useMutation({
    mutationFn: async ({ data }: { data: string }) => {
      const res = await fetch(`/api/gestao/membro/${memberId}/marcar-falta`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idUsuario: memberId, data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao marcar falta');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gestao', 'membro', memberId, 'ponto'] }),
  });

  // Autorizar falta diretamente (gestor com permissaoLiberacao)
  const autorizarMutation = useMutation({
    mutationFn: async ({ idFalta, idSolicitacao }: { idFalta: number; idSolicitacao: number }) => {
      const res = await fetch('/api/gestao/aprovar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tipo: 'apropriacao', id: idFalta, idFalta, idSolicitacao, acao: 'A' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao autorizar');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gestao', 'membro', memberId, 'ponto'] }),
  });

  const [diaAction, setDiaAction] = useState<{ dia: PontoDia; type: 'marcar' | 'autorizar' } | null>(null);

  function handleDiaClick(dia: PontoDia) {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const dataDate = parseDMY(dia.data);
    if (dataDate >= hoje) return; // não age em dias futuros/hoje sem horas

    const prevMin = toMin(dia.horasPrevistas);
    const realMin = toMin(dia.horasRealizadas);

    if (dia.isFalta && dia.permissaoLiberacao) {
      const st = computeFaltaStatus(dia);
      if (st === 'nao_solicitado' || st === 'pendente') {
        setDiaAction({ dia, type: 'autorizar' });
        return;
      }
    }

    if (!dia.isFalta && !dia.isAbono && realMin === 0 && prevMin > 0) {
      setDiaAction({ dia, type: 'marcar' });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => {
          if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
        }}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold">{MESES[month - 1]} {year}</span>
        <Button variant="ghost" size="icon" onClick={() => {
          if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
        }}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {isLoading && <PontoLoading label="Carregando ponto..." />}

      {isError && (
        <ErrorSection message="Não foi possível carregar o ponto." onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && (
        <PontoCalendar dias={dias} onDiaClick={handleDiaClick} />
      )}

      {/* Drawer ação: Marcar falta */}
      <DrawerForm
        open={diaAction?.type === 'marcar'}
        onClose={() => setDiaAction(null)}
        title={`Marcar falta — ${diaAction?.dia.data ?? ''}`}
        side="right"
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Confirma o registro de falta em <strong>{diaAction?.dia.data}</strong>?
          </p>
          {marcarMutation.error && (
            <p className="text-sm text-destructive">{marcarMutation.error.message}</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDiaAction(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={marcarMutation.isPending}
              onClick={async () => {
                if (!diaAction) return;
                await marcarMutation.mutateAsync({ data: diaAction.dia.data });
                setDiaAction(null);
              }}
            >
              {marcarMutation.isPending ? 'Marcando…' : 'Marcar falta'}
            </Button>
          </div>
        </div>
      </DrawerForm>

      {/* Drawer ação: Autorizar falta */}
      <DrawerForm
        open={diaAction?.type === 'autorizar'}
        onClose={() => setDiaAction(null)}
        title={`Autorizar falta — ${diaAction?.dia.data ?? ''}`}
        side="right"
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Autorizar diretamente a falta de <strong>{diaAction?.dia.data}</strong>?
            O colaborador poderá então registrar o apontamento.
          </p>
          {autorizarMutation.error && (
            <p className="text-sm text-destructive">{autorizarMutation.error.message}</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDiaAction(null)}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={autorizarMutation.isPending}
              onClick={async () => {
                if (!diaAction) return;
                await autorizarMutation.mutateAsync({
                  idFalta:       diaAction.dia.faltaId,
                  idSolicitacao: diaAction.dia.solicitacaoLiberacaoFaltaId,
                });
                setDiaAction(null);
              }}
            >
              {autorizarMutation.isPending ? 'Autorizando…' : 'Autorizar'}
            </Button>
          </div>
        </div>
      </DrawerForm>
    </div>
  );
}

// ── MembroDrawer ──────────────────────────────────────────────────────────────

export function MembroDrawer({ membro, pendencia, onClose, onAlocar }: Props) {
  const isOpen   = open_(membro, pendencia);
  const nome     = (membro?.nome ?? pendencia?.nome ?? '').trim();
  const foto     = membro?.foto ?? pendencia?.foto ?? null;
  const memberId = pendencia?.id ?? membro?.id ?? null;

  // Ponto só disponível para membros da equipe com login conhecido
  const membroLogin = membro?.login ?? null;
  const hasPonto    = memberId !== null && membroLogin !== null;

  const DRAWER_TABS = [
    { id: 'banco',  label: 'Banco de Horas' },
    ...(memberId !== null ? [{ id: 'ferias', label: 'Férias' }] : []),
    { id: 'perfil', label: 'Perfil' },
    ...(hasPonto ? [{ id: 'ponto', label: 'Ponto' }] : []),
  ];

  const [drawerTab, setDrawerTab] = useState('banco');

  useEffect(() => { setDrawerTab('banco'); }, [nome]);

  return (
    <DrawerForm open={isOpen} onClose={onClose} title={nome.split(' ').slice(0, 2).join(' ')} side="right">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center gap-3">
          <AvatarGradient nome={nome} foto={foto} size={40} />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm">{nome}</p>
            {membro?.ultimoProjeto && (
              <p className="text-xs text-muted-foreground truncate">{membro.ultimoProjeto}</p>
            )}
          </div>
          {memberId !== null && onAlocar && (
            <Button size="sm" variant="outline" onClick={onAlocar} className="flex-shrink-0">
              Alocar
            </Button>
          )}
        </div>

        <TabNav tabs={DRAWER_TABS} active={drawerTab} onChange={setDrawerTab} />

        <div className="flex-1 overflow-y-auto">
          {drawerTab === 'banco' && <BancoTab membro={membro} pendencia={pendencia} />}

          {drawerTab === 'ferias' && memberId !== null && <FeriasTab memberId={memberId} />}

          {drawerTab === 'perfil' && memberId !== null && (
            <PerfilTab memberId={memberId} nome={nome} foto={foto} />
          )}
          {drawerTab === 'perfil' && memberId === null && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Perfil indisponível — ID do colaborador não encontrado.
            </p>
          )}

          {drawerTab === 'ponto' && hasPonto && (
            <PontoTab memberId={memberId!} login={membroLogin!} />
          )}
        </div>
      </div>
    </DrawerForm>
  );
}
