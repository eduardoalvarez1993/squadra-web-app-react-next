import { describe, it, expect } from 'vitest';
import {
  addDaysISO, diffDaysInclusive, defaultsForTipo, defaultsForParentesco,
  horasDiaInteiro, horasFromRange, tipoExibeParentesco, tipoExibeDefinirHoras,
} from '@/features/solicitacoes/abono-rules';

describe('addDaysISO', () => {
  it('soma dias atravessando o mês sem drift de fuso', () => {
    expect(addDaysISO('2026-06-09', 1)).toBe('2026-06-10');
    expect(addDaysISO('2026-06-30', 1)).toBe('2026-07-01');
    expect(addDaysISO('2026-06-09', 19)).toBe('2026-06-28');
  });
});

describe('diffDaysInclusive', () => {
  it('conta inclusivo, mínimo 1', () => {
    expect(diffDaysInclusive('2026-06-09', '2026-06-09')).toBe(1);
    expect(diffDaysInclusive('2026-06-09', '2026-06-13')).toBe(5);
  });
});

describe('defaultsForTipo', () => {
  it('férias (12): +19 dias e 160h', () => {
    expect(defaultsForTipo(12, '2026-06-09')).toEqual({ dataFim: '2026-06-28', qtdadeHoras: 160 });
  });
  it('licença (13): +1 dia e 16h', () => {
    expect(defaultsForTipo(13, '2026-06-09')).toEqual({ dataFim: '2026-06-10', qtdadeHoras: 16 });
  });
  it('default: mesmo dia e 8h', () => {
    expect(defaultsForTipo(99, '2026-06-09')).toEqual({ dataFim: '2026-06-09', qtdadeHoras: 8 });
  });
});

describe('defaultsForParentesco', () => {
  it('parente próximo → 5 dias / 40h', () => {
    expect(defaultsForParentesco('PAI', '2026-06-09')).toEqual({ dataFim: '2026-06-13', qtdadeHoras: 40 });
    expect(defaultsForParentesco('FILHO', '2026-06-09')).toEqual({ dataFim: '2026-06-13', qtdadeHoras: 40 });
  });
  it('parente distante → 2 dias / 16h', () => {
    expect(defaultsForParentesco('AVÓS', '2026-06-09')).toEqual({ dataFim: '2026-06-10', qtdadeHoras: 16 });
  });
});

describe('horasDiaInteiro', () => {
  it('dias × 8', () => {
    expect(horasDiaInteiro('2026-06-09', '2026-06-09')).toBe(8);
    expect(horasDiaInteiro('2026-06-09', '2026-06-11')).toBe(24);
  });
});

describe('horasFromRange', () => {
  it('intervalo válido', () => {
    expect(horasFromRange('08:00', '12:00')).toEqual({ horas: 4, error: null });
  });
  it('mínimo 1h', () => {
    expect(horasFromRange('08:00', '08:30').error).toMatch(/mínimo/i);
  });
  it('máximo 8h', () => {
    expect(horasFromRange('08:00', '17:00').error).toMatch(/máximo/i);
  });
  it('fim antes do início', () => {
    expect(horasFromRange('12:00', '08:00').error).toMatch(/maior que o inicial/i);
  });
});

describe('flags por tipo', () => {
  it('parentesco 9/10', () => {
    expect(tipoExibeParentesco(9)).toBe(true);
    expect(tipoExibeParentesco(12)).toBe(false);
  });
  it('definir horas 11/21', () => {
    expect(tipoExibeDefinirHoras(11)).toBe(true);
    expect(tipoExibeDefinirHoras(21)).toBe(true);
    expect(tipoExibeDefinirHoras(9)).toBe(false);
  });
});
