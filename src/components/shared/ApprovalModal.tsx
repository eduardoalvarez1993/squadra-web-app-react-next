'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Field =
  | { type: 'select'; name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string }
  // Grupo de botões-toggle (mutuamente exclusivos), lado a lado. Mesmo papel do
  // select, mas com as opções sempre visíveis — usado p/ Banco vs Folha (app-react).
  | { type: 'toggle'; name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string }
  | { type: 'input';  name: string; label: string; inputType?: string }
  | { type: 'textarea'; name: string; label: string }
  | { type: 'static';  name: string; label: string; value: string }
  // Renderiza conteúdo livre que reage aos valores atuais (ex.: cálculo de custo
  // que só aparece quando um select está numa opção específica). Sem label/wrapper.
  | { type: 'custom';  name: string; render: (values: Record<string, string>) => ReactNode };

// Valores iniciais a partir dos defaults declarados nos campos (select e toggle).
function computeDefaults(fields: Field[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    if ((f.type === 'select' || f.type === 'toggle') && f.defaultValue) out[f.name] = f.defaultValue;
  }
  return out;
}

interface ApprovalModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  fields: Field[];
  onConfirm: (values: Record<string, string>) => Promise<void>;
  confirmLabel?: string;
  confirmVariant?: 'default' | 'destructive';
  // Renderiza como drawer lateral (Sheet) em vez de modal central. Indicado quando
  // há informação densa (ex.: aprovação de hora extra com detalhamento de custo).
  asDrawer?: boolean;
}

export function ApprovalModal({
  open,
  onClose,
  titulo,
  fields,
  onConfirm,
  confirmLabel = 'Confirmar',
  confirmVariant = 'default',
  asDrawer = false,
}: ApprovalModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => computeDefaults(fields));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ao (re)abrir, restaura os defaults para o que se vê bater com o que será enviado.
  useEffect(() => {
    if (open) setValues(computeDefaults(fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleClose() {
    if (loading) return;
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(values);
      setValues(computeDefaults(fields));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err) || 'Erro ao processar.');
    } finally {
      setLoading(false);
    }
  }

  const corpo = (
        <div className="flex flex-col gap-4 py-2">
          {fields.map((field) =>
            field.type === 'custom' ? (
              <div key={field.name}>{field.render(values)}</div>
            ) : (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
              </label>
              {field.type === 'select' && (
                <Select value={values[field.name] ?? ''} onValueChange={(v) => setValue(field.name, v as string)}>
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue>
                      {(v: string | null) =>
                        field.options.find((o) => o.value === v)?.label ?? 'Selecione…'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {field.type === 'toggle' && (
                <div className="flex gap-2" role="group" aria-label={field.label}>
                  {field.options.map((opt) => {
                    const active = (values[field.name] ?? '') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={loading}
                        aria-pressed={active}
                        onClick={() => setValue(field.name, opt.value)}
                        className={[
                          'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-muted text-foreground hover:bg-muted/70',
                        ].join(' ')}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {field.type === 'input' && (
                <Input
                  id={field.name}
                  type={field.inputType ?? 'text'}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  disabled={loading}
                />
              )}
              {field.type === 'textarea' && (
                <Textarea
                  id={field.name}
                  value={values[field.name] ?? ''}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  disabled={loading}
                />
              )}
              {field.type === 'static' && (
                <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {field.value || '—'}
                </p>
              )}
            </div>
            )
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
  );

  const acoes = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button variant={confirmVariant} onClick={handleConfirm} disabled={loading}>
        {loading ? 'Processando…' : confirmLabel}
      </Button>
    </>
  );

  if (asDrawer) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 w-[440px] max-w-full">
          <SheetHeader className="flex-shrink-0 px-5 py-4 border-b border-border bg-white">
            <SheetTitle className="text-base font-semibold">{titulo}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-2">{corpo}</div>
          <div className="flex-shrink-0 flex justify-end gap-2 px-5 py-4 border-t border-border bg-white">
            {acoes}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        {corpo}
        <DialogFooter>{acoes}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
