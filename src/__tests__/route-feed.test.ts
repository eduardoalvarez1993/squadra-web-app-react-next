import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';
import { rawPosts } from '@/__tests__/fixtures';

// Mock da fronteira de sessão (hoisted acima dos imports de rota).
vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/session';

import { GET } from '@/app/api/feed/route';
import { DELETE, POST } from '@/app/api/feed/posts/route';

beforeEach(() => {
  // Default: colaborador comum (pessoaId: 200, token válido).
  vi.mocked(getSession).mockResolvedValue(makeSession() as never);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feed — lista posts (offset)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/feed — guardas e contrato', () => {
  it('401 quando não autenticado', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await GET(makeRequest('http://localhost/api/feed'));
    expect(res.status).toBe(401);
  });

  it('200 com sessão — devolve posts do upstream squadraEmRede', async () => {
    server.use(http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json(rawPosts)));
    const res = await GET(makeRequest('http://localhost/api/feed'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({ idPost: 1, remetenteID: 200 });
  });

  it('usa o offset da query (clamp >= 1 feito no client)', async () => {
    let calledPath = '';
    server.use(http.get(`${UPSTREAM}/v1/squadraEmRede/:offset`, ({ params }) => {
      calledPath = String(params.offset);
      return HttpResponse.json(rawPosts);
    }));
    const res = await GET(makeRequest('http://localhost/api/feed?offset=3'));
    expect(res.status).toBe(200);
    expect(calledPath).toBe('3');
  });

  it('500 quando o upstream falha (erro genérico)', async () => {
    server.use(http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json({}, { status: 500 })));
    const res = await GET(makeRequest('http://localhost/api/feed'));
    expect(res.status).toBe(500);
  });

  it('401 quando upstream responde 401 (SquadraAuthError → sessão expirada)', async () => {
    server.use(http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json({}, { status: 401 })));
    const res = await GET(makeRequest('http://localhost/api/feed'));
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/feed/posts — apagar post (com checagem de dono)
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/feed/posts — guardas, dono e contrato', () => {
  it('403 (CSRF) quando origin não permitido — antes de qualquer auth', async () => {
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=1', {
      method: 'DELETE', origin: 'https://evil.com',
    }));
    expect(res.status).toBe(403);
  });

  it('401 quando não autenticado', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=1', { method: 'DELETE' }));
    expect(res.status).toBe(401);
  });

  it('400 quando postId inválido (zero/ausente)', async () => {
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=0', { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });

  it('400 quando postId não numérico', async () => {
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=abc', { method: 'DELETE' }));
    expect(res.status).toBe(400);
  });

  it('403 ao tentar apagar post de OUTRO dono (remetenteID != pessoaId da sessão)', async () => {
    // rawPosts: post idPost=2 tem remetenteID default 0 (!= pessoaId 200) → não é dono.
    server.use(http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json(rawPosts)));
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=2', { method: 'DELETE' }));
    expect(res.status).toBe(403);
  });

  it('200 ao apagar o PRÓPRIO post (remetenteID == pessoaId)', async () => {
    // post idPost=1 tem remetenteID=200 == sessionColaborador.pessoaId.
    server.use(
      http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json(rawPosts)),
      http.delete(`${UPSTREAM}/v1/squadraEmRede/deletar/1`, () => HttpResponse.json({ ok: true })),
    );
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=1', { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it('200 quando post não está na janela recente — upstream valida dono', async () => {
    server.use(
      http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json(rawPosts)),
      http.delete(`${UPSTREAM}/v1/squadraEmRede/deletar/999`, () => HttpResponse.json({ ok: true })),
    );
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=999', { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });

  it('200 mesmo quando a busca dos recentes falha (catch silencioso) — segue para upstream', async () => {
    server.use(
      http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json({}, { status: 500 })),
      http.delete(`${UPSTREAM}/v1/squadraEmRede/deletar/1`, () => HttpResponse.json({ ok: true })),
    );
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=1', { method: 'DELETE' }));
    expect(res.status).toBe(200);
  });

  it('422 quando upstream rejeita o delete (SquadraClientError 4xx)', async () => {
    server.use(
      http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json(rawPosts)),
      http.delete(`${UPSTREAM}/v1/squadraEmRede/deletar/1`, () => HttpResponse.text('rejeitado', { status: 400 })),
    );
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=1', { method: 'DELETE' }));
    expect(res.status).toBe(422);
  });

  it('401 quando upstream do delete responde 401 (sessão expirada)', async () => {
    server.use(
      http.get(`${UPSTREAM}/v1/squadraEmRede/1`, () => HttpResponse.json(rawPosts)),
      http.delete(`${UPSTREAM}/v1/squadraEmRede/deletar/1`, () => HttpResponse.json({}, { status: 401 })),
    );
    const res = await DELETE(makeRequest('http://localhost/api/feed/posts?postId=1', { method: 'DELETE' }));
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/feed/posts — criar post (cobertura adicional)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/feed/posts — guardas e validação', () => {
  it('403 (CSRF) quando origin não permitido', async () => {
    const res = await POST(makeRequest('http://localhost/api/feed/posts', {
      method: 'POST', origin: 'https://evil.com', body: { texto: 'oi' },
    }));
    expect(res.status).toBe(403);
  });

  it('401 quando não autenticado', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await POST(makeRequest('http://localhost/api/feed/posts', {
      method: 'POST', body: { texto: 'oi' },
    }));
    expect(res.status).toBe(401);
  });

  it('400 quando texto vazio (falha no schema Zod)', async () => {
    const res = await POST(makeRequest('http://localhost/api/feed/posts', {
      method: 'POST', body: { texto: '' },
    }));
    expect(res.status).toBe(400);
  });

  it('400 quando Kudos (K) sem destinatário', async () => {
    const res = await POST(makeRequest('http://localhost/api/feed/posts', {
      method: 'POST', body: { texto: 'parabéns', tipoPublicacao: 'K' },
    }));
    expect(res.status).toBe(400);
  });

  it('200 ao criar post válido (mocka upstream squadraEmRede)', async () => {
    server.use(http.post(`${UPSTREAM}/v1/squadraEmRede`, () => HttpResponse.json({ ok: true })));
    const res = await POST(makeRequest('http://localhost/api/feed/posts', {
      method: 'POST', body: { texto: 'Olá time!' },
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it('422 quando upstream rejeita o post (SquadraClientError 4xx)', async () => {
    server.use(http.post(`${UPSTREAM}/v1/squadraEmRede`, () => HttpResponse.text('nope', { status: 400 })));
    const res = await POST(makeRequest('http://localhost/api/feed/posts', {
      method: 'POST', body: { texto: 'Olá time!' },
    }));
    expect(res.status).toBe(422);
  });
});
