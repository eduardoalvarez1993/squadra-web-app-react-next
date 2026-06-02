'use client';

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
    <div
      role="tablist"
      className={`flex border-b border-border${className ? ` ${className}` : ''}`}
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
  );
}
