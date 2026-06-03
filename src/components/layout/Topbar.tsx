'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { useUserStore } from '@/store/user';
import { MobileNav } from './MobileNav';

const ROUTE_LABELS: [string, string][] = [
  ['/gestao',       'Gestão'],
  ['/ponto',        'Ponto'],
  ['/percentual',   'Percentual'],
  ['/rh',           'RH'],
  ['/feed',         'Squadra em Rede'],
  ['/holerite',     'Holerite'],
  ['/ferias',       'Férias'],
  ['/pessoas',      'Pessoas'],
  ['/solicitacoes', 'Solicitar'],
  ['/perfil',       'Perfil'],
  ['/home',         'Home'],
];

function routeLabel(pathname: string): string {
  for (const [prefix, label] of ROUTE_LABELS) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return label;
  }
  return 'Squadra';
}

export function Topbar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { nome, cargo, foto, simulando, drawerOpen, setDrawer } = useUserStore();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4">
        {/* Hamburguer — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setDrawer(true)}
          aria-label="Abrir menu"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>

        {/* Logo fica na Sidebar no desktop — aqui só o título */}
        <span className="flex-1 truncate font-semibold text-sm">
          {routeLabel(pathname)}
        </span>

        {simulando && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-200">
            Simulando
          </span>
        )}

        {/* Nome + cargo — desktop only */}
        {nome && (
          <button
            onClick={() => router.push('/perfil')}
            className="hidden md:flex flex-col items-end leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md hover:opacity-80 transition-opacity"
            aria-label={`Ver perfil de ${nome}`}
          >
            <span className="text-sm font-semibold text-foreground">{nome}</span>
            {cargo && <span className="text-xs text-muted-foreground uppercase tracking-wide">{cargo}</span>}
          </button>
        )}

        <button
          onClick={() => router.push('/perfil')}
          className="rounded-full ring-2 ring-transparent hover:ring-primary/30 focus-visible:ring-ring transition-all focus:outline-none"
          aria-label="Ir para perfil"
        >
          <AvatarGradient nome={nome || ''} foto={foto} size={32} />
        </button>
      </header>

      {/* Mobile nav drawer */}
      <MobileNav open={drawerOpen} onClose={() => setDrawer(false)} />
    </>
  );
}
