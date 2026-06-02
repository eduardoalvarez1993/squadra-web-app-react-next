'use client';

import { AvatarGradient } from './AvatarGradient';
import { Button } from '@/components/ui/button';
import { HeartIcon, MessageCircleIcon } from 'lucide-react';

interface PostCardProps {
  autor: { nome: string; foto: string | null; cargo?: string };
  texto: string;
  data: string;
  curtidas: number;
  curtido: boolean;
  totalComentarios: number;
  onLike: () => void;
  onToggleComments: () => void;
  children?: React.ReactNode;
}

export function PostCard({
  autor,
  texto,
  data,
  curtidas,
  curtido,
  totalComentarios,
  onLike,
  onToggleComments,
  children,
}: PostCardProps) {
  return (
    <article className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <AvatarGradient nome={autor.nome} foto={autor.foto} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{autor.nome}</p>
          {autor.cargo && (
            <p className="text-xs text-muted-foreground">{autor.cargo}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{data}</span>
      </div>

      {/* texto como plain-text para evitar XSS */}
      <p className="text-sm whitespace-pre-wrap break-words">{texto}</p>

      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          aria-pressed={curtido}
          className={`gap-1.5 ${curtido ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}`}
        >
          <HeartIcon
            className="h-4 w-4"
            fill={curtido ? 'currentColor' : 'none'}
            strokeWidth={curtido ? 0 : 2}
          />
          {curtidas}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleComments}
          className="gap-1.5 text-muted-foreground"
        >
          <MessageCircleIcon className="h-4 w-4" />
          {totalComentarios}
        </Button>
      </div>

      {children}
    </article>
  );
}
