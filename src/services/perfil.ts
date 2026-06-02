import { squadra, type PerfilData } from './squadra-client';

const EDITABLE_FIELDS = [
  'celular', 'nomeSocial', 'celularCorporativo', 'ramal', 'foto', 'skype', 'slack',
  'linkedin', 'google', 'teams', 'unidade', 'horasEntrada', 'horasSaida', 'horaAlmoco',
  'duracaoAlmoco', 'tamanhoCamisa', 'sobre', 'projetosPessoais', 'blog',
  'papelDesempenhado', 'formacaoAcademica', 'trabalhosVoluntarios',
  'listaExperiencias', 'listaExperienciasSoft', 'listaOutrasCompetencias',
  'listaIdiomas', 'listaInteresses', 'listaCertificacoes', 'listaComunidades',
];

// Campos que o backend exige como string (nunca null)
const STRING_REQUIRED = new Set([
  'celular', 'celularCorporativo', 'foto', 'skype', 'slack', 'linkedin', 'google',
  'unidade', 'horasEntrada', 'horasSaida', 'horaAlmoco', 'duracaoAlmoco',
  'tamanhoCamisa', 'formacaoAcademica',
]);

// normalizeFoto converte base64 → "data:image/jpeg;base64,..."
// O backend espera o base64 puro de volta — aqui revertemos
function rawFoto(val: unknown): string {
  if (!val || typeof val !== 'string') return '';
  if (val.startsWith('data:image/')) return val.replace(/^data:[^;]+;base64,/, '');
  return val;
}

export async function getPerfil(token: string, pessoaId?: number): Promise<PerfilData> {
  // Quando pessoaId é fornecido (incluindo simulação), busca por ID para garantir dados do alvo.
  // /v1/pessoa retorna o usuário do token; /v1/pessoas/{id} retorna o alvo correto.
  const data = pessoaId
    ? await squadra.perfil.getById(pessoaId, token)
    : await squadra.perfil.get(token);
  return data;
}

const SKILL_FIELDS = [
  'listaExperiencias', 'listaExperienciasSoft', 'listaOutrasCompetencias',
  'listaIdiomas', 'listaCertificacoes', 'listaInteresses',
] as const;

export async function salvarCompetencias(
  pessoaId: number,
  novos: Record<string, string[]>,
  token: string,
): Promise<{ ok: true }> {
  const payload: Record<string, unknown> = { id: pessoaId };
  for (const k of SKILL_FIELDS) payload[k] = novos[k] ?? [];
  return squadra.perfil.atualizarCompetencias(payload, token);
}

export async function atualizarPerfil(
  pessoaId: number,
  novos: Record<string, unknown>,
  token: string,
): Promise<{ ok: true }> {
  const current = await squadra.perfil.get(token);
  const payload: Record<string, unknown> = { id: pessoaId };

  for (const k of EDITABLE_FIELDS) {
    if (Object.hasOwn(novos, k)) {
      payload[k] = k === 'foto' ? rawFoto(novos[k]) : novos[k];
    } else if (k === 'foto') {
      payload[k] = rawFoto(current[k]);
    } else {
      const cur = current[k];
      payload[k] = cur ?? (STRING_REQUIRED.has(k) ? '' : null);
    }
  }

  return squadra.perfil.atualizar(payload, token);
}
