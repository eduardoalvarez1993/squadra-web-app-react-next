interface FormFeedbackProps {
  type: 'ok' | 'error' | 'loading' | null;
  message?: string;
}

export function FormFeedback({ type, message }: FormFeedbackProps) {
  if (type === null) return null;

  const textCls =
    type === 'ok'      ? 'text-green-600 dark:text-green-400' :
    type === 'error'   ? 'text-destructive' :
    'text-muted-foreground';

  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-2 text-sm ${textCls}`}>
      {type === 'loading' && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {type === 'ok'    && <span aria-hidden="true">✅</span>}
      {type === 'error' && <span aria-hidden="true">❌</span>}
      {message && <span>{message}</span>}
    </div>
  );
}
