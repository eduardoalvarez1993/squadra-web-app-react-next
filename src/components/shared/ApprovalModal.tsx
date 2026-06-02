'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  | { type: 'select'; name: string; label: string; options: { value: string; label: string }[] }
  | { type: 'input';  name: string; label: string; inputType?: string }
  | { type: 'textarea'; name: string; label: string };

interface ApprovalModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  fields: Field[];
  onConfirm: (values: Record<string, string>) => Promise<void>;
  confirmLabel?: string;
  confirmVariant?: 'default' | 'destructive';
}

export function ApprovalModal({
  open,
  onClose,
  titulo,
  fields,
  onConfirm,
  confirmLabel = 'Confirmar',
  confirmVariant = 'default',
}: ApprovalModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setValues({});
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err) || 'Erro ao processar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
              </label>
              {field.type === 'select' && (
                <Select onValueChange={(v) => setValue(field.name, v as string)}>
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Selecione…" />
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
            </div>
          ))}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processando…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
