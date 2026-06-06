'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { usePessoasBusca, useDebouncedValue } from '../hooks/useAlterarGestor';
import type { PessoaData } from '@/services/squadra-client';

interface Props {
  label:       string;
  placeholder?: string;
  selected:    PessoaData | null;
  onSelect:    (p: PessoaData | null) => void;
}

// Autocomplete de pessoa reaproveitando o padrão do AlocarForm (usePessoas, busca ≥3).
export function PessoaAutocomplete({ label, placeholder, selected, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query);
  const { data: resultados, isFetching } = usePessoasBusca(debouncedQuery);
  // "buscando…" também durante a espera do debounce
  const buscando = isFetching || (query.trim().length >= 3 && query !== debouncedQuery);

  if (selected) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-2 bg-accent rounded-md px-3 py-2">
          <AvatarGradient nome={selected.nomeSocial || selected.nome} foto={selected.foto} size={24} />
          <span className="flex-1 text-sm truncate">{selected.nomeSocial || selected.nome}</span>
          <button
            type="button"
            onClick={() => { onSelect(null); setQuery(''); setTimeout(() => inputRef.current?.focus(), 0); }}
            className="text-muted-foreground hover:text-foreground transition-colors text-base leading-none"
            aria-label="Remover"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? 'Digite o nome (mín. 3 caracteres)…'}
          autoComplete="off"
        />
        {buscando && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
            buscando…
          </span>
        )}
        {open && resultados && resultados.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden max-h-64 overflow-y-auto">
            {resultados.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(p); setQuery(''); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <AvatarGradient nome={p.nomeSocial || p.nome} foto={p.foto} size={24} />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{p.nomeSocial || p.nome}</p>
                  {p.cargo && <p className="text-xs text-muted-foreground truncate">{p.cargo}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
