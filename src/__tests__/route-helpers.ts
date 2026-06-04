/**
 * Helpers compartilhados para testes de API Routes (Fase 4).
 * ----------------------------------------------------------------------------
 * Criado ANTES do fan-out (igual à Fase 0) para que todos os agentes usem o
 * MESMO mock de sessão e a mesma forma de montar request — evita 4 helpers
 * divergentes. NÃO contém testes.
 *
 * Padrão de uso num arquivo de teste de rota:
 *
 *   import { describe, it, expect, vi, beforeEach } from 'vitest';
 *   import { http, HttpResponse } from 'msw';
 *   import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';
 *
 *   vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
 *   import { getSession } from '@/lib/session';
 *   import { POST } from '@/app/api/rh/abonos/[id]/avaliar/route';
 *
 *   beforeEach(() => vi.mocked(getSession).mockResolvedValue(makeSession({ cargo: 'PERSONNEL ANALYST' })));
 *
 *   it('403 sem acesso DP', async () => {
 *     vi.mocked(getSession).mockResolvedValue(makeSession({ cargo: 'Dev' }));
 *     const res = await POST(makeRequest('http://localhost/api/rh/abonos/1/avaliar', {
 *       method: 'POST', body: { acao: 'A' },
 *     }), { params: Promise.resolve({ id: '1' }) });
 *     expect(res.status).toBe(403);
 *   });
 */
import { vi } from 'vitest';
import { NextRequest } from 'next/server';
import { sessionColaborador } from './fixtures';

/** Server MSW — re-exporta a MESMA instância do setup global (que tem o listen()). */
export { server } from './setup-msw';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Base do upstream Squadra (igual ao SQUADRA_API_URL do vitest.config.ts). */
export const UPSTREAM = 'https://api.squadra.com.br/api';

/**
 * Origin permitido (igual ao ALLOWED_ORIGINS do vitest.config.ts).
 * `makeRequest` usa este por default → checkOrigin passa. Para testar CSRF,
 * passe `origin: 'https://evil.com'` ou `origin: null`.
 */
export const ALLOWED_ORIGIN = 'http://localhost:3000';

type MakeRequestOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Origin header. `undefined` usa o permitido; `null` omite (simula CSRF). */
  origin?: string | null;
  headers?: Record<string, string>;
};

/** Monta um NextRequest pronto para passar ao handler da rota. */
export function makeRequest(url: string, opts: MakeRequestOpts = {}): NextRequest {
  const { method = 'GET', body, origin, headers = {} } = opts;
  const h = new Headers(headers);
  if (origin !== null) h.set('origin', origin ?? ALLOWED_ORIGIN);
  if (body !== undefined && !h.has('content-type')) h.set('content-type', 'application/json');
  return new NextRequest(url, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Sessão falsa mutável com `save`/`destroy` mockados. Base = colaborador comum
 * (sem privilégios); passe overrides para gestor/DP/simulando/etc.
 * Para sessão ausente (401), use `makeSession({ token: '' })`.
 */
export function makeSession(overrides: Record<string, any> = {}) {
  return {
    ...sessionColaborador,
    permissoes: { ...sessionColaborador.permissoes, ...(overrides.permissoes ?? {}) },
    ...overrides,
    save:    vi.fn(async () => {}),
    destroy: vi.fn(() => {}),
  };
}
