'use client';

import { StatusChip } from '@/components/shared/StatusChip';

const STATUS_LABELS: Record<string, string> = {
  P: 'Pendente',
  A: 'Aprovado',
  R: 'Reprovado',
};

interface StatusChipsProps {
  status:    string;
  onFilter?: (s: 'P' | 'A' | 'R') => void;
  active?:   'P' | 'A' | 'R';
}

export function StatusChips({ status, onFilter, active }: StatusChipsProps) {
  if (!onFilter) {
    const s = (status as 'P' | 'A' | 'R') in STATUS_LABELS ? (status as 'P' | 'A' | 'R') : 'pendente';
    const mapped = s === 'P' ? 'pendente' : s === 'A' ? 'aprovado' : 'reprovado';
    return <StatusChip status={mapped as 'pendente' | 'aprovado' | 'reprovado'} />;
  }

  return (
    <div className="flex gap-2">
      {(['P', 'A', 'R'] as const).map((s) => {
        const mapped = s === 'P' ? 'pendente' : s === 'A' ? 'aprovado' : 'reprovado';
        return (
          <button
            key={s}
            onClick={() => onFilter(s)}
            className={`rounded-full transition-opacity ${active === s ? 'opacity-100 ring-2 ring-brand-primary ring-offset-1' : 'opacity-60 hover:opacity-80'}`}
          >
            <StatusChip status={mapped as 'pendente' | 'aprovado' | 'reprovado'} label={STATUS_LABELS[s]} />
          </button>
        );
      })}
    </div>
  );
}
