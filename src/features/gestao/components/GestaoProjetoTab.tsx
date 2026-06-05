'use client';

import { useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { EmptyState } from '@/components/shared/EmptyState';
import { PessoaAutocomplete } from './PessoaAutocomplete';
import { GestaoProjetoLoader } from './GestaoLoaders';
import { useAlterarGestorProjeto, useProjetosComGestor, useProjetosBusca, useUsuarioLogadoComoPessoa, useDebouncedValue } from '../hooks/useAlterarGestor';
import type { PessoaData, ProjetoBuscaItem } from '@/services/squadra-client';

function cap(nome: string): string {
  return nome.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(' ');
}

type ProjSel = { id: number; nome: string; cliente?: string };

function ProjetoAutocomplete({ selected, onSelect }: { selected: ProjSel | null; onSelect: (p: ProjSel | null) => void }) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query);
  const { data: resultados, isFetching } = useProjetosBusca(debouncedQuery);
  const buscando = isFetching || (query.trim().length >= 3 && query !== debouncedQuery);

  if (selected) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Projeto</label>
        <div className="flex items-center gap-2 bg-accent rounded-md px-3 py-2">
          <span className="flex-1 text-sm truncate">{selected.nome}{selected.cliente ? ` — ${selected.cliente}` : ''}</span>
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
      <label className="text-sm font-medium">Projeto</label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar projeto (mín. 3 caracteres)…"
          autoComplete="off"
        />
        {buscando && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
            buscando…
          </span>
        )}
        {open && resultados && resultados.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden max-h-64 overflow-y-auto">
            {resultados.slice(0, 10).map((p: ProjetoBuscaItem) => (
              <button
                key={String(p.id)}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect({ id: Number(p.id), nome: p.nome, cliente: p.cliente }); setQuery(''); setOpen(false); }}
                className="flex flex-col w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <span className="truncate">{p.nome}</span>
                {p.cliente && <span className="text-xs text-muted-foreground truncate">{p.cliente}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function GestaoProjetoTab() {
  const qc = useQueryClient();
  const usuarioLogado = useUsuarioLogadoComoPessoa();
  const [projeto,  setProjeto]  = useState<ProjSel | null>(null);
  const [gestor,   setGestor]   = useState<PessoaData | null>(usuarioLogado);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; message: string } | null>(null);

  const mutation = useAlterarGestorProjeto();

  const [verTodos, setVerTodos] = useState(false);
  const [busca,    setBusca]    = useState('');
  const { data: lista, isLoading: listaLoading, isError: listaError } = useProjetosComGestor(verTodos);

  const listaFiltrada = useMemo(() => {
    if (!lista) return [];
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      (p) => p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q) || p.gestor.toLowerCase().includes(q),
    );
  }, [lista, busca]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!projeto) { setFeedback({ type: 'error', message: 'Selecione um projeto' }); return; }
    if (!gestor)  { setFeedback({ type: 'error', message: 'Selecione o novo gestor' }); return; }
    const coordId = gestor.usuarioId || gestor.id;
    try {
      await mutation.mutateAsync({ coordId, prjId: projeto.id });
      setFeedback({ type: 'ok', message: `Gestor do projeto ${projeto.nome} alterado para ${cap(gestor.nome)}.` });
      setProjeto(null);
      setGestor(usuarioLogado);
      qc.invalidateQueries({ queryKey: ['gestao', 'projetos-gestores'] });
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">HML</span>
        <span className="text-xs text-muted-foreground">Esta tela opera 100% em homologação.</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Altere o gestor de um projeto.</p>
        <ProjetoAutocomplete selected={projeto} onSelect={(p) => { setProjeto(p); setFeedback(null); }} />
        <PessoaAutocomplete
          label="Novo gestor"
          placeholder="Buscar gestor…"
          selected={gestor}
          onSelect={(p) => { setGestor(p); setFeedback(null); }}
        />
        {feedback && <FormFeedback type={feedback.type} message={feedback.message} />}
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Salvando…' : 'Alterar gestor'}
        </Button>
      </form>

      {/* Ver todos — lazy load ao abrir */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setVerTodos((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/40 transition-colors text-sm font-medium cursor-pointer"
        >
          <span>Ver todos os projetos e seus gestores</span>
          <span className={`text-muted-foreground transition-transform text-xs ${verTodos ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {verTodos && (
          <div className="border-t border-border p-4 flex flex-col gap-3">
            <input
              type="search"
              placeholder="Buscar por projeto, cliente ou gestor…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            {listaLoading ? (
              <GestaoProjetoLoader />
            ) : listaError ? (
              <p className="text-sm text-destructive py-6 text-center">Erro ao carregar a lista.</p>
            ) : listaFiltrada.length === 0 ? (
              <EmptyState title="Nenhum projeto encontrado" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {listaFiltrada.length} projeto{listaFiltrada.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-col gap-2 max-h-[28rem] overflow-y-auto">
                  {listaFiltrada.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.cliente ? `${p.cliente} · ` : ''}Gestor: {p.gestor ? cap(p.gestor) : '—'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setProjeto({ id: p.id, nome: p.nome, cliente: p.cliente }); setGestor(usuarioLogado); setFeedback(null); }}
                      >
                        Alterar
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
