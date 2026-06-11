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
  LayoutGridIcon,
  MegaphoneIcon,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useUserStore } from '@/store/user';
import { temAcessoDP } from '@/lib/dp-access';
import { temAcessoMarketing } from '@/lib/marketing-access';
import { Skeleton } from '@/components/shared/Skeleton';
import { ASSETS } from '@/lib/assets';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { permissoes, gestorId, setFluencia, clearUser } = useUserStore();
  const pathname = usePathname();
  const router   = useRouter();
  const hydrated = gestorId !== 0;

  async function handleLogout() {
    onClose();
    await fetch('/api/auth', { method: 'DELETE' }).catch(() => {});
    clearUser();
    router.push('/login');
  }

  function itemCls(href: string) {
    const active = pathname === href || pathname.startsWith(href + '/');
    return [
      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left',
      active ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60',
    ].join(' ');
  }

  // Menus iguais ao vanilla (sem Feed/Rede e sem Perfil)
  // Ponto vs Percentual é decidido SÓ pelo bateRep: quem bate ponto vê Ponto;
  // quem não bate apropria horas por % (Percentual). Não depende de gerência nem de equipe.
  const showPercentual = hydrated && !permissoes.bateRep;
  const showPonto = hydrated && permissoes.bateRep;
  // Gestão: qualquer gerente funcional (alinhado à página /gestao e rotas /api/gestao).
  const showGestao = hydrated && permissoes.gerenteFuncional;

  // Home separado para inserir o bloco Gestão/Ponto/Percentual logo após
  const afterHome = [
    { href: '/pessoas',      label: 'Pessoas',      icon: <SearchIcon        className="h-5 w-5 text-green-500" /> },
    { href: '/ferias',       label: 'Férias',       icon: <UmbrellaIcon      className="h-5 w-5 text-emerald-500" /> },
    { href: '/holerite',     label: 'Holerite',     icon: <WalletIcon        className="h-5 w-5 text-amber-500" /> },
    { href: '/solicitacoes', label: 'Solicitar',    icon: <ClipboardListIcon className="h-5 w-5 text-orange-500" /> },
    { href: '/recursos',     label: 'Extras',       icon: <LayoutGridIcon    className="h-5 w-5 text-violet-500" /> },
  ];

  // RH e Marketing seguem depois dos itens fixos (Gestão/Ponto/Percentual sobem para perto da Home)
  const conditionalItems = [];
  if (hydrated) {
    if (temAcessoDP(permissoes.perfilDP)) {
      conditionalItems.push({ href: '/rh',         label: 'DP',         icon: <BriefcaseIcon className="h-5 w-5 text-teal-500" /> });
    }
    if (temAcessoMarketing(permissoes.perfilMarketing)) {
      conditionalItems.push({ href: '/marketing',  label: 'Marketing',  icon: <MegaphoneIcon className="h-5 w-5 text-pink-500" /> });
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-64 p-0">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <Image src="/squadra-logo.svg" alt="Squadra" width={100} height={26} className="h-7 w-auto" />
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-3 py-3 h-full">
          {/* Home */}
          <Link href="/home" className={itemCls('/home')} onClick={onClose}>
            <HomeIcon className="h-5 w-5 text-blue-500" />
            Home
          </Link>

          {/* Bloco de trabalho — logo após Home: Gestão, Ponto, Percentual */}
          {showGestao && (
            <Link href="/gestao" className={itemCls('/gestao')} onClick={onClose}>
              <UsersIcon className="h-5 w-5 text-purple-500" />
              Gestão
            </Link>
          )}
          {showPonto && (
            <Link href="/ponto" className={itemCls('/ponto')} onClick={onClose}>
              <ClockIcon className="h-5 w-5 text-sky-500" />
              Ponto
            </Link>
          )}
          {showPercentual && (
            <Link href="/percentual" className={itemCls('/percentual')} onClick={onClose}>
              <PercentIcon className="h-5 w-5 text-indigo-500" />
              Percentual
            </Link>
          )}

          {/* Restante dos itens fixos */}
          {afterHome.map((item) => (
            <Link key={item.href} href={item.href} className={itemCls(item.href)} onClick={onClose}>
              {item.icon}
              {item.label}
            </Link>
          ))}

          {/* Itens condicionais */}
          {!hydrated ? (
            <div aria-hidden className="flex flex-col gap-1 mt-1">
              <Skeleton height="44px" width="100%" borderRadius="8px" />
            </div>
          ) : (
            conditionalItems.map((item) => (
              <Link key={item.href} href={item.href} className={itemCls(item.href)} onClick={onClose}>
                {item.icon}
                {item.label}
              </Link>
            ))
          )}

          {/* FluencIA */}
          <button
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left text-foreground hover:bg-accent/60 cursor-pointer"
            onClick={() => { onClose(); setFluencia(true); }}
          >
            <Image src={ASSETS.fluenciaIcon} alt="" width={20} height={20} className="h-5 w-5 rounded-sm" />
            FluencIA
          </button>

          {/* Sair */}
          <button
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left text-foreground hover:bg-red-50 hover:text-red-600 mt-auto border-t border-border pt-4"
            onClick={handleLogout}
          >
            <LogOutIcon className="h-5 w-5" />
            Sair
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
