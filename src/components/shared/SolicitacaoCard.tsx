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
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  detalhes?: React.ReactNode;
  actions?: React.ReactNode;
  done?: boolean;
  hideTipoLabel?: boolean;
  hideStatus?: boolean;
}

export function SolicitacaoCard({
  tipo,
  nome,
  foto = null,
  status,
  subtitle,
  headerRight,
  detalhes,
  actions,
  done = false,
  hideTipoLabel = false,
  hideStatus = false,
}: SolicitacaoCardProps) {
  const cfg = TIPO_CONFIG[tipo];

  return (
    <div
      className={[
        'flex flex-col gap-2 rounded-lg border bg-card px-4 py-3 transition-opacity',
        done ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <AvatarGradient nome={nome} foto={foto} size={38} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{nome}</p>
          {subtitle
            ? <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
            : !hideTipoLabel && (
                <p className="text-xs text-muted-foreground">{cfg.icon} {cfg.label}</p>
              )
          }
        </div>
        {!hideStatus && <StatusChip status={status} />}
        {headerRight}
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
