import { describe, it, expect } from 'vitest';
import { isMesFechado, isPeriodoFechado } from '@/lib/periodo-fechado';

// Datas de referência em UTC. America/Sao_Paulo = UTC-3 (sem horário de verão atual).
// 2026-06-01T12:00 BRT == 2026-06-01T15:00Z.
const at = (utcIso: string) => new Date(utcIso);

describe('isMesFechado', () => {
  it('mês corrente não está fechado', () => {
    // Agora: 2026-06-11 BRT. Junho fecha só em 2026-07-01 12:00.
    expect(isMesFechado(2026, 6, at('2026-06-11T13:00:00Z'))).toBe(false);
  });

  it('mês anterior, dia 1º do mês seguinte ANTES das 12:00 BRT → ainda aberto', () => {
    // Maio fecha em 2026-06-01 12:00 BRT (== 15:00Z). 11:59 BRT == 14:59Z.
    expect(isMesFechado(2026, 5, at('2026-06-01T14:59:00Z'))).toBe(false);
  });

  it('mês anterior, exatamente às 12:00 BRT do dia 1º → fechado', () => {
    // 12:00 BRT == 15:00Z. ">= meio-dia" ⇒ fechado.
    expect(isMesFechado(2026, 5, at('2026-06-01T15:00:00Z'))).toBe(true);
  });

  it('mês anterior, após as 12:00 BRT do dia 1º → fechado', () => {
    expect(isMesFechado(2026, 5, at('2026-06-01T15:30:00Z'))).toBe(true);
  });

  it('virada de ano: dezembro fecha em 1º de janeiro 12:00 BRT', () => {
    // Antes do meio-dia de 01/01 → dezembro aberto.
    expect(isMesFechado(2025, 12, at('2026-01-01T14:00:00Z'))).toBe(false);
    // Depois do meio-dia → fechado.
    expect(isMesFechado(2025, 12, at('2026-01-01T15:01:00Z'))).toBe(true);
  });

  it('meses bem antigos estão fechados', () => {
    expect(isMesFechado(2024, 1, at('2026-06-11T13:00:00Z'))).toBe(true);
  });
});

describe('isPeriodoFechado (data ISO)', () => {
  it('deriva mês/ano da data e aplica a mesma regra', () => {
    expect(isPeriodoFechado('2026-05-20', at('2026-06-01T15:30:00Z'))).toBe(true);
    expect(isPeriodoFechado('2026-06-10', at('2026-06-11T13:00:00Z'))).toBe(false);
  });
});
