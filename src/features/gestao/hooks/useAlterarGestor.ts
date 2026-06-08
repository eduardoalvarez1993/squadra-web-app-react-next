'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user';
import type { ColaboradorComGestor, PessoaData, ProjetoBuscaItem } from '@/services/squadra-client';
import type { ProjetoComGestorView } from '@/services/gestao';

// Atraso entre a digitação e o disparo da busca (evita requisição por tecla).
export const SEARCH_DEBOUNCE_MS = 600;

// Retorna o valor só depois de `ms` sem mudanças.
export function useDebouncedValue<T>(value: T, ms: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// Usuário logado no formato PessoaData, para usar como "Novo gestor" padrão.
export function useUsuarioLogadoComoPessoa(): PessoaData {
  const id    = useUserStore((s) => s.gestorId);
  const nome  = useUserStore((s) => s.nome);
  const foto  = useUserStore((s) => s.foto);
  const login = useUserStore((s) => s.login);
  const cargo = useUserStore((s) => s.cargo);
  return useMemo<PessoaData>(
    () => ({ id, usuarioId: id, nome, nomeSocial: nome, foto, cargo, email: '', celular: '', login }),
    [id, nome, foto, login, cargo],
  );
}

async function postJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Erro ao alterar gestor');
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function useAlterarGestorColaborador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { coordId: number; recId: number }) =>
      postJson('/api/gestao/altera-gestor-colaborador', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gestao', 'colaboradores-gestores'] }),
  });
}

export function useAlterarGestorProjeto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { coordId: number; prjId: number }) =>
      postJson('/api/gestao/altera-gestor-projeto', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gestao', 'projetos-gestores'] }),
  });
}

// Listagens "ver todos" — carregam só quando o accordion abre (enabled).
export function useColaboradoresComGestor(enabled: boolean) {
  return useQuery<ColaboradorComGestor[]>({
    queryKey:  ['gestao', 'colaboradores-gestores'],
    queryFn:   () => getJson('/api/gestao/colaboradores-gestores'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjetosComGestor(enabled: boolean) {
  return useQuery<ProjetoComGestorView[]>({
    queryKey:  ['gestao', 'projetos-gestores'],
    queryFn:   () => getJson('/api/gestao/projetos-gestores'),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Busca de pessoas (autocomplete, PROD) — exclusiva destas abas.
export function usePessoasBusca(query: string) {
  return useQuery<PessoaData[]>({
    queryKey:  ['gestao', 'pessoas-busca', query],
    queryFn:   () => getJson(`/api/gestao/pessoas-busca?q=${encodeURIComponent(query)}`),
    enabled:   query.length >= 3,
    staleTime: 2 * 60 * 1000,
  });
}

// Busca de projetos (autocomplete, PROD) — exclusiva desta aba.
export function useProjetosBusca(query: string) {
  return useQuery<ProjetoBuscaItem[]>({
    queryKey:  ['gestao', 'projetos-busca', query],
    queryFn:   () => getJson(`/api/gestao/projetos-busca?q=${encodeURIComponent(query)}`),
    enabled:   query.length >= 3,
    staleTime: 2 * 60 * 1000,
  });
}
