import {
  squadra,
  type MembroEquipe,
  type SaldoGlobalItem,
  type HoraExtraItem,
  type ApropriacaoItem,
  type AbonoEquipeItem,
  type FeriasRHItem,
  type ServicoGestor,
  type Papel,
  type AlocarPayload,
  type ColaboradorComGestor,
  type PessoaData,
  type ProjetoBuscaItem,
} from './squadra-client';

function toUpstreamDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export async function getEquipe(gestorId: number, token: string): Promise<MembroEquipe[]> {
  const [equipe, saldoList] = await Promise.all([
    squadra.gestao.getEquipe(gestorId, token),
    squadra.home.saldoGlobal(token).catch((): SaldoGlobalItem[] => []),
  ]);

  // Deriva login do email (saldoGlobal), indexado por nome em uppercase
  const loginMap = new Map<string, string>();
  for (const s of saldoList) {
    if (s.email) {
      const login = s.email.split('@')[0].toLowerCase();
      if (login) loginMap.set(s.colaborador.toUpperCase(), login);
    }
  }

  const withLogins = equipe.map(m => ({
    ...m,
    login: m.login ?? loginMap.get(m.nome.toUpperCase()),
  }));

  // Resolve IDs em paralelo server-side via GET /v1/usuarios/{login}
  const resolved = await Promise.allSettled(
    withLogins.map(async (m): Promise<MembroEquipe> => {
      if (m.id) return m;
      if (!m.login) return m;
      const id = await squadra.gestao.resolveLogin(m.login, token);
      return { ...m, id: id ?? undefined };
    }),
  );

  return resolved.map((r, i) => r.status === 'fulfilled' ? r.value : withLogins[i]!);
}

export type ColaboradorPendencia = {
  id:                              number;
  nome:                            string;
  foto:                            string | null;
  projetosAlocados:                Array<{ nome: string; dataTermino: string }>;
  saldoFeriasColaborador:          number;
  terminoPeriodoDeGozoColaborador: string | null;
  bancoHorasColaborador:           number;
  datasSemApontamento:             string[];
  preFechamentoPendente:           boolean;
};

export async function getPendencias(gestorId: number, token: string): Promise<ColaboradorPendencia[]> {
  const raw = await squadra.gestao.getPendencias(gestorId, token) as Record<string, unknown>;
  const retorno  = (raw?.['retorno'] as Record<string, unknown>) ?? raw ?? {};
  const equipe   = Array.isArray(retorno['pendenciaEquipe']) ? retorno['pendenciaEquipe'] : [];
  return (equipe as Record<string, unknown>[]).map((c): ColaboradorPendencia => ({
    id:                              Number(c['id'] ?? 0),
    nome:                            String(c['nome'] ?? ''),
    foto:                            (c['foto'] as string | null) || null,
    projetosAlocados:                (Array.isArray(c['projetosAlocadoColaborador']) ? c['projetosAlocadoColaborador'] : [])
      .map((p: Record<string, unknown>) => ({
        nome:        String(p['Nome'] ?? p['nome'] ?? ''),
        dataTermino: String(p['dataTermino'] ?? ''),
      })),
    saldoFeriasColaborador:          Number(c['saldoFeriasColaborador'] ?? 0),
    terminoPeriodoDeGozoColaborador: (c['terminoPeriodoDeGozoColaborador'] as string | null) || null,
    bancoHorasColaborador:           Number(c['bancoHorasColaborador'] ?? 0),
    // Backend manda [{ horas, dia }] — extraímos o `dia` (dd/MM/yyyy). Em algum
    // ambiente pode vir string direto, então tratamos os dois casos.
    datasSemApontamento:             (Array.isArray(c['datasSemApontamento']) ? c['datasSemApontamento'] : [])
      .map((d: unknown) => typeof d === 'string' ? d : String((d as Record<string, unknown>)?.['dia'] ?? ''))
      .filter(Boolean),
    preFechamentoPendente:           Array.isArray(c['preFechamentoPendenteColaborador']) && (c['preFechamentoPendenteColaborador'] as unknown[]).length > 0,
  }));
}

// ── Autorização por objeto (object-level) ──────────────────────────────────────
// Conjunto de IDs de colaboradores sob gestão do gestor (equipe + pendências).
// Usado pelas rotas /api/gestao/membro/[id]/* para garantir que o gestor só
// acessa/age sobre membros da PRÓPRIA equipe — não basta ter o papel.
// Durante simulação, session.gestorId é o usuário simulado → o escopo passa a ser
// a equipe DELE, que é o comportamento correto.
// Cache curto (60s) porque getEquipe é caro (saldoGlobal + resolveLogin).
const IDS_SOB_GESTAO_TTL_MS = 60 * 1000;
const _idsSobGestao = new Map<number, { at: number; ids: Set<number> }>();

export async function getIdsSobGestao(gestorId: number, token: string): Promise<Set<number>> {
  const hit = _idsSobGestao.get(gestorId);
  if (hit && Date.now() - hit.at < IDS_SOB_GESTAO_TTL_MS) return hit.ids;

  const [equipe, pend] = await Promise.allSettled([
    getEquipe(gestorId, token),
    getPendencias(gestorId, token),
  ]);

  // Falha total nos dois → propaga o erro (vira 401/5xx na rota, não um 403 enganoso)
  if (equipe.status === 'rejected' && pend.status === 'rejected') throw equipe.reason;

  const ids = new Set<number>();
  if (equipe.status === 'fulfilled') for (const m of equipe.value) if (m.id) ids.add(m.id);
  if (pend.status === 'fulfilled')  for (const p of pend.value)  if (p.id) ids.add(p.id);

  _idsSobGestao.set(gestorId, { at: Date.now(), ids });
  return ids;
}

export type SolicitacoesGestao = {
  horasExtras:  HoraExtraItem[];
  apropriacao:  ApropriacaoItem[];
  ferias:       FeriasRHItem[];
  abonos:       AbonoEquipeItem[];
};

export async function getSolicitacoes(gestorId: number, token: string): Promise<SolicitacoesGestao> {
  const [he, ap, fe, ab] = await Promise.allSettled([
    squadra.gestao.getHorasExtras(gestorId, token),
    squadra.gestao.getSolicitacoesApropriacao(gestorId, token),
    squadra.gestao.getSolicitacoesFerias(gestorId, token),
    squadra.gestao.getDayoffPendentes(gestorId, token),
  ]);
  return {
    horasExtras: he.status === 'fulfilled' ? he.value : [],
    apropriacao: ap.status === 'fulfilled' ? ap.value : [],
    ferias:      fe.status === 'fulfilled' ? fe.value : [],
    abonos:      ab.status === 'fulfilled' ? ab.value : [],
  };
}

export async function aprovarSolicitacao(
  tipo: 'hora_extra' | 'apropriacao' | 'ferias' | 'abono',
  input: {
    id:               number;
    idFalta?:         number;
    acao:             'A' | 'R';
    tipoAprovacao?:   string;
    observacaoGestor?: string;
    projeto?:         number;
    justificativa?:   string;
  },
  token: string,
): Promise<{ ok: true }> {
  switch (tipo) {
    case 'hora_extra':
      return squadra.gestao.aprovarHorasExtras(
        0, input.id, input.acao,
        input.tipoAprovacao ?? 'B',
        input.observacaoGestor ?? '',
        input.projeto ?? 0,
        token,
      );
    case 'apropriacao':
      return squadra.gestao.avaliarApropriacao(
        input.idFalta ?? 0, input.id, input.acao, token,
      );
    case 'ferias':
      return squadra.gestao.avaliarFerias(
        input.id, input.acao, input.observacaoGestor ?? '', token,
      );
    case 'abono':
      return squadra.gestao.avaliarAbono(
        input.id, input.acao, input.justificativa ?? '', token,
      );
  }
}

export async function alocarColaborador(
  input: {
    gestorId:      number;
    colaboradorId: number;
    projetoId:     number;
    subProjetoId:  number;
    papelId:       number;
    dataInicio:    string;
    dataFim:       string;
  },
  token: string,
): Promise<{ ok: true }> {
  const payload: AlocarPayload = {
    ...input,
    dataInicio: toUpstreamDate(input.dataInicio),
    dataFim:    toUpstreamDate(input.dataFim),
  };
  return squadra.gestao.alocar(payload, token);
}

export async function getServicos(gestorId: number, token: string): Promise<ServicoGestor[]> {
  return squadra.gestao.getServicos(gestorId, token);
}

export async function getPapeis(token: string): Promise<Papel[]> {
  return squadra.gestao.getPapeis(token);
}

// ── Cache server-side (in-memory, compartilhado entre usuários do processo) ────
// As listagens pessoasRelatorio (~25s/585KB) e relatorioProjetos são GLOBAIS e
// mudam pouco → cacheamos por alguns minutos. Invalidado ao alterar um gestor.
const CACHE_TTL_MS = 10 * 60 * 1000;
type CacheEntry<T> = { at: number; data: T };
const _cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = _cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  const data = await fn();
  _cache.set(key, { at: Date.now(), data });
  return data;
}

export function invalidateGestaoCache(...keys: string[]): void {
  if (keys.length === 0) { _cache.clear(); return; }
  for (const k of keys) _cache.delete(k);
}

const KEY_PESSOAS  = 'pessoas-relatorio';
const KEY_PROJETOS = 'relatorio-projetos';

// Listagens "ver todos" leem de PRODUÇÃO (dados reais). As mutações e as buscas do
// form também estão em PROD desde o deploy do alterar-gestor.
function getPessoasRelatorio(token: string): Promise<ColaboradorComGestor[]> {
  return cached(KEY_PESSOAS, () => squadra.pessoas.relatorio(token));
}

// Buscas do formulário (autocomplete) — em PROD, mesmo ambiente da mutação
// (os IDs selecionados precisam ser válidos onde o alterar-gestor é aplicado).
export async function buscarPessoas(nome: string, token: string): Promise<PessoaData[]> {
  return squadra.pessoas.buscar({ nome }, token);
}

export async function buscarProjetos(q: string, token: string): Promise<ProjetoBuscaItem[]> {
  return squadra.percentual.buscarProjetos(q, token);
}

// ── Alterar gestor (PROD) ─────────────────────────────────────────────────────
export async function alteraGestorColaborador(coordId: number, recId: number, token: string): Promise<{ ok: true }> {
  const res = await squadra.gestao.alteraGestorColaborador(coordId, recId, token);
  invalidateGestaoCache(KEY_PESSOAS);   // o gestor do colaborador mudou
  return res;
}

export async function alteraGestorProjeto(coordId: number, prjId: number, token: string): Promise<{ ok: true }> {
  const res = await squadra.gestao.alteraGestorProjeto(coordId, prjId, token);
  invalidateGestaoCache(KEY_PROJETOS);  // o gestor do projeto mudou
  return res;
}

// ── Listagens "ver todos" com gestor atual (cacheadas) ────────────────────────
export async function listarColaboradoresComGestor(token: string): Promise<ColaboradorComGestor[]> {
  const list = await getPessoasRelatorio(token);
  return [...list].sort((a, b) => a.nome.localeCompare(b.nome));
}

export type ProjetoComGestorView = {
  id:       number;
  nome:     string;
  cliente:  string;
  situacao: string;
  cpf:      string;   // cpfGerente cru
  gestor:   string;   // nome do gestor (vindo do relatório)
};

export async function listarProjetosComGestor(token: string): Promise<ProjetoComGestorView[]> {
  const projetos = await cached(KEY_PROJETOS, () => squadra.gestao.relatorioProjetos(token));
  return projetos
    .map((pr): ProjetoComGestorView => ({
      id:       pr.id,
      nome:     pr.nome,
      cliente:  pr.cliente,
      situacao: pr.situacao,
      cpf:      pr.cpfGerente,
      gestor:   pr.nomeGerente,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}
