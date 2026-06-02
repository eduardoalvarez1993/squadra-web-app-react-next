'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface DrawerFormProps {
  open:      boolean;
  onClose:   () => void;
  title:     string;
  children:  React.ReactNode;
  readOnly?: boolean;
  side?:     'right' | 'left' | 'top' | 'bottom';
}

export function DrawerForm({
  open,
  onClose,
  title,
  children,
  readOnly = false,
  side = 'right',
}: DrawerFormProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={side}
        aria-modal="true"
        className={[
          'flex flex-col gap-0 p-0',
          side === 'right' || side === 'left' ? 'w-[420px] max-w-full' : 'max-h-[90dvh]',
        ].join(' ')}
      >
        {/* Header */}
        <SheetHeader className="flex-shrink-0 px-5 py-4 border-b border-border bg-white">
          <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
        </SheetHeader>

        {/* Conteúdo scrollável com padding generoso */}
        <div
          className={[
            'flex-1 overflow-y-auto px-5 py-5',
            readOnly ? 'pointer-events-none select-none' : '',
          ].join(' ')}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
