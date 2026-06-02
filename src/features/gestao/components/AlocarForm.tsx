'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { usePessoas } from '@/features/pessoas/hooks/usePessoas';
import type { ServicoGestor, Papel, PessoaData } from '@/services/squadra-client';
import type { AlocarInput } from '../hooks/useGestao';

type Presel = { id: number; nome: string; nomeSocial?: string | null; foto: string | null };

interface AlocarFormProps {
  servicos:      ServicoGestor[];
  papeis:        Papel[];
  onSubmit:      (input: AlocarInput) => Promise<void>;
  isSubmitting?: boolean;
  presel?:       Presel | null;
}

export function AlocarForm({ servicos, papeis, onSubmit, isSubmitting, presel }: AlocarFormProps) {
  const [pessoaQuery,     setPessoaQuery]     = useState('');
  const [pessoaSel,       setPessoaSel]       = useState<PessoaData | null>(
    presel ? (presel as unknown as PessoaData) : null,
  );
  const [dropdownOpen,    setDropdownOpen]    = useState(false);
  const [projetoId,       setProjetoId]       = useState('');
  const [subProjetoId,    setSubProjetoId]    = useState('');
  const [papelId,         setPapelId]         = useState('');
  const [dataInicio,      setDataInicio]      = useState('');
  const [dataFim,         setDataFim]         = useState('');
  const [ok,              setOk]              = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const { data: resultados, isFetching } = usePessoas(pessoaQuery);

  const servico     = servicos.find((s) => String(s.id) === projetoId);
  const subprojetos = servico?.subprojetos ?? [];

  // Limpa subprojeto ao trocar projeto
  useEffect(() => { setSubProjetoId(''); }, [projetoId]);

  function selecionarPessoa(p: PessoaData) {
    setPessoaSel(p);
    setPessoaQuery('');
    setDropdownOpen(false);
  }

  function limparPessoa() {
    setPessoaSel(null);
    setPessoaQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function validate(): string | null {
    if (!pessoaSel)                                       return 'Selecione um colaborador';
    if (!projetoId)                                       return 'Selecione um projeto';
    if (subprojetos.length > 0 && !subProjetoId)          return 'Selecione um subprojeto';
    if (!papelId)                                         return 'Selecione um papel';
    if (!dataInicio || !dataFim)                          return 'Informe as datas';
    if (dataFim < dataInicio)                             return 'Data fim deve ser após a data início';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    try {
      await onSubmit({
        colaboradorId: pessoaSel!.id,
        projetoId:     Number(projetoId),
        subProjetoId:  Number(subProjetoId) || 0,
        papelId:       Number(papelId),
        dataInicio,
        dataFim,
      });
      setOk(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">

      {/* ── Colaborador ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Colaborador</label>

        {pessoaSel ? (
          <div className="flex items-center gap-2 bg-accent rounded-md px-3 py-2">
            <AvatarGradient nome={pessoaSel.nomeSocial || pessoaSel.nome} foto={pessoaSel.foto} size={24} />
            <span className="flex-1 text-sm truncate">{pessoaSel.nomeSocial || pessoaSel.nome}</span>
            <button
              type="button"
              onClick={limparPessoa}
              className="text-muted-foreground hover:text-foreground transition-colors text-base leading-none"
              aria-label="Remover colaborador"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <Input
              ref={inputRef}
              value={pessoaQuery}
              onChange={(e) => { setPessoaQuery(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              placeholder="Digite o nome (mín. 3 caracteres)…"
              autoComplete="off"
            />
            {isFetching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
                buscando…
              </span>
            )}
            {dropdownOpen && resultados && resultados.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
                {resultados.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selecionarPessoa(p); }}
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
        )}
      </div>

      {/* ── Projeto ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Serviço</label>
        <Select value={projetoId} onValueChange={(v) => { setProjetoId(v ?? ''); setOk(false); }}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string | null) => v ? (servicos.find((s) => String(s.id) === v)?.nome ?? v) : 'Selecione…'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {servicos.map((s) => (
              <SelectItem key={String(s.id)} value={String(s.id)}>
                {s.nome}
                {s.cliente && <span className="text-muted-foreground"> — {s.cliente}</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Subprojeto (condicional) ─────────────────────────────────── */}
      {subprojetos.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Subprojeto</label>
          <Select value={subProjetoId} onValueChange={(v) => { setSubProjetoId(v ?? ''); setOk(false); }}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) => v ? (subprojetos.find((s) => String(s.id) === v)?.nome ?? v) : 'Selecione…'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {subprojetos.map((s) => (
                <SelectItem key={String(s.id)} value={String(s.id)}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Papel ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Papel</label>
        <Select value={papelId} onValueChange={(v) => { setPapelId(v ?? ''); setOk(false); }}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string | null) => v ? (papeis.find((p) => String(p.id) === v)?.nomePapel ?? v) : 'Selecione…'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {papeis.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.nomePapel}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Datas ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Início</label>
          <Input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setOk(false); }} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Fim</label>
          <Input type="date" value={dataFim} min={dataInicio} onChange={(e) => { setDataFim(e.target.value); setOk(false); }} required />
        </div>
      </div>

      {ok    && <FormFeedback type="ok"    message="Alocação criada com sucesso!" />}
      {error && <FormFeedback type="error" message={error} />}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Alocando…' : 'Confirmar alocação'}
      </Button>
    </form>
  );
}
