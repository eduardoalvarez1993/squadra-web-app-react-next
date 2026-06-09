'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  HomeIcon,
  UsersIcon,
  ClockIcon,
  PercentIcon,
  BriefcaseIcon,
  WalletIcon,
  UmbrellaIcon,
  SearchIcon,
  ClipboardListIcon,
  LogOutIcon,
  ChevronRightIcon,
  LayersIcon,
  LayoutGridIcon,
  MegaphoneIcon,
} from 'lucide-react';
import { useUserStore } from '@/store/user';
import { temAcessoDP } from '@/lib/dp-access';
import { temAcessoMarketing } from '@/lib/marketing-access';
import { Skeleton } from '@/components/shared/Skeleton';
import { ASSETS } from '@/lib/assets';

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

// Menus fixos — igual ao vanilla (sem Feed/Rede e sem Perfil), ícones coloridos
const ALWAYS: NavItem[] = [
  { href: '/home',         label: 'Home',        icon: <HomeIcon          className="h-5 w-5 text-blue-500" /> },
  { href: '/pessoas',      label: 'Pessoas',      icon: <SearchIcon        className="h-5 w-5 text-green-500" /> },
  { href: '/ferias',       label: 'Férias',       icon: <UmbrellaIcon      className="h-5 w-5 text-emerald-500" /> },
  { href: '/holerite',     label: 'Holerite',     icon: <WalletIcon        className="h-5 w-5 text-amber-500" /> },
  { href: '/solicitacoes', label: 'Solicitar',    icon: <ClipboardListIcon className="h-5 w-5 text-orange-500" /> },
  { href: '/recursos',     label: 'Extras',       icon: <LayoutGridIcon    className="h-5 w-5 text-violet-500" /> },
];

export function Sidebar() {
  const {
    permissoes, cargo, temEquipe, gestorId,
    setFluencia, clearUser,
    sidebarCollapsed, toggleSidebar,
  } = useUserStore();
  const pathname  = usePathname();
  const router    = useRouter();
  const hydrated  = gestorId !== 0;

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' }).catch(() => {});
    clearUser();
    router.push('/login');
  }

  // Percentual: gestor com equipe que NÃO bate ponto (apropria horas por %)
  const showPercentual = hydrated && permissoes.gerenteFuncional && !permissoes.bateRep && temEquipe;
  // Ponto fica logo após Home. É o fallback universal: quem não cai em Percentual
  // vê Ponto — espelha o app-react, onde quem não vai para apropriação por % cai em /horas.
  // Garante que ninguém fique sem nenhum dos dois (ex.: bateRep desatualizado no cadastro).
  const showPonto = hydrated && !showPercentual;

  const conditional: NavItem[] = [];
  if (hydrated) {
    if (permissoes.gerenteFuncional && temEquipe) {
      conditional.push({ href: '/gestao',     label: 'Gestão',     icon: <UsersIcon     className="h-5 w-5 text-purple-500" /> });
    }
    if (showPercentual) {
      conditional.push({ href: '/percentual', label: 'Percentual', icon: <PercentIcon   className="h-5 w-5 text-indigo-500" /> });
    }
    if (temAcessoDP(permissoes.perfilDP, cargo)) {
      conditional.push({ href: '/rh',         label: 'RH',         icon: <BriefcaseIcon className="h-5 w-5 text-teal-500" /> });
    }
    if (temAcessoMarketing(permissoes.perfilMarketing)) {
      conditional.push({ href: '/marketing',  label: 'Marketing',  icon: <MegaphoneIcon className="h-5 w-5 text-pink-500" /> });
    }
  }

  const collapsed = sidebarCollapsed;
  const w         = collapsed ? 'w-[56px]' : 'w-52';

  function itemCls(href: string) {
    const active = pathname === href || pathname.startsWith(href + '/');
    const base   = 'flex items-center gap-3 rounded-lg transition-colors w-full';
    const pad    = collapsed ? 'flex-col justify-center py-2 px-1' : 'px-3 py-2';
    const color  = active
      ? 'text-primary bg-primary/10'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60';
    return `${base} ${pad} ${color}`;
  }

  const labelCls = collapsed
    ? 'text-[9px] font-medium leading-none'
    : 'text-sm font-medium';

  const btnCls = (danger = false) => {
    const base = `flex items-center gap-3 rounded-lg transition-colors w-full cursor-pointer ${collapsed ? 'flex-col justify-center py-2 px-1' : 'px-3 py-2'}`;
    return danger
      ? `${base} text-muted-foreground hover:text-red-500 hover:bg-red-50`
      : `${base} text-muted-foreground hover:text-foreground hover:bg-accent/60`;
  };

  return (
    <aside
      aria-label="Menu lateral de navegação"
      className={`hidden md:flex flex-col ${w} h-screen sticky top-0 shrink-0 bg-white border-r border-border items-center px-1 py-3 gap-0.5 transition-all duration-200 overflow-hidden`}
    >
      {/* Logo */}
      <Link
        href="/home"
        className={`flex items-center mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm ${collapsed ? 'justify-center px-0' : 'px-2 justify-start w-full'}`}
      >
        {collapsed ? (
          <span className="text-xs font-black text-primary tracking-tight leading-none">SQ</span>
        ) : (
          <Image src="/squadra-logo.svg" alt="Squadra" width={120} height={30} className="h-7 w-auto" />
        )}
      </Link>

      {/* Home */}
      <Link href="/home" className={itemCls('/home')}>
        {ALWAYS[0].icon}
        <span className={labelCls}>{ALWAYS[0].label}</span>
      </Link>

      {/* Ponto — logo após Home */}
      {showPonto && (
        <Link href="/ponto" className={itemCls('/ponto')}>
          <ClockIcon className="h-5 w-5 text-sky-500" />
          <span className={labelCls}>Ponto</span>
        </Link>
      )}

      {/* Restante dos itens fixos */}
      {ALWAYS.slice(1).map((item) => (
        <Link key={item.href} href={item.href} className={itemCls(item.href)}>
          {item.icon}
          <span className={labelCls}>{item.label}</span>
        </Link>
      ))}

      {/* Gestão, Percentual, RH */}
      {!hydrated ? (
        <div className="flex flex-col gap-1 mt-1 w-full" aria-hidden>
          <Skeleton height="40px" width="100%" borderRadius="8px" />
        </div>
      ) : (
        conditional.map((item) => (
          <Link key={item.href} href={item.href} className={itemCls(item.href)}>
            {item.icon}
            <span className={labelCls}>{item.label}</span>
          </Link>
        ))
      )}

      {/* FluencIA — item de menu junto com os demais */}
      <button className={btnCls()} onClick={() => setFluencia(true)}>
        <Image src={ASSETS.fluenciaIcon} alt="" width={20} height={20} className="h-5 w-5 rounded-sm flex-shrink-0" />
        <span className={labelCls}>FluencIA</span>
      </button>

      {/* Rodapé: Stack + Sair + Recolher */}
      <div className="mt-auto flex flex-col gap-0.5 w-full">
        <Link href="/stack" className={itemCls('/stack')}>
          <LayersIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
          <span className={labelCls}>Stack</span>
        </Link>

        <button className={btnCls(true)} onClick={handleLogout} aria-label="Sair">
          <LogOutIcon className="h-5 w-5 flex-shrink-0" />
          <span className={labelCls}>Sair</span>
        </button>

        <button
          className={btnCls()}
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <ChevronRightIcon
            className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
          {!collapsed && <span className={labelCls}>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
