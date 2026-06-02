'use client';

import { useState } from 'react';
import DOMPurify from 'dompurify';
import { TabNav } from '@/components/shared/TabNav';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { useUserStore } from '@/store/user';
import { useFeed, type Post, type Comunicado } from '@/features/feed/hooks/useFeed';
import { PostCard } from '@/features/feed/components/PostCard';
import { ComposeBox } from '@/features/feed/components/ComposeBox';
import { ASSETS } from '@/lib/assets';

function FeedLoading() {
  return (
    <div className="feed-loading-wrap is-feed-loading" role="status" aria-live="polite">
      <span className="feed-swipe-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="feed-swipe-card feed-swipe-card-1" src={ASSETS.loadingFeedCards[0]} alt="" loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="feed-swipe-card feed-swipe-card-2" src={ASSETS.loadingFeedCards[1]} alt="" loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="feed-swipe-card feed-swipe-card-3" src={ASSETS.loadingFeedCards[2]} alt="" loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="feed-swipe-card feed-swipe-card-4" src={ASSETS.loadingFeedCards[3]} alt="" loading="lazy" />
      </span>
      <strong>Carregando Squadra em Rede...</strong>
    </div>
  );
}

function ComunicadosLoading() {
  return (
    <div className="comunicados-loading-wrap" role="status" aria-live="polite">
      <span className="comunicados-loading-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="comunicados-loading-mailbox" src={ASSETS.loadingComunicados} alt="" loading="lazy" />
        <span className="comunicados-mail-flag" />
      </span>
      <strong>Carregando comunicados...</strong>
    </div>
  );
}

const TABS = [
  { id: 'posts',       label: 'Posts' },
  { id: 'comunicados', label: 'Comunicados' },
];

function ComunicadoCard({ c }: { c: Comunicado }) {
  const [expanded, setExpanded] = useState(false);
  const sanitized = typeof window !== 'undefined' ? DOMPurify.sanitize(c.corpo) : c.corpo;

  return (
    <div className="bg-card border border-border rounded-card p-4 flex flex-col gap-2">
      <div>
        <p className="font-medium text-sm">{c.assunto}</p>
        <p className="text-xs text-muted-foreground">{c.remetente} · {new Date(c.dataRecebimento).toLocaleDateString('pt-BR')}</p>
      </div>
      {expanded && (
        <div
          className="text-sm prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      )}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-primary hover:underline text-left"
      >
        {expanded ? 'Ocultar' : 'Ver conteúdo'}
      </button>
    </div>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState('posts');
  const gestorId = useUserStore((s) => s.gestorId);

  const { posts, comunicados, isLoading, isError, refetch, criarPost, isCriando, toggleLike, comentar, isComentando, deletarPost } = useFeed(1);

  if (isError) {
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar o feed." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="p-4 flex flex-col gap-3">
          {tab === 'posts' && (
            <>
              <ComposeBox onPost={(p) => criarPost(p)} isPosting={isCriando} />

              {isLoading
                ? <FeedLoading />
                : posts.length === 0
                ? <EmptyState image={ASSETS.emptyFeed} title="Nenhuma publicação ainda" />
                : posts.map((p: Post) => (
                    <PostCard
                      key={p.idPost}
                      post={p}
                      gestorId={gestorId}
                      onLike={(liked) => toggleLike(p.idPost, liked)}
                      onComentar={comentar}
                      isComentando={isComentando}
                      onDelete={deletarPost}
                    />
                  ))
              }
            </>
          )}

          {tab === 'comunicados' && (
            <>
              {isLoading
                ? <ComunicadosLoading />
                : comunicados.length === 0
                ? <EmptyState image={ASSETS.emptyComunicados} title="Nenhum comunicado" />
                : comunicados.map((c: Comunicado, i) => (
                    <ComunicadoCard key={`${c.assunto}-${i}`} c={c} />
                  ))
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
}
