import { AvatarGradient } from './AvatarGradient';
import { Badge } from '@/components/ui/badge';

interface PessoaCardProps {
  nome: string;
  foto?: string | null;
  cargo?: string;
  projeto?: string;
  variant?: 'pessoas' | 'equipe';
  onClick?: () => void;
  badge?: string;
  badgeClassName?: string;
}

export function PessoaCard({
  nome,
  foto = null,
  cargo,
  projeto,
  variant = 'pessoas',
  onClick,
  badge,
  badgeClassName,
}: PessoaCardProps) {
  const baseProps = {
    onClick,
    className: '',
  };

  if (variant === 'equipe') {
    const cls = [
      'flex items-center gap-3 w-full rounded-lg border bg-card p-3 transition-colors text-left',
      onClick ? 'cursor-pointer hover:bg-accent' : '',
    ].join(' ');

    return onClick ? (
      <button {...baseProps} className={cls}>
        <EquipeContent nome={nome} foto={foto} cargo={cargo} projeto={projeto} badge={badge} badgeClassName={badgeClassName} />
      </button>
    ) : (
      <div className={cls}>
        <EquipeContent nome={nome} foto={foto} cargo={cargo} projeto={projeto} badge={badge} badgeClassName={badgeClassName} />
      </div>
    );
  }

  // variant === 'pessoas'
  const cls = [
    'flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-colors text-center',
    onClick ? 'cursor-pointer hover:bg-accent' : '',
  ].join(' ');

  return onClick ? (
    <button {...baseProps} className={cls}>
      <PessoasContent nome={nome} foto={foto} cargo={cargo} badge={badge} />
    </button>
  ) : (
    <div className={cls}>
      <PessoasContent nome={nome} foto={foto} cargo={cargo} badge={badge} />
    </div>
  );
}

function EquipeContent({
  nome, foto, cargo, projeto, badge, badgeClassName,
}: Pick<PessoaCardProps, 'nome' | 'foto' | 'cargo' | 'projeto' | 'badge' | 'badgeClassName'>) {
  return (
    <>
      <AvatarGradient nome={nome} foto={foto} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{nome}</p>
        {cargo   && <p className="text-xs text-muted-foreground truncate">{cargo}</p>}
        {projeto && <p className="text-xs text-muted-foreground truncate">{projeto}</p>}
      </div>
      {badge && (
        <Badge variant="secondary" className={`flex-shrink-0${badgeClassName ? ` ${badgeClassName}` : ''}`}>
          {badge}
        </Badge>
      )}
    </>
  );
}

function PessoasContent({
  nome, foto, cargo, badge,
}: Pick<PessoaCardProps, 'nome' | 'foto' | 'cargo' | 'badge'>) {
  return (
    <>
      <AvatarGradient nome={nome} foto={foto} size={56} />
      <div className="w-full">
        <p className="font-medium truncate text-sm">{nome}</p>
        {cargo && <p className="text-xs text-muted-foreground truncate">{cargo}</p>}
        {badge && <Badge variant="secondary" className="mt-1">{badge}</Badge>}
      </div>
    </>
  );
}
