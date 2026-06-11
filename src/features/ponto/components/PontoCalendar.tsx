'use client';

import { useState } from 'react';
import type { PontoDia } from '@/services/squadra-client';
import { ASSETS } from '@/lib/assets';
import { computeFaltaStatus, parseDMY, toMin, horaExtraAprovadaMin, isAbonoReal, SEM_ABREV } from '../hooks/usePonto';

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

export interface DiaComputed {
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
export function computeDia(dia: PontoDia, hoje: Date, gestorMode = false): DiaComputed {
  const diaDate  = parseDMY(dia.data);
  const prevMin  = toMin(dia.horasPrevistas);
  const realMin  = toMin(dia.horasRealizadas);
  const st       = dia.statusLiberacaoFalta || '';
  const isFeriado = dia.fimDeSemana;
  // Sáb/Dom de verdade ("sem hora prevista") × feriado em dia útil (backend manda
  // fimDeSemana:true ou carga 0 num dia de semana) → "Feriado" prevalece.
  const ehFimDeSemanaReal = dia.diaSemana === 'Sabado' || dia.diaSemana === 'Domingo';
  const isAbono   = isAbonoReal(dia);
  const isToday   = diaDate.getTime() === hoje.getTime();
  const isFaltaDia = dia.isFalta || (dia.falta && Number(dia.faltaId) > 0);
  // Dia que já tem apontamento lançado (JORNADA ou HORA_EXTRA). `realMin` só conta
  // jornada, então um dia 100% hora extra tem realMin=0 mas NÃO está "sem apontamento".
  const temApontamento = (Array.isArray(dia.projeto) && dia.projeto.length > 0) || toMin(dia.horaExtra) > 0;
  // Hora extra aprovada (status 3) ainda não apontada nesse dia.
  const heLiberada = horaExtraAprovadaMin(dia) - toMin(dia.horaExtra) > 0;

  const base: DiaComputed = {
    barKey: 'pend', statusKey: null, statusText: '', showBadge: false,
    ctas: [], liberadoBtn: false, aguardarBtn: false,
    horasDisplay: '', horaExtra: '',
  };

  const horaExtra = dia.horaExtra && dia.horaExtra !== '00:00' ? dia.horaExtra : '';
  // Sempre exibe um valor na coluna de horas (00:00 quando zerado) para a coluna
  // ficar alinhada; o tom (cinza claro vs escuro) é decidido no render.
  const horasDisplay = isAbono ? dia.horasAbono : (dia.horasRealizadas || '00:00');

  let r: DiaComputed = { ...base, horaExtra, horasDisplay };

  if (isFeriado) {
    r = { ...r, barKey: 'info', statusKey: 'info', statusText: ehFimDeSemanaReal ? 'Sem hora prevista' : 'Feriado' };
  } else if (isAbono) {
    r = { ...r, barKey: 'info', statusKey: 'info', statusText: dia.descricaoTipoAbono };
  } else if (prevMin === 0 && !isToday) {
    // Dia útil sem carga prevista → feriado.
    r = { ...r, barKey: 'info', statusKey: 'info', statusText: 'Feriado' };
  } else if (isFaltaDia && (st === 'A' || dia.liberacaoGestor === 'S')) {
    // Falta liberada — por aprovação da solicitação (statusLiberacaoFalta 'A') OU
    // liberação direta do gestor (liberacaoGestor 'S', que às vezes vem sem status).
    // Vale como dia normal: pode bater/completar.
    r = { ...r, barKey: 'ok', statusKey: 'ok' };
    if (realMin === 0 && !temApontamento) {
      // Liberada e nada lançado ainda → oferece bater ponto.
      r = { ...r, statusText: 'Liberado', ctas: [{ tipo: 'apontar', label: 'Apontar' }] };
    } else if (realMin > 0 && realMin < prevMin) {
      // Liberada mas jornada incompleta → permite completar o dia.
      r = { ...r, statusText: 'Liberado', ctas: [{ tipo: 'registrar', label: 'Registrar' }] };
    } else {
      // Liberada e com a jornada coberta (ou só hora extra) → selo "Liberado".
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
  } else if (realMin === 0 && prevMin > 0 && !temApontamento) {
    r = { ...r, barKey: 'pend', statusKey: 'pend', statusText: 'Sem apontamento', ctas: [{ tipo: 'registrar', label: 'Registrar' }] };
  } else if (realMin === 0 && temApontamento) {
    // Dia sem jornada mas com hora extra lançada → nada pendente; mostra a HE (+hh:mm).
    r = { ...r, barKey: 'ok' };
  } else if (realMin >= prevMin) {
    r = { ...r, barKey: 'ok' };
  } else {
    // Jornada incompleta (bateu parte do dia): oferece "Registrar" para completar.
    // As horas já aparecem na coluna numérica; o botão dá o caminho de ação.
    r = { ...r, barKey: 'pend', ctas: [{ tipo: 'registrar', label: 'Registrar' }] };
  }

  // Hora extra APROVADA e ainda não apontada → chip "H.Extra liberada" + botão Registrar
  // (visão colaborador). Some sozinho quando a HE é apontada. Não aplica no modo gestor.
  if (heLiberada && !gestorMode) {
    r = {
      ...r,
      statusKey: 'ok',
      statusText: 'H.Extra liberada',
      ctas: [{ tipo: 'registrar', label: 'Registrar' }],
      liberadoBtn: false,
      aguardarBtn: false,
    };
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
  r.showBadge = statusGestor || (heLiberada && !gestorMode) || (!!r.statusText && !(r.barKey === 'ok' && !dia.isFalta));
  return r;
}

interface PontoCalendarProps {
  dias:          PontoDia[];
  loading?:      boolean;
  onDiaClick:    (dia: PontoDia, tipo?: CtaTipo) => void;
  onSolicitar?:  (idFalta: number, dataISO?: string) => Promise<void>;
  hideProjetos?: boolean;   // oculta a coluna de horários do projeto (uso em espaços estreitos, ex.: drawer)
  gestorMode?:   boolean;   // CTAs do gestor ("Liberar"/"Confirmar falta") em vez dos do colaborador
  bloqueado?:    boolean;   // mês fechado: somente leitura — sem nenhum botão de ação
}

export function PontoCalendar({ dias, loading, onDiaClick, onSolicitar, hideProjetos, gestorMode, bloqueado }: PontoCalendarProps) {
  // Dia + dia-da-semana ficam numa só célula (1ª coluna), liberando espaço.
  // Sem a coluna do projeto, a coluna de ações vira 1fr para a barra preencher a linha.
  // data | horas (coluna fixa → alinhada em todas as linhas) | ações (flexível).
  // Os horários do projeto vão numa 2ª linha, para não empurrar a coluna de horas.
  const gridCols = 'grid-cols-[64px_56px_1fr]';
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [solicitando, setSolicitando] = useState<string | null>(null);

  if (loading) return <PontoLoading />;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Ordena por data. Mantém todos os dias (inclusive fim de semana / carga 0): eles
  // aparecem como "Sem hora prevista" e podem receber hora extra aprovada.
  const sorted = [...dias]
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

    // Linha clicável (abre o drawer de qualquer dia): só na visão colaborador e mês
    // aberto. Permite gerenciar inclusive dias completos (sem CTA próprio), como no app.
    const rowClickable = !gestorMode && !bloqueado;

    rows.push(
      <div
        key={dia.data}
        role={rowClickable ? 'button' : undefined}
        tabIndex={rowClickable ? 0 : undefined}
        onClick={rowClickable ? () => onDiaClick(dia) : undefined}
        onKeyDown={rowClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDiaClick(dia); } } : undefined}
        className={`flex flex-col px-3.5 py-2.5 border-b border-gray-100 last:border-0 text-[0.82rem] hover:bg-gray-50 ${rowClickable ? 'cursor-pointer' : ''}`}
      >
        <div className={`grid ${gridCols} items-center gap-x-1.5`}>
        <span className="font-semibold text-gray-700 whitespace-nowrap">
          {dia.data.slice(0, 5)} <span className="text-[0.72rem] font-normal text-gray-400">{abrev}</span>
        </span>
        <span className={`text-[0.82rem] font-bold text-right leading-tight tabular-nums ${c.horasDisplay === '00:00' ? 'text-gray-300' : 'text-gray-700'}`}>
          {c.horasDisplay}
          {c.horaExtra && <span className="block text-[0.82rem] font-bold text-red-600 leading-tight">+{c.horaExtra}</span>}
        </span>

        <div
          className="flex flex-wrap items-center justify-end gap-1.5 min-w-[120px]"
          // Área de ações: cliques aqui (botões/barra) não abrem o drawer da linha.
          onClick={(e) => e.stopPropagation()}
        >
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
          {!bloqueado && c.aguardarBtn && (
            <button
              type="button"
              disabled
              className="text-[0.7rem] font-bold rounded-md px-2 py-1 bg-amber-500 text-white opacity-50 cursor-default whitespace-nowrap"
            >
              Aguardar
            </button>
          )}

          {/* CTAs: pode ter mais de um (ex.: gestor com Liberar + Confirmar falta) */}
          {!bloqueado && c.ctas.map((cta) => {
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
                      const [dd, mm, yy] = dia.data.split('/');
                      try {
                        await onSolicitar(dia.faltaId, `${yy}-${mm}-${dd}`);
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
        </div>

        {/* 2ª linha: horários do projeto (não empurra a coluna de horas). */}
        {!hideProjetos && projetoTimes && (
          <div className="text-[0.72rem] text-gray-500 leading-snug break-words pl-[68px] pt-1">
            {projetoTimes}
          </div>
        )}
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
          { color: BAR.info,   label: 'Feriado / Sem previsão / Abono' },
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
