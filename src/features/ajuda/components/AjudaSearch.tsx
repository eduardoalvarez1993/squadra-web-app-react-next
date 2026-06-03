'use client';

import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { AjudaResposta, type ItemAjuda } from './AjudaResposta';

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 rounded-sm">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function ResultRow({ item, q }: { item: ItemAjuda; q: string }) {
  const [open, setOpen] = useState(false);
  const preview = item.resposta.slice(0, 100).replace(/\n/g, ' ');

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col gap-1 w-full px-4 py-3 text-left hover:bg-accent/30 transition-colors cursor-pointer"
      >
        <p className="text-xs text-muted-foreground">
          {item.categoria} › {item.subcategoria}
        </p>
        <p className="text-sm font-medium text-foreground">
          {highlight(item.problema, q)}
        </p>
        {!open && item.resposta && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {preview}{item.resposta.length > 100 ? '…' : ''}
          </p>
        )}
        <ChevronDownIcon className={`h-4 w-4 text-muted-foreground self-end transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <AjudaResposta item={item} />
        </div>
      )}
    </div>
  );
}

export function AjudaSearch({ dados, q }: { dados: ItemAjuda[]; q: string }) {
  const resultados = dados.filter((i) => {
    const query = q.toLowerCase();
    return (
      i.problema.toLowerCase().includes(query) ||
      i.resposta.toLowerCase().includes(query) ||
      i.categoria.toLowerCase().includes(query) ||
      i.subcategoria.toLowerCase().includes(query)
    );
  });

  if (resultados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum resultado para &ldquo;{q}&rdquo;.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
      </p>
      {resultados.map((item) => (
        <ResultRow key={`${item.categoria}-${item.problema}`} item={item} q={q} />
      ))}
    </div>
  );
}
