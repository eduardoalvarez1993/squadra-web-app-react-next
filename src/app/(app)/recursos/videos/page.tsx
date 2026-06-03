'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { SearchIcon, PlayCircleIcon, ArrowLeftIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { ASSETS } from '@/lib/assets';
type VideoItem = { titulo: string; youtubeId: string; categoria: string };

function VideosLoader() {
  return (
    <div className="videos-loading-wrap" role="status" aria-live="polite">
      <span className="videos-loading-stage" aria-hidden="true">
        <Image className="videos-loading-frame" src={ASSETS.loadingVideosFrame} alt="" width={320} height={220} priority unoptimized />
        <Image className="videos-loading-reel" src={ASSETS.loadingVideosReel} alt="" width={180} height={180} priority unoptimized />
      </span>
      <strong>Carregando videos...</strong>
    </div>
  );
}

export default function VideosPage() {
  const [busca,     setBusca]     = useState('');
  const [categoria, setCategoria] = useState('Todos');

  const { data: videos = [], isLoading, isError, refetch } = useQuery<VideoItem[]>({
    queryKey: ['videos'],
    queryFn:  async () => {
      const res = await fetch('/api/videos');
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1h — espelha o revalidate do servidor
  });

  const categorias = useMemo(() => {
    const cats = Array.from(new Set(videos.map((v) => v.categoria)));
    return ['Todos', ...cats.sort()];
  }, [videos]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return videos.filter((v) => {
      const matchCat = categoria === 'Todos' || v.categoria === categoria;
      const matchQ   = !q || v.titulo.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [videos, busca, categoria]);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-2">
        <Link href="/recursos" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors" aria-label="Voltar">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Vídeos</h1>
      </div>

      {/* Busca */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar vídeo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Loading */}
      {isLoading && <VideosLoader />}

      {/* Erro */}
      {isError && (
        <ErrorSection message="Não foi possível carregar os vídeos." onRetry={() => refetch()} />
      )}

      {/* Filtro por categoria */}
      {!isLoading && !isError && categorias.length > 2 && (
        <div className="flex gap-2 flex-wrap">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={[
                'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
                categoria === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-accent/60',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {!isLoading && !isError && (
        filtrados.length === 0 ? (
          videos.length === 0
            ? <EmptyState title="Nenhum vídeo disponível" description="Os vídeos institucionais aparecerão aqui em breve." />
            : <p className="text-sm text-muted-foreground text-center py-8">Nenhum vídeo encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtrados.map((video) => (
              <a
                key={video.youtubeId}
                href={`https://youtu.be/${video.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-video bg-muted overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    alt={video.titulo}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircleIcon className="h-12 w-12 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div className="px-4 py-3 flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                    {video.titulo}
                  </p>
                  <span className="text-xs text-muted-foreground">{video.categoria}</span>
                </div>
              </a>
            ))}
          </div>
        )
      )}
    </div>
  );
}
