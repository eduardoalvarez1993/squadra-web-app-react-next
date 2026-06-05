import Image from 'next/image';
import { ASSETS } from '@/lib/assets';

export function VerificandoCredenciais() {
  return (
    <div className="credentials-loading-wrap" role="status" aria-live="polite">
      <span className="credentials-loading-stage" aria-hidden="true">
        <Image
          className="credentials-loading-token"
          src={ASSETS.loadingCredentials}
          alt=""
          width={240}
          height={240}
          loading="eager"
          unoptimized
        />
        <span className="credentials-validation-ring" />
      </span>
      <p className="text-sm text-muted-foreground">Verificando credenciais…</p>
    </div>
  );
}
