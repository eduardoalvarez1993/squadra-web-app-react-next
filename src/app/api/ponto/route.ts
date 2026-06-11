import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { getDadosColab, novoApontamento } from '@/services/ponto';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';
import { extractUpstreamMsg } from '@/lib/upstream-error';
import { isPeriodoFechado } from '@/lib/periodo-fechado';

const PERIODO_FECHADO_MSG = 'Período fechado — mês já computado.';

const DateRangeSchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fim:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const HE_MSG_6H = 'O período não pode exceder 6 horas';

function diffMin(inicio: string, final: string): number {
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = final.split(':').map(Number);
  return (hf * 60 + mf) - (hi * 60 + mi);
}

const PeriodoSchema = z.object({
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFinal:  z.string().regex(/^\d{2}:\d{2}$/),
})
  .refine((p) => p.horaFinal > p.horaInicio, 'Horário fim deve ser após o início')
  // Espelha o app-react: cada período no máximo 6h (360 min).
  .refine((p) => diffMin(p.horaInicio, p.horaFinal) <= 360, HE_MSG_6H);

const NovoApontamentoClientSchema = z.object({
  // data não pode ser futura (compara YYYY-MM-DD lexicograficamente, fuso BRT)
  data:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
                     .refine((d) => d <= new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }), 'Data futura não permitida')
                     .refine((d) => !isPeriodoFechado(d), PERIODO_FECHADO_MSG),
  periodos:        z.array(PeriodoSchema).min(1, 'Pelo menos 1 período é obrigatório'),
  projetoId:       z.number(),
  subprojetoId:    z.number().optional(),
  tipoApropriacao: z.enum(['JORNADA', 'HORA_EXTRA']),
  justificativa:   z.string().optional(),
}).superRefine((v, ctx) => {
  // No próprio dia, nenhum período pode terminar depois da hora atual (BRT).
  const hojeIso   = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  if (v.data !== hojeIso) return;
  const horaAgora = new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Sao_Paulo', hour12: false }).slice(0, 5);
  if (v.periodos.some((p) => p.horaFinal > horaAgora)) {
    ctx.addIssue({ code: 'custom', message: 'Horário futuro não permitido', path: ['periodos'] });
  }
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.token)   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.bateRep) return NextResponse.json({ error: 'Sem permissão' },   { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = DateRangeSchema.safeParse({
    inicio: searchParams.get('inicio'),
    fim:    searchParams.get('fim'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'inicio e fim obrigatórios (YYYY-MM-DD)' }, { status: 400 });
  }

  // O ponto desta rota é SEMPRE o do próprio usuário da sessão. Ponto de terceiros
  // (visão do gestor) passa por /api/gestao/membro/[id]/ponto, com checagem de equipe.
  const sqhorasId = session.sqhorasId;

  try {
    const data = await getDadosColab(sqhorasId, parsed.data.inicio, parsed.data.fim, session.token);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/ponto]', detail);

    // Código 8 = Usuário não encontrado no SQHoras (conta inativa ou inexistente)
    try {
      const parsed = JSON.parse(detail);
      const codigo = parsed?.erros?.[0]?.codigo;
      if (codigo === 8) {
        return NextResponse.json({ error: 'sqhoras_not_found' }, { status: 404 });
      }
    } catch { /* não é JSON, segue para erro genérico */ }

    return NextResponse.json({ error: 'Erro ao buscar dados de ponto' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token)   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!session.bateRep) return NextResponse.json({ error: 'Sem permissão' },   { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = NovoApontamentoClientSchema.safeParse(body);
  if (!parsed.success) {
    // Expõe as msgs específicas de negócio; demais erros ficam genéricos.
    const msgs = parsed.error.issues.map((i) => i.message);
    if (msgs.includes(PERIODO_FECHADO_MSG)) {
      return NextResponse.json({ error: PERIODO_FECHADO_MSG }, { status: 422 });
    }
    if (msgs.includes(HE_MSG_6H)) {
      return NextResponse.json({ error: HE_MSG_6H }, { status: 400 });
    }
    const dataFutura = msgs.includes('Data futura não permitida');
    return NextResponse.json({ error: dataFutura ? 'Data futura não permitida' : 'Dados inválidos' }, { status: 400 });
  }

  try {
    await novoApontamento({ ...parsed.data, usuarioId: session.pessoaId, login: session.login }, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) {
      console.error('[POST /api/ponto] rejeitado', err.status, err.message);
      // O upstream manda { sucesso:false, erros:[...] } — repassamos a mensagem real
      // (são validações de negócio voltadas ao usuário: almoço, futuro, sobreposição…).
      return NextResponse.json({ error: extractUpstreamMsg(err.message, 'Apontamento rejeitado pela API') }, { status: 422 });
    }
    console.error('[POST /api/ponto]', err);
    return NextResponse.json({ error: 'Erro ao registrar apontamento' }, { status: 500 });
  }
}
