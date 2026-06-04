import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';

// Mock da fronteira de sessão (hoisted acima dos imports de rota).
vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/session';
import { GET } from '@/app/api/videos/route';

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue(makeSession() as never);
});

describe('GET /api/videos — guardas', () => {
  it('401 quando não autenticado', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('500 "Airtable não configurado" com sessão mas sem env', async () => {
    // AIRTABLE_VIDEOS_TOKEN/BASE não estão no env de teste → guard de config.
    const res = await GET();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('Airtable') });
  });
});

// Sanity do harness: prova que o MSW intercepta o upstream Squadra neste setup.
// (As Fases 4 dependem disso — se quebrar aqui, quebra para todos os agentes.)
describe('infra — MSW intercepta o upstream', () => {
  it('responde a um handler registrado via server.use', async () => {
    server.use(http.get(`${UPSTREAM}/ping`, () => HttpResponse.json({ ok: true })));
    const r = await fetch(`${UPSTREAM}/ping`);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
  });

  it('makeRequest monta NextRequest com origin permitido por default', async () => {
    const req = makeRequest('http://localhost/api/x', { method: 'POST', body: { a: 1 } });
    expect(req.headers.get('origin')).toBe('http://localhost:3000');
    expect(await req.json()).toEqual({ a: 1 });
  });
});
