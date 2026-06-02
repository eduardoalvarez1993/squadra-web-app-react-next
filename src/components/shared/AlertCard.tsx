import { Button } from '@/components/ui/button';

const CONFIG = {
  warn:  { bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800', icon: '⚠️' },
  error: { bg: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',            icon: '❌' },
  ok:    { bg: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',    icon: '✅' },
} as const;

interface AlertCardProps {
  type: keyof typeof CONFIG;
  children: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
}

export function AlertCard({ type, children, onAction, actionLabel }: AlertCardProps) {
  const cfg = CONFIG[type];
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${cfg.bg}`}>
      <span className="mt-0.5 flex-shrink-0 text-base" aria-hidden="true">{cfg.icon}</span>
      <div className="flex-1 text-sm">{children}</div>
      {onAction && actionLabel && (
        <Button size="sm" variant="outline" onClick={onAction} className="flex-shrink-0">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
