'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/user';
import { temAcessoMarketing } from '@/lib/marketing-access';
import { TabNav } from '@/components/shared/TabNav';
import { AccessDenied } from '@/components/shared/AccessDenied';
import { VerificandoCredenciais } from '@/components/shared/VerificandoCredenciais';
import { CrudPanel } from '@/features/marketing/components/CrudPanel';
import { MARKETING_CRUD } from '@/features/marketing/crud-config';

// Features que o painel Marketing vai gerenciar (substituindo o Airtable).
// CRUD front-only (sem persistência) — ver docs/marketing-painel.md.
const TABS = [
  { id: 'videos',       label: 'Vídeos' },
  { id: 'comunicados',  label: 'Comunicados' },
  { id: 'links',        label: 'Links' },
  { id: 'ajuda',        label: 'Ajuda / FAQ' },
];

export default function MarketingPage() {
  const perfilMarketing = useUserStore((s) => s.permissoes.perfilMarketing);
  const gestorId        = useUserStore((s) => s.gestorId);
  const hydrated        = gestorId !== 0;

  const [tab, setTab] = useState('videos');

  if (!hydrated) return <VerificandoCredenciais />;
  if (!temAcessoMarketing(perfilMarketing)) {
    return <AccessDenied description="O painel de Marketing fica disponível apenas para o time de Marketing/Comunidade." />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      <h1 className="text-xl font-semibold">Marketing</h1>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="p-4">
          {/* Recria o CrudPanel ao trocar de aba (key) → reinicia estado por recurso */}
          <CrudPanel key={tab} config={MARKETING_CRUD[tab]} />
        </div>
      </div>
    </div>
  );
}
