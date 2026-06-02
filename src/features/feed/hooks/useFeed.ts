'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/user';
import type { Post, Comentario, Comunicado } from '@/services/squadra-client';

export type { Post, Comentario, Comunicado };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function useComentarios(postId: number | null) {
  return useQuery<Comentario[]>({
    queryKey: ['feed', 'comentarios', postId],
    queryFn:  () => fetchJson(`/api/feed/comentarios?postId=${postId}`),
    staleTime: 60 * 1000,
    enabled:   postId !== null && postId > 0,
  });
}

export function useFeed(offset = 1) {
  const qc = useQueryClient();
  const gestorId = useUserStore((s) => s.gestorId);

  const postsQuery = useQuery<Post[]>({
    queryKey: ['feed', 'posts', offset],
    queryFn:  () => fetchJson(`/api/feed?offset=${offset}`),
    staleTime: 2 * 60 * 1000,
  });

  const comunicadosQuery = useQuery<Comunicado[]>({
    queryKey: ['feed', 'comunicados'],
    queryFn:  () => fetchJson('/api/feed/comunicados'),
    staleTime: 10 * 60 * 1000,
  });

  const criarPostMutation = useMutation({
    mutationFn: async (payload: { texto: string; tipoPublicacao: string; destinatarioId?: number }) => {
      const res = await fetch('/api/feed/posts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Erro ao criar post');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed', 'posts'] }),
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, liked }: { postId: number; liked: boolean }) => {
      if (liked) {
        const res = await fetch('/api/feed/like', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ postId }),
        });
        if (!res.ok) throw new Error('Erro ao curtir');
      } else {
        const res = await fetch(`/api/feed/like?postId=${postId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao remover curtida');
      }
    },
    onMutate: async ({ postId, liked }) => {
      await qc.cancelQueries({ queryKey: ['feed', 'posts', offset] });
      const prev = qc.getQueryData<Post[]>(['feed', 'posts', offset]);
      qc.setQueryData<Post[]>(['feed', 'posts', offset], (old) =>
        (old ?? []).map((p) => p.idPost === postId
          ? {
              ...p,
              curtidas: liked
                ? [...p.curtidas, gestorId]
                : p.curtidas.filter((id) => id !== gestorId),
            }
          : p
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['feed', 'posts', offset], ctx.prev);
    },
  });

  const comentarMutation = useMutation({
    mutationFn: async ({ postId, texto }: { postId: number; texto: string }) => {
      const res = await fetch('/api/feed/comentarios', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ postId, texto }),
      });
      if (!res.ok) throw new Error('Erro ao comentar');
    },
    onSuccess: (_data, { postId }) => {
      qc.invalidateQueries({ queryKey: ['feed', 'comentarios', postId] });
      qc.invalidateQueries({ queryKey: ['feed', 'posts', offset] });
    },
  });

  const deletarPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/feed/posts?postId=${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao deletar post');
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: ['feed', 'posts', offset] });
      const prev = qc.getQueryData<Post[]>(['feed', 'posts', offset]);
      qc.setQueryData<Post[]>(['feed', 'posts', offset],
        (old) => (old ?? []).filter((p) => p.idPost !== postId),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['feed', 'posts', offset], ctx.prev);
    },
  });

  return {
    posts:         postsQuery.data      ?? [],
    comunicados:   comunicadosQuery.data ?? [],
    isLoading:     postsQuery.isLoading,
    isError:       postsQuery.isError,
    refetch:       postsQuery.refetch,
    criarPost:     (payload: { texto: string; tipoPublicacao: string; destinatarioId?: number }) => criarPostMutation.mutateAsync(payload),
    isCriando:     criarPostMutation.isPending,
    toggleLike:    (postId: number, liked: boolean) => likeMutation.mutateAsync({ postId, liked }),
    comentar:      (postId: number, texto: string) => comentarMutation.mutateAsync({ postId, texto }),
    isComentando:  comentarMutation.isPending,
    deletarPost:   (postId: number) => deletarPostMutation.mutateAsync(postId),
  };
}
