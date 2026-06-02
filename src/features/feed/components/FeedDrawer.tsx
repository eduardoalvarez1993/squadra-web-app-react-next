'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { Button } from '@/components/ui/button';
import { useComentarios } from '@/features/feed/hooks/useFeed';
import { useUserStore } from '@/store/user';
import type { Post, Comentario } from '@/features/feed/hooks/useFeed';

const MAX_LIKERS_SHOWN = 12;

type LikerInfo = { id: number; nome: string; foto: string | null };

function isMesmoComentario(a: Comentario, b: Comentario) {
  return (
    a.idAutor === b.idAutor &&
    a.descComentario.trim() === b.descComentario.trim()
  );
}

function useLikers(ids: number[]) {
  const slice = ids.slice(0, MAX_LIKERS_SHOWN);
  const results = useQueries({
    queries: slice.map((id) => ({
      queryKey: ['pessoa-mini', id],
      queryFn:  async (): Promise<LikerInfo> => {
        const res = await fetch(`/api/pessoas/${id}`);
        if (!res.ok) return { id, nome: '', foto: null };
        const d = await res.json();
        return {
          id,
          nome: String(d.nomeSocial ?? d.nome ?? ''),
          foto: (d.foto as string | null) ?? null,
        };
      },
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const likers    = results.map((r, i) => r.data ?? { id: slice[i], nome: '', foto: null });
  return { likers, isLoading };
}

interface FeedDrawerProps {
  post:          Post;
  gestorId:      number;
  onClose:       () => void;
  onLike:        (liked: boolean) => void;
  onComentar:    (postId: number, texto: string) => Promise<void>;
  isComentando?: boolean;
}

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  K: { label: 'KUDOS',      color: 'bg-pink-100 text-pink-600' },
  C: { label: 'COMUNICADO', color: 'bg-blue-100 text-blue-600' },
  D: { label: 'DESTAQUE',   color: 'bg-purple-100 text-purple-600' },
  I: { label: 'IDEIA',      color: 'bg-amber-100 text-amber-600' },
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

export function FeedDrawer({
  post, gestorId, onClose, onLike, onComentar, isComentando = false,
}: FeedDrawerProps) {
  const [texto, setTexto] = useState('');
  const [localComentarios, setLocalComentarios] = useState<Comentario[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const liked    = post.curtidas.includes(gestorId);
  const { likers, isLoading: loadingLikers } = useLikers(post.curtidas);
  const nomeAtual = useUserStore((s) => s.nome);
  const fotoAtual = useUserStore((s) => s.foto);
  const pessoaIdAtual = useUserStore((s) => s.pessoaId);

  const qc = useQueryClient();
  const { data: serverComentarios, isLoading: loadingComents } = useComentarios(post.idPost);
  const comentariosServidor = serverComentarios ?? [];
  const comentariosLocaisPendentes = localComentarios.filter(
    (local) => !comentariosServidor.some((server) => isMesmoComentario(server, local))
  );
  const comentarios = [...comentariosServidor, ...comentariosLocaisPendentes];

  const deletarComentarioMutation = useMutation({
    mutationFn: async (comentarioId: number) => {
      const res = await fetch(`/api/feed/comentarios?id=${comentarioId}&postId=${post.idPost}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao deletar comentário');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed', 'comentarios', post.idPost] }),
  });

  const tipo   = TIPO_LABEL[post.tipoPublicacao];
  const isKudo = post.tipoPublicacao === 'K';
  const dateStr = (() => {
    const d = new Date(post.dataPostagem);
    return isNaN(d.getTime()) ? post.dataPostagem
      : d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  })();

  async function enviar() {
    const t = texto.trim();
    if (!t) return;
    const optimisticId = -Date.now();
    setTexto('');
    setLocalComentarios((prev) => [
      ...prev,
      { id: optimisticId, descComentario: t, idAutor: pessoaIdAtual, nomeAutor: nomeAtual ?? 'Você', fotoAutor: fotoAtual ?? null },
    ]);
    inputRef.current?.focus();
    try {
      await onComentar(post.idPost, t);
    } catch {
      setLocalComentarios((prev) => prev.filter((c) => c.id !== optimisticId));
    }
  }

  async function removerComentario(comentario: Comentario) {
    if (!window.confirm('Remover este comentário?')) return;
    if (comentario.id < 0) {
      setLocalComentarios((prev) => prev.filter((c) => c.id !== comentario.id));
      return;
    }
    setLocalComentarios((prev) => prev.filter((c) => !isMesmoComentario(c, comentario)));
    await deletarComentarioMutation.mutateAsync(comentario.id);
  }

  // Fechar com Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[1000]"
        onClick={onClose}
        aria-hidden
      />

      {/* Painel lateral direito */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[1001] flex flex-col bg-white shadow-2xl"
        style={{ width: 'min(500px, 100vw)', animation: 'drawerIn .22s ease' }}
        role="dialog"
        aria-label="Detalhes do post"
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-muted-foreground hover:text-foreground transition-colors leading-none w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto">
          {/* Post completo */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            {tipo && (
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mb-3 ${tipo.color}`}>
                {isKudo ? '❤️' : '📣'} {tipo.label}
              </span>
            )}

            <div className="flex items-start gap-3 mb-3">
              <AvatarGradient nome={post.remetenteNome} foto={post.remetenteFoto} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">{post.remetenteNome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
                {isKudo && post.destinatarioNome && (
                  <p className="text-xs mt-1">
                    Kudo para: <span className="font-bold">{post.destinatarioNome}</span>
                  </p>
                )}
              </div>
            </div>

            {post.titulo && <p className="font-semibold text-sm mb-2">{post.titulo}</p>}
            {post.mensagem && (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {post.mensagem}
              </p>
            )}
          </div>

          {/* Stats + like */}
          <div className="px-5 py-3 border-b border-border flex items-center gap-6">
            <button
              type="button"
              onClick={(e) => { if (!liked) burstHearts(e.currentTarget); onLike(!liked); }}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
            >
              {liked ? '❤️' : '🤍'}
              <span>{post.curtidas.length} {post.curtidas.length === 1 ? 'curtida' : 'curtidas'}</span>
            </button>
            <span className="text-sm text-muted-foreground">
              💬 {post.numComentarios} {post.numComentarios === 1 ? 'comentário' : 'comentários'}
            </span>
          </div>

          {/* Quem curtiu */}
          {post.curtidas.length > 0 && (
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">
                Curtidas ({post.curtidas.length})
              </p>
              {loadingLikers ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(post.curtidas.length, MAX_LIKERS_SHOWN) }).map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {likers.map((liker) => (
                    <div
                      key={liker.id}
                      className="flex items-center gap-1.5 bg-[#f5f7fa] rounded-full px-2 py-1"
                      title={liker.nome || String(liker.id)}
                    >
                      <AvatarGradient nome={liker.nome || String(liker.id)} foto={liker.foto} size={22} />
                      {liker.nome && (
                        <span className="text-xs font-semibold text-foreground pr-1">{liker.nome.split(' ')[0]}</span>
                      )}
                    </div>
                  ))}
                  {post.curtidas.length > MAX_LIKERS_SHOWN && (
                    <div className="flex items-center justify-center bg-muted rounded-full px-3 py-1">
                      <span className="text-xs font-bold text-muted-foreground">+{post.curtidas.length - MAX_LIKERS_SHOWN}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comentários */}
          <div className="px-5 py-4 flex flex-col gap-4">
            <p className="text-sm font-bold text-foreground uppercase tracking-wide">Comentários</p>

            {loadingComents && (
              <div className="flex flex-col gap-3">
                {[60, 80, 50].map((w, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className={`h-4 bg-muted animate-pulse rounded`} style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            )}

            {!loadingComents && (!comentarios || comentarios.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</p>
            )}

            {comentarios?.map((c) => (
              <div key={c.id} className="flex items-start gap-2 group">
                <AvatarGradient nome={c.nomeAutor} foto={c.fotoAutor} size={32} />
                <div className="flex-1 bg-[#f5f7fa] rounded-xl px-3 py-2 relative">
                  <p className="text-xs font-semibold text-foreground leading-tight">{c.nomeAutor}</p>
                  <p className="text-sm text-foreground mt-0.5 leading-snug">{c.descComentario}</p>
                  {c.idAutor === pessoaIdAtual && (
                    <button
                      type="button"
                      onClick={() => void removerComentario(c)}
                      disabled={deletarComentarioMutation.isPending}
                      className="absolute top-1.5 right-2 text-xs text-muted-foreground/50 hover:text-red-500 active:text-red-600 transition-colors"
                      aria-label="Remover comentário"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input de comentário fixo no rodapé */}
        <div className="border-t border-border px-4 py-3 flex gap-2 items-center bg-white">
          <input
            ref={inputRef}
            className="flex-1 border border-border rounded-full px-4 py-2 text-sm bg-background outline-none focus:ring-1 focus:ring-ring"
            placeholder="Escreva um comentário…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            disabled={isComentando}
          />
          <Button
            size="sm"
            className="rounded-full px-4"
            onClick={enviar}
            disabled={isComentando || !texto.trim()}
          >
            {isComentando ? '…' : 'Enviar'}
          </Button>
        </div>
      </div>
    </>
  );
}
