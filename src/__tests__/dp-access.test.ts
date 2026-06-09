import { describe, it, expect } from 'vitest';
import { temAcessoDP } from '@/lib/dp-access';
import { casosDPAccess } from '@/__tests__/fixtures';

describe('temAcessoDP', () => {
  it.each(casosDPAccess)(
    'perfilDP=%s → %s',
    (perfilDP, esperado) => {
      expect(temAcessoDP(perfilDP)).toBe(esperado);
    },
  );

  it('acesso controlado exclusivamente pela permissão (sem fallback por cargo)', () => {
    expect(temAcessoDP(true)).toBe(true);
    expect(temAcessoDP(false)).toBe(false);
    expect(temAcessoDP(undefined)).toBe(false);
  });
});
