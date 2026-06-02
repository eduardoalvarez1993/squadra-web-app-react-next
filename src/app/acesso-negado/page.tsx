import type { Metadata } from 'next';
import { AccessDenied } from '@/components/shared/AccessDenied';

export const metadata: Metadata = {
  title: 'Acesso negado - Horas',
};

export default function AcessoNegadoPage() {
  return <AccessDenied />;
}
