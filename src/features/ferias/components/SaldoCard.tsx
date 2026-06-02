import { Skeleton } from '@/components/shared/Skeleton';
import type { FeriasDados } from '@/services/squadra-client';

interface SaldoCardProps {
  dados:     FeriasDados | undefined;
  isLoading: boolean;
}

function fmt(s: string | null | undefined): string {
  if (!s) return '—';
  // Já está em DD/MM/YYYY → retorna direto
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // ISO YYYY-MM-DD → converte
  const [y, m, d] = s.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return s;
}

export function SaldoCard({ dados, isLoading }: SaldoCardProps) {
  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;

  const saldo   = dados?.saldoFeriasColaborador ?? 0;
  const gozoIni = fmt(dados?.inicioPeriodoDeGozoColaborador);
  const gozoFim = fmt(dados?.terminoPeriodoDeGozoColaborador);
  const limite  = fmt(dados?.dataLimiteFerias);
  const marcIni = dados?.inicioFeriasPlanejadaColaborador;
  const marcFim = dados?.terminoFeriasPlanejadaColaborador;

  return (
    <div className="flex flex-col gap-3">
      {/* Saldo principal */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-black ${saldo > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {saldo}
          </span>
          <span className="text-base text-muted-foreground font-medium">dias disponíveis</span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {gozoIni !== '—' && gozoFim !== '—' && (
            <span className="text-xs text-muted-foreground">
              🗓 Período de gozo: <strong className="text-foreground">{gozoIni} – {gozoFim}</strong>
            </span>
          )}
          {limite !== '—' && (
            <span className="text-xs text-muted-foreground">
              📅 Prazo limite: <strong className="text-foreground">{limite}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Férias já marcadas */}
      {marcIni && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-blue-700 mb-0.5">Férias já marcadas</p>
          <p className="text-sm font-semibold text-blue-900">
            {fmt(marcIni)} – {fmt(marcFim ?? undefined)}
          </p>
        </div>
      )}
    </div>
  );
}
