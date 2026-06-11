const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Aceita ISO (yyyy-MM-dd[...]) E pt-BR (dd/MM/yyyy). Ancora ao meio-dia local para
// não escorregar de dia no fuso BR (UTC-3). new Date(s) cru interpretava o pt-BR
// "09/06/2026" como US (MM/DD) e invertia dia↔mês.
function parseFlexivel(s: string): Date | null {
  const v = (s ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(`${v.split('T')[0]}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(v)) {
    const [day, month, year] = v.split('/');
    const d = new Date(`${year}-${month}-${day}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Badge vertical: mês (faixa azul) sobre o dia.
export function DateBadge({ date, className = '' }: { date: string; className?: string }) {
  const d = parseFlexivel(date);
  if (!d) return null;
  const mes = MESES_ABREV[d.getMonth()];
  const dia = String(d.getDate()).padStart(2, '0');
  return (
    <div className={`flex flex-col items-center w-11 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-white ${className}`}>
      <span className="w-full text-center text-[0.6rem] font-bold uppercase tracking-wider bg-blue-600 text-white py-0.5">{mes}</span>
      <span className="w-full text-center text-lg font-bold leading-tight text-foreground py-1">{dia}</span>
    </div>
  );
}
