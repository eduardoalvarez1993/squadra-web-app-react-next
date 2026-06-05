/**
 * Testes das rotas da feature "alterar-gestor" (abas Gestão Funcional / Projeto).
 *
 * Particularidades desta feature:
 *  - Todas as rotas exigem `permissoes.gerenteFuncional` (403 sem ele).
 *  - O upstream é a base de HOMOLOGAÇÃO (`HML_API_URL`), não a de produção
 *    (`UPSTREAM` do route-helpers) — os handlers MSW vão na base HML.
 *  - O service mantém cache in-memory (TTL 10min). `invalidateGestaoCache()`
 *    no beforeEach isola os testes das listagens cacheadas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';
import { HML_API_URL } from '@/services/squadra-client';
import { invalidateGestaoCache } from '@/services/gestao';

vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/session';

import { POST as POST_COLAB } from '@/app/api/gestao/altera-gestor-colaborador/route';
import { POST as POST_PROJ } from '@/app/api/gestao/altera-gestor-projeto/route';
import { GET as GET_COLABS } from '@/app/api/gestao/colaboradores-gestores/route';
import { GET as GET_PROJS } from '@/app/api/gestao/projetos-gestores/route';
import { GET as GET_PESSOAS } from '@/app/api/gestao/pessoas-busca/route';
import { GET as GET_PROJ_BUSCA } from '@/app/api/gestao/projetos-busca/route';

const HML = HML_API_URL;
const gerente = () => makeSession({ permissoes: { gerenteFuncional: true } });

beforeEach(() => {
  invalidateGestaoCache();                    // zera cache do service entre testes
  vi.mocked(getSession).mockResolvedValue(gerente() as never); // default: gerente funcional
});

// ── POST /api/gestao/altera-gestor-colaborador ───────────────────────────────
describe('POST /api/gestao/altera-gestor-colaborador', () => {
  const url = 'http://localhost/api/gestao/altera-gestor-colaborador';
  const body = { coordId: 5, recId: 10 };

  it('401 sem sessão', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await POST_COLAB(makeRequest(url, { method: 'POST', body }));
    expect(res.status).toBe(401);
  });

  it('403 CSRF (origin inválido)', async () => {
    const res = await POST_COLAB(makeRequest(url, { method: 'POST', body, origin: 'https://evil.com' }));
    expect(res.status).toBe(403);
  });

  it('403 sem gerenteFuncional', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession() as never);
    const res = await POST_COLAB(makeRequest(url, { method: 'POST', body }));
    expect(res.status).toBe(403);
  });

  it('400 payload inválido (recId ausente)', async () => {
    const res = await POST_COLAB(makeRequest(url, { method: 'POST', body: { coordId: 5 } }));
    expect(res.status).toBe(400);
  });

  it('400 payload inválido (id não-positivo)', async () => {
    const res = await POST_COLAB(makeRequest(url, { method: 'POST', body: { coordId: 0, recId: -1 } }));
    expect(res.status).toBe(400);
  });

  it('200 sucesso (mock upstream HML)', async () => {
    let chamou = false;
    server.use(http.post(`${HML}/v1/alteraGestorColaborador/5/10`, () => {
      chamou = true;
      return HttpResponse.json({ sucesso: true });
    }));
    const res = await POST_COLAB(makeRequest(url, { method: 'POST', body }));
    expect(res.status).toBe(200);
    expect(chamou).toBe(true);
  });

  it('422 com a mensagem do upstream quando rejeitado', async () => {
    server.use(http.post(`${HML}/v1/alteraGestorColaborador/5/10`, () =>
      HttpResponse.json({ erros: [{ mensagem: 'Coordenador inválido' }] }, { status: 422 })));
    const res = await POST_COLAB(makeRequest(url, { method: 'POST', body }));
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: 'Coordenador inválido' });
  });
});

// ── POST /api/gestao/altera-gestor-projeto ───────────────────────────────────
describe('POST /api/gestao/altera-gestor-projeto', () => {
  const url = 'http://localhost/api/gestao/altera-gestor-projeto';
  const body = { coordId: 7, prjId: 20 };

  it('401 sem sessão', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    expect((await POST_PROJ(makeRequest(url, { method: 'POST', body }))).status).toBe(401);
  });

  it('403 CSRF', async () => {
    expect((await POST_PROJ(makeRequest(url, { method: 'POST', body, origin: 'https://evil.com' }))).status).toBe(403);
  });

  it('403 sem gerenteFuncional', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession() as never);
    expect((await POST_PROJ(makeRequest(url, { method: 'POST', body }))).status).toBe(403);
  });

  it('400 payload inválido (prjId ausente)', async () => {
    expect((await POST_PROJ(makeRequest(url, { method: 'POST', body: { coordId: 7 } }))).status).toBe(400);
  });

  it('200 sucesso (mock upstream HML)', async () => {
    server.use(http.post(`${HML}/v1/alteraGestorProjeto/7/20`, () => HttpResponse.json({ sucesso: true })));
    expect((await POST_PROJ(makeRequest(url, { method: 'POST', body }))).status).toBe(200);
  });

  it('422 com a mensagem do upstream', async () => {
    server.use(http.post(`${HML}/v1/alteraGestorProjeto/7/20`, () =>
      HttpResponse.json({ erros: [{ mensagem: 'Projeto inexistente' }] }, { status: 422 })));
    const res = await POST_PROJ(makeRequest(url, { method: 'POST', body }));
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: 'Projeto inexistente' });
  });
});

// ── GET /api/gestao/colaboradores-gestores ───────────────────────────────────
describe('GET /api/gestao/colaboradores-gestores', () => {
  it('401 sem sessão', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    expect((await GET_COLABS()).status).toBe(401);
  });

  it('403 sem gerenteFuncional', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession() as never);
    expect((await GET_COLABS()).status).toBe(403);
  });

  it('200 e ordena colaboradores por nome (lê de PRODUÇÃO)', async () => {
    server.use(http.get(`${UPSTREAM}/v1/pessoasRelatorio`, () => HttpResponse.json({
      retorno: [
        { id: 1, nome: 'Bruno', cpf: '111', gerente: 'Chefe X' },
        { id: 2, nome: 'Ana',   cpf: '222', gerente: 'Chefe Y' },
      ],
    })));
    const res = await GET_COLABS();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.map((d: { nome: string }) => d.nome)).toEqual(['Ana', 'Bruno']);
  });
});

// ── GET /api/gestao/projetos-gestores ────────────────────────────────────────
describe('GET /api/gestao/projetos-gestores', () => {
  it('401 sem sessão', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    expect((await GET_PROJS()).status).toBe(401);
  });

  it('403 sem gerenteFuncional', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession() as never);
    expect((await GET_PROJS()).status).toBe(403);
  });

  it('200 e resolve o nome do gestor por CPF', async () => {
    server.use(
      http.get(`${UPSTREAM}/v1/gestor/relatorioProjetosCadastrados`, () => HttpResponse.json({
        retorno: [{ id: 30, nome: 'Projeto Z', nomeCliente: 'Cliente A', situacao: 'Ativo', cpfGerente: '111.111.111-11' }],
      })),
      http.get(`${UPSTREAM}/v1/pessoasRelatorio`, () => HttpResponse.json({
        retorno: [{ id: 1, nome: 'Bruno', cpf: '11111111111' }],  // mesmo CPF (sem máscara)
      })),
    );
    const res = await GET_PROJS();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0]).toMatchObject({ nome: 'Projeto Z', gestor: 'Bruno' });
  });
});

// ── GET /api/gestao/pessoas-busca ────────────────────────────────────────────
describe('GET /api/gestao/pessoas-busca', () => {
  const url = (q: string) => `http://localhost/api/gestao/pessoas-busca?q=${q}`;

  it('401 sem sessão', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    expect((await GET_PESSOAS(makeRequest(url('ana')))).status).toBe(401);
  });

  it('403 sem gerenteFuncional', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession() as never);
    expect((await GET_PESSOAS(makeRequest(url('ana')))).status).toBe(403);
  });

  it('200 [] quando q < 3 (não chama upstream)', async () => {
    const res = await GET_PESSOAS(makeRequest(url('an')));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('200 com resultados quando q >= 3 (mock HML)', async () => {
    server.use(http.post(`${HML}/v1/pessoas/buscarpessoas`, () => HttpResponse.json({
      retorno: [{ id: 1, nome: 'Ana', login: 'ana' }],
    })));
    const res = await GET_PESSOAS(makeRequest(url('ana')));
    expect(res.status).toBe(200);
    expect((await res.json()).length).toBe(1);
  });
});

// ── GET /api/gestao/projetos-busca ───────────────────────────────────────────
describe('GET /api/gestao/projetos-busca', () => {
  const url = (q: string) => `http://localhost/api/gestao/projetos-busca?q=${q}`;

  it('401 sem sessão', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    expect((await GET_PROJ_BUSCA(makeRequest(url('alp')))).status).toBe(401);
  });

  it('403 sem gerenteFuncional', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession() as never);
    expect((await GET_PROJ_BUSCA(makeRequest(url('alp')))).status).toBe(403);
  });

  it('400 quando q < 3', async () => {
    const res = await GET_PROJ_BUSCA(makeRequest(url('al')));
    expect(res.status).toBe(400);
  });

  it('200 com resultados quando q >= 3 (mock HML)', async () => {
    server.use(http.post(`${HML}/v2/projetos/pornomev2`, () => HttpResponse.json({
      retorno: [{ id: 1, nome: 'Projeto Alpha', cliente: 'Cliente A' }],
    })));
    const res = await GET_PROJ_BUSCA(makeRequest(url('alpha')));
    expect(res.status).toBe(200);
    expect((await res.json()).length).toBe(1);
  });
});
