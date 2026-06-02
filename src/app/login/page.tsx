import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Entrar — Squadra',
};

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: '#f5f7fa' }}
    >
      <div
        className="flex flex-col w-full"
        style={{
          background:   '#fff',
          borderRadius: '16px',
          padding:      '40px 36px',
          maxWidth:     '380px',
          boxShadow:    '0 4px 24px rgba(0,0,0,.10)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-7">
          <Image
            src="/squadra-logo.svg"
            alt="Squadra"
            width={140}
            height={36}
            priority
            className="h-8 w-auto"
          />
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
          Bem-vindo
        </h1>
        <p style={{ fontSize: '.875rem', color: '#6b7280', marginBottom: '28px' }}>
          Entre com seu usuário e senha
        </p>

        <LoginForm />
      </div>
    </main>
  );
}
