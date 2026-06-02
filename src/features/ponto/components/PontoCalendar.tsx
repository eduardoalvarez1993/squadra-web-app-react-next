'use client';

import { useState } from 'react';
import type { PontoDia } from '@/services/squadra-client';
import { ASSETS } from '@/lib/assets';
import { computeFaltaStatus, parseDMY } from '../hooks/usePonto';

export function PontoLoading({ label = 'Carregando seu ponto...' }: { label?: string }) {
  return (
    <div className="ponto-loading-wrap">
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

function toMin(t: string): number {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
}

function normalizeStr(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
}

function getAbonoBadge(dia: PontoDia): string {
  const tipo = normalizeStr(dia.descricaoTipoAbono || '');
  if (tipo.includes('FERIA')) return 'Férias';
  if (tipo.includes('DAY'))   return 'Day-off';
  return dia.descricaoTipoAbono || 'Feriado / Abono';
}

type DayVariant = 'apontado' | 'pendente' | 'falta' | 'feriado' | 'futuro';

function getDayVariant(dia: PontoDia, hoje: Date): DayVariant {
  const dataDate = parseDMY(dia.data);
  if (dataDate > hoje) return 'futuro';

  const prevMin = toMin(dia.horasPrevistas);
  const realMin = toMin(dia.horasRealizadas);

  if (dia.isAbono || (prevMin === 0 && dataDate.getTime() !== hoje.getTime())) return 'feriado';

  if (dia.isFalta) {
    const st = computeFaltaStatus(dia);
    if (st === 'aprovado') return 'apontado';
    if (st === 'recusado') return 'falta';
    return 'pendente';
  }

  if (realMin === 0 && prevMin > 0) return 'pendente';
  if (realMin >= prevMin) return 'apontado';
  return 'pendente';
}

const barColor: Record<DayVariant, string> = {
  apontado: 'bg-green-500',
  pendente: 'bg-yellow-400',
  falta:    'bg-red-500',
  feriado:  'bg-blue-400',
  futuro:   'bg-muted-foreground/20',
};

interface PontoCalendarProps {
  dias:         PontoDia[];
  loading?:     boolean;
  onDiaClick:   (dia: PontoDia) => void;
  onSolicitar?: (idFalta: number) => Promise<void>;
}

export function PontoCalendar({ dias, loading, onDiaClick, onSolicitar }: PontoCalendarProps) {
  // Dias que tiveram "Solicitar" clicado inline — evita abrir drawer
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [solicitando, setSolicitando] = useState<string | null>(null);

  if (loading) return <PontoLoading />;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasUteis = dias
    .filter((d) => !d.fimDeSemana)
    .sort((a, b) => parseDMY(a.data).getTime() - parseDMY(b.data).getTime());

  let hojeInserido   = false;
  let futuroInserido = false;
  const rows: React.ReactNode[] = [];

  for (const dia of diasUteis) {
    const dataDate = parseDMY(dia.data);
    const isFuture = dataDate > hoje;
    const isToday  = dataDate.getTime() === hoje.getTime();

    if (isToday && !hojeInserido) {
      hojeInserido = true;
      rows.push(
        <div key="divider-hoje" className="flex items-center gap-2 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">hoje</span>
          <div className="flex-1 h-px bg-border" />
        </div>,
      );
    }
    if (isFuture && !futuroInserido) {
      futuroInserido = true;
      rows.push(
        <div key="divider-futuro" className="flex items-center gap-2 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">futuro</span>
          <div className="flex-1 h-px bg-border" />
        </div>,
      );
    }

    const variant  = getDayVariant(dia, hoje);
    const clicavel = variant !== 'feriado' && variant !== 'futuro';
    const prevMin  = toMin(dia.horasPrevistas);
    const realMin  = toMin(dia.horasRealizadas);

    // Badge de status
    const badge = (() => {
      if (variant === 'futuro' || variant === 'apontado') return null;
      if (variant === 'feriado') return getAbonoBadge(dia);
      if (dia.isFalta) {
        const st = computeFaltaStatus(dia);
        if (st === 'recusado') return 'Recusado';
        if (st === 'aprovado' && realMin === 0) return 'Liberado';
        return null;
      }
      if (realMin === 0 && prevMin > 0) return 'Sem apontamento';
      return null;
    })();

    // Hora extra
    const horaExtra = dia.horaExtra && dia.horaExtra !== '00:00' ? dia.horaExtra : null;

    // Horários dos projetos: "09:00–18:00 · 14:00–16:00"
    const projetoTimes = Array.isArray(dia.projeto) && dia.projeto.length > 0
      ? dia.projeto.map((p) => `${p.horaInicio}–${p.horaTermino}`).join(' · ')
      : null;

    // Botão inline solicitar (apenas se nao_solicitado e não já solicitado)
    const faltaStatus = dia.isFalta ? computeFaltaStatus(dia) : null;
    const podeSolicitarInline =
      onSolicitar &&
      faltaStatus === 'nao_solicitado' &&
      dia.faltaId > 0 &&
      !solicitados.has(dia.data);
    const jaSolicitadoInline = solicitados.has(dia.data);

    const [diaNum, mes] = dia.data.split('/');
    const diaSemanaAbrev = dia.diaSemana.slice(0, 3);

    rows.push(
      <button
        key={dia.data}
        type="button"
        onClick={() => clicavel && !podeSolicitarInline && onDiaClick(dia)}
        disabled={!clicavel}
        className={[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
          clicavel && !podeSolicitarInline
            ? 'hover:bg-accent active:bg-accent/80'
            : 'cursor-default',
          isFuture ? 'opacity-35' : '',
        ].join(' ')}
      >
        {/* Data */}
        <div className="w-10 flex-shrink-0 text-center">
          <div className="text-sm font-semibold leading-tight">{diaNum}/{mes}</div>
          <div className="text-xs text-muted-foreground leading-tight">{diaSemanaAbrev}</div>
        </div>

        {/* Barra de cor */}
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${barColor[variant]}`} />

        {/* Conteúdo central */}
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {!isFuture && realMin > 0 && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {dia.horasRealizadas}
              </span>
            )}
            {horaExtra && (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                +{horaExtra}
              </span>
            )}
            {isFuture && (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          {projetoTimes && !isFuture && (
            <span className="text-xs text-muted-foreground truncate">{projetoTimes}</span>
          )}
        </div>

        {/* Ação / badge direita */}
        <div className="flex-shrink-0 flex items-center">
          {jaSolicitadoInline ? (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Solicitado</span>
          ) : podeSolicitarInline ? (
            <button
              type="button"
              disabled={solicitando === dia.data}
              onClick={async (e) => {
                e.stopPropagation();
                if (!onSolicitar || solicitando) return;
                setSolicitando(dia.data);
                try {
                  await onSolicitar(dia.faltaId);
                  setSolicitados((prev) => new Set(prev).add(dia.data));
                } finally {
                  setSolicitando(null);
                }
              }}
              className="text-xs font-medium px-2 py-0.5 rounded-full border border-yellow-400 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-50 transition-colors"
            >
              {solicitando === dia.data ? '…' : 'Solicitar'}
            </button>
          ) : badge ? (
            <span
              className={[
                'text-xs font-medium px-2 py-0.5 rounded-full',
                variant === 'feriado'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : variant === 'falta'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
              ].join(' ')}
            >
              {badge}
            </span>
          ) : null}
        </div>
      </button>,
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-3 pb-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Registro do mês
        </h2>
      </div>

      {rows}

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 pt-3">
        {[
          { color: 'bg-green-500',           label: 'OK' },
          { color: 'bg-yellow-400',          label: 'Pendente' },
          { color: 'bg-red-500',             label: 'Falta / Recusado' },
          { color: 'bg-blue-400',            label: 'Feriado / Abono' },
          { color: 'bg-muted-foreground/20', label: 'Futuro' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
