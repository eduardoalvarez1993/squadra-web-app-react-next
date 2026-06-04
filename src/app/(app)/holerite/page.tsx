'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TabNav } from '@/components/shared/TabNav';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { DrawerForm } from '@/components/shared/DrawerForm';
import { HistoricoTable } from '@/components/shared/HistoricoTable';
import { HoleriteGrid } from '@/features/holerite/components/HoleriteGrid';
import { LoadingDoc } from '@/features/holerite/components/LoadingDoc';
import { useHolerite } from '@/features/holerite/hooks/useHolerite';
import { useHistoricoSalarial } from '@/features/holerite/hooks/useHistoricoSalarial';
import type { Contracheque } from '@/services/squadra-client';

const TABS = [
  { id: 'contracheques', label: 'Contracheques' },
  { id: 'historico',     label: 'Histórico Salarial' },
];

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const HISTORICO_COLS = [
  { key: 'data',      label: 'Data' },
  { key: 'alteracao', label: 'Alteração' },
];

function HistoricoSalarialLoading() {
  return (
    <div className="salary-history-loading-wrap" role="status" aria-live="polite">
      <span className="salary-history-stage" aria-hidden="true">
        <svg className="salary-history-chart" viewBox="0 0 280 180" focusable="false">
          <defs>
            <linearGradient id="salaryLineGradient" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="58%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#e946a9" />
            </linearGradient>
            <linearGradient id="salaryAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".22" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="salary-history-grid" d="M42 36H246M42 74H246M42 112H246M42 150H246" />
          <path className="salary-history-axis" d="M42 28V150H252" />
          <path className="salary-history-area" d="M48 135L91 124L132 100L174 86L218 52L248 38V150H48Z" />
          <path className="salary-history-line" d="M48 135L91 124L132 100L174 86L218 52L248 38" />
          <g className="salary-history-points">
            <circle cx="48" cy="135" r="4" />
            <circle cx="91" cy="124" r="4" />
            <circle cx="132" cy="100" r="4" />
            <circle cx="174" cy="86" r="4" />
            <circle cx="218" cy="52" r="4" />
            <circle cx="248" cy="38" r="4" />
          </g>
        </svg>
        <span className="salary-history-dot" />
      </span>
      <strong>Carregando histórico salarial...</strong>
    </div>
  );
}

function fmtBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtHistDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
}

function ContrachequeDetail({ c }: { c: Contracheque }) {
  const proventos = c.itensContracheque.filter((i) => i.provDescBase === 'P');
  const descontos = c.itensContracheque.filter((i) => i.provDescBase === 'D');
  const totProv   = proventos.reduce((s, i) => s + (i.valor ?? 0), 0);
  const totDesc   = descontos.reduce((s, i) => s + (i.valor ?? 0), 0);
  const totLiq    = totProv - totDesc;

  return (
    <div>
      <div className="hol-resumo">
        <div className="hol-resumo-item hol-prov">
          <div className="hol-resumo-label">Proventos</div>
          <div className="hol-resumo-val">{fmtBRL(totProv)}</div>
        </div>
        <div className="hol-resumo-item hol-desc">
          <div className="hol-resumo-label">Descontos</div>
          <div className="hol-resumo-val">{fmtBRL(totDesc)}</div>
        </div>
        <div className="hol-resumo-item hol-liq">
          <div className="hol-resumo-label">Líquido</div>
          <div className="hol-resumo-val">{fmtBRL(totLiq)}</div>
        </div>
      </div>

      {proventos.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden mt-3">
          <div className="hol-section-title hol-title-prov px-4 pt-3 pb-2">Proventos</div>
          <table className="hol-table w-full">
            <tbody>
              {proventos.map((i, idx) => (
                <tr key={idx}>
                  <td className="hol-td-desc">{i.descricao}</td>
                  <td className="hol-td-val">{fmtBRL(i.valor ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {descontos.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden mt-3">
          <div className="hol-section-title hol-title-desc px-4 pt-3 pb-2">Descontos</div>
          <table className="hol-table w-full">
            <tbody>
              {descontos.map((i, idx) => (
                <tr key={idx}>
                  <td className="hol-td-desc">{i.descricao}</td>
                  <td className="hol-td-val">{fmtBRL(i.valor ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {proventos.length === 0 && descontos.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Detalhes do holerite não disponíveis.
        </p>
      )}
    </div>
  );
}

export default function HoleritePage() {
  const [tab,      setTab]      = useState('contracheques');
  const [ano,      setAno]      = useState(new Date().getFullYear());
  const [selected, setSelected] = useState<Contracheque | null>(null);

  const { data, isLoading, isError, refetch } = useHolerite(ano);
  const hist = useHistoricoSalarial();

  if (isError) {
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar o holerite." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <h1 className="sr-only">Holerite</h1>
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="p-4 flex flex-col gap-4">
          {tab === 'contracheques' && (
            <>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full cursor-pointer"
                  onClick={() => setAno((a) => a - 1)}
                  aria-label="Ano anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[4rem] text-center text-sm font-semibold tabular-nums">{ano}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full cursor-pointer"
                  onClick={() => setAno((a) => a + 1)}
                  aria-label="Próximo ano"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <HoleriteGrid
                contracheques={data?.contracheques ?? []}
                isLoading={isLoading}
                onSelect={setSelected}
              />
            </>
          )}

          {tab === 'historico' && (
            hist.isLoading ? (
              <HistoricoSalarialLoading />
            ) : hist.data && hist.data.length > 0 ? (
              <HistoricoTable
                columns={HISTORICO_COLS}
                rows={hist.data.map((h) => ({ data: fmtHistDate(h.dataMudanca ?? ''), alteracao: h.mudanca }))}
              />
            ) : (
              <EmptyState title="Sem histórico salarial" />
            )
          )}
        </div>
      </div>

      <DrawerForm
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${MESES[(selected.mesCompetencia ?? 1) - 1]} ${selected.anoCompetencia}` : ''}
        readOnly
        side="right"
      >
        {selected ? <ContrachequeDetail c={selected} /> : <LoadingDoc />}
      </DrawerForm>
    </div>
  );
}
