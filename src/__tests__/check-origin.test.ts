import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { checkOrigin } from '@/lib/check-origin';
import { casosCheckOrigin, ALLOWED_ORIGINS } from '@/__tests__/fixtures';

function makeReq(origin: string): NextRequest {
  const headers: Record<string, string> = {};
  if (origin) headers.origin = origin;
  return new NextRequest('http://localhost/api/x', { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('checkOrigin', () => {
  it.each(casosCheckOrigin)(
    'env=$env origin=$origin ok=$ok',
    ({ env, origin, ok }) => {
      vi.stubEnv('ALLOWED_ORIGINS', env);
      vi.stubEnv('APP_URL', '');
      const res = checkOrigin(makeReq(origin));
      if (ok) {
        expect(res).toBeNull();
      } else {
        expect(res).not.toBeNull();
        expect(res!.status).toBe(403);
      }
    },
  );

  it('origin na allowlist → retorna null', () => {
    vi.stubEnv('ALLOWED_ORIGINS', ALLOWED_ORIGINS);
    vi.stubEnv('APP_URL', '');
    expect(checkOrigin(makeReq('http://localhost:3000'))).toBeNull();
  });

  it('origin estranho → 403', () => {
    vi.stubEnv('ALLOWED_ORIGINS', ALLOWED_ORIGINS);
    vi.stubEnv('APP_URL', '');
    const res = checkOrigin(makeReq('https://evil.com'));
    expect(res!.status).toBe(403);
  });

  it('sem header Origin → 403', () => {
    vi.stubEnv('ALLOWED_ORIGINS', ALLOWED_ORIGINS);
    vi.stubEnv('APP_URL', '');
    const res = checkOrigin(makeReq(''));
    expect(res!.status).toBe(403);
  });

  it('env vazio (fail-closed) → 403 mesmo para origin válido', () => {
    vi.stubEnv('ALLOWED_ORIGINS', '');
    vi.stubEnv('APP_URL', '');
    const res = checkOrigin(makeReq('http://localhost:3000'));
    expect(res!.status).toBe(403);
  });

  it('usa APP_URL como fallback quando ALLOWED_ORIGINS está unset', () => {
    // NB: o fallback usa `??`, então só dispara quando ALLOWED_ORIGINS é
    // undefined (não definido). String vazia ('') NÃO cai no fallback.
    vi.stubEnv('ALLOWED_ORIGINS', undefined as unknown as string);
    vi.stubEnv('APP_URL', 'https://app.squadra.com.br');
    expect(checkOrigin(makeReq('https://app.squadra.com.br'))).toBeNull();
  });

  it('ALLOWED_ORIGINS vazio ("") NÃO cai no fallback APP_URL → 403', () => {
    vi.stubEnv('ALLOWED_ORIGINS', '');
    vi.stubEnv('APP_URL', 'https://app.squadra.com.br');
    const res = checkOrigin(makeReq('https://app.squadra.com.br'));
    expect(res!.status).toBe(403);
  });
});
