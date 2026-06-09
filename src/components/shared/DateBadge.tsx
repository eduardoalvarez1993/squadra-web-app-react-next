const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Badge vertical: mês (faixa azul) sobre o dia. Usa UTC porque as datas chegam como
// "2026-06-08T00:00:00Z" — no fuso BR (UTC-3) o getDate local mostraria o dia anterior.
export function DateBadge({ date, className = '' }: { date: string; className?: string }) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const mes = MESES_ABREV[d.getUTCMonth()];
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return (
    <div className={`flex flex-col items-center w-11 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-white ${className}`}>
      <span className="w-full text-center text-[0.6rem] font-bold uppercase tracking-wider bg-blue-600 text-white py-0.5">{mes}</span>
      <span className="w-full text-center text-lg font-bold leading-tight text-foreground py-1">{dia}</span>
    </div>
  );
}
