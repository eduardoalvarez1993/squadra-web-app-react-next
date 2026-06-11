import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';

vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));
import { getSession } from '@/lib/session';
import { GET as GETApontamentosDia } from '@/app/api/ponto/apontamentos-dia/route';

const sqHoraRaw = { apontamentoID: 1, projetoID: 1, horaInicio: '08:00', horaFim: '12:00', tipo: 'A' };

function mockPorDia(retorno: { sqHoras?: unknown[]; rm?: unknown[] }) {
  server.use(
    http.get(`${UPSTREAM}/v2/RetornaApontamentosPorDia`, () => HttpResponse.json({ sucesso: true, retorno })),
  );
}

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue(makeSession({ bateRep: true, permissoes: { bateRep: true } }) as never);
});

const req = () => makeRequest('http://localhost/api/ponto/apontamentos-dia?data=2026-06-09');

describe('GET /api/ponto/apontamentos-dia — sqHoras + rmCount', () => {
  it('403 sem bateRep', async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ bateRep: false, permissoes: { bateRep: false } }) as never);
    const res = await GETApontamentosDia(req());
    expect(res.status).toBe(403);
  });

  it('em dia sincronizado retorna sqHoras e rmCount > 0', async () => {
    mockPorDia({ sqHoras: [sqHoraRaw], rm: [{ hora: '08:00' }] });
    const res = await GETApontamentosDia(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sqHoras).toHaveLength(1);
    expect(body.rmCount).toBe(1);
  });

  it('expõe rmCount = 0 quando o ERP não tem espelho (falha de sync detectável)', async () => {
    mockPorDia({ sqHoras: [sqHoraRaw], rm: [] });
    const res = await GETApontamentosDia(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sqHoras).toHaveLength(1);
    expect(body.rmCount).toBe(0); // sqHoras>0 && rmCount===0 → sync error no cliente
  });
});
