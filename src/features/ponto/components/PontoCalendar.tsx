'use client';

import { useState } from 'react';
import type { PontoDia } from '@/services/squadra-client';
import { ASSETS } from '@/lib/assets';
import { computeFaltaStatus, parseDMY, toMin, SEM_ABREV } from '../hooks/usePonto';

export function PontoLoading({ label = 'Carregando seu ponto...' }: { label?: string }) {
  return (
    <div className="ponto-loading-wrap" role="status" aria-live="polite">
      <span className="ponto-loading-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ponto-loading-panel" src={ASSETS.loadingPonto} alt="" loading="lazy" />
        <span className="ponto-clock-marker">
          <span className="ponto-clock-hand ponto-clock-hour" />
          <span className="ponto-clock-hand ponto-clock-minute" />
        </span>
      </span>
      <strong>{label}</strong>
    </div>
  );
}

// Cores das barras horizontais (espelham .pdr-bar--* do vanilla)
const BAR = {
  ok:     'bg-green-300',
  pend:   'bg-amber-300',
  err:    'bg-red-300',
  info:   'bg-blue-200',
  future: 'bg-gray-200',
} as const;

// Cores dos badges de status (espelham .pdr-status--* do vanilla)
const STATUS = {
  ok:   'bg-green-100 text-green-600',
  pend: 'bg-amber-100 text-amber-700',
  err:  'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-700',
} as const;

// Cor de cada CTA: liberar = verde (positivo), confirmar = vermelho (danger), demais = âmbar.
const CTA_CLS = {
  registrar: 'bg-amber-500 hover:bg-amber-600 text-white',
  apontar:   'bg-amber-500 hover:bg-amber-600 text-white',
  solicitar: 'bg-amber-500 hover:bg-amber-600 text-white',
  liberar:   'bg-green-600 hover:bg-green-700 text-white',
  confirmar: 'bg-red-600 hover:bg-red-700 text-white',
} as const;

type BarKey    = keyof typeof BAR;
type StatusKey = keyof typeof STATUS;
type CtaTipo   = 'registrar' | 'solicitar' | 'apontar' | 'liberar' | 'confirmar';
type Cta       = { tipo: CtaTipo; label: string };

interface DiaComputed {
  barKey:      BarKey;
  statusKey:   StatusKey | null;
  statusText:  string;
  showBadge:   boolean;
  ctas:        Cta[];            // pode ter mais de um (ex.: gestor com Liberar + Confirmar falta)
  liberadoBtn: boolean;          // botão verde "Liberado" (falta aprovada com horas)
  aguardarBtn: boolean;          // botão cinza "Aguardar" (disabled)
  horasDisplay: string;
  horaExtra:   string;
}

// Replica a árvore de decisão de renderDias() do web-app vanilla (visão colaborador).
// gestorMode SOBRESCREVE os CTAs pela regra do app-react (dirigida por flags do backend):
//   confirmaFalta → "Confirmar falta" (marcaFalta/cadastrar)
//   permissaoLiberacao OU falta passada → "Liberar" (removeFaltaColab — liberação livre,
//   mantida mesmo sem permissaoLiberacao e mesmo em dia que já passou).
function computeDia(dia: PontoDia, hoje: Date, gestorMode = false): DiaComputed {
  const diaDate  = parseDMY(dia.data);
  const prevMin  = toMin(dia.horasPrevistas);
  const realMin  = toMin(dia.horasRealizadas);
  const st       = dia.statusLiberacaoFalta || '';
  const isFeriado = dia.fimDeSemana;
  const isAbono   = dia.isFalta && !!dia.horasAbono && dia.horasAbono !== '00:00' && !!dia.descricaoTipoAbono;
  const isToday   = diaDate.getTime() === hoje.getTime();
  const isFaltaDia = dia.isFalta || (dia.falta && Number(dia.faltaId) > 0);

  const base: DiaComputed = {
    barKey: 'pend', statusKey: null, statusText: '', showBadge: false,
    ctas: [], liberadoBtn: false, aguardarBtn: false,
    horasDisplay: '', horaExtra: '',
  };

  const horaExtra = dia.horaExtra && dia.horaExtra !== '00:00' ? dia.horaExtra : '';
  const horasDisplay = isAbono
    ? dia.horasAbono
    : (dia.horasRealizadas !== '00:00' ? dia.horasRealizadas : '');

  let r: DiaComputed = { ...base, horaExtra, horasDisplay };

  if (isFeriado) {
    r = { ...r, barKey: 'info', statusKey: 'info', statusText: 'Feriado' };
  } else if (isAbono) {
    r = { ...r, barKey: 'info', statusKey: 'info', statusText: dia.descricaoTipoAbono };
  } else if (prevMin === 0 && !isToday) {
    r = { ...r, barKey: 'info', statusKey: 'info', statusText: 'Feriado' };
  } else if (dia.isFalta && st === 'A') {
    r = { ...r, barKey: 'ok', statusKey: 'ok' };
    if (realMin === 0) {
      r = { ...r, statusText: 'Liberado', ctas: [{ tipo: 'apontar', label: 'Apontar' }] };
    } else {
      r = { ...r, liberadoBtn: true };
    }
  } else if (dia.isFalta && st === 'R') {
    r = { ...r, barKey: 'err', statusKey: 'err', statusText: 'Recusado' };
  } else if (isFaltaDia) {
    const fSt = computeFaltaStatus(dia);
    if (fSt === 'nao_solicitado') {
      r = { ...r, barKey: 'err', ctas: [{ tipo: 'solicitar', label: 'Solicitar' }] };
    } else if (fSt === 'pendente' && realMin > 0) {
      r = { ...r, barKey: 'ok' };
    } else {
      r = { ...r, barKey: 'pend', aguardarBtn: true };
    }
  } else if (realMin === 0 && prevMin > 0) {
    r = { ...r, barKey: 'pend', statusKey: 'pend', statusText: 'Sem apontamento', ctas: [{ tipo: 'registrar', label: 'Registrar' }] };
  } else if (realMin >= prevMin) {
    r = { ...r, barKey: 'ok' };
  } else {
    r = { ...r, barKey: 'pend', statusKey: 'pend', statusText: dia.horasRealizadas || '—' };
  }

  // ── Modo gestor (regra do squadra-app-react) ────────────────────────────────
  // Dia com falta aplicada e ainda não liberada → o gestor escolhe:
  //   • Confirmar falta (sempre) → marcaFalta/cadastrar
  //   • Liberar (excusar)        → removeFaltaColab
  // No app-react o "Liberar" só aparece no dia útil anterior; aqui mantemos a
  // liberação LIVRE (qualquer falta passada), por pedido do usuário.
  if (gestorMode) {
    const ctas: Cta[] = [];
    const jaLiberada = dia.liberacaoGestor === 'S' || dia.statusLiberacaoFalta === 'A';
    const confirmada = !!dia.confirmaFalta;
    if (isFaltaDia && jaLiberada) {
      // Liberada: se a pessoa já apropriou (tem horas) → "Apropriado"; senão "Falta liberada".
      r = realMin > 0
        ? { ...r, barKey: 'ok', statusKey: 'ok', statusText: 'Apropriado' }
        : { ...r, barKey: 'ok', statusKey: 'ok', statusText: 'Falta liberada' };
    } else if (isFaltaDia && confirmada) {
      // Já confirmada → ação encerrada no app (alterar só via chamado) → chip readonly.
      r = { ...r, barKey: 'err', statusKey: 'err', statusText: 'Falta confirmada' };
    } else if (isFaltaDia) {
      // Pendente de decisão do gestor: liberar (livre, passado) ou confirmar a falta.
      if (!isToday) ctas.push({ tipo: 'liberar', label: 'Liberar' });
      ctas.push({ tipo: 'confirmar', label: 'Falta' });
    }
    // Limpa o botão "Liberado" do colaborador — no gestor o status vira chip único.
    r = { ...r, ctas, aguardarBtn: false, liberadoBtn: false };
  }

  // showBadge: oculta badge quando barra ok e não é falta (visão colaborador).
  // No modo gestor, os status próprios (chips readonly) sempre aparecem.
  const statusGestor = gestorMode && ['Apropriado', 'Falta confirmada', 'Falta liberada'].includes(r.statusText);
  r.showBadge = statusGestor || (!!r.statusText && !(r.barKey === 'ok' && !dia.isFalta));
  return r;
}

interface PontoCalendarProps {
  dias:          PontoDia[];
  loading?:      boolean;
  onDiaClick:    (dia: PontoDia, tipo?: CtaTipo) => void;
  onSolicitar?:  (idFalta: number) => Promise<void>;
  hideProjetos?: boolean;   // oculta a coluna de horários do projeto (uso em espaços estreitos, ex.: drawer)
  gestorMode?:   boolean;   // CTAs do gestor ("Liberar"/"Confirmar falta") em vez dos do colaborador
}

export function PontoCalendar({ dias, loading, onDiaClick, onSolicitar, hideProjetos, gestorMode }: PontoCalendarProps) {
  // Dia + dia-da-semana ficam numa só célula (1ª coluna), liberando espaço.
  // Sem a coluna do projeto, a coluna de ações vira 1fr para a barra preencher a linha.
  const gridCols = hideProjetos
    ? 'grid-cols-[64px_42px_1fr]'
    : 'grid-cols-[64px_1fr_42px_auto]';
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [solicitando, setSolicitando] = useState<string | null>(null);

  if (loading) return <PontoLoading />;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Ordena por data; remove apenas sábados/domingos reais (feriado no meio da semana fica)
  const sorted = [...dias]
    .filter((d) => !(d.fimDeSemana && (d.diaSemana === 'Sabado' || d.diaSemana === 'Domingo')))
    .sort((a, b) => parseDMY(a.data).getTime() - parseDMY(b.data).getTime());

  let hojeInserido   = false;
  let futuroInserido = false;
  const rows: React.ReactNode[] = [];

  for (const dia of sorted) {
    const diaDate  = parseDMY(dia.data);
    const isFuture = diaDate > hoje;
    const isToday  = diaDate.getTime() === hoje.getTime();
    const abrev    = SEM_ABREV[dia.diaSemana] ?? dia.diaSemana.slice(0, 3);

    if (isToday && !hojeInserido) {
      hojeInserido = true;
      rows.push(<Divider key="divider-hoje" label="hoje" tone="hoje" />);
    }
    if (isFuture && !futuroInserido) {
      futuroInserido = true;
      rows.push(<Divider key="divider-futuro" label="futuro" tone="futuro" />);
    }

    // Linha futura: barra cinza, sem horários nem status
    if (isFuture) {
      rows.push(
        <div
          key={dia.data}
          className={`grid ${gridCols} items-center gap-x-1.5 px-3.5 py-2.5 border-b border-gray-100 last:border-0 text-[0.82rem] opacity-35 pointer-events-none`}
        >
          <span className="font-semibold text-gray-700 whitespace-nowrap">
            {dia.data.slice(0, 5)} <span className="text-[0.72rem] font-normal text-gray-400">{abrev}</span>
          </span>
          {!hideProjetos && <span />}
          <span />
          <div className="flex items-center gap-1.5 min-w-[120px]">
            <div className={`flex-1 min-w-[40px] h-1.5 rounded-full ${BAR.future}`} />
          </div>
        </div>,
      );
      continue;
    }

    const c = computeDia(dia, hoje, gestorMode);

    const projetoTimes = Array.isArray(dia.projeto) && dia.projeto.length > 0
      ? dia.projeto.map((p) => `${p.horaInicio}–${p.horaTermino}`).join(' — ')
      : '';

    // Botão "Solicitar" inline já clicado nesta sessão
    const jaSolicitado = solicitados.has(dia.data);
    const podeSolicitarInline = !!onSolicitar && c.ctas.some((x) => x.tipo === 'solicitar') && dia.faltaId > 0;

    rows.push(
      <div
        key={dia.data}
        className={`grid ${gridCols} items-center gap-x-1.5 px-3.5 py-2.5 border-b border-gray-100 last:border-0 text-[0.82rem] hover:bg-gray-50`}
      >
        <span className="font-semibold text-gray-700 whitespace-nowrap">
          {dia.data.slice(0, 5)} <span className="text-[0.72rem] font-normal text-gray-400">{abrev}</span>
        </span>
        {!hideProjetos && (
          <span className="text-[0.72rem] text-gray-500 leading-snug break-words">{projetoTimes}</span>
        )}
        <span className="text-[0.82rem] font-bold text-gray-700 text-right leading-tight">
          {c.horasDisplay}
          {c.horaExtra && <span className="block text-[0.66rem] font-bold text-red-600 leading-tight">+{c.horaExtra}</span>}
        </span>

        <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-[120px]">
          {/* Barra horizontal */}
          <div className={`flex-1 min-w-[40px] h-1.5 rounded-full ${BAR[c.barKey]}`} />

          {/* Botão verde "Liberado" (falta aprovada com horas) */}
          {c.liberadoBtn && (
            <span className="text-[0.7rem] font-bold rounded-md px-2 py-1 bg-green-100 text-green-600 border border-green-200 whitespace-nowrap">
              Liberado
            </span>
          )}

          {/* Badge de status */}
          {c.showBadge && c.statusKey && (
            <span className={`text-[0.68rem] font-bold rounded-full px-2 py-0.5 whitespace-nowrap ${STATUS[c.statusKey]}`}>
              {c.statusText}
            </span>
          )}

          {/* Botão "Aguardar" (disabled) */}
          {c.aguardarBtn && (
            <button
              type="button"
              disabled
              className="text-[0.7rem] font-bold rounded-md px-2 py-1 bg-amber-500 text-white opacity-50 cursor-default whitespace-nowrap"
            >
              Aguardar
            </button>
          )}

          {/* CTAs: pode ter mais de um (ex.: gestor com Liberar + Confirmar falta) */}
          {c.ctas.map((cta) => {
            // Solicitar (colaborador): inline quando possível, senão abre o drawer.
            if (cta.tipo === 'solicitar') {
              if (jaSolicitado) {
                return (
                  <span key="solicitado" className="text-[0.7rem] font-bold rounded-md px-2.5 py-1 bg-green-600 text-white whitespace-nowrap">
                    ✓ Solicitado
                  </span>
                );
              }
              if (podeSolicitarInline) {
                return (
                  <button
                    key="solicitar-inline"
                    type="button"
                    disabled={solicitando === dia.data}
                    onClick={async () => {
                      if (!onSolicitar || solicitando) return;
                      setSolicitando(dia.data);
                      try {
                        await onSolicitar(dia.faltaId);
                        setSolicitados((prev) => new Set(prev).add(dia.data));
                      } finally {
                        setSolicitando(null);
                      }
                    }}
                    className={`text-[0.7rem] font-bold rounded-md px-2.5 py-1 whitespace-nowrap disabled:opacity-50 ${CTA_CLS.solicitar}`}
                  >
                    {solicitando === dia.data ? 'Solicitando…' : 'Solicitar'}
                  </button>
                );
              }
            }
            return (
              <button
                key={cta.tipo}
                type="button"
                onClick={() => onDiaClick(dia, cta.tipo)}
                className={`text-[0.7rem] font-bold rounded-md px-2.5 py-1 whitespace-nowrap ${CTA_CLS[cta.tipo]}`}
              >
                {cta.label}
              </button>
            );
          })}
        </div>
      </div>,
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-3.5 pt-3 pb-1">
        <h2 className="text-[0.78rem] font-bold text-gray-400 uppercase tracking-wide">
          Registro do mês
        </h2>
      </div>

      {rows}

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-3.5 py-3 border-t border-gray-100">
        {[
          { color: BAR.ok,     label: 'OK' },
          { color: BAR.pend,   label: 'Pendente' },
          { color: BAR.err,    label: 'Falta / Recusado' },
          { color: BAR.info,   label: 'Feriado / Abono' },
          { color: BAR.future, label: 'Futuro' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Divider({ label, tone }: { label: string; tone: 'hoje' | 'futuro' }) {
  const line = tone === 'hoje' ? 'bg-blue-200' : 'bg-gray-200';
  const text = tone === 'hoje' ? 'text-blue-300' : 'text-gray-300';
  return (
    <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-1.5">
      <div className={`flex-1 h-px ${line}`} />
      <span className={`text-[0.7rem] font-semibold uppercase tracking-wider ${text}`}>{label}</span>
      <div className={`flex-1 h-px ${line}`} />
    </div>
  );
}
