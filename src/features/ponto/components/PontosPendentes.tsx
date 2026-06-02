import type { PontoDiaPendente } from '../hooks/usePonto';

interface PontosPendentesProps {
  pendentes: PontoDiaPendente[];
  onItemClick: (item: PontoDiaPendente) => void;
}

function formatDataLabel(dmy: string): string {
  const [d, m, y] = dmy.split('/');
  return `${d}/${m}/${y}`;
}

export function PontosPendentes({ pendentes, onItemClick }: PontosPendentesProps) {
  if (pendentes.length === 0) return null;

  return (
    <div className="rounded-card border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-yellow-200 dark:border-yellow-800 flex items-center gap-2">
        <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
          Dias pendentes
        </span>
        <span className="ml-auto text-xs font-medium bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200 rounded-full px-2 py-0.5">
          {pendentes.length}
        </span>
      </div>

      <ul className="divide-y divide-yellow-200 dark:divide-yellow-800/50">
        {pendentes.map((item) => {
          const isDisabled = item.tipo === 'aguardar';
          return (
            <li key={`${item.dia.data}-${item.tipo}`}>
              <button
                type="button"
                onClick={() => onItemClick(item)}
                disabled={false}
                className={[
                  'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                  isDisabled
                    ? 'cursor-default text-muted-foreground'
                    : 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 active:bg-yellow-200',
                ].join(' ')}
              >
                <span className="text-sm">
                  <span className="font-medium">{formatDataLabel(item.dia.data)}</span>
                  <span className="ml-1 text-muted-foreground">{item.dia.diaSemana}</span>
                </span>
                <span
                  className={[
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    item.tipo === 'registrar'
                      ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-200'
                      : item.tipo === 'solicitar'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : item.tipo === 'apontar'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-muted text-muted-foreground',
                  ].join(' ')}
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
