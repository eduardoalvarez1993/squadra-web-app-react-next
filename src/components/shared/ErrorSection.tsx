import { Button } from '@/components/ui/button';

interface ErrorSectionProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorSection({ message = 'Erro ao carregar dados.', onRetry }: ErrorSectionProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center" role="alert">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
