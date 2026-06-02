'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/user';

export function SimulandoBanner() {
  const simulando = useUserStore((s) => s.simulando);
  const nome      = useUserStore((s) => s.nome);
  const clearUser = useUserStore((s) => s.clearUser);
  const [loading, setLoading] = useState(false);

  if (!simulando) return null;

  async function encerrar() {
    setLoading(true);
    try {
      await fetch('/api/auth/simulate', { method: 'DELETE' });
      clearUser();
      window.location.reload();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-orange-500 text-white text-sm flex items-center justify-between px-4 py-2 z-50">
      <span>
        🎭 Simulando como <strong>{nome}</strong>
      </span>
      <button
        type="button"
        onClick={encerrar}
        disabled={loading}
        className="underline hover:no-underline font-medium disabled:opacity-60"
      >
        {loading ? 'Saindo…' : 'Sair da simulação'}
      </button>
    </div>
  );
}
