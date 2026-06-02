import { Badge } from '@/components/ui/badge';

const CONFIG = {
  pendente:  { label: 'Pendente',  cls: 'border-yellow-400 text-yellow-700 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300' },
  aprovado:  { label: 'Aprovado',  cls: 'border-green-400  text-green-700  bg-green-50  dark:bg-green-950  dark:text-green-300'  },
  reprovado: { label: 'Reprovado', cls: 'border-red-400    text-red-700    bg-red-50    dark:bg-red-950    dark:text-red-300'    },
  cancelado: { label: 'Cancelado', cls: 'border-gray-400   text-gray-600   bg-gray-50   dark:bg-gray-900   dark:text-gray-400'  },
} as const;

type Status = keyof typeof CONFIG;

interface StatusChipProps {
  status: Status;
  label?: string;
}

export function StatusChip({ status, label }: StatusChipProps) {
  const cfg = CONFIG[status];
  return (
    <Badge variant="outline" className={cfg.cls}>
      {label ?? cfg.label}
    </Badge>
  );
}
