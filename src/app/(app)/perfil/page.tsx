'use client';

import { useState } from 'react';
import { TabNav } from '@/components/shared/TabNav';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { ProfileForm } from '@/features/perfil/components/ProfileForm';
import { SkillsTab } from '@/features/perfil/components/SkillsTab';
import { AlocacoesTab } from '@/features/perfil/components/AlocacoesTab';
import { KudosTab } from '@/features/perfil/components/KudosTab';
import { usePerfil } from '@/features/perfil/hooks/usePerfil';
import { PerfilLoader } from '@/components/shared/PerfilLoader';

const TABS = [
  { id: 'dados',      label: 'Dados' },
  { id: 'skills',     label: 'Skills' },
  { id: 'alocacoes',  label: 'Alocações' },
  { id: 'kudos',      label: 'Kudos' },
];

function PerfilLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <PerfilLoader text="Carregando seu perfil..." />
    </div>
  );
}

export default function PerfilPage() {
  const [tab, setTab] = useState('dados');
  const { perfil, isLoading, isError, refetch, atualizar, isAtualizando } = usePerfil();

  if (isError) {
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar o perfil." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !perfil) {
    return <PerfilLoading />;
  }

  const nome     = String(perfil.nomeSocial || perfil.nome || '');
  const cargo    = String(perfil.cargo || '');
  const unidade  = String((perfil as Record<string, unknown>)['unidade'] ?? (perfil as Record<string, unknown>)['nomeUnidade'] ?? '');
  const gerente  = String((perfil as Record<string, unknown>)['gerente'] ?? '');

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">

      {/* ── Header do perfil ─────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-xl px-5 py-4 flex items-center gap-4">
        <AvatarGradient nome={nome || ''} foto={perfil.foto} size={64} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight truncate">{nome}</h1>
          {cargo && (
            <p className="text-sm text-muted-foreground truncate">{cargo}</p>
          )}
          {unidade && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{unidade}</p>
          )}
          {gerente && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Gestor(a): <span className="font-medium text-foreground">{gerente}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>

        <div className="px-4 pb-4">
          {tab === 'dados' && (
            <div className="pt-4">
              <ProfileForm perfil={perfil} onAtualizar={atualizar} isAtualizando={isAtualizando} />
            </div>
          )}
          {tab === 'skills' && (
            <SkillsTab perfil={perfil} />
          )}
          {tab === 'alocacoes' && (
            <AlocacoesTab />
          )}
          {tab === 'kudos' && (
            <KudosTab perfil={perfil} />
          )}
        </div>
      </div>
    </div>
  );
}
