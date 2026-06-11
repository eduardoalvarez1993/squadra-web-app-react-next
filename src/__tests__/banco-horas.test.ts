import { describe, it, expect } from 'vitest';
import { proximoDescontoBR, cicloBancoHoras } from '@/features/ponto/banco-horas';

describe('cicloBancoHoras', () => {
  it('saldo negativo → desconto no 1º do mês seguinte', () => {
    const c = cicloBancoHoras(true, new Date(2026, 5, 11));
    expect(c.tipo).toBe('desconto');
    expect(c.verbo).toBe('descontado');
    expect(c.rotulo).toBe('negativo');
    expect(c.dataBR).toBe('01/07/2026');
  });
  it('saldo positivo → pagamento no próximo trimestre', () => {
    const c = cicloBancoHoras(false, new Date(2026, 5, 11));
    expect(c.tipo).toBe('pagamento');
    expect(c.verbo).toBe('pago');
    expect(c.rotulo).toBe('positivo');
    expect(c.dataBR).toBe('01/09/2026');
  });
});

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
