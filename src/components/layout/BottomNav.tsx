'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HomeIcon, SearchIcon, MoreHorizontalIcon } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { ASSETS } from '@/lib/assets';

export function BottomNav() {
  const { setDrawer, setFluencia } = useUserStore();
  const pathname = usePathname();

  function itemCls(href: string) {
    const active = pathname === href || pathname.startsWith(href + '/');
    return [
      'flex flex-col items-center gap-0.5 px-3 py-2 min-w-[52px] min-h-[44px] justify-center rounded-md transition-colors',
      active ? 'text-primary' : 'text-muted-foreground',
    ].join(' ');
  }

  const labelCls = 'text-[10px] font-medium';

  return (
    <nav aria-label="Menu inferior" className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-border bg-white px-2 pb-safe">
      <Link href="/home" className={itemCls('/home')}>
        <HomeIcon className="h-5 w-5" />
        <span className={labelCls}>Home</span>
      </Link>

      <Link href="/pessoas" className={itemCls('/pessoas')}>
        <SearchIcon className="h-5 w-5" />
        <span className={labelCls}>Pessoas</span>
      </Link>

      {/* FluencIA — botão central destacado */}
      <button
        className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[52px] min-h-[44px] justify-center rounded-md transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => setFluencia(true)}
      >
        <Image
          src={ASSETS.fluenciaIcon}
          alt="FluencIA"
          width={22}
          height={22}
          className="h-[22px] w-[22px] rounded-sm"
        />
        <span className={labelCls}>FluencIA</span>
      </button>

      {/* Mais — abre drawer completo */}
      <button
        className={itemCls('#mais')}
        onClick={() => setDrawer(true)}
      >
        <MoreHorizontalIcon className="h-5 w-5" />
        <span className={labelCls}>Mais</span>
      </button>
    </nav>
  );
}
