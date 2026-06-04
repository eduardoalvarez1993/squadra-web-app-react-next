import { describe, it, expect } from 'vitest';
import { statusLabel } from '@/lib/status';
import { casosStatus } from '@/__tests__/fixtures';

describe('statusLabel', () => {
  it.each(casosStatus)('%s → %s', (entrada, esperado) => {
    expect(statusLabel(entrada)).toBe(esperado);
  });

  it("usa 'reprovado' (não 'recusado') para R/2", () => {
    expect(statusLabel('R')).toBe('reprovado');
    expect(statusLabel(2)).toBe('reprovado');
  });

  it('é case-insensitive', () => {
    expect(statusLabel('A')).toBe('aprovado');
    expect(statusLabel('a')).toBe('aprovado');
    expect(statusLabel('APROVADO')).toBe('aprovado');
  });

  it('desconhecido/vazio → pendente', () => {
    expect(statusLabel('???')).toBe('pendente');
    expect(statusLabel('')).toBe('pendente');
  });
});
