import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toMin,
  parseDMY,
  computeFaltaStatus,
  computePendentes,
  horaExtraAprovadaMin,
} from '@/features/ponto/hooks/usePonto';
import type { DadosHoraExtra } from '@/services/squadra-client';
import { pontoDias, casosToMin } from '@/__tests__/fixtures';

describe('toMin', () => {
  it.each(casosToMin)('toMin(%j) → %i', (input, esperado) => {
    expect(toMin(input as string)).toBe(esperado);
  });

  it('"08:30" → 510', () => {
    expect(toMin('08:30')).toBe(510);
  });

  it('"" → 0', () => {
    expect(toMin('')).toBe(0);
  });

  it('"ab:cd" → 0 (NaN-safe)', () => {
    expect(toMin('ab:cd')).toBe(0);
  });

  it('undefined → 0', () => {
    expect(toMin(undefined as unknown as string)).toBe(0);
  });
});

describe('parseDMY', () => {
  it('"02/06/2026" → Date(2026, 5, 2)', () => {
    const d = parseDMY('02/06/2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // junho (0-based)
    expect(d.getDate()).toBe(2);
  });
});

describe('computeFaltaStatus', () => {
  const base = pontoDias.pontoDiaOk;

  it("statusLiberacaoFalta 'A' → aprovado", () => {
    expect(computeFaltaStatus({ ...base, statusLiberacaoFalta: 'A' })).toBe('aprovado');
  });

  it("statusLiberacaoFalta 'R' → recusado", () => {
    expect(computeFaltaStatus({ ...base, statusLiberacaoFalta: 'R' })).toBe('recusado');
  });

  it("statusLiberacaoFalta 'P' → pendente", () => {
    expect(computeFaltaStatus({ ...base, statusLiberacaoFalta: 'P' })).toBe('pendente');
  });

  it("liberacaoGestor 'S' → aprovado", () => {
    expect(
      computeFaltaStatus({ ...base, statusLiberacaoFalta: '', liberacaoGestor: 'S' }),
    ).toBe('aprovado');
  });

  it('solicitacaoLiberacaoFaltaId > 0 → pendente', () => {
    expect(
      computeFaltaStatus({
        ...base,
        statusLiberacaoFalta: '',
        liberacaoGestor: '',
        solicitacaoLiberacaoFaltaId: 42,
      }),
    ).toBe('pendente');
  });

  it('nada solicitado → nao_solicitado', () => {
    expect(
      computeFaltaStatus({
        ...base,
        statusLiberacaoFalta: '',
        liberacaoGestor: '',
        solicitacaoLiberacaoFaltaId: 0,
      }),
    ).toBe('nao_solicitado');
  });
});

describe('horaExtraAprovadaMin', () => {
  const base = pontoDias.pontoDiaOk;
  const he = (statusSolicitacao: number, qtdadeHoras: number): DadosHoraExtra => ({
    solicitacaoID: 1, dataSolicitacao: '2026-06-02T00:00:00Z', qtdadeHoras,
    projetoId: 1, projetoDescricao: 'P', solicitacaoTipo: 'C', statusSolicitacao, isNoturno: null,
  });

  it('soma só as aprovadas (status 3), em minutos', () => {
    const dia = { ...base, dadosHoraExtra: [he(3, 1), he(5, 2), he(3, 0.5)] };
    expect(horaExtraAprovadaMin(dia)).toBe(90); // 60 + 30 (ignora a pendente status 5)
  });

  it('sem dadosHoraExtra → 0', () => {
    expect(horaExtraAprovadaMin({ ...base, dadosHoraExtra: null })).toBe(0);
  });
});

describe('computePendentes', () => {
  // 30/06/2026 — depois de todas as datas das fixtures (junho/2026).
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 30));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const {
    pontoDiaOk,
    pontoDiaPendente,
    pontoDiaFalta,
    pontoDiaFeriado,
    pontoDiaFimDeSemana,
    pontoDiaAbono,
  } = pontoDias;

  it('exclui fim de semana', () => {
    const r = computePendentes([pontoDiaFimDeSemana]);
    expect(r).toHaveLength(0);
  });

  it('exclui feriado (horasPrevistas 00:00 → prevMin 0)', () => {
    const r = computePendentes([pontoDiaFeriado]);
    expect(r).toHaveLength(0);
  });

  it('exclui dia futuro', () => {
    // 01/07/2026 é depois do relógio fixado (30/06/2026)
    const futuro = { ...pontoDiaPendente, data: '01/07/2026' };
    const r = computePendentes([futuro]);
    expect(r).toHaveLength(0);
  });

  it('exclui dia com abono', () => {
    const r = computePendentes([pontoDiaAbono]);
    expect(r).toHaveLength(0);
  });

  it("classifica 'registrar' (sem falta, sem horas realizadas)", () => {
    const r = computePendentes([pontoDiaPendente]);
    expect(r).toHaveLength(1);
    expect(r[0].tipo).toBe('registrar');
  });

  it("classifica 'solicitar' (falta sem solicitação)", () => {
    const r = computePendentes([pontoDiaFalta]);
    expect(r).toHaveLength(1);
    expect(r[0].tipo).toBe('solicitar');
  });

  it("classifica 'aguardar' (falta com solicitação pendente)", () => {
    const dia = { ...pontoDiaFalta, statusLiberacaoFalta: 'P' };
    const r = computePendentes([dia]);
    expect(r).toHaveLength(1);
    expect(r[0].tipo).toBe('aguardar');
  });

  it("classifica 'apontar' (falta aprovada sem horas realizadas)", () => {
    const dia = { ...pontoDiaFalta, statusLiberacaoFalta: 'A' };
    const r = computePendentes([dia]);
    expect(r).toHaveLength(1);
    expect(r[0].tipo).toBe('apontar');
  });

  it("falta recusada volta para 'solicitar'", () => {
    const dia = { ...pontoDiaFalta, statusLiberacaoFalta: 'R' };
    const r = computePendentes([dia]);
    expect(r).toHaveLength(1);
    expect(r[0].tipo).toBe('solicitar');
  });

  it('dia ok (trabalhado) não entra em pendentes', () => {
    const r = computePendentes([pontoDiaOk]);
    expect(r).toHaveLength(0);
  });

  const heAprovada: DadosHoraExtra = {
    solicitacaoID: 1, dataSolicitacao: '2026-06-02T00:00:00Z', qtdadeHoras: 1,
    projetoId: 1, projetoDescricao: 'P', solicitacaoTipo: 'C', statusSolicitacao: 3, isNoturno: null,
  };

  it("HE aprovada e não registrada → 'H.Extra liberada' (mesmo com jornada completa)", () => {
    const dia = { ...pontoDiaOk, horaExtra: '00:00', dadosHoraExtra: [heAprovada] };
    const r = computePendentes([dia]);
    expect(r).toHaveLength(1);
    expect(r[0].tipo).toBe('registrar');
    expect(r[0].heExtra).toBe(true);
    expect(r[0].label).toBe('H.Extra liberada');
  });

  it('HE aprovada já registrada (horaExtra cobre o aprovado) → some dos pendentes', () => {
    const dia = { ...pontoDiaOk, horaExtra: '01:00', dadosHoraExtra: [heAprovada] };
    const r = computePendentes([dia]);
    expect(r).toHaveLength(0);
  });

  it('HE pendente do gestor (status 5) não libera registro', () => {
    const pendenteGestor = { ...heAprovada, statusSolicitacao: 5 };
    const dia = { ...pontoDiaOk, horaExtra: '00:00', dadosHoraExtra: [pendenteGestor] };
    const r = computePendentes([dia]);
    expect(r).toHaveLength(0);
  });

  it('ordena por data desc e filtra o conjunto completo', () => {
    const dias = [
      pontoDiaFalta,        // 01/06 → solicitar
      pontoDiaOk,           // 02/06 → (excluído: trabalhado)
      pontoDiaPendente,     // 03/06 → registrar
      pontoDiaAbono,        // 04/06 → (excluído: abono)
      pontoDiaFimDeSemana,  // 06/06 → (excluído: fds)
      pontoDiaFeriado,      // 07/09 → (excluído: feriado)
    ];
    const r = computePendentes(dias);
    expect(r).toHaveLength(2);
    // ordenado desc: 03/06 antes de 01/06
    expect(r[0].dia.data).toBe('03/06/2026');
    expect(r[0].tipo).toBe('registrar');
    expect(r[1].dia.data).toBe('01/06/2026');
    expect(r[1].tipo).toBe('solicitar');
  });
});
