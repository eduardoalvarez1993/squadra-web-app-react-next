'use client';

import { useMemo, useRef, useState } from 'react';
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DrawerForm } from '@/components/shared/DrawerForm';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import type { CrudConfig, FieldDef, Row } from '../crud-config';

interface CrudPanelProps {
  config: CrudConfig;
}

type FormValues = Record<string, string>;

function emptyForm(fields: FieldDef[]): FormValues {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

export function CrudPanel({ config }: CrudPanelProps) {
  const { fields, primaryKey, secondaryKeys, itemLabel, itemLabelPlural } = config;

  const [rows, setRows] = useState<Row[]>(config.seed);
  const [busca, setBusca] = useState('');

  // dialog de criar/editar
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(() => emptyForm(fields));
  const [touched, setTouched] = useState(false);

  // confirmação de remoção
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const idCounter = useRef(0);
  const nextId = () => `new-${itemLabel}-${++idCounter.current}`;

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, busca]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(fields));
    setTouched(false);
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditingId(row._id);
    setForm(Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ''])));
    setTouched(false);
    setOpen(true);
  }

  const missingRequired = fields.some((f) => f.required && !form[f.key]?.trim());

  function handleSave() {
    setTouched(true);
    if (missingRequired) return;
    if (editingId) {
      setRows((prev) => prev.map((r) => (r._id === editingId ? { ...r, ...form } : r)));
    } else {
      setRows((prev) => [{ _id: nextId(), ...form }, ...prev]);
    }
    setOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setRows((prev) => prev.filter((r) => r._id !== deleteTarget._id));
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de ações */}
      <div className="flex items-center gap-2">
        <input
          type="search"
          placeholder={`Buscar ${itemLabelPlural}…`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        <Button onClick={openCreate} className="shrink-0">
          <PlusIcon /> Novo
        </Button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          title={busca ? 'Nenhum resultado' : `Nenhum ${itemLabel} cadastrado`}
          description={busca ? undefined : `Clique em “Novo” para adicionar o primeiro ${itemLabel}.`}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((row) => (
            <li
              key={row._id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5"
            >
              <div className="min-w-0 flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {row[primaryKey] || <span className="text-muted-foreground italic">(sem {primaryKey})</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {secondaryKeys.map((k) =>
                    row[k] ? (
                      <Badge key={k} variant="secondary" className="font-normal max-w-[200px] truncate">
                        {row[k]}
                      </Badge>
                    ) : null,
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={`Editar ${itemLabel}`} onClick={() => openEdit(row)}>
                  <PencilIcon />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Remover ${itemLabel}`} onClick={() => setDeleteTarget(row)}>
                  <Trash2Icon className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? itemLabel : itemLabelPlural} · protótipo sem persistência (alterações não são salvas)
      </p>

      {/* Drawer criar/editar — padrão do app (DrawerForm) */}
      <DrawerForm
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? `Editar ${itemLabel}` : `Novo ${itemLabel}`}
        side="right"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        >
          {fields.map((f) => {
            const invalid = Boolean(touched && f.required && !form[f.key]?.trim());
            return (
              <div key={f.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`fld-${f.key}`}>
                  {f.label}{f.required && <span className="text-destructive"> *</span>}
                </Label>
                <FieldInput
                  field={f}
                  value={form[f.key] ?? ''}
                  invalid={invalid}
                  onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                />
                {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
                {invalid && <p className="text-xs text-destructive">Campo obrigatório.</p>}
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DrawerForm>

      {/* Confirmação de remoção */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {itemLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.[primaryKey] || `Este ${itemLabel}`} será removido da lista. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Input por tipo de campo ───────────────────────────────────────────────────

function FieldInput({
  field, value, invalid, onChange,
}: {
  field: FieldDef;
  value: string;
  invalid: boolean;
  onChange: (v: string) => void;
}) {
  const id = `fld-${field.key}`;

  if (field.type === 'textarea') {
    return (
      <Textarea
        id={id}
        value={value}
        rows={4}
        placeholder={field.placeholder}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
        <SelectTrigger id={id} aria-invalid={invalid}>
          <SelectValue placeholder="Selecione…" />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === 'color') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${field.label} (seletor)`}
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <Input
          id={id}
          value={value}
          placeholder={field.placeholder}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  return (
    <Input
      id={id}
      type={field.type === 'date' ? 'date' : 'text'}
      value={value}
      placeholder={field.placeholder}
      aria-invalid={invalid}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
