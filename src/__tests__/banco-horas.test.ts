import { describe, it, expect } from 'vitest';
import { proximoDescontoBR } from '@/features/ponto/banco-horas';

describe('proximoDescontoBR', () => {
  it('saldo negativo → 1º do mês seguinte', () => {
    expect(proximoDescontoBR(true, new Date(2026, 5, 11))).toBe('01/07/2026');
    expect(proximoDescontoBR(true, new Date(2026, 11, 15))).toBe('01/01/2027');
  });

  it('saldo positivo → próximo trimestre (mar/jun/set/dez)', () => {
    expect(proximoDescontoBR(false, new Date(2026, 5, 11))).toBe('01/09/2026'); // após 11/jun → set
    expect(proximoDescontoBR(false, new Date(2026, 0, 5))).toBe('01/03/2026');  // jan → mar
  });

  it('saldo positivo no fim do ano → mar do ano seguinte', () => {
    expect(proximoDescontoBR(false, new Date(2026, 11, 15))).toBe('01/03/2027');
  });
});
