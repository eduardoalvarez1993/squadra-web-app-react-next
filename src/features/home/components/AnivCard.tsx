'use client';

import { useState } from 'react';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { DrawerColaborador } from '@/features/pessoas/components/DrawerColaborador';
import { ASSETS } from '@/lib/assets';
import type { ColaboradorResumo } from '@/services/squadra-client';

function AniversariantesLoading() {
  return (
    <div className="is-aniversariantes-loading">
      <span className="aniversariantes-loading-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="aniversariantes-loading-cake" src={ASSETS.loadingAniversariantes} alt="" loading="lazy" />
        <span className="aniversariantes-flame aniversariantes-flame-1" />
        <span className="aniversariantes-flame aniversariantes-flame-2" />
        <span className="aniversariantes-flame aniversariantes-flame-3" />
      </span>
      <strong>Encontrando aniversariantes...</strong>
    </div>
  );
}

function NovosColabsLoading() {
  return (
    <div className="is-novos-colaboradores-loading">
      <span className="novos-colaboradores-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="novos-colaboradores-kit" src={ASSETS.loadingNovosColabs} alt="" loading="lazy" />
        <span className="novos-colaboradores-badge">
          <span className="novos-colaboradores-badge-avatar" />
          <span className="novos-colaboradores-badge-lines">
            <span />
            <span />
          </span>
        </span>
      </span>
      <strong>Encontrando novos colaboradores</strong>
    </div>
  );
}

interface AnivCardProps {
  label:     string;
  items:     ColaboradorResumo[];
  isLoading: boolean;
  isAniv?:   boolean;
}

export function AnivCard({ label, items, isLoading, isAniv = true }: AnivCardProps) {
  const [selected, setSelected] = useState<ColaboradorResumo | null>(null);

  if (isLoading) {
    return (
      <section aria-label={label}>
        {isAniv ? <AniversariantesLoading /> : <NovosColabsLoading />}
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section aria-label={label}>
        <div className="aniversariantes-empty">
          {isAniv && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ASSETS.emptyAniversariantes} alt="" loading="lazy" />
          )}
          <span>
            {isAniv
              ? 'Que pena, nenhum aniversariante para comemorar hoje.'
              : 'Nenhum novo colaborador recentemente.'}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={label}>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c)}
            className="flex flex-col items-center gap-1 flex-shrink-0 hover:opacity-80 transition-opacity focus:outline-none group cursor-pointer"
            aria-label={`Ver perfil de ${c.nome.split(' ')[0]}`}
          >
            <div className="ring-2 ring-transparent group-hover:ring-primary/30 rounded-full transition-all">
              <AvatarGradient nome={c.nome} foto={c.foto} size={48} />
            </div>
            <span className="text-xs text-muted-foreground max-w-[60px] truncate text-center">
              {c.nome.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {selected && selected.id > 0 && (
        <DrawerColaborador
          pessoaId={selected.id}
          nomeInicial={selected.nome}
          fotoInicial={selected.foto}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
