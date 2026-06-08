'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { PessoaCard } from '@/components/shared/PessoaCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { usePessoas } from '@/features/pessoas/hooks/usePessoas';
import type { PessoaData } from '@/services/squadra-client';
import { ASSETS } from '@/lib/assets';

// Lazy: o drawer do colaborador só carrega ao selecionar alguém.
const DrawerColaborador = dynamic(() => import('@/features/pessoas/components/DrawerColaborador').then((m) => m.DrawerColaborador));

function SearchHint() {
  return (
    <div className="pessoas-search-hint">
      <span className="pessoas-type-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pessoas-type-keyboard-img" src={ASSETS.pessoasBuscaTeclado} alt="" loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pessoas-type-hand-img" src={ASSETS.pessoasBuscaMao} alt="" loading="lazy" />
      </span>
      <strong><span>Digite 3</span> letras para buscar colaboradores.</strong>
    </div>
  );
}

function SearchLoader() {
  return (
    <div className="pessoas-search-loader">
      <span className="search-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="search-base" src={ASSETS.buscandoEquipeBase} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="search-lens" src={ASSETS.buscandoLupa} alt="" />
      </span>
      <strong>Buscando colaboradores...</strong>
    </div>
  );
}

function useDebounce(value: string, ms: number) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}


export default function PessoasPage() {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState<PessoaData | null>(null);
  const debouncedQ = useDebounce(query, 300);

  const { data, isLoading, isError } = usePessoas(debouncedQ);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold">Pessoas</h1>

      <Input
        placeholder="Buscar por nome…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isError && (
        <ErrorSection message="Erro na busca." onRetry={() => setQuery((q) => q + ' ')} />
      )}

      {!isError && debouncedQ.length < 3 && <SearchHint />}

      {!isError && debouncedQ.length >= 3 && isLoading && <SearchLoader />}

      {!isLoading && data && data.length === 0 && debouncedQ.length >= 3 && (
        <EmptyState
          image={ASSETS.emptyPessoas}
          title="Nenhum colaborador encontrado"
          description="Tente buscar por outro nome ou confira se digitou corretamente."
        />
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.map((p) => (
            <PessoaCard
              key={p.id}
              nome={p.nomeSocial || p.nome}
              foto={p.foto}
              cargo={p.cargo}
              onClick={() => setSelected(p)}
            />
          ))}
        </div>
      )}

      {selected && (
        <DrawerColaborador
          pessoaId={selected.id}
          nomeInicial={selected.nomeSocial || selected.nome}
          fotoInicial={selected.foto}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
