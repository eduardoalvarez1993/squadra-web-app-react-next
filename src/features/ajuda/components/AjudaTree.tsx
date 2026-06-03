'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { AjudaResposta, type ItemAjuda } from './AjudaResposta';

type Subcategoria = { nome: string; items: ItemAjuda[] };
type Categoria    = { nome: string; subcategorias: Subcategoria[] };

function buildTree(dados: ItemAjuda[]): Categoria[] {
  const map = new Map<string, Map<string, ItemAjuda[]>>();
  for (const item of dados) {
    if (!map.has(item.categoria)) map.set(item.categoria, new Map());
    const sub = map.get(item.categoria)!;
    if (!sub.has(item.subcategoria)) sub.set(item.subcategoria, []);
    sub.get(item.subcategoria)!.push(item);
  }
  return Array.from(map.entries()).map(([nome, subs]) => ({
    nome,
    subcategorias: Array.from(subs.entries()).map(([snome, items]) => ({ nome: snome, items })),
  }));
}

// ── Nível 3: Pergunta/Problema ────────────────────────────────────────────────
function ProblemRow({ item }: { item: ItemAjuda }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-t border-border/60 first:border-t-0 ${open ? 'bg-blue-50/40' : 'bg-white'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-start gap-2.5 w-full px-4 py-3 text-left text-sm hover:bg-blue-50/50 transition-colors cursor-pointer group"
      >
        <span className="text-primary/50 mt-0.5 flex-shrink-0 text-xs font-bold">›</span>
        <span className="flex-1 text-foreground/80 group-hover:text-foreground transition-colors">{item.problema}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-l-2 border-primary/20 ml-4">
          <AjudaResposta item={item} />
        </div>
      )}
    </div>
  );
}

// ── Nível 2: Subcategoria ─────────────────────────────────────────────────────
function SubcategoriaSection({ sub }: { sub: Subcategoria }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <ChevronRightIcon className={`h-3.5 w-3.5 text-primary/60 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span className="text-sm font-semibold text-foreground/70 flex-1">{sub.nome}</span>
        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {sub.items.length}
        </span>
      </button>
      {open && (
        <div className="border-l-2 border-primary/20 ml-6">
          {sub.items.map((item) => (
            <ProblemRow key={item.problema} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Nível 1 Mobile: Categoria ─────────────────────────────────────────────────
function MobileTree({ categorias }: { categorias: Categoria[] }) {
  const [catAberta, setCatAberta] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {categorias.map((cat) => {
        const isOpen = catAberta === cat.nome;
        const total  = cat.subcategorias.reduce((acc, s) => acc + s.items.length, 0);
        return (
          <div key={cat.nome} className={`border border-border rounded-xl overflow-hidden transition-shadow ${isOpen ? 'shadow-sm' : ''}`}>
            {/* Cabeçalho de categoria — nível mais alto */}
            <button
              type="button"
              onClick={() => setCatAberta(isOpen ? null : cat.nome)}
              className={`flex items-center justify-between w-full px-4 py-3.5 text-left transition-colors cursor-pointer ${
                isOpen ? 'bg-primary/5 border-b border-primary/10' : 'bg-white hover:bg-accent/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                <span className={`text-sm font-bold ${isOpen ? 'text-primary' : 'text-foreground'}`}>
                  {cat.nome}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{total}</span>
                <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
              </div>
            </button>

            {/* Subcategorias e problemas */}
            {isOpen && (
              <div className="bg-white">
                {cat.subcategorias.map((sub) => (
                  <SubcategoriaSection key={sub.nome} sub={sub} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Nível 1 Desktop: dois painéis ─────────────────────────────────────────────
function DesktopTree({ categorias }: { categorias: Categoria[] }) {
  const [catSel, setCatSel] = useState<string>(categorias[0]?.nome ?? '');
  const cat = categorias.find((c) => c.nome === catSel);

  return (
    <div className="flex gap-4 items-start">
      {/* Painel esquerdo — categorias (nível 1) */}
      <div className="w-52 flex-shrink-0 bg-white border border-border rounded-xl overflow-hidden sticky top-20">
        <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 border-b border-border">
          Categorias
        </p>
        {categorias.map((c) => {
          const active = c.nome === catSel;
          const total  = c.subcategorias.reduce((acc, s) => acc + s.items.length, 0);
          return (
            <button
              key={c.nome}
              type="button"
              onClick={() => setCatSel(c.nome)}
              className={[
                'flex items-center justify-between w-full px-4 py-2.5 text-left text-sm transition-colors border-b border-border last:border-b-0',
                active
                  ? 'bg-primary/8 text-primary font-bold border-l-2 border-l-primary cursor-default'
                  : 'text-foreground/70 hover:bg-accent/40 hover:text-foreground cursor-pointer',
              ].join(' ')}
            >
              <span className="truncate">{c.nome}</span>
              <span className={`text-[11px] ml-1 flex-shrink-0 ${active ? 'text-primary/70' : 'text-muted-foreground'}`}>
                {total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Painel direito — subcategorias + perguntas (níveis 2 e 3) */}
      <div className="flex-1 min-w-0 bg-white border border-border rounded-xl overflow-hidden">
        {cat ? (
          <>
            <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 border-b border-border">
              {cat.nome}
            </p>
            {cat.subcategorias.map((sub) => (
              <SubcategoriaSection key={sub.nome} sub={sub} />
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ── Export principal ───────────────────────────────────────────────────────────
export function AjudaTree({ dados }: { dados: ItemAjuda[] }) {
  const categorias = buildTree(dados);
  if (categorias.length === 0) return null;

  return (
    <>
      <div className="md:hidden">
        <MobileTree categorias={categorias} />
      </div>
      <div className="hidden md:block">
        <DesktopTree categorias={categorias} />
      </div>
    </>
  );
}
