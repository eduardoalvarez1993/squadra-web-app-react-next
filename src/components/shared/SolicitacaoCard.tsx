import { AvatarGradient } from './AvatarGradient';
import { StatusChip } from './StatusChip';

type TipoSolicitacao = 'abono' | 'ferias' | 'hora-extra' | 'dayoff';
type StatusSolicitacao = 'pendente' | 'aprovado' | 'reprovado' | 'cancelado';

const TIPO_CONFIG: Record<TipoSolicitacao, { icon: string; label: string }> = {
  'abono':      { icon: '📋', label: 'Abono' },
  'ferias':     { icon: '🌴', label: 'Férias' },
  'hora-extra': { icon: '⏱', label: 'Hora Extra' },
  'dayoff':     { icon: '📅', label: 'Day-off' },
};

interface SolicitacaoCardProps {
  tipo: TipoSolicitacao;
  nome: string;
  foto?: string | null;
  status: StatusSolicitacao;
  detalhes?: React.ReactNode;
  actions?: React.ReactNode;
  done?: boolean;
}

export function SolicitacaoCard({
  tipo,
  nome,
  foto = null,
  status,
  detalhes,
  actions,
  done = false,
}: SolicitacaoCardProps) {
  const cfg = TIPO_CONFIG[tipo];

  return (
    <div
      className={[
        'flex flex-col gap-3 rounded-lg border bg-card p-4 transition-opacity',
        done ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <AvatarGradient nome={nome} foto={foto} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{nome}</p>
          <p className="text-xs text-muted-foreground">
            {cfg.icon} {cfg.label}
          </p>
        </div>
        <StatusChip status={status} />
      </div>
      {detalhes && (
        <div className="text-sm text-muted-foreground">{detalhes}</div>
      )}
      {actions && !done && (
        <div className="flex justify-end gap-2">{actions}</div>
      )}
    </div>
  );
}
