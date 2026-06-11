'use client';

import Link from 'next/link';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { useUserStore } from '@/store/user';
import { cicloBancoHoras } from '@/features/ponto/banco-horas';
import { useSaldoProprio } from '../hooks/useSaldoProprio';

function formatSaldo(horas: number): string {
  const abs  = Math.abs(horas);
  const h    = Math.floor(abs);
  const min  = Math.round((abs - h) * 60);
  const sign = horas >= 0 ? '+' : '-';
  return min > 0 ? `${sign}${h}h${String(min).padStart(2, '0')}` : `${sign}${h}h`;
}

function dataHoje(): string {
  const d = new Date();
  const s = d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function GreetingCard() {
  const nome      = useUserStore((s) => s.nome);
  const cargo     = useUserStore((s) => s.cargo);
  const foto      = useUserStore((s) => s.foto);
  const bateRep   = useUserStore((s) => s.permissoes.bateRep);
  const gestor    = useUserStore((s) => s.permissoes.gerenteFuncional);
  const { data, isLoading } = useSaldoProprio();

  const atalho = bateRep
    ? { href: '/ponto',      label: 'Bater ponto' }
    : gestor
    ? { href: '/percentual', label: 'Percentual' }
    : null;

  return (
    <div className="bg-white border border-border rounded-xl px-4 py-3 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-3">
        <AvatarGradient nome={nome || ''} foto={foto} size={52} />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-foreground leading-tight">
            Olá, {nome} 👋
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{dataHoje()}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoading ? (
            <span className="text-xs text-muted-foreground animate-pulse">—</span>
          ) : data ? (
            <span className={`text-sm font-semibold ${data.saldoHoras >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatSaldo(data.saldoHoras)}
            </span>
          ) : null}

          {atalho && (
            <Link
              href={atalho.href}
              className="text-sm font-semibold bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {atalho.label}
            </Link>
          )}
        </div>
      </div>

      {/* Banco de horas: desconto (negativo) ou pagamento (positivo), p/ quem bate ponto. */}
      {bateRep && data && data.saldoHoras !== 0 && (() => {
        const ciclo = cicloBancoHoras(data.saldoHoras < 0);
        return (
          <p className="text-[0.7rem] text-muted-foreground leading-snug border-t border-border pt-2">
            Saldo <strong>{ciclo.rotulo}</strong> será <strong>{ciclo.verbo}</strong> em <strong>{ciclo.dataBR}</strong>.
          </p>
        );
      })()}
    </div>
  );
}
