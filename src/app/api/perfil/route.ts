import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkOrigin } from '@/lib/check-origin';
import { getPerfil, atualizarPerfil } from '@/services/perfil';
import { SquadraAuthError, SquadraClientError } from '@/services/squadra-client';

// Campos editáveis do perfil — cada um string ou lista de strings (skills/idiomas).
// Permissivo de propósito (a API aceita muitos campos), mas valida os TIPOS e
// rejeita chaves desconhecidas, evitando payload arbitrário.
const PerfilUpdateSchema = z.object({
  celular: z.string(), nomeSocial: z.string(), celularCorporativo: z.string(),
  ramal: z.string().nullable(), foto: z.string(), skype: z.string(), slack: z.string(),
  linkedin: z.string(), google: z.string(), teams: z.string().nullable(), unidade: z.string(),
  horasEntrada: z.string(), horasSaida: z.string(), horaAlmoco: z.string(), duracaoAlmoco: z.string(),
  tamanhoCamisa: z.string(), sobre: z.string().nullable(), projetosPessoais: z.string().nullable(),
  blog: z.string().nullable(), papelDesempenhado: z.string().nullable(),
  formacaoAcademica: z.string(), trabalhosVoluntarios: z.string().nullable(),
  listaExperiencias: z.array(z.string()), listaExperienciasSoft: z.array(z.string()),
  listaOutrasCompetencias: z.array(z.string()), listaIdiomas: z.array(z.string()),
  listaInteresses: z.array(z.string()), listaCertificacoes: z.array(z.string()),
  listaComunidades: z.array(z.string()),
}).partial();

export async function GET() {
  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const data = await getPerfil(session.token, session.pessoaId || undefined);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    console.error('[GET /api/perfil]', err);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const session = await getSession();
  if (!session.token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 }); }

  const parsed = PerfilUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  try {
    await atualizarPerfil(session.pessoaId, parsed.data, session.token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SquadraAuthError) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
    if (err instanceof SquadraClientError) return NextResponse.json({ error: 'Perfil rejeitado pela API' }, { status: 422 });
    console.error('[PUT /api/perfil]', err);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
