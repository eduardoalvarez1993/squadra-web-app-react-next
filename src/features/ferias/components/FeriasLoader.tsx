import Image from 'next/image';
import { ASSETS } from '@/lib/assets';

export function FeriasLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="ferias-loading-stage">
        <Image
          src={ASSETS.loadingFerias}
          alt=""
          fill
          sizes="(max-width: 480px) 80vw, 320px"
          className="gestao-loader-img"
          loading="eager"
        />
        <div className="ferias-coco" aria-hidden="true" />
      </div>
      <strong>Buscando suas férias…</strong>
    </div>
  );
}
