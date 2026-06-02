'use client';

import type { Contracheque } from '@/services/squadra-client';
import { ASSETS } from '@/lib/assets';

function HoleriteLoading() {
  return (
    <div className="holerite-loading-wrap" style={{ gridColumn: '1 / -1' }}>
      <span className="holerite-loading-stage" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="holerite-loading-doc" src={ASSETS.loadingHolerite} alt="" loading="lazy" />
        <span className="holerite-loading-scan-mask">
          <span className="holerite-loading-scan" />
        </span>
      </span>
      <strong>Buscando seu holerite...</strong>
    </div>
  );
}

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

interface HoleriteGridProps {
  contracheques: Contracheque[];
  isLoading:     boolean;
  onSelect:      (c: Contracheque) => void;
}

export function HoleriteGrid({ contracheques, isLoading, onSelect }: HoleriteGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <HoleriteLoading />
      </div>
    );
  }

  return (
    <div className="holerite-grid">
      {MESES.map((nome, idx) => {
        const mes    = idx + 1;
        const cheque = contracheques.find((c) => c.mesCompetencia === mes);
        return (
          <button
            key={mes}
            className="holerite-mes-card"
            disabled={!cheque}
            onClick={() => cheque && onSelect(cheque)}
          >
            {nome}
          </button>
        );
      })}
    </div>
  );
}
