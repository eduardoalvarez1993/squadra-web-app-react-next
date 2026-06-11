import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { getTiposAbono, solicitarAbono } from '@/services/solicitacoes';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

const Schema = z.object({
  data:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  qtdadeHoras:   z.number().positive(),
  justificativa: z.string().min(1),
});

function normalizeTipo(v: string) {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
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

  try {
    // Encontra o tipoAbonoId correspondente a DAY OFF
    const tipos = await getTiposAbono(session.token);
    const tipoDayoff = tipos.find((t) => normalizeTipo(t.tipoAbono).includes('DAY OFF'))
      ?? tipos.find((t) => normalizeTipo(t.tipoAbono).includes('FOLGA'));

    if (!tipoDayoff) {
      return NextResponse.json({ error: 'Tipo DAY OFF não encontrado' }, { status: 422 });
    }

    await solicitarAbono({
      tipoAbonoId:   tipoDayoff.id,
      // Day-off é dia único: início = fim.
      dataInicio:    parsed.data.data,
      dataFim:       parsed.data.data,
      qtdadeHoras:   parsed.data.qtdadeHoras,
      justificativa: parsed.data.justificativa,
      pessoaId:      session.pessoaId,
    }, session.token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError)   return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Solicitação rejeitada pela API' }, { status: 422 });
    console.error('[POST /api/solicitacoes/dayoff]', err);
    return NextResponse.json({ error: 'Erro ao solicitar day-off' }, { status: 500 });
  }
}
