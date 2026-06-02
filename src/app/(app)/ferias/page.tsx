'use client';

import { useState } from 'react';
import { TabNav } from '@/components/shared/TabNav';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { HistoricoTable } from '@/components/shared/HistoricoTable';
import { Skeleton } from '@/components/shared/Skeleton';
import { SaldoCard } from '@/features/ferias/components/SaldoCard';
import { FeriasForm } from '@/features/ferias/components/FeriasForm';
import { FeriasLoader } from '@/features/ferias/components/FeriasLoader';
import { useFerias } from '@/features/ferias/hooks/useFerias';
import { ASSETS } from '@/lib/assets';

const TABS = [
  { id: 'solicitar', label: 'Solicitar' },
  { id: 'historico', label: 'Histórico' },
];

const HISTORICO_COLS = [
  { key: 'periodo', label: 'Período' },
  { key: 'status',  label: 'Status' },
];

export default function FeriasPage() {
  const [tab, setTab] = useState('solicitar');
  const { saldo, historico, isLoading, isError, solicitar, isSolicitando } = useFerias();

  if (isError) {
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar férias." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <SaldoCard dados={saldo} isLoading={isLoading} />

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>

        <div className="p-4">
          {tab === 'solicitar' && (
            isLoading ? (
              <FeriasLoader />
            ) : (
              <FeriasForm
                dados={saldo}
                onSolicitar={solicitar}
                isSolicitando={isSolicitando}
              />
            )
          )}

          {tab === 'historico' && (
            isLoading ? (
              <Skeleton height="128px" />
            ) : historico.length > 0 ? (
              <HistoricoTable
                columns={HISTORICO_COLS}
                rows={historico.map((h) => ({
                  periodo: `${h.dataFeriasInicio} → ${h.dataFeriasFinal}`,
                  status:  h.status,
                }))}
              />
            ) : (
              <EmptyState image={ASSETS.emptyFeriasHistorico} title="Sem histórico de férias" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
