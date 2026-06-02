'use client';

import { useState } from 'react';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { Button } from '@/components/ui/button';
import type { FeriasDados } from '@/services/squadra-client';

const CHIPS_DIAS = [8, 10, 14, 15, 20, 30];

interface FeriasFormProps {
  dados:         FeriasDados | undefined;
  onSolicitar:   (inicio: string, fim: string) => Promise<void>;
  isSolicitando: boolean;
}

function isoParaBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function brParaISO(br: string): string {
  const [d, m, y] = br.split('/');
  return `${y}-${m}-${d}`;
}

function calcFim(inicioISO: string, dias: number): string {
  const d = new Date(inicioISO + 'T00:00:00');
  d.setDate(d.getDate() + dias - 1);
  return d.toISOString().slice(0, 10);
}

function minDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 31);
  return d.toISOString().slice(0, 10);
}

// Normaliza string de data (DD/MM/YYYY ou YYYY-MM-DD) para ISO
function toISO(s: string | null | undefined): string | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return brParaISO(s);
  return null;
}

export function FeriasForm({ dados, onSolicitar, isSolicitando }: FeriasFormProps) {
  const [inicio,   setInicio]   = useState('');
  const [dias,     setDias]     = useState<number | null>(null);
  const [ok,       setOk]       = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const saldo     = dados?.saldoFeriasColaborador ?? 0;
  const semSaldo  = saldo <= 0;

  // Datas calculadas
  const fimISO    = inicio && dias ? calcFim(inicio, dias) : null;
  const inicioFmt = inicio ? new Date(inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  const fimFmt    = fimISO ? new Date(fimISO + 'T00:00:00').toLocaleDateString('pt-BR') : '';

  function validate(): string | null {
    if (!inicio)       return 'Selecione a data de início';
    if (!dias)         return 'Selecione a quantidade de dias';

    const inicioDate = new Date(inicio + 'T00:00:00');

    // Regra 1: mínimo 30 dias a partir de hoje
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 30);
    if (inicioDate < minDate) {
      return 'A data de início deve ser pelo menos 30 dias a partir de hoje.';
    }

    // Regra 2: não pode iniciar na sexta-feira (5)
    if (inicioDate.getDay() === 5) {
      return 'Não é permitido iniciar férias em uma sexta-feira.';
    }

    // Regra 3: dentro do período de gozo
    const gozoIniISO = toISO(dados?.inicioPeriodoDeGozoColaborador);
    const gozoFimISO = toISO(dados?.terminoPeriodoDeGozoColaborador);
    if (gozoIniISO && gozoFimISO) {
      const gIni = new Date(gozoIniISO + 'T00:00:00');
      const gFim = new Date(gozoFimISO + 'T00:00:00');
      if (inicioDate < gIni || inicioDate > gFim) {
        return `A data deve estar dentro do período de gozo (${new Date(gozoIniISO + 'T00:00:00').toLocaleDateString('pt-BR')} – ${new Date(gozoFimISO + 'T00:00:00').toLocaleDateString('pt-BR')}).`;
      }
    }

    // Regra 4: saldo suficiente
    if (dias > saldo) {
      return `Você possui apenas ${saldo} dias disponíveis.`;
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setError(null);
    try {
      await onSolicitar(inicio, fimISO!);
      setOk(true);
      setInicio('');
      setDias(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (semSaldo) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-sm font-semibold text-red-700">Saldo de férias esgotado.</p>
        <p className="text-xs text-red-600 mt-0.5">Você não possui dias disponíveis para solicitar férias.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Data de início */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ferias-inicio" className="text-sm font-semibold text-foreground">
          Data de início
        </label>
        <input
          id="ferias-inicio"
          type="date"
          min={minDateISO()}
          value={inicio}
          onChange={(e) => { setInicio(e.target.value); setOk(false); setError(null); }}
          disabled={isSolicitando}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Chips de quantidade de dias */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground">Quantidade de dias</label>
        <div className="flex flex-wrap gap-2">
          {CHIPS_DIAS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDias(d); setOk(false); setError(null); }}
              disabled={isSolicitando}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors',
                dias === d
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white border-border text-foreground hover:border-primary hover:text-primary',
              ].join(' ')}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Preview da solicitação */}
      {inicio && dias && fimISO && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          Suas férias serão solicitadas para início dia{' '}
          <strong>{inicioFmt}</strong> até dia <strong>{fimFmt}</strong>.
        </div>
      )}

      <FormFeedback type={ok ? 'ok' : error ? 'error' : null} message={ok ? 'Férias solicitadas com sucesso!' : error ?? ''} />

      <Button
        type="submit"
        disabled={isSolicitando || !inicio || !dias}
        className="w-full"
      >
        {isSolicitando ? 'Solicitando…' : 'Solicitar Férias'}
      </Button>
    </form>
  );
}
