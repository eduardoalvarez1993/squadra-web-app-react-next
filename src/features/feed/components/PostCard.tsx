'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import type { Post } from '@/features/feed/hooks/useFeed';

// Lazy: o drawer só é baixado quando o card é aberto.
const FeedDrawer = dynamic(() => import('./FeedDrawer').then((m) => m.FeedDrawer));

export const TIPO_EMOJI: Record<string, string> = {
  C: '⭐', D: '💬', I: '💡', K: '❤️',
};

export function burstHearts(btn: HTMLButtonElement) {
  const rect = btn.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  for (let i = 0; i < 8; i++) {
    const h     = document.createElement('span');
    h.className = 'feed-heart-burst';
    h.textContent = '❤️';
    const angle = (i / 8) * 2 * Math.PI;
    const dist  = 40 + Math.random() * 30;
    h.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    h.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    h.style.left = `${cx}px`;
    h.style.top  = `${cy}px`;
    document.body.appendChild(h);
    h.addEventListener('animationend', () => h.remove());
  }
}

interface PostCardProps {
  post:                  Post;
  gestorId:              number;
  onLike:                (liked: boolean) => void;
  onComentar:            (postId: number, texto: string) => Promise<void>;
  isComentando:          boolean;
  onDelete?:             (postId: number) => Promise<void>;
}

export function PostCard({ post, gestorId, onLike, onComentar, isComentando, onDelete }: PostCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const liked  = post.curtidas.includes(gestorId);
  const isMine = post.remetenteID === gestorId;

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onDelete || deleting) return;
    if (!window.confirm('Remover essa publicação?')) return;
    setDeleting(true);
    try { await onDelete(post.idPost); } finally { setDeleting(false); }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="bg-card border border-border rounded-card p-4 flex flex-col gap-3 cursor-pointer hover:shadow-sm transition-shadow"
        onClick={() => setDrawerOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerOpen(true); } }}
        aria-label={`Ver post de ${post.remetenteNome}`}
      >
        <div className="flex items-center gap-3">
          <AvatarGradient nome={post.remetenteNome} foto={post.remetenteFoto} size={36} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {TIPO_EMOJI[post.tipoPublicacao]} {post.remetenteNome}
              {post.destinatarioNome && (
                <span className="text-muted-foreground"> → {post.destinatarioNome}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.dataPostagem).toLocaleDateString('pt-BR')}
            </p>
          </div>
          {isMine && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
              aria-label="Remover post"
            >
              ✕
            </button>
          )}
        </div>

        {post.titulo && <p className="font-semibold text-sm">{post.titulo}</p>}
        {post.mensagem && (
          <p className="text-sm text-foreground line-clamp-3">{post.mensagem}</p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!liked) burstHearts(e.currentTarget);
              onLike(!liked);
            }}
            aria-label={liked ? `Descurtir. ${post.curtidas.length} curtidas` : `Curtir. ${post.curtidas.length} curtidas`}
            aria-pressed={liked}
            className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
          >
            <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span> {post.curtidas.length}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDrawerOpen(true); }}
            aria-label={`Ver ${post.numComentarios} comentário${post.numComentarios !== 1 ? 's' : ''}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <span aria-hidden="true">💬</span> {post.numComentarios}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <FeedDrawer
          post={post}
          gestorId={gestorId}
          onClose={() => setDrawerOpen(false)}
          onLike={onLike}
          onComentar={onComentar}
          isComentando={isComentando}
        />
      )}
    </>
  );
}
