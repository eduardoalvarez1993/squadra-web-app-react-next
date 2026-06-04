import { describe, it, expect } from 'vitest';
import { temAcessoDP } from '@/lib/dp-access';
import { casosDPAccess } from '@/__tests__/fixtures';

describe('temAcessoDP', () => {
  it.each(casosDPAccess)(
    'perfilDP=%s cargo=%s → %s',
    (perfilDP, cargo, esperado) => {
      expect(temAcessoDP(perfilDP, cargo)).toBe(esperado);
    },
  );

  it('perfilDP=true tem precedência sobre cargo vazio', () => {
    expect(temAcessoDP(true, '')).toBe(true);
  });

  it('cargo "SENIOR PERSONNEL" não começa com personnel → false', () => {
    expect(temAcessoDP(false, 'SENIOR PERSONNEL')).toBe(false);
  });

  it('case-insensitive para o fallback de cargo', () => {
    expect(temAcessoDP(false, 'personnel administration manager')).toBe(true);
  });
});
