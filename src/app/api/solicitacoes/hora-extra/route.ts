import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { solicitarHoraExtra } from '@/services/solicitacoes';
import { getDadosColab } from '@/services/ponto';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';
import { toMinutes } from '@/lib/horas';
import { extractUpstreamMsg } from '@/lib/upstream-error';

const Schema = z.object({
  projetoId:   z.number(),
  data:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  qtdadeHoras: z.number().positive(),
  motivo:      z.string().min(1),
  isNoturno:   z.enum(['S', 'N']).default('N'),
});

async function calcTipo(sqhorasId: number, isoDate: string, token: string): Promise<'C' | 'E'> {
  try {
    const meses = await getDadosColab(sqhorasId, isoDate, isoDate, token);
    const [y, m, d] = isoDate.split('-');
    const brDate = `${d}/${m}/${y}`;
    for (const mes of meses) {
      const dia = mes.dados.find((x) => x.data === brDate);
      if (dia) {
        const realizadas = toMinutes(dia.horasRealizadas);
        const previstas  = toMinutes(dia.horasPrevistas) || 8 * 60;
        return realizadas >= previstas ? 'E' : 'C';
      }
    }
  } catch (err) {
    // Sem dados do dia, assume 'C' (banco). Loga para diagnóstico — o tipo pode sair errado.
    console.warn('[hora-extra] calcTipo: falha ao obter dados do dia, assumindo banco (C):', err);
  }
  return 'C';
}

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  const { projetoId, data, qtdadeHoras, motivo, isNoturno } = parsed.data;
  if (qtdadeHoras > 2) {
    return NextResponse.json({ error: 'Máximo de 2h por solicitação de hora extra.' }, { status: 400 });
  }

  const tipo = await calcTipo(session.sqhorasId, data, session.token);

  try {
    await solicitarHoraExtra({ gestorId: session.gestorId, projetoId, data, qtdadeHoras, motivo, tipo, isNoturno }, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) {
      console.error('[POST /api/solicitacoes/hora-extra] rejeitado', err.status, err.message);
      return NextResponse.json({ error: extractUpstreamMsg(err.message, 'Solicitação rejeitada pela API') }, { status: 422 });
    }
    console.error('[POST /api/solicitacoes/hora-extra]', err);
    return NextResponse.json({ error: 'Erro ao solicitar hora extra' }, { status: 500 });
  }
}
