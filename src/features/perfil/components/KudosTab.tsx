'use client';

import { useState } from 'react';
import { PostCard } from '@/features/feed/components/PostCard';
import { useUserStore } from '@/store/user';
import { ASSETS } from '@/lib/assets';
import type { PerfilData } from '@/services/squadra-client';
import type { Post } from '@/features/feed/hooks/useFeed';

function rawToPost(k: Record<string, unknown>): Post {
  return {
    idPost:           Number(k['idPost'] ?? k['id'] ?? k['squadraEmRedeId'] ?? k['idPublicacao'] ?? 0),
    remetenteID:      Number(k['remetenteID'] ?? 0),
    remetenteNome:    String(k['remetenteNome'] ?? k['nomeAutor'] ?? k['nome'] ?? ''),
    remetenteFoto:    (k['remetenteFoto'] ?? k['foto'] ?? null) as string | null,
    destinatarioNome: k['destinatarioNome'] != null ? String(k['destinatarioNome']) : null,
    mensagem:         k['mensagem'] != null ? String(k['mensagem']) : (k['descricao'] != null ? String(k['descricao']) : null),
    titulo:           k['titulo'] != null ? String(k['titulo']) : null,
    categoria:        null,
    tipoPublicacao:   String(k['tipoPublicacao'] ?? 'K'),
    dataPostagem:     String(k['dataPostagem'] ?? k['dataPublicacao'] ?? ''),
    numComentarios:   Number(k['numComentarios'] ?? k['quantidadeComentarios'] ?? 0),
    curtidas:         Array.isArray(k['curtidas']) ? (k['curtidas'] as number[]) : [],
    aplausos:         Number(k['aplausos'] ?? 0),
  };
}

export function KudosTab({ perfil }: { perfil: PerfilData }) {
  const gestorId = useUserStore((s) => s.gestorId);

  const rawList = Array.isArray(perfil['kudosWalls']) ? (perfil['kudosWalls'] as Record<string, unknown>[]) : [];
  const [posts, setPosts] = useState<Post[]>(() => rawList.map(rawToPost));
  const [isComentando, setIsComentando] = useState(false);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSETS.emptyFeed} alt="" className="h-28 w-auto" loading="lazy" />
        <p className="text-sm text-muted-foreground">Nenhuma publicação encontrada.</p>
      </div>
    );
  }

  function handleLike(postId: number, liked: boolean) {
    setPosts((prev) =>
      prev.map((p) =>
        p.idPost === postId
          ? {
              ...p,
              curtidas: liked
                ? [...p.curtidas, gestorId]
                : p.curtidas.filter((id) => id !== gestorId),
            }
          : p,
      ),
    );
    const url = liked ? '/api/feed/like' : `/api/feed/like?postId=${postId}`;
    const opts = liked
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }) }
      : { method: 'DELETE' };
    fetch(url, opts).catch(() => {
      // rollback on error
      setPosts((prev) =>
        prev.map((p) =>
          p.idPost === postId
            ? {
                ...p,
                curtidas: liked
                  ? p.curtidas.filter((id) => id !== gestorId)
                  : [...p.curtidas, gestorId],
              }
            : p,
        ),
      );
    });
  }

  async function handleComentar(postId: number, texto: string) {
    setIsComentando(true);
    try {
      const res = await fetch('/api/feed/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, texto }),
      });
      if (!res.ok) throw new Error('Erro ao comentar');
      setPosts((prev) =>
        prev.map((p) =>
          p.idPost === postId ? { ...p, numComentarios: p.numComentarios + 1 } : p,
        ),
      );
    } finally {
      setIsComentando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      {posts.map((post) => (
        <PostCard
          key={post.idPost}
          post={post}
          gestorId={gestorId}
          onLike={(liked) => handleLike(post.idPost, liked)}
          onComentar={handleComentar}
          isComentando={isComentando}
        />
      ))}
    </div>
  );
}
