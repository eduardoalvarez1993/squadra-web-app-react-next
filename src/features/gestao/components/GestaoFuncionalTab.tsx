'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { EmptyState } from '@/components/shared/EmptyState';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { PessoaAutocomplete } from './PessoaAutocomplete';
import { useAlterarGestorColaborador, useColaboradoresComGestor, useUsuarioLogadoComoPessoa } from '../hooks/useAlterarGestor';
import type { PessoaData, ColaboradorComGestor } from '@/services/squadra-client';

function cap(nome: string): string {
  return nome.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(' ');
}

export function GestaoFuncionalTab() {
  const qc = useQueryClient();
  const usuarioLogado = useUsuarioLogadoComoPessoa();
  const [colaborador, setColaborador] = useState<PessoaData | null>(null);
  const [gestor,      setGestor]      = useState<PessoaData | null>(usuarioLogado);
  const [feedback,    setFeedback]    = useState<{ type: 'ok' | 'error'; message: string } | null>(null);

  const mutation = useAlterarGestorColaborador();

  const [verTodos, setVerTodos] = useState(false);
  const [busca,    setBusca]    = useState('');
  const { data: lista, isLoading: listaLoading, isError: listaError } = useColaboradoresComGestor(verTodos);

  const listaFiltrada = useMemo(() => {
    if (!lista) return [];
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      (c) => c.nome.toLowerCase().includes(q) || c.gerente.toLowerCase().includes(q) || c.cargo.toLowerCase().includes(q),
    );
  }, [lista, busca]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!colaborador) { setFeedback({ type: 'error', message: 'Selecione um colaborador' }); return; }
    if (!gestor)      { setFeedback({ type: 'error', message: 'Selecione o novo gestor' }); return; }
    const coordId = gestor.usuarioId || gestor.id;
    try {
      await mutation.mutateAsync({ coordId, recId: colaborador.id });
      setFeedback({ type: 'ok', message: `Gestor de ${cap(colaborador.nome)} alterado para ${cap(gestor.nome)}.` });
      setColaborador(null);
      setGestor(usuarioLogado);
      qc.invalidateQueries({ queryKey: ['gestao', 'colaboradores-gestores'] });
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  }

  function prefill(c: ColaboradorComGestor) {
    setColaborador({
      id: c.id, usuarioId: 0, nome: c.nome, nomeSocial: c.nome,
      foto: null, cargo: c.cargo, email: '', celular: '', login: c.login,
    });
    setGestor(usuarioLogado);
    setFeedback(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">HML</span>
        <span className="text-xs text-muted-foreground">Esta tela opera 100% em homologação.</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Altere o gestor funcional de um colaborador.</p>
        <PessoaAutocomplete
          label="Colaborador"
          placeholder="Buscar colaborador…"
          selected={colaborador}
          onSelect={(p) => { setColaborador(p); setFeedback(null); }}
        />
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
          <span>Ver todos os colaboradores e seus gestores</span>
          <span className={`text-muted-foreground transition-transform text-xs ${verTodos ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {verTodos && (
          <div className="border-t border-border p-4 flex flex-col gap-3">
            <input
              type="search"
              placeholder="Buscar por colaborador, gestor ou cargo…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            {listaLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Carregando colaboradores…</p>
            ) : listaError ? (
              <p className="text-sm text-destructive py-6 text-center">Erro ao carregar a lista.</p>
            ) : listaFiltrada.length === 0 ? (
              <EmptyState title="Nenhum colaborador encontrado" />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {listaFiltrada.length} colaborador{listaFiltrada.length > 1 ? 'es' : ''}
                </p>
                <div className="flex flex-col gap-2 max-h-[28rem] overflow-y-auto">
                  {listaFiltrada.map((c) => (
                    <div key={c.id || c.login} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                      <AvatarGradient nome={c.nome} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cap(c.nome)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.cargo ? `${cap(c.cargo)} · ` : ''}Gestor: {c.gerente ? cap(c.gerente) : '—'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => prefill(c)}>Alterar</Button>
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
