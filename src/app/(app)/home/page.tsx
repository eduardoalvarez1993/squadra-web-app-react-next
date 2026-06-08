'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import DOMPurify from 'dompurify';
import { GreetingCard } from '@/features/home/components/GreetingCard';
import { AnivCard } from '@/features/home/components/AnivCard';
import { TabNav } from '@/components/shared/TabNav';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { Skeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { useHome } from '@/features/home/hooks/useHome';
import { useFeed, type Post, type Comunicado } from '@/features/feed/hooks/useFeed';
import { ComposeBox } from '@/features/feed/components/ComposeBox';
import { useUserStore } from '@/store/user';
import { ASSETS } from '@/lib/assets';

// Lazy: só carrega o chunk do drawer quando o usuário abre um post.
const FeedDrawer = dynamic(() => import('@/features/feed/components/FeedDrawer').then((m) => m.FeedDrawer));

const ANIV_TABS = [
  { id: 'aniv',  label: 'Aniversariantes 🎂' },
  { id: 'novos', label: 'Novos na Squadra ✨' },
];

const FEED_TABS = [
  { id: 'posts',       label: 'Squadra em Rede' },
  { id: 'comunicados', label: 'Comunicados' },
];

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  K: { label: 'KUDOS',       color: 'bg-pink-100 text-pink-600' },
  C: { label: 'COMUNICADO',  color: 'bg-blue-100 text-blue-600' },
  D: { label: 'DESTAQUE',    color: 'bg-purple-100 text-purple-600' },
  I: { label: 'IDEIA',       color: 'bg-amber-100 text-amber-600' },
};

function burstHearts(btn: HTMLButtonElement) {
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

function PostCardHome({ post, gestorId, onLike, onComentar, isComentando }: {
  post: Post;
  gestorId: number;
  onLike: (liked: boolean) => void;
  onComentar: (postId: number, texto: string) => Promise<void>;
  isComentando: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const liked = post.curtidas.includes(gestorId);

  const tipo     = TIPO_LABEL[post.tipoPublicacao];
  const isKudo   = post.tipoPublicacao === 'K';
  const dateStr  = (() => {
    const d = new Date(post.dataPostagem);
    return isNaN(d.getTime()) ? post.dataPostagem : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  })();

  return (
    <>
      {/* Card clicável no corpo abre o drawer */}
      <div
        role="button"
        tabIndex={0}
        className="bg-white border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
        onClick={() => setDrawerOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerOpen(true); } }}
        aria-label={`Ver post de ${post.remetenteNome}`}
      >
        {/* Badge de tipo */}
        {tipo && (
          <div className="px-4 pt-3 pb-1">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${tipo.color}`}>
              {isKudo ? '❤️' : '📣'} {tipo.label}
            </span>
          </div>
        )}

        {/* Header: avatar + nome + data | kudo para */}
        <div className="px-4 py-2 flex items-start gap-3">
          <AvatarGradient nome={post.remetenteNome} foto={post.remetenteFoto} size={40} />
          <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">{post.remetenteNome}</p>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
            {isKudo && post.destinatarioNome && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">Kudo para:</p>
                <p className="text-sm font-bold">{post.destinatarioNome}</p>
              </div>
            )}
          </div>
        </div>

        {/* Mensagem (truncada no card) */}
        {post.mensagem && (
          <p className="px-4 pb-3 text-sm text-foreground leading-snug line-clamp-3">{post.mensagem}</p>
        )}
        {post.titulo && !post.mensagem && (
          <p className="px-4 pb-3 text-sm font-medium line-clamp-2">{post.titulo}</p>
        )}

        {/* Ações — stopPropagation para não abrir o drawer ao clicar */}
        <div className="px-4 pb-3 flex items-center gap-4 border-t border-border pt-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!liked) burstHearts(e.currentTarget); onLike(!liked); }}
            aria-label={liked ? `Descurtir. ${post.curtidas.length} curtidas` : `Curtir. ${post.curtidas.length} curtidas`}
            aria-pressed={liked}
            className={`flex items-center gap-1 text-sm transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
          >
            <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span> {post.curtidas.length}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDrawerOpen(true); }}
            aria-label={`Ver ${post.numComentarios} comentário${post.numComentarios !== 1 ? 's' : ''}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span aria-hidden="true">💬</span> {post.numComentarios}
          </button>
        </div>
      </div>

      {/* Drawer de detalhes */}
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

function ComunicadoCardHome({ c }: { c: Comunicado }) {
  const [expanded, setExpanded] = useState(false);
  const sanitized = typeof window !== 'undefined' ? DOMPurify.sanitize(c.corpo) : c.corpo;
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2">
      <p className="font-medium text-sm">{c.assunto}</p>
      <p className="text-xs text-muted-foreground">{c.remetente} · {new Date(c.dataRecebimento).toLocaleDateString('pt-BR')}</p>
      {expanded && <div className="text-sm prose prose-sm max-w-none mt-1" dangerouslySetInnerHTML={{ __html: sanitized }} />}
      <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs text-primary hover:underline text-left">
        {expanded ? 'Ocultar' : 'Ver conteúdo'}
      </button>
    </div>
  );
}

export default function HomePage() {
  const [anivTab,  setAnivTab]  = useState('aniv');
  const [feedTab,  setFeedTab]  = useState('posts');
  const gestorId = useUserStore((s) => s.gestorId);
  const { aniversariantes, novosColabs, isLoading, isError, refetch } = useHome();
  const { posts, comunicados, isLoading: feedLoading, criarPost, isCriando, toggleLike, comentar, isComentando } = useFeed(1);

  async function handlePost(payload: { texto: string; tipoPublicacao: string; destinatarioId?: number }) {
    await criarPost(payload);
  }

  if (isError) {
    return <div className="p-4"><ErrorSection message="Não foi possível carregar o início." onRetry={refetch} /></div>;
  }

  const anivItems = anivTab === 'aniv' ? aniversariantes : novosColabs;
  const anivLabel = anivTab === 'aniv' ? 'Aniversariantes hoje' : 'Novos na Squadra';

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      <GreetingCard />

      {/* Aniversariantes — card com tabs dentro */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={ANIV_TABS} active={anivTab} onChange={setAnivTab} />
        </div>
        <div className="px-4 pb-4 pt-2">
          <AnivCard label={anivLabel} items={anivItems} isLoading={isLoading} isAniv={anivTab === 'aniv'} />
        </div>
      </div>

      {/* Squadra em Rede — card com tabs + compose + posts */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={FEED_TABS} active={feedTab} onChange={setFeedTab} />
        </div>

        {feedTab === 'posts' && (
          <div className="flex flex-col gap-3 p-4">
            {/* ComposeBox */}
            <ComposeBox onPost={handlePost} isPosting={isCriando} />

            {feedLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="100px" width="100%" />)
              : posts.length === 0
              ? <EmptyState image={ASSETS.emptyFeed} title="Nenhuma publicação ainda" />
              : posts.map((p: Post) => (
                  <PostCardHome
                    key={p.idPost}
                    post={p}
                    gestorId={gestorId}
                    onLike={(liked) => toggleLike(p.idPost, liked)}
                    onComentar={comentar}
                    isComentando={isComentando}
                  />
                ))
            }
          </div>
        )}

        {feedTab === 'comunicados' && (
          <div className="flex flex-col gap-3 p-4">
            {feedLoading
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height="80px" width="100%" />)
              : comunicados.length === 0
              ? <EmptyState image={ASSETS.emptyComunicados} title="Nenhum comunicado" />
              : comunicados.map((c: Comunicado, i) => <ComunicadoCardHome key={`${c.assunto}-${i}`} c={c} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}
