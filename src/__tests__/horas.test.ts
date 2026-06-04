import { describe, it, expect } from 'vitest';
import { calcHoras, toMinutes } from '@/lib/horas';
import { casosHoras } from '@/__tests__/fixtures';

describe('toMinutes', () => {
  // NB: a fixture `casosToMin` afirma que "ab:cd" → 0 (NaN-safe), porém a
  // implementação real de src/lib/horas.ts faz `.split(':').map(Number)`, e o
  // default `= 0` só cobre elementos `undefined` (string vazia / segmento
  // ausente) — NÃO cobre `Number('ab') === NaN`. Logo a função NÃO é NaN-safe
  // para segmentos não-numéricos. Asserimos o comportamento REAL aqui e
  // reportamos a divergência da fixture (sem editar produção).
  it.each<[string, number]>([
    ['08:30', 510],
    ['00:00', 0],
    ['', 0],        // segmentos ausentes → default 0
  ])('%s → %s min', (hhmm, esperado) => {
    expect(toMinutes(hhmm)).toBe(esperado);
  });

  it('"08:30" → 510', () => {
    expect(toMinutes('08:30')).toBe(510);
  });

  it('segmento não-numérico "ab:cd" → NaN (NÃO é NaN-safe — ver lib/horas.ts)', () => {
    expect(toMinutes('ab:cd')).toBeNaN();
  });
});

describe('calcHoras', () => {
  it.each(casosHoras)(
    'inicio=%s fim=%s noturno=%s → %s h',
    (inicio, fim, isNoturno, esperado) => {
      expect(calcHoras(inicio, fim, isNoturno)).toBe(esperado);
    },
  );

  it('diurno 08:00→10:00 = 2h', () => {
    expect(calcHoras('08:00', '10:00', 'N')).toBe(2);
  });

  it('REGRESSÃO: noturno 23:00→01:00 com isNoturno=S = 2h', () => {
    expect(calcHoras('23:00', '01:00', 'S')).toBe(2);
  });

  it('diurno fim ≤ início → ≤ 0 (rota deve rejeitar)', () => {
    expect(calcHoras('08:00', '08:00', 'N')).toBeLessThanOrEqual(0);
    expect(calcHoras('23:00', '01:00', 'N')).toBeLessThanOrEqual(0);
  });
});
