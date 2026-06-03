'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchIcon, ArrowLeftIcon } from 'lucide-react';
import { AjudaSearch } from './AjudaSearch';
import { AjudaTree }   from './AjudaTree';
import type { ItemAjuda } from './AjudaResposta';

export function AjudaPageClient({ dados }: { dados: ItemAjuda[] }) {
  const [busca, setBusca] = useState('');
  const q = busca.trim();

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-2">
        <Link href="/recursos" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors" aria-label="Voltar">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Ajuda</h1>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar dúvida, procedimento ou palavra-chave..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {q.length >= 2
        ? <AjudaSearch dados={dados} q={q} />
        : <AjudaTree   dados={dados} />
      }
    </div>
  );
}
