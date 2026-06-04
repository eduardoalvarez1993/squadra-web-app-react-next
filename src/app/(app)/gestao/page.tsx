'use client';

import { useMemo, useState } from 'react';
import { TabNav } from '@/components/shared/TabNav';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { AccessDenied } from '@/components/shared/AccessDenied';
import { VerificandoCredenciais } from '@/components/shared/VerificandoCredenciais';
import { EmptyState } from '@/components/shared/EmptyState';
import { SolicitacaoCard } from '@/components/shared/SolicitacaoCard';
import { ApprovalModal } from '@/components/shared/ApprovalModal';
import { PessoaCard } from '@/components/shared/PessoaCard';
import { DrawerForm } from '@/components/shared/DrawerForm';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import {
  useGestao,
  type HoraExtraItem,
  type ApropriacaoItem,
  type AbonoEquipeItem,
  type FeriasRHItem,
  type ColaboradorPendencia,
  type MembroEquipe,
} from '@/features/gestao/hooks/useGestao';
import { AlocarForm } from '@/features/gestao/components/AlocarForm';
import { GestaoFuncionalTab } from '@/features/gestao/components/GestaoFuncionalTab';
import { GestaoProjetoTab } from '@/features/gestao/components/GestaoProjetoTab';
import { MembroDrawer } from '@/features/gestao/components/MembroDrawer';
import { ASSETS } from '@/lib/assets';
import { statusLabel } from '@/lib/status';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import {
  PendenciasLoader,
  AlocarLoader,
  HoraExtraLoader,
  ApropriacaoLoader,
  FeriasLoader,
  AbonoLoader,
  EquipeSearchLoader,
} from '@/features/gestao/components/GestaoLoaders';

const SOL_TABS = [
  { id: 'apropriacao', label: 'Apropriação' },
  { id: 'hora_extra',  label: 'Hora Extra' },
  { id: 'ferias',      label: 'Férias' },
  { id: 'abono',       label: 'Abono/Dayoff' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function projetoLabel(nome: string): string {
  const parts = nome.split(' - ');
  return parts.length > 1 ? parts.slice(1).join(' - ') : nome;
}

function fmtData(s: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function hasAlerta(c: ColaboradorPendencia): boolean {
  return (
    c.projetosAlocados.length === 0 ||
    (c.saldoFeriasColaborador > 0 && !!c.terminoPeriodoDeGozoColaborador) ||
    c.bancoHorasColaborador !== 0 ||
    c.datasSemApontamento.length > 0 ||
    c.preFechamentoPendente
  );
}

// ── PendenciaCard ─────────────────────────────────────────────────────────────

function parseDate(raw: unknown): Date | null {
  const s = String(raw ?? '').trim();
  // ISO: yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(`${s.split('T')[0]}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  // pt-BR: dd/MM/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [day, month, year] = s.split('/');
    const d = new Date(`${year}-${month}-${day}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function DateBox({ iso }: { iso: unknown }) {
  const d = parseDate(iso);
  if (!d) return null;
  const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
  const dia = String(d.getDate()).padStart(2, '0');
  return (
    <div className="flex flex-col rounded overflow-hidden border border-border flex-shrink-0 w-9 text-center leading-none">
      <span className="bg-primary text-primary-foreground text-[9px] font-bold py-0.5">
        {mes}
      </span>
      <span className="bg-muted text-foreground text-xs font-bold py-1">
        {dia}
      </span>
    </div>
  );
}

function PendRow({ type, text }: { type: 'ok' | 'warn' | 'err'; text: string }) {
  const icon = type === 'ok' ? '✅' : type === 'warn' ? '⚠️' : '❌';
  return (
    <div className="flex items-start gap-2 text-sm py-0.5">
      <span>{icon}</span>
      <span className={type === 'ok' ? '' : 'text-amber-700 dark:text-amber-400'}>{text}</span>
    </div>
  );
}

function PendenciaCard({
  c,
  onDetalhes,
}: {
  c: ColaboradorPendencia;
  onDetalhes?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const alerta    = hasAlerta(c);
  const nomeExib  = c.nome.trim().split(' ').slice(0, 2).join(' ');

  return (
    <div className="bg-card border border-border rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-accent/40 transition-colors cursor-pointer"
      >
        <AvatarGradient nome={c.nome} foto={c.foto} size={36} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{nomeExib}</p>
          <p className="text-xs text-muted-foreground truncate">
            {c.projetosAlocados.length === 0
              ? <span className="text-red-500">Sem projeto alocado</span>
              : `${projetoLabel(c.projetosAlocados[0].nome)} até ${fmtData(c.projetosAlocados[0].dataTermino)}`
            }
          </p>
        </div>
        {c.datasSemApontamento.length > 0 && (
          <DateBox iso={c.datasSemApontamento[0]} />
        )}
        {alerta && <span className="text-amber-500 text-base flex-shrink-0">⚠</span>}
        <span className={`text-muted-foreground transition-transform text-xs ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-1 border-t border-border pt-2">
          {c.projetosAlocados.length > 0
            ? c.projetosAlocados.map((p, i) => (
                <PendRow key={i} type="ok" text={`${projetoLabel(p.nome)} até ${fmtData(p.dataTermino)}`} />
              ))
            : <PendRow type="err" text="Sem alocação em projeto" />
          }

          {c.saldoFeriasColaborador > 0 && c.terminoPeriodoDeGozoColaborador && (
            <PendRow type="warn" text={`Prazo para solicitar férias: ${c.terminoPeriodoDeGozoColaborador}`} />
          )}

          {c.bancoHorasColaborador > 0 && (
            <PendRow type="warn" text={`Banco de horas alto: +${c.bancoHorasColaborador}h`} />
          )}

          {c.bancoHorasColaborador < 0 && (
            <PendRow type="err" text={`Banco de horas negativo: ${c.bancoHorasColaborador}h`} />
          )}

          {c.datasSemApontamento.length > 0 && (
            <div className="flex flex-col gap-1.5 py-0.5">
              <div className="flex items-center gap-1.5 text-sm">
                <span>❌</span>
                <span className="text-amber-700 dark:text-amber-400">Data da Falta</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {c.datasSemApontamento.map((dt, i) => (
                  <DateBox key={i} iso={dt} />
                ))}
              </div>
            </div>
          )}

          {c.preFechamentoPendente && (
            <PendRow type="err" text="Pré-fechamento pendente" />
          )}

          {onDetalhes && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDetalhes(); }}
              className="text-xs text-primary underline-offset-2 hover:underline mt-2 self-start"
            >
              Ver detalhes →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── PendenciasTab ─────────────────────────────────────────────────────────────

function PendenciasTab({
  pendencias,
  isLoading,
  onDetalhes,
}: {
  pendencias: ColaboradorPendencia[] | null;
  isLoading: boolean;
  onDetalhes: (c: ColaboradorPendencia) => void;
}) {
  if (isLoading || pendencias === null) {
    return <PendenciasLoader />;
  }

  if (pendencias.length === 0) {
    return <EmptyState image={ASSETS.emptyPendencias} title="Nenhuma pendência" description="Sua equipe está em dia." />;
  }

  const comAlerta = pendencias.filter(hasAlerta).length;

  return (
    <div className="flex flex-col gap-3">
      {comAlerta > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
          {comAlerta} colaborador{comAlerta > 1 ? 'es' : ''} com pendência
        </p>
      )}
      {pendencias.map((c) => (
        <PendenciaCard key={c.id || c.nome} c={c} onDetalhes={() => onDetalhes(c)} />
      ))}
    </div>
  );
}

// ── GestaoPage ────────────────────────────────────────────────────────────────

export default function GestaoPage() {
  const gerenteFuncional = useUserStore((s) => s.permissoes.gerenteFuncional);
  const gestorId         = useUserStore((s) => s.gestorId);
  const hydrated         = gestorId !== 0;

  const [tab,        setTab]        = useState('pendencias');
  const [solTab,     setSolTab]     = useState('apropriacao');

  const [alocarOpen,   setAlocarOpen]   = useState(false);
  const [alocarPresel, setAlocarPresel] = useState<{ id: number; nome: string; nomeSocial?: string | null; foto: string | null } | null>(null);
  const [busca,      setBusca]      = useState('');
  // chave composta `${tipo}-${id}` — evita colisão entre tipos com mesmo número de id
  const [aprovandoId, setAprovandoId] = useState<string | null>(null);
  const [heModal, setHeModal] = useState<{ open: boolean; item: HoraExtraItem | null }>({ open: false, item: null });

  // Drawer de membro
  const [drawerMembro,    setDrawerMembro]    = useState<MembroEquipe | null>(null);
  const [drawerPendencia, setDrawerPendencia] = useState<ColaboradorPendencia | null>(null);

  const {
    equipe, pendencias, isPendenciasLoading,
    solicitacoes, servicos, papeis,
    isLoading, isError, refetchEquipe,
    aprovar,
    alocar, isAlocando,
  } = useGestao();

  // Mapa nome → foto da equipe para enriquecer solicitações que não retornam foto
  const fotoByNome = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const mb of equipe) m.set(mb.nome.trim(), mb.foto);
    return m;
  }, [equipe]);

  // Cross-referência por nome
  function findPendencia(nome: string): ColaboradorPendencia | null {
    return (pendencias ?? []).find(p => p.nome.trim() === nome.trim()) ?? null;
  }
  function findMembro(nome: string): MembroEquipe | null {
    return equipe.find(m => m.nome.trim() === nome.trim()) ?? null;
  }

  function abrirDrawerMembro(m: MembroEquipe) {
    setDrawerMembro(m);
    setDrawerPendencia(findPendencia(m.nome));
  }
  function abrirDrawerPendencia(c: ColaboradorPendencia) {
    setDrawerPendencia(c);
    setDrawerMembro(findMembro(c.nome));
  }
  function fecharDrawer() {
    setDrawerMembro(null);
    setDrawerPendencia(null);
  }

  function handleAlocarFromDrawer() {
    const id   = drawerPendencia?.id ?? drawerMembro?.id;
    const nome = drawerMembro?.nome ?? drawerPendencia?.nome ?? '';
    const foto = drawerMembro?.foto ?? drawerPendencia?.foto ?? null;
    if (!id) return;
    fecharDrawer();
    setAlocarPresel({ id, nome, foto });
    setAlocarOpen(true);
  }

  const equipeFiltrado = useMemo(
    () => equipe.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase())),
    [equipe, busca],
  );

  const comAlerta = useMemo(
    () => (pendencias ?? []).filter(hasAlerta).length,
    [pendencias],
  );

  const TABS = [
    { id: 'pendencias',   label: 'Pendências',   badge: comAlerta },
    { id: 'equipe',       label: 'Equipe' },
    { id: 'solicitacoes', label: 'Solicitações' },
    { id: 'alocar',       label: 'Alocar' },
    { id: 'gestao-funcional', label: 'Gestão Funcional' },
    { id: 'gestao-projeto',   label: 'Gestão de Projeto' },
  ];

  if (!hydrated)         return <VerificandoCredenciais />;
  if (!gerenteFuncional) return <AccessDenied description="A gestao fica disponivel apenas para gestores com equipe ativa." />;

  if (isError) {
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar a equipe." onRetry={() => refetchEquipe()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      <h1 className="text-xl font-semibold">Gestão</h1>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="p-4 flex flex-col gap-4">

      {/* ── Pendências ───────────────────────────────────────────────── */}
      {tab === 'pendencias' && (
        <PendenciasTab
          pendencias={pendencias}
          isLoading={isPendenciasLoading}
          onDetalhes={abrirDrawerPendencia}
        />
      )}

      {/* ── Equipe ──────────────────────────────────────────────────── */}
      {tab === 'equipe' && (
        <div className="flex flex-col gap-3">
          <input
            type="search"
            placeholder="Buscar colaborador…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />

          {isLoading
            ? <EquipeSearchLoader />
            : equipeFiltrado.length === 0
            ? <EmptyState title={busca ? 'Nenhum resultado' : 'Nenhum membro na equipe'} />
            : equipeFiltrado.map((m, i) => {
                const saldo = parseFloat(m.saldoHoras);
                const badgeTxt = `${saldo >= 0 ? '+' : ''}${m.saldoHoras}h`;
                const badgeCls = saldo < 0
                  ? 'bg-red-100 text-red-600 border-0'
                  : 'bg-green-100 text-green-700 border-0';
                return (
                  <PessoaCard
                    key={m.login ?? i}
                    variant="equipe"
                    nome={m.nome}
                    foto={m.foto}
                    projeto={m.ultimoProjeto || undefined}
                    badge={badgeTxt}
                    badgeClassName={badgeCls}
                    onClick={() => abrirDrawerMembro(m)}
                  />
                );
              })
          }
        </div>
      )}

      {/* ── Solicitações ─────────────────────────────────────────────── */}
      {tab === 'solicitacoes' && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 pt-3">
            <TabNav tabs={SOL_TABS} active={solTab} onChange={setSolTab} />
          </div>
          <div className="p-4 flex flex-col gap-3">

          {solTab === 'hora_extra' && (
            <div className="flex flex-col gap-3">
              {!solicitacoes
                ? <HoraExtraLoader />
                : solicitacoes.horasExtras.length === 0
                ? <EmptyState image={ASSETS.emptyGestaoHoraExtra} title="Nenhuma hora extra pendente" />
                : solicitacoes.horasExtras.map((item: HoraExtraItem) => (
                    <SolicitacaoCard
                      key={item.solicitacaoID}
                      tipo="hora-extra"
                      nome={item.nomeColaborador}
                      foto={item.foto}
                      status={statusLabel(item.statusSolicitacao)}
                      detalhes={`${item.qtdadeHoras}h — ${item.projetoDescricao} — ${item.dataSolicitacao}`}
                      actions={
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setHeModal({ open: true, item })}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={aprovandoId === `he-${item.solicitacaoID}`}
                            onClick={async () => {
                              setAprovandoId(`he-${item.solicitacaoID}`);
                              try { await aprovar({ id: item.solicitacaoID, tipo: 'hora_extra', acao: 'R' }); }
                              finally { setAprovandoId(null); }
                            }}
                          >
                            {aprovandoId === `he-${item.solicitacaoID}` ? '…' : 'Reprovar'}
                          </Button>
                        </div>
                      }
                    />
                  ))
              }
            </div>
          )}

          {solTab === 'apropriacao' && (
            <div className="flex flex-col gap-3">
              {!solicitacoes
                ? <ApropriacaoLoader />
                : solicitacoes.apropriacao.length === 0
                ? <EmptyState image={ASSETS.emptyGestaoApropriacao} title="Nenhuma solicitação de liberação pendente" />
                : solicitacoes.apropriacao.map((item: ApropriacaoItem) => (
                    <SolicitacaoCard
                      key={item.id}
                      tipo="abono"
                      nome={item.nomeColaborador}
                      foto={item.foto ?? fotoByNome.get(item.nomeColaborador.trim()) ?? null}
                      status={statusLabel(item.status)}
                      hideTipoLabel
                      hideStatus
                      subtitle={`Data da Falta: ${item.data}`}
                      headerRight={<DateBox iso={item.data} />}
                      actions={
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={aprovandoId === `apr-${item.id}`}
                            onClick={async () => {
                              setAprovandoId(`apr-${item.id}`);
                              try { await aprovar({ id: item.id, idFalta: item.idFalta, tipo: 'apropriacao', acao: 'A' }); }
                              finally { setAprovandoId(null); }
                            }}
                          >
                            {aprovandoId === `apr-${item.id}` ? '…' : 'Aprovar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={aprovandoId === `apr-${item.id}`}
                            onClick={async () => {
                              setAprovandoId(`apr-${item.id}`);
                              try { await aprovar({ id: item.id, idFalta: item.idFalta, tipo: 'apropriacao', acao: 'R' }); }
                              finally { setAprovandoId(null); }
                            }}
                          >
                            Reprovar
                          </Button>
                        </div>
                      }
                    />
                  ))
              }
            </div>
          )}

          {solTab === 'ferias' && (
            <div className="flex flex-col gap-3">
              {!solicitacoes
                ? <FeriasLoader />
                : solicitacoes.ferias.length === 0
                ? <EmptyState image={ASSETS.emptyGestaoFerias} title="Nenhuma férias pendente" />
                : solicitacoes.ferias.map((item: FeriasRHItem) => (
                    <SolicitacaoCard
                      key={item.idFerias}
                      tipo="ferias"
                      nome={item.nomeColaborador}
                      foto={item.foto ?? fotoByNome.get(item.nomeColaborador.trim()) ?? null}
                      status={statusLabel(item.status)}
                      detalhes={
                        <div className="flex items-center justify-between gap-2">
                          <span>{item.dataInicio} → {item.dataFim}</span>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              disabled={aprovandoId === `fer-${item.idFerias}`}
                              onClick={async () => {
                                setAprovandoId(`fer-${item.idFerias}`);
                                try { await aprovar({ id: item.idFerias, tipo: 'ferias', acao: 'A' }); }
                                finally { setAprovandoId(null); }
                              }}
                            >
                              {aprovandoId === `fer-${item.idFerias}` ? '…' : 'Aprovar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={aprovandoId === `fer-${item.idFerias}`}
                              onClick={async () => {
                                setAprovandoId(`fer-${item.idFerias}`);
                                try { await aprovar({ id: item.idFerias, tipo: 'ferias', acao: 'R' }); }
                                finally { setAprovandoId(null); }
                              }}
                            >
                              Reprovar
                            </Button>
                          </div>
                        </div>
                      }
                    />
                  ))
              }
            </div>
          )}

          {solTab === 'abono' && (
            <div className="flex flex-col gap-3">
              {!solicitacoes
                ? <AbonoLoader />
                : solicitacoes.abonos.length === 0
                ? <EmptyState image={ASSETS.emptyGestaoAbonos} title="Nenhum abono/day-off pendente" />
                : solicitacoes.abonos.map((item: AbonoEquipeItem, i) => (
                    <SolicitacaoCard
                      key={`${item.idUnico}-${i}`}
                      tipo="dayoff"
                      nome={item.nomeColaborador}
                      foto={item.foto ?? fotoByNome.get(item.nomeColaborador.trim()) ?? null}
                      status={statusLabel(item.status)}
                      detalhes={`${item.tipo} — ${item.data}${item.horas ? ` (${item.horas}h)` : ''}`}
                      actions={
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={aprovandoId === `abo-${item.idUnico}`}
                            onClick={async () => {
                              setAprovandoId(`abo-${item.idUnico}`);
                              try { await aprovar({ id: Number(item.idUnico), tipo: 'abono', acao: 'A' }); }
                              finally { setAprovandoId(null); }
                            }}
                          >
                            {aprovandoId === `abo-${item.idUnico}` ? '…' : 'Aprovar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={aprovandoId === `abo-${item.idUnico}`}
                            onClick={async () => {
                              setAprovandoId(`abo-${item.idUnico}`);
                              try { await aprovar({ id: Number(item.idUnico), tipo: 'abono', acao: 'R' }); }
                              finally { setAprovandoId(null); }
                            }}
                          >
                            Reprovar
                          </Button>
                        </div>
                      }
                    />
                  ))
              }
            </div>
          )}
          </div>
        </div>
      )}

      {/* ── Alocar ──────────────────────────────────────────────────── */}
      {tab === 'alocar' && (
        isLoading
          ? <AlocarLoader />
          : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Aloque um colaborador em um projeto.
              </p>
              <Button onClick={() => setAlocarOpen(true)} className="w-full">
                Nova alocação
              </Button>
            </div>
          )
      )}

      {/* ── Gestão Funcional ─────────────────────────────────────────── */}
      {tab === 'gestao-funcional' && <GestaoFuncionalTab />}

      {/* ── Gestão de Projeto ────────────────────────────────────────── */}
      {tab === 'gestao-projeto' && <GestaoProjetoTab />}

        </div>
      </div>

      {/* Modal aprovar hora extra */}
      {heModal.item && (
        <ApprovalModal
          open={heModal.open}
          onClose={() => setHeModal({ open: false, item: null })}
          titulo={`Aprovar Hora Extra — ${heModal.item.nomeColaborador}`}
          fields={[
            { type: 'select', name: 'tipoAprovacao', label: 'Contabilizar como', options: [
              { value: 'B', label: 'Banco de Horas' },
              { value: 'P', label: 'Folha de Pagamento' },
            ]},
            { type: 'static',   name: 'projeto',          label: 'Projeto',               value: heModal.item.projetoDescricao },
            { type: 'textarea', name: 'observacaoGestor',  label: 'Observação (opcional)' },
          ]}
          confirmLabel="Confirmar"
          onConfirm={async (values) => {
            await aprovar({
              id:               heModal.item!.solicitacaoID,
              tipo:             'hora_extra',
              acao:             'A',
              tipoAprovacao:    values['tipoAprovacao'] || 'B',
              projeto:          heModal.item!.projetoId,
              observacaoGestor: values['observacaoGestor'] ?? '',
            });
            setHeModal({ open: false, item: null });
          }}
        />
      )}

      {/* Drawer alocar */}
      <DrawerForm
        open={alocarOpen}
        onClose={() => { setAlocarOpen(false); setAlocarPresel(null); }}
        title="Nova alocação"
        side="right"
      >
        <AlocarForm
          servicos={servicos}
          papeis={papeis}
          isSubmitting={isAlocando}
          presel={alocarPresel}
          onSubmit={async (input) => {
            await alocar(input);
            setAlocarOpen(false);
            setAlocarPresel(null);
          }}
        />
      </DrawerForm>

      {/* Drawer de membro */}
      <MembroDrawer
        membro={drawerMembro}
        pendencia={drawerPendencia}
        onClose={fecharDrawer}
        onAlocar={handleAlocarFromDrawer}
      />
    </div>
  );
}
