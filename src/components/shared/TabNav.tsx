'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  badge?: number;
}

interface TabNavProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabNav({ tabs, active, onChange, className }: TabNavProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [overflowLeft, setOverflowLeft] = useState(false);
  const [overflowRight, setOverflowRight] = useState(false);

  const updateOverflow = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflowLeft(el.scrollLeft > 1);
    setOverflowRight(el.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    updateOverflow();
    const el = listRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateOverflow, { passive: true });
    window.addEventListener('resize', updateOverflow);
    return () => {
      el.removeEventListener('scroll', updateOverflow);
      window.removeEventListener('resize', updateOverflow);
    };
  }, [updateOverflow, tabs.length]);

  // Centraliza a aba ativa no scroll lateral (cobre clique e navegação por teclado)
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = tabs.findIndex((t) => t.id === active);
    const btn = el.children[idx] as HTMLElement | undefined;
    if (!btn) return;
    const target = btn.offsetLeft - (el.clientWidth - btn.clientWidth) / 2;
    el.scrollTo({ left: target, behavior: 'smooth' });
  }, [active, tabs]);

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowRight') {
      const next = tabs[(idx + 1) % tabs.length];
      onChange(next.id);
      (e.currentTarget.parentElement?.children[(idx + 1) % tabs.length] as HTMLElement)?.focus();
    } else if (e.key === 'ArrowLeft') {
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      onChange(prev.id);
      (e.currentTarget.parentElement?.children[(idx - 1 + tabs.length) % tabs.length] as HTMLElement)?.focus();
    }
  }

  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      <div
        ref={listRef}
        role="tablist"
        className="flex border-b border-border overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar"
      >
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active}
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={[
              'flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-md cursor-pointer',
              tab.id === active
                ? 'text-primary border-b-2 border-primary -mb-px bg-transparent'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
            {(tab.badge ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Indicadores de scroll lateral — mostram que há mais abas fora da tela */}
      <div
        aria-hidden
        className={[
          'pointer-events-none absolute left-0 top-0 bottom-px flex w-8 items-center justify-start bg-gradient-to-r from-background to-transparent transition-opacity duration-200',
          overflowLeft ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <ChevronLeftIcon className="h-5 w-5 text-primary" />
      </div>
      <div
        aria-hidden
        className={[
          'pointer-events-none absolute right-0 top-0 bottom-px flex w-8 items-center justify-end bg-gradient-to-l from-background to-transparent transition-opacity duration-200',
          overflowRight ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <ChevronRightIcon className="h-5 w-5 text-primary animate-pulse" />
      </div>
    </div>
  );
}
