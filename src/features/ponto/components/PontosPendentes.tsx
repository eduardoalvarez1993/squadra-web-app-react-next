import type { PontoDiaPendente } from '../hooks/usePonto';
import { SEM_ABREV } from '../hooks/usePonto';

interface PontosPendentesProps {
  pendentes: PontoDiaPendente[];
  onItemClick: (item: PontoDiaPendente) => void;
}

// Cores dos chips por tipo (espelham .ponto-pendente-chip-* do vanilla)
const CHIP: Record<PontoDiaPendente['tipo'], string> = {
  registrar: 'bg-amber-100 text-amber-700',
  apontar:   'bg-green-100 text-green-600',
  solicitar: 'bg-red-100 text-red-600',
  aguardar:  'bg-amber-100 text-amber-700',
};

export function PontosPendentes({ pendentes, onItemClick }: PontosPendentesProps) {
  if (pendentes.length === 0) return null;

  return (
    <div className="bg-amber-50 border-[1.5px] border-amber-300 rounded-xl px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[0.75rem] font-bold text-amber-800 uppercase tracking-wider">
          Dias pendentes
        </span>
        <span className="inline-flex items-center justify-center bg-amber-800 text-white rounded-full text-[0.65rem] w-4 h-4">
          {pendentes.length}
        </span>
      </div>

      <ul>
        {pendentes.map((item) => {
          const abrev = SEM_ABREV[item.dia.diaSemana] ?? item.dia.diaSemana.slice(0, 3);
          return (
            <li
              key={`${item.dia.data}-${item.tipo}`}
              className="border-b border-amber-100 last:border-0"
            >
              <button
                type="button"
                onClick={() => onItemClick(item)}
                className="w-full flex items-center gap-2.5 py-2 text-left hover:opacity-75 transition-opacity"
              >
                <span className="text-[0.85rem] text-gray-700 min-w-[52px] flex-shrink-0">
                  <strong>{item.dia.data.slice(0, 5)}</strong>{' '}
                  <span className="text-[0.72rem] text-gray-400">{abrev}</span>
                </span>
                <span
                  className={`ml-auto text-[0.7rem] font-bold rounded-full px-2.5 py-0.5 whitespace-nowrap ${item.heExtra ? 'bg-emerald-100 text-emerald-700' : CHIP[item.tipo]}`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
