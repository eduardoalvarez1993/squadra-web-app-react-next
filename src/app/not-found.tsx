import type { Metadata } from 'next';
import { IllustratedState } from '@/components/shared/IllustratedState';
import { ASSETS } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Página não encontrada — Horas',
};

export default function NotFound() {
  return (
    <IllustratedState
      eyebrow="Erro 404"
      title="Rota nao encontrada"
      subtitle="Nao encontramos essa rota no mapa de horas."
      description="O endereco pode ter mudado ou nao existe neste painel. Volte para o inicio para continuar acompanhando equipe, pendencias, solicitacoes e abonos."
      image={ASSETS.notFound}
      actions={[{ href: '/home', label: 'Voltar para o inicio' }]}
    />
  );
}
