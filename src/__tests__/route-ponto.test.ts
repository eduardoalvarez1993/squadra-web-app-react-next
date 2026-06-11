import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';

// Mock da fronteira de sessão (hoisted acima dos imports de rota).
vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/session';
import { POST as POSTPonto } from '@/app/api/ponto/route';
import { POST as POSTHoraExtra } from '@/app/api/solicitacoes/hora-extra/route';

// ── Massa local específica ─────────────────────────────────────────────────
// Sessão que bate ponto (bateRep:true) — exigida pelo guard do POST /api/ponto.
const sessionPonto = () => makeSession({ bateRep: true, permissoes: { bateRep: true } });

// "Hoje" no fuso BRT no mesmo formato que a rota usa para comparar data futura.
const hojeBRT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
// Uma data claramente futura (ano +1).
const dataFutura = () => {
  const [y, m, d] = hojeBRT().split('-');
  return `${Number(y) + 1}-${m}-${d}`;
};
// Uma data passada mas DENTRO do mês aberto: o 1º do mês corrente. Evita a regra de
// horário futuro do próprio dia (≠ hoje, salvo no próprio dia 1º) e a trava de
// período fechado — que rejeitaria uma data de meses/anos anteriores.
const dataPassada = () => {
  const [y, m] = hojeBRT().split('-');
  return `${y}-${m}-01`;
};

const payloadPontoOk = (over: Record<string, unknown> = {}) => ({
  data:            hojeBRT(),
  // Período de 4h — dentro do limite de 6h por período.
  periodos:        [{ horaInicio: '08:00', horaFinal: '12:00' }],
  projetoId:       1,
  tipoApropriacao: 'JORNADA' as const,
  ...over,
});

const payloadHEOk = (over: Record<string, unknown> = {}) => ({
  projetoId:   1,
  data:        hojeBRT(),
  qtdadeHoras: 1,
  motivo:      'Demanda urgente',
  isNoturno:   'N' as const,
  ...over,
});

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue(sessionPonto() as never);
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/ponto — registrar apontamento
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/ponto — guardas e validação', () => {
  it('401 quando não autenticado (sem token)', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await POSTPonto(makeRequest('http://localhost/api/ponto', { method: 'POST', body: payloadPontoOk() }));
    expect(res.status).toBe(401);
  });

  it('403 quando a sessão não tem bateRep', async () => {
    // Colaborador comum (bateRep:false) não pode registrar apontamento.
    vi.mocked(getSession).mockResolvedValue(makeSession({ bateRep: false, permissoes: { bateRep: false } }) as never);
    const res = await POSTPonto(makeRequest('http://localhost/api/ponto', { method: 'POST', body: payloadPontoOk() }));
    expect(res.status).toBe(403);
  });

  it('403 (CSRF) quando origin não é permitido', async () => {
    const res = await POSTPonto(makeRequest('http://localhost/api/ponto', {
      method: 'POST', body: payloadPontoOk(), origin: 'https://evil.com',
    }));
    expect(res.status).toBe(403);
  });

  it('400 quando a data é futura (REGRESSÃO — refine Zod)', async () => {
    const res = await POSTPonto(makeRequest('http://localhost/api/ponto', {
      method: 'POST', body: payloadPontoOk({ data: dataFutura() }),
    }));
    expect(res.status).toBe(400);
    // A msg específica de data futura agora chega ao cliente (antes era genérica).
    expect(await res.json()).toMatchObject({ error: 'Data futura não permitida' });
  });

  it('400 quando um período excede 6 horas (limite por período)', async () => {
    const res = await POSTPonto(makeRequest('http://localhost/api/ponto', {
      method: 'POST', body: payloadPontoOk({ periodos: [{ horaInicio: '08:00', horaFinal: '15:00' }] }),
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'O período não pode exceder 6 horas' });
  });

  it('400 quando o payload é inválido (Zod — tipoApropriacao errado)', async () => {
    const res = await POSTPonto(makeRequest('http://localhost/api/ponto', {
      method: 'POST', body: payloadPontoOk({ tipoApropriacao: 'BANCO' }),
    }));
    expect(res.status).toBe(400);
  });

  it('400 quando o payload é inválido (projetoId não numérico)', async () => {
    const res = await POSTPonto(makeRequest('http://localhost/api/ponto', {
      method: 'POST', body: payloadPontoOk({ projetoId: 'abc' }),
    }));
    expect(res.status).toBe(400);
  });

  it('200 ok quando payload válido (data passada) — chama upstream', async () => {
    let chamou = false;
    server.use(http.post(`${UPSTREAM}/v3/apontamentos/novo/v3`, () => {
      chamou = true;
      return HttpResponse.json({ sucesso: true });
    }));
    const res = await POSTPonto(makeRequest('http://localhost/api/ponto', {
      method: 'POST', body: payloadPontoOk({ data: dataPassada() }),
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(chamou).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/solicitacoes/hora-extra
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/solicitacoes/hora-extra — guardas e regras de negócio', () => {
  it('401 quando não autenticado (sem token)', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ token: '' }) as never);
    const res = await POSTHoraExtra(makeRequest('http://localhost/api/solicitacoes/hora-extra', {
      method: 'POST', body: payloadHEOk(),
    }));
    expect(res.status).toBe(401);
  });

  it('403 (CSRF) quando origin não é permitido', async () => {
    const res = await POSTHoraExtra(makeRequest('http://localhost/api/solicitacoes/hora-extra', {
      method: 'POST', body: payloadHEOk(), origin: 'https://evil.com',
    }));
    expect(res.status).toBe(403);
  });

  it('400 quando qtdadeHoras não é positiva (Zod)', async () => {
    const res = await POSTHoraExtra(makeRequest('http://localhost/api/solicitacoes/hora-extra', {
      method: 'POST', body: payloadHEOk({ qtdadeHoras: 0 }),
    }));
    expect(res.status).toBe(400);
  });

  it('400 "máximo de 2h" quando a quantidade excede 2 horas', async () => {
    const res = await POSTHoraExtra(makeRequest('http://localhost/api/solicitacoes/hora-extra', {
      method: 'POST', body: payloadHEOk({ qtdadeHoras: 3 }),
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('2h') });
  });

  it('400 quando o payload é inválido (Zod — motivo vazio)', async () => {
    const res = await POSTHoraExtra(makeRequest('http://localhost/api/solicitacoes/hora-extra', {
      method: 'POST', body: payloadHEOk({ motivo: '' }),
    }));
    expect(res.status).toBe(400);
  });

  it('400 quando o motivo excede 300 caracteres (limite da API)', async () => {
    const res = await POSTHoraExtra(makeRequest('http://localhost/api/solicitacoes/hora-extra', {
      method: 'POST', body: payloadHEOk({ motivo: 'x'.repeat(301) }),
    }));
    expect(res.status).toBe(400);
  });

  it('200 ok no caso noturno (2h, isNoturno=S)', async () => {
    let chamouHE = false;
    // calcTipo busca dados do dia (getDadosColab) — devolvemos lista vazia → assume 'C'.
    server.use(
      http.get(`${UPSTREAM}/v1/retornaDadosColab/:id/:ini/:fim`, () => HttpResponse.json({ retorno: [] })),
      http.post(`${UPSTREAM}/v1/horaExtra/cadastraSolicitacao`, () => {
        chamouHE = true;
        return HttpResponse.json({ sucesso: true });
      }),
    );
    const res = await POSTHoraExtra(makeRequest('http://localhost/api/solicitacoes/hora-extra', {
      method: 'POST', body: payloadHEOk({ qtdadeHoras: 2, isNoturno: 'S' }),
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(chamouHE).toBe(true);
  });

  it('200 ok em caso diurno normal (1h) — chama upstream', async () => {
    let chamouHE = false;
    server.use(
      http.get(`${UPSTREAM}/v1/retornaDadosColab/:id/:ini/:fim`, () => HttpResponse.json({ retorno: [] })),
      http.post(`${UPSTREAM}/v1/horaExtra/cadastraSolicitacao`, () => {
        chamouHE = true;
        return HttpResponse.json({ sucesso: true });
      }),
    );
    const res = await POSTHoraExtra(makeRequest('http://localhost/api/solicitacoes/hora-extra', {
      method: 'POST', body: payloadHEOk(),
    }));
    expect(res.status).toBe(200);
    expect(chamouHE).toBe(true);
  });
});
