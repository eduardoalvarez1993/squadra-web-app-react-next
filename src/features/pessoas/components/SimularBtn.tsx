'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';

interface SimularBtnProps {
  pessoaId: number;
  nomePessoa: string;
}

export function SimularBtn({ pessoaId, nomePessoa }: SimularBtnProps) {
  const podeSimular = useUserStore((s) => s.podeSimular);
  const meuId       = useUserStore((s) => s.gestorId);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  if (!podeSimular || pessoaId === meuId) return null;

  async function iniciar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/simulate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: pessoaId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? 'Erro ao simular');
      }
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={iniciar}
        disabled={loading}
        className="text-orange-600 border-orange-300 hover:bg-orange-50"
      >
        {loading ? 'Iniciando…' : `Simular como ${nomePessoa}`}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
