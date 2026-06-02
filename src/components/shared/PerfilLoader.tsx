import { ASSETS } from '@/lib/assets';

interface PerfilLoaderProps {
  text?: string;
}

export function PerfilLoader({ text = 'Carregando colaborador...' }: PerfilLoaderProps) {
  return (
    <div className="perfil-loading-wrap">
      <span className="perfil-loading-stage" aria-hidden="true">
        <span className="perfil-flip-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="perfil-card-face" src={ASSETS.loadingPerfilFront} alt="" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="perfil-card-face perfil-card-back-face" src={ASSETS.loadingPerfilBack} alt="" loading="lazy" />
        </span>
      </span>
      <strong>{text}</strong>
    </div>
  );
}
