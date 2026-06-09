import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';
import { rawAbonosRH } from '@/__tests__/fixtures';

// Mock da fronteira de sessão (hoisted acima dos imports de rota).
vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/session';

import { GET as GET_ABONOS } from '@/app/api/rh/abonos/route';
import { POST as POST_AVALIAR } from '@/app/api/rh/abonos/[id]/avaliar/route';
import { GET as GET_ANEXO } from '@/app/api/rh/abonos/[id]/anexo/route';

// URLs upstream reais (lidas de squadra-client.ts → squadra.rh.*):
//   getAbonos / getAbonoAnexo → GET  /v1/listaAbonosDP/0/0/{status}
//   avaliarAbono              → POST /v1/avaliaSolicitacaoAbonoColab
const LISTA_ABONOS_P = `${UPSTREAM}/v1/listaAbonosDP/0/0/P`;
const AVALIA_ABONO = `${UPSTREAM}/v1/avaliaSolicitacaoAbonoColab`;

beforeEach(() => {
  // Default: sessão com acesso DP (perfilDP=true) → passa os dois guards.
  vi.mocked(getSession).mockResolvedValue(makeSession({ permissoes: { perfilDP: true } }) as never);
});

// ════════════════════════════════════════════════════════════════════════════
// 1) GET /api/rh/abonos  — listagem (exige acesso DP)
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/rh/abonos', () => {
  it('401 quando não autenticado (sem token)', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await GET_ABONOS(makeRequest('http://localhost/api/rh/abonos'));
    expect(res.status).toBe(401);
  });

  it('403 quando sessão sem acesso DP', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ cargo: 'Dev' }) as never);
    const res = await GET_ABONOS(makeRequest('http://localhost/api/rh/abonos'));
    expect(res.status).toBe(403);
  });

  it('200 com acesso DP via perfilDP → devolve abonos normalizados', async () => {
    server.use(http.get(LISTA_ABONOS_P, () => HttpResponse.json(rawAbonosRH)));
    const res = await GET_ABONOS(makeRequest('http://localhost/api/rh/abonos'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3);
    // contrato: schema mapeia id→idUnico e normaliza status PENDENTE→P
    expect(body[0]).toMatchObject({ idUnico: 9001, status: 'P', temAnexo: true });
  });

  it('403 com cargo PERSONNEL mas sem perfilDP (fallback por cargo removido)', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ cargo: 'PERSONNEL ANALYST' }) as never);
    const res = await GET_ABONOS(makeRequest('http://localhost/api/rh/abonos'));
    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2) POST /api/rh/abonos/[id]/avaliar
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/rh/abonos/[id]/avaliar', () => {
  const ctx = (id = '1') => ({ params: Promise.resolve({ id }) });

  it('401 quando não autenticado', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await POST_AVALIAR(
      makeRequest('http://localhost/api/rh/abonos/1/avaliar', { method: 'POST', body: { acao: 'A' } }),
      ctx('1'),
    );
    expect(res.status).toBe(401);
  });

  it('403 quando sessão sem acesso DP', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ cargo: 'Dev' }) as never);
    const res = await POST_AVALIAR(
      makeRequest('http://localhost/api/rh/abonos/1/avaliar', { method: 'POST', body: { acao: 'A' } }),
      ctx('1'),
    );
    expect(res.status).toBe(403);
  });

  it('403 CSRF quando origin não permitido', async () => {
    const res = await POST_AVALIAR(
      makeRequest('http://localhost/api/rh/abonos/1/avaliar', {
        method: 'POST', body: { acao: 'A' }, origin: 'https://evil.com',
      }),
      ctx('1'),
    );
    expect(res.status).toBe(403);
  });

  it('400 quando id não é numérico', async () => {
    const res = await POST_AVALIAR(
      makeRequest('http://localhost/api/rh/abonos/abc/avaliar', { method: 'POST', body: { acao: 'A' } }),
      ctx('abc'),
    );
    expect(res.status).toBe(400);
  });

  it('400 quando payload inválido (acao fora de A|R)', async () => {
    const res = await POST_AVALIAR(
      makeRequest('http://localhost/api/rh/abonos/1/avaliar', { method: 'POST', body: { acao: 'X' } }),
      ctx('1'),
    );
    expect(res.status).toBe(400);
  });

  it('200 sucesso (acao A, acesso DP, id numérico)', async () => {
    server.use(http.post(AVALIA_ABONO, () => HttpResponse.json({ sucesso: true })));
    const res = await POST_AVALIAR(
      makeRequest('http://localhost/api/rh/abonos/9001/avaliar', { method: 'POST', body: { acao: 'A', justificativa: 'ok' } }),
      ctx('9001'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3) GET /api/rh/abonos/[id]/anexo
//    A rota reusa /v1/listaAbonosDP/0/0/{status} e extrai o campo `arquivo`
//    do item cujo id casa. NÃO usa checkOrigin (é GET).
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/rh/abonos/[id]/anexo', () => {
  const ctx = (id = '1') => ({ params: Promise.resolve({ id }) });

  it('401 quando não autenticado', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await GET_ANEXO(makeRequest('http://localhost/api/rh/abonos/9002/anexo'), ctx('9002'));
    expect(res.status).toBe(401);
  });

  it('403 quando sessão sem acesso DP', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ cargo: 'Dev' }) as never);
    const res = await GET_ANEXO(makeRequest('http://localhost/api/rh/abonos/9002/anexo'), ctx('9002'));
    expect(res.status).toBe(403);
  });

  it('400 quando id não é numérico', async () => {
    const res = await GET_ANEXO(makeRequest('http://localhost/api/rh/abonos/abc/anexo'), ctx('abc'));
    expect(res.status).toBe(400);
  });

  it('200 devolve o anexo (campo arquivo do item correspondente)', async () => {
    server.use(http.get(LISTA_ABONOS_P, () => HttpResponse.json(rawAbonosRH)));
    // id 9002 é o único da massa com `arquivo` base64 preenchido.
    const res = await GET_ANEXO(makeRequest('http://localhost/api/rh/abonos/9002/anexo'), ctx('9002'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ arquivo: 'JVBERi0xLjcK' });
  });

  it('200 com arquivo vazio quando o item não tem base64', async () => {
    server.use(http.get(LISTA_ABONOS_P, () => HttpResponse.json(rawAbonosRH)));
    // id 9001 só tem caminho `anexo`, sem campo `arquivo` → string vazia.
    const res = await GET_ANEXO(makeRequest('http://localhost/api/rh/abonos/9001/anexo'), ctx('9001'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ arquivo: '' });
  });
});
