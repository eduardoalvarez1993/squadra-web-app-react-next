'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DrawerForm } from '@/components/shared/DrawerForm';
import { TabNav } from '@/components/shared/TabNav';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { PerfilLoader } from '@/components/shared/PerfilLoader';
import { Button } from '@/components/ui/button';
import { PontoCalendar, PontoLoading } from '@/features/ponto/components/PontoCalendar';
import { FeriasLoader } from './GestaoLoaders';
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

  if (isLoading) return <FeriasLoader />;
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

// Listas vêm serializadas com o marcador {*} (1 por nível). Para interesses
// removemos o marcador; para skills contamos as estrelas.
function limparMarcador(s: string): string {
  return s.replace(/\{\*\}/g, '').trim();
}

function parseNivel(s: string): { nome: string; nivel: number } {
  const nivel = (s.match(/\{\*\}/g) ?? []).length;
  return { nome: limparMarcador(s), nivel };
}

const SKILL_SECOES: { key: keyof PessoaData; label: string }[] = [
  { key: 'listaExperiencias',       label: 'Hard Skills' },
  { key: 'listaExperienciasSoft',   label: 'Soft Skills' },
  { key: 'listaOutrasCompetencias', label: 'Outras Competências' },
  { key: 'listaCertificacoes',      label: 'Certificações' },
  { key: 'listaIdiomas',            label: 'Idiomas' },
];

function Estrelas({ nivel }: { nivel: number }) {
  if (nivel <= 0) return null;
  return (
    <span className="flex gap-0.5" aria-label={`${nivel} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-xs leading-none ${i < nivel ? 'text-amber-400' : 'text-muted-foreground/25'}`}>
          {i < nivel ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function Chip({ nome, nivel }: { nome: string; nivel?: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#f5f7fa] border border-border rounded-full px-3 py-1.5">
      <span className="text-xs font-medium text-foreground">{nome}</span>
      {nivel != null && <Estrelas nivel={nivel} />}
    </div>
  );
}

function PerfilTab({ memberId }: { memberId: number }) {
  const { data, isLoading, isError, refetch } = useQuery<PessoaData>({
    queryKey: ['pessoas', memberId],
    queryFn:  async () => {
      const res = await fetch(`/api/pessoas/${memberId}`);
      if (!res.ok) throw new Error('Erro ao buscar perfil');
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <PerfilLoader text="Carregando perfil..." />;
  if (isError || !data) return <ErrorSection message="Não foi possível carregar o perfil." onRetry={() => refetch()} />;

  const interesses = (data.listaInteresses ?? []).map(limparMarcador).filter(Boolean);
  const temAlgumaSkill = SKILL_SECOES.some((s) => ((data[s.key] as string[]) ?? []).length > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Dados básicos */}
      <div className="flex flex-col gap-3 bg-card border border-border rounded-lg p-3">
        <InfoRow label="Cargo"   value={data.cargo} />
        <InfoRow label="E-mail"  value={data.email} />
        <InfoRow label="Celular" value={data.celular} />
      </div>

      {/* Interesses */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interesses</h3>
        {interesses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interesses.map((nome, i) => <Chip key={`${nome}-${i}`} nome={nome} />)}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Nenhum interesse cadastrado</span>
        )}
      </div>

      {/* Skills / Habilidades */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skills &amp; Habilidades</h3>
        {temAlgumaSkill ? (
          SKILL_SECOES.map((sec) => {
            const itens = ((data[sec.key] as string[]) ?? []).map(parseNivel).filter((x) => x.nome);
            if (itens.length === 0) return null;
            return (
              <div key={sec.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">{sec.label}</span>
                <div className="flex flex-wrap gap-2">
                  {itens.map((sk, i) => <Chip key={`${sk.nome}-${i}`} nome={sk.nome} nivel={sk.nivel} />)}
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-xs text-muted-foreground italic">Nenhuma skill cadastrada</span>
        )}
      </div>
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

  // Confirmar falta (marcaFalta/cadastrar) — confirma/cria a falta do dia
  const confirmarMutation = useMutation({
    mutationFn: async ({ data }: { data: string }) => {
      const res = await fetch(`/api/gestao/membro/${memberId}/marcar-falta`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idUsuario: memberId, data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao confirmar falta');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gestao', 'membro', memberId, 'ponto'] }),
  });

  // Liberar falta livre (gestor remove a falta direto, sem solicitação do colaborador)
  const liberarMutation = useMutation({
    mutationFn: async ({ data }: { data: string }) => {
      const res = await fetch(`/api/gestao/membro/${memberId}/liberar-falta`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao liberar falta');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gestao', 'membro', memberId, 'ponto'] }),
  });

  const [diaAction, setDiaAction] = useState<{ dia: PontoDia; type: 'confirmar' | 'liberar' } | null>(null);

  // A decisão de qual ação cabe em cada dia é do PontoCalendar (gestorMode, por flags).
  // Aqui só roteamos pelo tipo do CTA clicado.
  function handleDiaClick(_dia: PontoDia, tipo?: string) {
    if (tipo === 'liberar')   { setDiaAction({ dia: _dia, type: 'liberar' });   return; }
    if (tipo === 'confirmar') { setDiaAction({ dia: _dia, type: 'confirmar' }); return; }
  }

  return (
    // Full-bleed: cancela o px-5 do DrawerForm e cria um "canvas" mobile cinza
    // com gutter menor (px-3), devolvendo largura ao calendário.
    <div className="flex flex-col gap-3 -mx-5 -mb-5 min-h-full px-3 pt-1 pb-5 bg-gray-50">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between px-1">
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
        <PontoCalendar dias={dias} onDiaClick={handleDiaClick} hideProjetos gestorMode />
      )}

      {/* Drawer ação: Confirmar falta (marcaFalta/cadastrar) */}
      <DrawerForm
        open={diaAction?.type === 'confirmar'}
        onClose={() => setDiaAction(null)}
        title={`Confirmar falta — ${diaAction?.dia.data ?? ''}`}
        side="right"
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Confirmar a falta em <strong>{diaAction?.dia.data}</strong>?
          </p>
          {confirmarMutation.error && (
            <p className="text-sm text-destructive">{confirmarMutation.error.message}</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDiaAction(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={confirmarMutation.isPending}
              onClick={async () => {
                if (!diaAction) return;
                await confirmarMutation.mutateAsync({ data: diaAction.dia.data });
                setDiaAction(null);
              }}
            >
              {confirmarMutation.isPending ? 'Confirmando…' : 'Confirmar falta'}
            </Button>
          </div>
        </div>
      </DrawerForm>

      {/* Drawer ação: Liberar falta (livre — sem solicitação do colaborador) */}
      <DrawerForm
        open={diaAction?.type === 'liberar'}
        onClose={() => setDiaAction(null)}
        title={`Liberar falta — ${diaAction?.dia.data ?? ''}`}
        side="right"
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Liberar a falta de <strong>{diaAction?.dia.data}</strong> sem aguardar solicitação?
            A falta do dia será removida e o colaborador poderá registrar o apontamento.
          </p>
          {liberarMutation.error && (
            <p className="text-sm text-destructive">{liberarMutation.error.message}</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDiaAction(null)}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={liberarMutation.isPending}
              onClick={async () => {
                if (!diaAction) return;
                await liberarMutation.mutateAsync({ data: diaAction.dia.data });
                setDiaAction(null);
              }}
            >
              {liberarMutation.isPending ? 'Liberando…' : 'Liberar falta'}
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

  // Ponto exige login (o endpoint resolve o sqhorasId via resolveLogin). Membros já
  // trazem login; pendências não → resolvemos via /api/pessoas/{id} (mesma queryKey
  // do PerfilTab, então o React Query deduplica e não há fetch extra).
  const membroLogin = membro?.login ?? null;
  const { data: pessoaPonto } = useQuery<PessoaData>({
    queryKey: ['pessoas', memberId],
    queryFn:  async () => {
      const res = await fetch(`/api/pessoas/${memberId}`);
      if (!res.ok) throw new Error('Erro ao buscar pessoa');
      return res.json();
    },
    enabled:   memberId !== null && membroLogin === null,
    staleTime: 10 * 60 * 1000,
  });
  const effectiveLogin = membroLogin ?? pessoaPonto?.login ?? null;
  const hasPonto       = memberId !== null && effectiveLogin !== null;

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
            <PerfilTab memberId={memberId} />
          )}
          {drawerTab === 'perfil' && memberId === null && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Perfil indisponível — ID do colaborador não encontrado.
            </p>
          )}

          {drawerTab === 'ponto' && hasPonto && (
            <PontoTab memberId={memberId!} login={effectiveLogin!} />
          )}
        </div>
      </div>
    </DrawerForm>
  );
}
