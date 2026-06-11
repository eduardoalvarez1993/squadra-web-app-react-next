import { describe, it, expect } from 'vitest';
import { podeAlterarMes } from '@/features/percentual/regras';

// Mês index do Date é 0-based: new Date(2026, 5, X) = junho/2026.
describe('podeAlterarMes', () => {
  it('mês corrente: pode alterar em qualquer dia', () => {
    expect(podeAlterarMes(6, 2026, new Date(2026, 5, 1))).toBe(true);
    expect(podeAlterarMes(6, 2026, new Date(2026, 5, 20))).toBe(true);
    expect(podeAlterarMes(6, 2026, new Date(2026, 5, 30))).toBe(true);
  });

  it('mês anterior: carência até o dia 6 do mês seguinte', () => {
    expect(podeAlterarMes(5, 2026, new Date(2026, 5, 5))).toBe(true);        // 05/jun edita maio
    expect(podeAlterarMes(5, 2026, new Date(2026, 5, 6, 23, 0))).toBe(true); // 06/jun ainda
    expect(podeAlterarMes(5, 2026, new Date(2026, 5, 7))).toBe(false);       // 07/jun trava maio
  });

  it('meses mais antigos: travados', () => {
    expect(podeAlterarMes(4, 2026, new Date(2026, 5, 3))).toBe(false); // abril, em junho
  });

  it('mês futuro: não alterável', () => {
    expect(podeAlterarMes(7, 2026, new Date(2026, 5, 10))).toBe(false);
  });

  it('virada de ano: dezembro editável até 06/jan', () => {
    expect(podeAlterarMes(12, 2026, new Date(2027, 0, 6, 12))).toBe(true);
    expect(podeAlterarMes(12, 2026, new Date(2027, 0, 7))).toBe(false);
  });
});
