import { IllustratedState } from '@/components/shared/IllustratedState';
import { ASSETS } from '@/lib/assets';

interface AccessDeniedProps {
  title?: string;
  description?: string;
}

export function AccessDenied({
  title = 'Acesso negado',
  description = 'Seu perfil nao possui permissao para acessar esta area. Volte para o inicio ou fale com o responsavel pelo painel caso precise liberar esse acesso.',
}: AccessDeniedProps) {
  return (
    <IllustratedState
      eyebrow="Acesso restrito"
      title={title}
      subtitle="Esta area nao esta disponivel para o seu perfil."
      description={description}
      image={ASSETS.accessDenied}
      actions={[{ href: '/home', label: 'Voltar para o inicio' }]}
    />
  );
}
