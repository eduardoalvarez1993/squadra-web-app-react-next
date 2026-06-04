import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';
import {
  rawPessoa,
  rawPermissoesDP,
  rawPerfilComSensiveis,
} from '@/__tests__/fixtures';

// Mock da fronteira de sessão (hoisted acima dos imports de rota).
vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/session';

import { POST as SIMULATE_POST, DELETE as SIMULATE_DELETE } from '@/app/api/auth/simulate/route';
import { PUT as PERFIL_PUT } from '@/app/api/perfil/route';

// ─── /api/auth/simulate ──────────────────────────────────────────────────────
describe('POST /api/auth/simulate — guardas', () => {
  beforeEach(() => {
    // Default: gestor que pode simular.
    vi.mocked(getSession).mockResolvedValue(
      makeSession({ gestorId: 100, podeSimular: true }) as never,
    );
  });

  it('403 origin inválido (CSRF) antes de qualquer outra checagem', async () => {
    const res = await SIMULATE_POST(
      makeRequest('http://localhost/api/auth/simulate', {
        method: 'POST',
        body: { id: 200 },
        origin: 'https://evil.com',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('401 sem sessão (token vazio)', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await SIMULATE_POST(
      makeRequest('http://localhost/api/auth/simulate', { method: 'POST', body: { id: 200 } }),
    );
    expect(res.status).toBe(401);
  });

  it('403 quando podeSimular=false', async () => {
    vi.mocked(getSession).mockResolvedValue(
      makeSession({ gestorId: 100, podeSimular: false }) as never,
    );
    const res = await SIMULATE_POST(
      makeRequest('http://localhost/api/auth/simulate', { method: 'POST', body: { id: 200 } }),
    );
    expect(res.status).toBe(403);
  });

  it('400 payload inválido (sem id)', async () => {
    const res = await SIMULATE_POST(
      makeRequest('http://localhost/api/auth/simulate', { method: 'POST', body: {} }),
    );
    expect(res.status).toBe(400);
  });

  it('400 ao tentar simular a si mesmo (id === gestorId)', async () => {
    const res = await SIMULATE_POST(
      makeRequest('http://localhost/api/auth/simulate', { method: 'POST', body: { id: 100 } }),
    );
    expect(res.status).toBe(400);
  });

  it('200 + session.save no caminho de sucesso (podeSimular, id≠gestorId)', async () => {
    server.use(
      http.get(`${UPSTREAM}/v1/pessoas/:id`, () => HttpResponse.json(rawPessoa)),
      http.get(`${UPSTREAM}/v1/pessoa/permissoes/:id`, () => HttpResponse.json(rawPermissoesDP)),
    );

    const session = makeSession({ gestorId: 100, podeSimular: true });
    vi.mocked(getSession).mockResolvedValue(session as never);

    const res = await SIMULATE_POST(
      makeRequest('http://localhost/api/auth/simulate', { method: 'POST', body: { id: 200 } }),
    );

    expect(res.status).toBe(200);
    expect(session.save).toHaveBeenCalledTimes(1);
    // Mutação da sessão para o alvo.
    expect(session.gestorId).toBe(200);
    expect(session.simulando).toBe(true);
    expect(session.podeSimular).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((session as any)._simOrig).toBeTruthy();
  });
});

describe('DELETE /api/auth/simulate — guardas', () => {
  it('403 origin inválido (CSRF)', async () => {
    vi.mocked(getSession).mockResolvedValue(
      makeSession({ simulando: true }) as never,
    );
    const res = await SIMULATE_DELETE(
      makeRequest('http://localhost/api/auth/simulate', { method: 'DELETE', origin: 'https://evil.com' }),
    );
    expect(res.status).toBe(403);
  });

  it('401 sem sessão (token vazio)', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await SIMULATE_DELETE(
      makeRequest('http://localhost/api/auth/simulate', { method: 'DELETE' }),
    );
    expect(res.status).toBe(401);
  });

  it('400 quando não está simulando', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ simulando: false }) as never);
    const res = await SIMULATE_DELETE(
      makeRequest('http://localhost/api/auth/simulate', { method: 'DELETE' }),
    );
    expect(res.status).toBe(400);
  });

  it('500 quando simulando mas sem _simOrig', async () => {
    vi.mocked(getSession).mockResolvedValue(
      makeSession({ simulando: true }) as never, // sem _simOrig
    );
    const res = await SIMULATE_DELETE(
      makeRequest('http://localhost/api/auth/simulate', { method: 'DELETE' }),
    );
    expect(res.status).toBe(500);
  });

  it('200 + restaura sessão original (simulando + _simOrig presente)', async () => {
    const orig = {
      token:      'orig-token',
      gestorId:   100,
      pessoaId:   100,
      sqhorasId:  300,
      login:      'maria.gestora',
      nome:       'Maria Gestora',
      cargo:      'Gerente',
      bateRep:    false,
      permissoes: { gerenteFuncional: true, perfilDP: false, bateRep: false },
    };
    const session = makeSession({
      token:      'sim-token',
      gestorId:   200,
      simulando:  true,
      podeSimular: false,
      _simOrig:   orig,
    });
    vi.mocked(getSession).mockResolvedValue(session as never);

    const res = await SIMULATE_DELETE(
      makeRequest('http://localhost/api/auth/simulate', { method: 'DELETE' }),
    );

    expect(res.status).toBe(200);
    expect(session.save).toHaveBeenCalledTimes(1);
    expect(session.gestorId).toBe(100);
    expect(session.token).toBe('orig-token');
    expect(session.simulando).toBe(false);
    expect(session.podeSimular).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((session as any)._simOrig).toBeUndefined();
  });
});

// ─── /api/perfil (PUT) ─────────────────────────────────────────────────────────
describe('PUT /api/perfil — guardas', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ pessoaId: 200 }) as never);
  });

  it('403 origin inválido (CSRF) antes da sessão', async () => {
    const res = await PERFIL_PUT(
      makeRequest('http://localhost/api/perfil', {
        method: 'PUT',
        body: { celular: '999' },
        origin: 'https://evil.com',
      }),
    );
    expect(res.status).toBe(403);
  });

  it('401 sem sessão (token vazio)', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await PERFIL_PUT(
      makeRequest('http://localhost/api/perfil', { method: 'PUT', body: { celular: '999' } }),
    );
    expect(res.status).toBe(401);
  });

  // DIVERGÊNCIA: o comentário da rota diz "rejeita chaves desconhecidas", mas o
  // schema usa apenas .partial() (sem .strict()), então o Zod ESTRIPA chaves
  // desconhecidas em vez de rejeitar. Logo, payload só com chave desconhecida
  // parseia para {} (sucesso) e NÃO retorna 400. Aqui provamos que NÃO é 400.
  it('400 quando há chave desconhecida (schema .strict() — anti mass-assignment)', async () => {
    const res = await PERFIL_PUT(
      makeRequest('http://localhost/api/perfil', {
        method: 'PUT',
        body: { chaveQueNaoExiste: 'x' },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('400 quando o Zod rejeita tipo inválido (celular numérico)', async () => {
    const res = await PERFIL_PUT(
      makeRequest('http://localhost/api/perfil', {
        method: 'PUT',
        body: { celular: 12345 },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('200 no caminho de sucesso (payload válido → GET /v1/pessoa + PUT /v1/pessoas)', async () => {
    let putCalled = false;
    server.use(
      http.get(`${UPSTREAM}/v1/pessoa`, () => HttpResponse.json(rawPerfilComSensiveis)),
      http.put(`${UPSTREAM}/v1/pessoas`, () => {
        putCalled = true;
        return HttpResponse.json({ sucesso: true });
      }),
    );

    const res = await PERFIL_PUT(
      makeRequest('http://localhost/api/perfil', {
        method: 'PUT',
        body: { celular: '(11) 91234-5678', nomeSocial: 'João' },
      }),
    );

    expect(res.status).toBe(200);
    expect(putCalled).toBe(true);
  });
});
