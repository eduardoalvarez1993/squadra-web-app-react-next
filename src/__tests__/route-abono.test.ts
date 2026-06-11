import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';

vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/session';
import { POST as POSTAbono } from '@/app/api/solicitacoes/abono/route';

const payloadAbonoOk = (over: Record<string, unknown> = {}) => ({
  tipoAbonoId:   11,
  dataInicio:    '2026-06-09',
  dataFim:       '2026-06-09',
  qtdadeHoras:   8,
  justificativa: 'Consulta médica',
  ...over,
});

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue(makeSession() as never);
});

describe('POST /api/solicitacoes/abono — guardas e validação', () => {
  it('401 quando não autenticado', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await POSTAbono(makeRequest('http://localhost/api/solicitacoes/abono', { method: 'POST', body: payloadAbonoOk() }));
    expect(res.status).toBe(401);
  });

  it('403 (CSRF) quando origin não é permitido', async () => {
    const res = await POSTAbono(makeRequest('http://localhost/api/solicitacoes/abono', {
      method: 'POST', body: payloadAbonoOk(), origin: 'https://evil.com',
    }));
    expect(res.status).toBe(403);
  });

  it('400 quando falta dataInicio/dataFim', async () => {
    const res = await POSTAbono(makeRequest('http://localhost/api/solicitacoes/abono', {
      method: 'POST', body: { tipoAbonoId: 11, qtdadeHoras: 8, justificativa: 'x' },
    }));
    expect(res.status).toBe(400);
  });

  it('400 quando dataFim é anterior a dataInicio', async () => {
    const res = await POSTAbono(makeRequest('http://localhost/api/solicitacoes/abono', {
      method: 'POST', body: payloadAbonoOk({ dataInicio: '2026-06-10', dataFim: '2026-06-09' }),
    }));
    expect(res.status).toBe(400);
  });

  it('400 quando o motivo excede 300 caracteres', async () => {
    const res = await POSTAbono(makeRequest('http://localhost/api/solicitacoes/abono', {
      method: 'POST', body: payloadAbonoOk({ justificativa: 'x'.repeat(301) }),
    }));
    expect(res.status).toBe(400);
  });

  it('200 ok e encaminha faixa de datas + anexo ao upstream', async () => {
    let recebido: Record<string, unknown> | null = null;
    server.use(
      http.post(`${UPSTREAM}/v1/abono/cadastraSolicitacao`, async ({ request }) => {
        recebido = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ sucesso: true });
      }),
    );
    const res = await POSTAbono(makeRequest('http://localhost/api/solicitacoes/abono', {
      method: 'POST', body: payloadAbonoOk({ tipoAbonoId: 12, dataInicio: '2026-06-09', dataFim: '2026-06-28', qtdadeHoras: 160, anexo: 'QUJD', nomeAnexo: 'atestado.pdf' }),
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(recebido).toMatchObject({
      tipo:                  12,
      dataInicioSolicitacao: '09/06/2026',
      dataFimSolicitacao:    '28/06/2026',
      qtdadeHoras:           160,
      descricao:             'Consulta médica',
      anexo:                 'QUJD',
      nomeAnexo:             'atestado.pdf',
    });
  });
});
