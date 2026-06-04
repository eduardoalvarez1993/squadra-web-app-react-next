import { z } from 'zod';
import { SQUADRA_API_URL } from '@/lib/config';

const TIMEOUT_MS = Number(process.env.SQUADRA_API_TIMEOUT_MS ?? 15_000);

// Homologação. As chamadas alteraGestor* só existem aqui; as abas Gestão Funcional/
// Gestão de Projeto também LEEM daqui (feature 100% em HML enquanto não vai pra prod).
export const HML_API_URL = 'https://api-hml.squadra.com.br/api';

// ─── Error types ────────────────────────────────────────────────────────────

export class SquadraAuthError extends Error {
  constructor(message = 'Sessão expirada') {
    super(message);
    this.name = 'SquadraAuthError';
  }
}

export class SquadraClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SquadraClientError';
  }
}

export class SquadraServerError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SquadraServerError';
  }
}

export class SquadraTimeoutError extends Error {
  constructor() {
    super('Request timeout');
    this.name = 'SquadraTimeoutError';
  }
}

// ─── Core HTTP client ───────────────────────────────────────────────────────

async function sq<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body: unknown,
  token: string,
  schema: z.ZodType<T>,
  retry = true,
  contentType = 'application/json',
  baseUrl = SQUADRA_API_URL,
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const execute = async (): Promise<T> => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': contentType,
        'Accept':       'application/json',
        'User-Agent':   'okhttp/4.9.2',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (res.status === 401) throw new SquadraAuthError();

    if (res.status >= 400 && res.status < 500) {
      const msg = await res.text().catch(() => '');
      throw new SquadraClientError(res.status, msg);
    }

    if (res.status >= 500) {
      const msg = await res.text().catch(() => '');
      throw new SquadraServerError(res.status, msg);
    }

    const json = await res.json();
    return schema.parse(json);
  };

  try {
    return await execute();
  } catch (err) {
    if (err instanceof SquadraServerError && retry) {
      return sq(method, path, body, token, schema, false, contentType, baseUrl, timeoutMs);
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SquadraTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Common helpers ──────────────────────────────────────────────────────────

const OkSchema = z.unknown().transform(() => ({ ok: true as const }));

function normalizeFoto(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  if (raw.startsWith('data:') || raw.startsWith('http')) return raw;
  return `data:image/jpeg;base64,${raw}`;
}

function extractRetornoList(raw: unknown): unknown[] {
  const d = raw as Record<string, unknown>;
  const ret = d['retorno'] ?? raw;
  if (ret && typeof ret === 'object' && !Array.isArray(ret)) {
    const inner = (ret as Record<string, unknown>)['retorno'];
    if (Array.isArray(inner)) return inner;
  }
  return Array.isArray(ret) ? ret : [];
}

// ─── Auth schemas ────────────────────────────────────────────────────────────

const LoginUpstreamSchema = z.unknown().transform((raw) => {
  const d = raw as Record<string, unknown>;
  const perfil = d['perfil'] as Record<string, unknown> | undefined;
  return {
    token: String(d['accessToken'] ?? d['token'] ?? ''),
    id:    Number(d['idUsuario']   ?? d['id']    ?? 0),
    login: String(d['login']       ?? d['nomeColaborador'] ?? ''),
    cargo: String(d['cargo']       ?? perfil?.['nome']     ?? ''),
    nome:  String(d['nome']        ?? ''),
  };
});

const UsuariosUpstreamSchema = z.unknown().transform((raw) => {
  const d = raw as Record<string, unknown>;
  const retorno = (d['retorno'] ?? []) as Record<string, unknown>[];
  const first   = retorno[0] ?? {};
  return { sqhorasId: Number(first['usuarioIdSQHoras'] ?? 0) };
});

const PessoaUpstreamSchema = z.unknown().transform((raw) => {
  const d = raw as Record<string, unknown>;
  const r = (d['retorno'] as Record<string, unknown>) ?? d;
  return {
    pessoaId: Number(r['id'] ?? 0),
    nome:     String(r['nomeSocial'] ?? r['nome'] ?? '').trim(),
    foto:     normalizeFoto(r['foto'] ?? r['fotoPerfil'] ?? null),
    bateRep:  Boolean(r['bateRep'] ?? false),
  };
});

// A API Squadra retorna as permissões dentro de { retorno: { ... } }
const PermissoesUpstreamSchema = z.unknown().transform((raw) => {
  const d = raw as Record<string, unknown>;
  const r = (d['retorno'] as Record<string, unknown>) ?? d;
  return {
    perfilDP:          Boolean(r['perfilDP']          ?? false),
    gerenteFuncional:  Boolean(r['gerenteFuncional']  ?? false),
    bateRep:           Boolean(r['bateRep']           ?? false),
    perfilCoordenador: Boolean(r['perfilCoordenador'] ?? false),
    perfilTI:          Boolean(r['perfilTI']          ?? false),
    perfilMarketing:   Boolean(r['perfilMarketing']   ?? false),
  };
});

export type LoginUpstream  = z.infer<typeof LoginUpstreamSchema>;
export type PermissoesData = z.infer<typeof PermissoesUpstreamSchema>;

// ─── Home schemas ────────────────────────────────────────────────────────────

export type ColaboradorResumo = {
  id:    number;
  nome:  string;
  foto:  string | null;
  cargo: string;
  login: string;
};

const ColaboradorResumoItemSchema = z.unknown().transform((raw): ColaboradorResumo => {
  const d = raw as Record<string, unknown>;
  return {
    id:    Number(d['id'] ?? d['idUsuario'] ?? d['idPessoa'] ?? 0),
    nome:  String(d['nome'] ?? d['nomeColaborador'] ?? d['nomeSocial'] ?? ''),
    foto:  normalizeFoto(d['foto'] ?? d['fotoColaborador'] ?? d['fotoPerfil'] ?? null),
    cargo: String(d['cargo'] ?? ''),
    login: String(d['login'] ?? ''),
  };
});

const ColabListSchema = z.unknown().transform((raw): ColaboradorResumo[] =>
  extractRetornoList(raw).map((item) => ColaboradorResumoItemSchema.parse(item))
);

export type SaldoHoras = { saldoHoras: number };

const SaldoProprioSchema = z.unknown().transform((raw): SaldoHoras => {
  const d = raw as Record<string, unknown>;
  const ret = (d['retorno'] as Record<string, unknown>) ?? d;
  return { saldoHoras: parseFloat(String(ret['saldoHoras'] ?? ret['saldo'] ?? '0')) || 0 };
});

export type SaldoGlobalItem = {
  colaborador:      string;
  saldoHoras:       number;
  email:            string;
  saldoFechamento:  number;
  cpf:              string;
  ultimoFechamento: string;
  diasPendentes:    string[];
  alocacoes:        unknown[];
};

const SaldoGlobalItemSchema = z.unknown().transform((raw): SaldoGlobalItem => {
  const d = raw as Record<string, unknown>;
  return {
    colaborador:     String(d['colaborador'] ?? ''),
    saldoHoras:      Number(d['saldoHoras'] ?? 0),
    email:           String(d['email'] ?? ''),
    saldoFechamento: Number(d['saldoFechamento'] ?? 0),
    cpf:             String(d['cpf'] ?? ''),
    ultimoFechamento: String(d['ultimoFechamento'] ?? ''),
    diasPendentes:   (Array.isArray(d['diasPendentes']) ? d['diasPendentes'] : []) as string[],
    alocacoes:       (Array.isArray(d['alocacoes']) ? d['alocacoes'] : []),
  };
});

const SaldoGlobalSchema = z.unknown().transform((raw): SaldoGlobalItem[] => {
  const list = Array.isArray(raw) ? raw : extractRetornoList(raw);
  return list.map((item) => SaldoGlobalItemSchema.parse(item));
});

// ─── Holerite schemas ────────────────────────────────────────────────────────

export type ItemContracheque = {
  codEvento:        string;
  referencia:       string;
  valor:            number;
  descricao:        string;
  provDescBase:     string;
  tipoContraCheque: string;
};

export type Contracheque = {
  mesCompetencia:    number;
  anoCompetencia:    number;
  nome:              string;
  funcao:            string;
  salarioBase:       number;
  itensContracheque: ItemContracheque[];
};

const ContrachequeItemSchema = z.unknown().transform((raw): ItemContracheque => {
  const d = raw as Record<string, unknown>;
  return {
    codEvento:        String(d['codEvento'] ?? ''),
    referencia:       String(d['referencia'] ?? ''),
    valor:            Number(d['valor'] ?? 0),
    descricao:        String(d['descricao'] ?? ''),
    provDescBase:     String(d['provDescBase'] ?? ''),
    tipoContraCheque: String(d['tipoContraCheque'] ?? ''),
  };
});

const ContrachequeSchema = z.unknown().transform((raw): Contracheque => {
  const d = raw as Record<string, unknown>;
  const itens = Array.isArray(d['itensContracheque']) ? d['itensContracheque'] : [];
  return {
    mesCompetencia:    Number(d['mesCompetencia'] ?? 0),
    anoCompetencia:    Number(d['anoCompetencia'] ?? 0),
    nome:              String(d['nome'] ?? ''),
    funcao:            String(d['funcao'] ?? ''),
    salarioBase:       Number(d['salarioBase'] ?? 0),
    itensContracheque: itens.map((i) => ContrachequeItemSchema.parse(i)),
  };
});

export type HoleriteAno = { contracheques: Contracheque[] };

const HoleriteAnoSchema = z.unknown().transform((raw): HoleriteAno => {
  const d = raw as Record<string, unknown>;
  const retorno = (d['retorno'] as Record<string, unknown>) ?? {};
  const list = Array.isArray(retorno['contracheque']) ? retorno['contracheque'] : [];
  return { contracheques: list.map((c) => ContrachequeSchema.parse(c)) };
});

export type HistoricoSalarialItem = { dataMudanca: string; mudanca: string };

const HistoricoSalarialSchema = z.unknown().transform((raw): HistoricoSalarialItem[] =>
  extractRetornoList(raw).map((item) => {
    const d = item as Record<string, unknown>;
    return {
      dataMudanca: String(d['dataMudanca'] ?? d['data'] ?? ''),
      mudanca:     String(d['mudanca']     ?? d['descricao'] ?? ''),
    };
  })
);

// ─── Ferias schemas ──────────────────────────────────────────────────────────

export type FeriasDados = {
  saldoFeriasColaborador:             number;
  inicioPeriodoDeGozoColaborador:     string | null;
  terminoPeriodoDeGozoColaborador:    string | null;
  dataLimiteFerias:                   string | null;
  inicioFeriasPlanejadaColaborador:   string | null;
  terminoFeriasPlanejadaColaborador:  string | null;
};

const FeriasDadosSchema = z.unknown().transform((raw): FeriasDados => {
  const d = raw as Record<string, unknown>;
  const ret = (d['retorno'] as Record<string, unknown>) ?? d;
  return {
    saldoFeriasColaborador:            parseFloat(String(ret['saldoFeriasColaborador'] ?? '0')) || 0,
    inicioPeriodoDeGozoColaborador:    (ret['inicioPeriodoDeGozoColaborador'] as string | null) ?? null,
    terminoPeriodoDeGozoColaborador:   (ret['terminoPeriodoDeGozoColaborador'] as string | null) ?? null,
    dataLimiteFerias:                  (ret['dataLimiteFerias'] as string | null) ?? null,
    inicioFeriasPlanejadaColaborador:  (ret['inicioFeriasPlanejadaColaborador'] as string | null) ?? null,
    terminoFeriasPlanejadaColaborador: (ret['terminoFeriasPlanejadaColaborador'] as string | null) ?? null,
  };
});

export type FeriasHistoricoItem = {
  dataFeriasInicio:            string;
  dataFeriasFinal:             string;
  dataInicioPeriodoAquisitivo: string;
  dataFimPeriodoAquisitivo:    string;
  status:                      string;
};

const FeriasHistoricoItemSchema = z.unknown().transform((raw): FeriasHistoricoItem => {
  const d = raw as Record<string, unknown>;
  return {
    dataFeriasInicio:            String(d['dataFeriasInicio']            ?? ''),
    dataFeriasFinal:             String(d['dataFeriasFinal']             ?? ''),
    dataInicioPeriodoAquisitivo: String(d['dataInicioPeriodoAquisitivo'] ?? ''),
    dataFimPeriodoAquisitivo:    String(d['dataFimPeriodoAquisitivo']    ?? ''),
    status:                      String(d['status']                      ?? ''),
  };
});

const HistoricoFeriasSchema = z.unknown().transform((raw): FeriasHistoricoItem[] => {
  const d = raw as Record<string, unknown>;
  const outer = (d['retorno'] as Record<string, unknown>) ?? {};
  const list  = Array.isArray(outer['retorno']) ? outer['retorno'] : extractRetornoList(raw);
  return list.map((item) => FeriasHistoricoItemSchema.parse(item));
});

export type FeriasSolicitarInput = {
  idColaborador: number;
  dataInicio:    string;
  dataFim:       string;
};

// ─── Perfil schemas ──────────────────────────────────────────────────────────

export type PerfilData = {
  id:         number;
  nome:       string;
  nomeSocial: string;
  foto:       string | null;
  celular:    string;
  cargo:      string;
  email:      string;
  [key: string]: unknown;
};

// Remove campos sensíveis antes de repassar o objeto bruto ao cliente.
// Os schemas de pessoa/perfil fazem spread do retorno cru (a UI usa muitos campos
// não-tipados); este omit evita vazar dados como CPF para qualquer colaborador.
const CAMPOS_SENSIVEIS = ['cpf', 'cpfColaborador', 'senha', 'password', 'token', 'accessToken'];
export function semSensiveis(obj: Record<string, unknown>): Record<string, unknown> {
  const r = { ...obj };
  for (const k of CAMPOS_SENSIVEIS) delete r[k];
  return r;
}

const PerfilSchema = z.unknown().transform((raw): PerfilData => {
  const d = raw as Record<string, unknown>;
  const ret = ((d['retorno'] as Record<string, unknown>) ?? d) as Record<string, unknown>;
  return {
    ...semSensiveis(ret),
    id:         Number(ret['id'] ?? 0),
    nome:       String(ret['nome'] ?? ''),
    nomeSocial: String(ret['nomeSocial'] ?? ret['nome'] ?? ''),
    foto:       normalizeFoto(ret['foto'] ?? ret['fotoPerfil'] ?? null),
    celular:    String(ret['celular'] ?? ''),
    cargo:      String(ret['cargo'] ?? ''),
    email:      String(ret['email'] ?? ''),
  };
});

// ─── Pessoas schemas ─────────────────────────────────────────────────────────

export type PessoaData = {
  id:         number;
  usuarioId:  number;   // id do USUÁRIO (≠ id de pessoa) — usado como coordId em alteraGestor*
  nome:       string;
  nomeSocial: string;
  foto:       string | null;
  cargo:      string;
  email:      string;
  celular:    string;
  login:      string;
};

const PessoaItemSchema = z.unknown().transform((raw): PessoaData => {
  const d = raw as Record<string, unknown>;
  return {
    ...semSensiveis(d),
    id:         Number(d['id'] ?? d['idPessoa'] ?? 0),
    usuarioId:  Number(d['usuarioId'] ?? d['usuarioIdSQHoras'] ?? 0),
    nome:       String(d['nome'] ?? ''),
    nomeSocial: String(d['nomeSocial'] ?? d['nome'] ?? ''),
    foto:       normalizeFoto(d['foto'] ?? d['fotoPerfil'] ?? d['fotoColaborador'] ?? null),
    cargo:      String(d['cargo'] ?? ''),
    email:      String(d['email'] ?? ''),
    celular:    String(d['celular'] ?? ''),
    login:      String(d['login'] ?? d['loginUsuario'] ?? d['usuario'] ?? ''),
  };
});

// ─── Listagens com gestor atual (relatórios) ─────────────────────────────────

export type ColaboradorComGestor = {
  id:           number;
  nome:         string;
  login:        string;
  cargo:        string;
  cpf:          string;
  gerente:      string;
  emailGerente: string;
};

const ColaboradorComGestorSchema = z.unknown().transform((raw): ColaboradorComGestor => {
  const d = raw as Record<string, unknown>;
  return {
    id:           Number(d['id'] ?? 0),
    nome:         String(d['nome'] ?? ''),
    login:        String(d['login'] ?? ''),
    cargo:        String(d['cargo'] ?? ''),
    cpf:          String(d['cpf'] ?? ''),
    gerente:      String(d['gerente'] ?? ''),
    emailGerente: String(d['emailGerente'] ?? ''),
  };
});

const ColaboradorComGestorListSchema = z.unknown().transform((raw): ColaboradorComGestor[] =>
  extractRetornoList(raw).map((x) => ColaboradorComGestorSchema.parse(x))
);

export type ProjetoComGestor = {
  id:         number;
  nome:       string;
  cliente:    string;
  situacao:   string;
  cpfGerente: string;
};

const ProjetoComGestorSchema = z.unknown().transform((raw): ProjetoComGestor => {
  const d = raw as Record<string, unknown>;
  return {
    id:         Number(d['projetoID'] ?? d['projetoId'] ?? d['id'] ?? 0),
    nome:       String(d['projetoNome'] ?? d['nome'] ?? ''),
    cliente:    String(d['nomeCliente'] ?? d['cliente'] ?? ''),
    situacao:   String(d['situacao'] ?? ''),
    cpfGerente: String(d['cpfGerente'] ?? ''),
  };
});

const ProjetoComGestorListSchema = z.unknown().transform((raw): ProjetoComGestor[] =>
  extractRetornoList(raw).map((x) => ProjetoComGestorSchema.parse(x))
);

const PessoaSchema = z.unknown().transform((raw): PessoaData => {
  const d = raw as Record<string, unknown>;
  const ret = ((d['retorno'] as Record<string, unknown>) ?? d) as Record<string, unknown>;
  return PessoaItemSchema.parse(ret);
});

const PessoaListSchema = z.unknown().transform((raw): PessoaData[] =>
  extractRetornoList(raw).map((item) => PessoaItemSchema.parse(item))
);

export type BuscarPessoasBody = {
  nome:           string;
  ativo?:         boolean;
  pagina?:        number;
  tamanhoPagina?: number;
};

// ─── RH schemas ──────────────────────────────────────────────────────────────

export type AbonoRH = {
  idUnico:         string | number;
  nomeColaborador: string;
  foto:            string | null;
  motivo:          string;
  tipo:            string;
  data:            string;
  horas:           string;   // "HH:MM" (a API retorna string, ex.: "00:50")
  status:          string;   // normalizado para 'P' | 'A' | 'R' | 'C'
  temAnexo:        boolean;
};

const AbonoRHItemSchema = z.unknown().transform((raw): AbonoRH => {
  const d = raw as Record<string, unknown>;
  // status vem como "PENDENTE"/"APROVADO"/"RECUSADO" — normaliza para P/A/R/C
  const s = String(d['status'] ?? '').toUpperCase();
  const status = (s === 'A' || s.includes('APROV'))                     ? 'A'
               : (s === 'R' || s.includes('RECUS') || s.includes('REPROV')) ? 'R'
               : (s === 'C' || s.includes('CANCEL'))                    ? 'C'
               : 'P';
  // anexo é o caminho do arquivo no servidor (vazio = sem anexo); o conteúdo
  // base64 vem de /v1/abono/downloadAnexo/{id}
  const anexo = String(d['anexo'] ?? '').trim();
  return {
    idUnico:         (d['id'] ?? d['idUnico'] ?? 0) as string | number,
    nomeColaborador: String(d['nome'] ?? d['nomeColaborador'] ?? d['colaborador'] ?? ''),
    foto:            normalizeFoto(d['foto'] ?? d['fotoColaborador'] ?? null),
    motivo:          String(d['motivo'] ?? d['justificativa'] ?? ''),
    tipo:            String(d['descricao'] ?? d['tipo'] ?? ''),
    data:            String(d['dataInicio'] ?? d['data'] ?? d['periodo'] ?? ''),
    horas:           String(d['horas'] ?? ''),
    status,
    temAnexo:        anexo.length > 0 || !!d['arquivo'],
  };
});

const AbonoListSchema = z.unknown().transform((raw): AbonoRH[] =>
  extractRetornoList(raw).map((item) => AbonoRHItemSchema.parse(item))
);

export type FeriasRHItem = {
  idFerias:        number;
  nomeColaborador: string;
  foto:            string | null;
  dataInicio:      string;
  dataFim:         string;
  status:          string;
};

const FeriasRHItemSchema = z.unknown().transform((raw): FeriasRHItem => {
  const d = raw as Record<string, unknown>;
  return {
    idFerias:        Number(d['solicitacaoID'] ?? d['idSolicitacao'] ?? d['idFerias'] ?? d['id'] ?? 0),
    nomeColaborador: String(d['nomeColaborador'] ?? d['colaborador'] ?? d['nome'] ?? ''),
    foto:            normalizeFoto(d['foto'] ?? null),
    dataInicio:      String(d['dataInicioSolicitacao'] ?? d['dataInicio'] ?? d['dataFeriasInicio'] ?? ''),
    dataFim:         String(d['dataFimSolicitacao'] ?? d['dataFim'] ?? d['dataFeriasFinal'] ?? ''),
    status:          String(d['status'] ?? 'P'),
  };
});

const FeriasRHListSchema = z.unknown().transform((raw): FeriasRHItem[] =>
  extractRetornoList(raw)
    .map((item) => FeriasRHItemSchema.parse(item))
    .filter((item) => item.idFerias > 0)  // API retorna { idFerias: 0 } como sentinela de "vazio"
);

export type AvaliarAbonoBody  = { idUnico: string | number; acao: 'A' | 'R'; justificativa?: string };
export type AvaliarFeriasBody = { idFerias: number; acao: 'A' | 'R'; observacao?: string };

// ─── Solicitacoes schemas ─────────────────────────────────────────────────────

export type TipoAbono = { id: number; tipoAbono: string };

export type AbonoItem = {
  id:            number;
  dataInicio:    string;
  dataFim:       string;
  descricao:     string;
  status:        string;
  justificativa: string;
  dias:          number;
  motivo:        string;
  horas:         string;
  nome:          string | null;
};

const TipoAbonoItemSchema = z.unknown().transform((raw): TipoAbono => {
  const d = raw as Record<string, unknown>;
  return {
    id:        Number(d['id'] ?? 0),
    tipoAbono: String(d['tipoAbono'] ?? d['tipo'] ?? d['descricao'] ?? ''),
  };
});

const TipoAbonoListSchema = z.unknown().transform((raw): TipoAbono[] => {
  const list = Array.isArray(raw) ? raw : extractRetornoList(raw);
  return list.map((x) => TipoAbonoItemSchema.parse(x));
});

const AbonoItemSchema = z.unknown().transform((raw): AbonoItem => {
  const d = raw as Record<string, unknown>;
  return {
    id:            Number(d['id'] ?? d['idAbono'] ?? d['idSolicitacao'] ?? d['idRegistro'] ?? 0),
    dataInicio:    String(d['dataInicio'] ?? d['data'] ?? ''),
    dataFim:       String(d['dataFim']    ?? d['dataInicio'] ?? d['data'] ?? ''),
    descricao:     String(d['descricao']  ?? d['tipo'] ?? ''),
    status:        String(d['status']     ?? 'PENDENTE'),
    justificativa: String(d['justificativa'] ?? ''),
    dias:          Number(d['dias']       ?? 0),
    motivo:        String(d['motivo']     ?? ''),
    horas:         String(d['horas']      ?? '00:00'),
    nome:          d['nome'] != null ? String(d['nome']) : null,
  };
});

const AbonoItemListSchema = z.unknown().transform((raw): AbonoItem[] => {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((x) => AbonoItemSchema.parse(x));
});

// ─── Feed schemas ─────────────────────────────────────────────────────────────

export type Post = {
  idPost:           number;
  remetenteID:      number;
  remetenteNome:    string;
  remetenteFoto:    string | null;
  destinatarioNome: string | null;
  mensagem:         string | null;
  titulo:           string | null;
  categoria:        string | null;
  tipoPublicacao:   string;
  dataPostagem:     string;
  numComentarios:   number;
  curtidas:         number[];
  aplausos:         number;
};

export type Comentario = {
  id:             number;
  descComentario: string;
  idAutor:        number;
  nomeAutor:      string;
  fotoAutor:      string | null;
};

export type Comunicado = {
  assunto:         string;
  remetente:       string;
  dataRecebimento: string;
  corpo:           string;
};

const PostItemSchema = z.unknown().transform((raw): Post => {
  const d = raw as Record<string, unknown>;
  const curtidas = Array.isArray(d['curtidas']) ? (d['curtidas'] as number[]) : [];
  return {
    idPost:           Number(d['idPost']           ?? d['id']    ?? 0),
    remetenteID:      Number(d['remetenteID']      ?? 0),
    remetenteNome:    String(d['remetenteNome']    ?? ''),
    remetenteFoto:    ((d['remetenteFoto'] ?? null) as string | null) || null,
    destinatarioNome: d['destinatarioNome'] != null ? String(d['destinatarioNome']) : null,
    mensagem:         d['mensagem'] != null ? String(d['mensagem']) : null,
    titulo:           d['titulo']   != null ? String(d['titulo'])   : null,
    categoria:        d['categoria']!= null ? String(d['categoria'])  : null,
    tipoPublicacao:   String(d['tipoPublicacao'] ?? 'C'),
    dataPostagem:     String(d['dataPostagem']   ?? ''),
    numComentarios:   Number(d['numComentarios'] ?? 0),
    curtidas,
    aplausos:         Number(d['aplausos'] ?? curtidas.length),
  };
});

const PostListSchema = z.unknown().transform((raw): Post[] =>
  extractRetornoList(raw).map((x) => PostItemSchema.parse(x))
);

const ComentarioItemSchema = z.unknown().transform((raw): Comentario => {
  const d = raw as Record<string, unknown>;
  return {
    id:             Number(d['id'] ?? 0),
    descComentario: String(d['descComentario'] ?? d['comentario'] ?? ''),
    idAutor:        Number(d['idAutor']  ?? 0),
    nomeAutor:      String(d['nomeAutor'] ?? ''),
    fotoAutor:      normalizeFoto(d['fotoAutor'] ?? null),
  };
});

const ComentarioListSchema = z.unknown().transform((raw): Comentario[] =>
  extractRetornoList(raw).map((x) => ComentarioItemSchema.parse(x))
);

const ComunicadoItemSchema = z.unknown().transform((raw): Comunicado => {
  const d = raw as Record<string, unknown>;
  return {
    assunto:         String(d['assunto']         ?? d['titulo'] ?? ''),
    remetente:       String(d['remetente']        ?? ''),
    dataRecebimento: String(d['dataRecebimento']  ?? d['data'] ?? ''),
    corpo:           String(d['corpo']            ?? d['mensagem'] ?? ''),
  };
});

const ComunicadoListSchema = z.unknown().transform((raw): Comunicado[] =>
  extractRetornoList(raw).map((x) => ComunicadoItemSchema.parse(x))
);

// ─── Percentual schemas ───────────────────────────────────────────────────────

export type PercentualItem = {
  id:               string | number;
  clienteNome:      string | null;
  projetoNome:      string;
  subProjetoNome:   string | null;
  horasRegistradas: number;
  percentual:       number | null;
};

export type PercentualData = {
  itens:            PercentualItem[];
  horasPrevistas:   number;
  horasRegistradas: number;
  fechado:          boolean;
  dataFechamento:   string | null;
};

export type ProjetoBuscaItem = { id: string | number; nome: string; cliente?: string };
export type SubprojetoPercentual = { id: string | number; nome: string };

const PercentualItemSchema2 = z.unknown().transform((raw): PercentualItem => {
  const d = raw as Record<string, unknown>;
  return {
    id:               (d['id'] ?? 0) as string | number,
    clienteNome:      d['clienteNome'] != null ? String(d['clienteNome']) : null,
    projetoNome:      String(d['projetoNome'] ?? d['nomeProjeto'] ?? d['projeto'] ?? d['servicoDescricao'] ?? ''),
    subProjetoNome:   (() => { const v = d['subProjetoNome'] ?? d['nomeSubProjeto'] ?? d['subProjeto'] ?? d['subProjetoDescricao'] ?? null; return v != null ? String(v) : null; })(),
    horasRegistradas: Number(d['horasRegistradas'] ?? d['horas'] ?? d['totalHoras'] ?? 0),
    percentual:       d['percentual'] != null ? Number(d['percentual']) : null,
  };
});

const PercentualDataSchema2 = z.unknown().transform((raw): PercentualData => {
  const d = raw as Record<string, unknown>;
  const retorno = (d['retorno'] as Record<string, unknown>) ?? d;
  const itensList: unknown[] = Array.isArray(retorno['itens'])
    ? retorno['itens']
    : Array.isArray(retorno['horasPercentuais'])
    ? retorno['horasPercentuais']
    : Array.isArray(retorno['retorno'])
    ? retorno['retorno']
    : Array.isArray(d['itens'])
    ? d['itens'] as unknown[]
    : [];
  return {
    itens:            itensList.map((x) => PercentualItemSchema2.parse(x)),
    horasPrevistas:   Number(retorno['horasPrevistas'] ?? retorno['horasContratadas'] ?? d['horasPrevistas'] ?? 0),
    horasRegistradas: Number(retorno['horasRegistradas'] ?? retorno['horasAlocadas'] ?? d['horasRegistradas'] ?? 0),
    fechado:          Boolean(retorno['fechado'] ?? retorno['mesFechado'] ?? d['fechado'] ?? false),
    dataFechamento:   ((retorno['dataFechamento'] ?? retorno['dataFechado'] ?? d['dataFechamento'] ?? null) as string | null) || null,
  };
});

const ProjetoBuscaItemSchema2 = z.unknown().transform((raw): ProjetoBuscaItem => {
  const d = raw as Record<string, unknown>;
  // /v2/projetos/pornomev2 retorna projetoID (ID maiúsculo) e NomeCliente.
  const cliente = d['cliente'] ?? d['NomeCliente'] ?? d['nomeCliente'];
  return {
    id:      (d['id'] ?? d['projetoId'] ?? d['projetoID'] ?? 0) as string | number,
    nome:    String(d['nome'] ?? d['nomeProjeto'] ?? d['projetoNome'] ?? ''),
    cliente: cliente != null ? String(cliente) : undefined,
  };
});

const ProjetosBuscaListSchema = z.unknown().transform((raw): ProjetoBuscaItem[] =>
  extractRetornoList(raw).map((x) => ProjetoBuscaItemSchema2.parse(x))
);

const SubprojetoItemSchema2 = z.unknown().transform((raw): SubprojetoPercentual => {
  const d = raw as Record<string, unknown>;
  return {
    id:   (d['id'] ?? d['subProjetoId'] ?? 0) as string | number,
    nome: String(d['nome'] ?? d['subProjetoNome'] ?? ''),
  };
});

const SubprojetosListSchema = z.unknown().transform((raw): SubprojetoPercentual[] => {
  const d = raw as Record<string, unknown>;
  if (d['sucesso'] === false) return [];
  return extractRetornoList(raw).map((x) => SubprojetoItemSchema2.parse(x));
});

// ─── Gestão schemas ──────────────────────────────────────────────────────────

export type MembroEquipe = {
  nome:          string;
  saldoHoras:    string;
  saldoFerias:   string;
  feriasInicio:  string;
  feriasFim:     string;
  ultimoProjeto: string;
  foto:          string | null;
  login?:        string;
  id?:           number;
};

export type HoraExtraItem = {
  solicitacaoID:     number;
  nomeColaborador:   string;
  foto:              string | null;
  dataSolicitacao:   string;
  qtdadeHoras:       number;
  projetoId:         number;
  projetoDescricao:  string;
  solicitacaoTipo:   string;
  statusSolicitacao: number;
  isNoturno:         boolean | null;
};

export type ApropriacaoItem = {
  id:              number;
  idFalta:         number;
  nomeColaborador: string;
  foto:            string | null;
  data:            string;
  status:          string;
};

export type AbonoEquipeItem = {
  idUnico:         string | number;
  nomeColaborador: string;
  foto:            string | null;
  tipo:            string;
  data:            string;
  horas:           number;
  status:          string;
  motivo:          string;
};

export type ServicoGestor = {
  id:          string | number;
  nome:        string;
  cliente:     string;
  subprojetos: Array<{ id: string | number; nome: string }>;
};

export type Papel = { id: number; nomePapel: string };

export type AlocarPayload = {
  colaboradorId: number;
  projetoId:     number;
  subProjetoId:  number;
  papelId:       number;
  dataInicio:    string;
  dataFim:       string;
  gestorId:      number;
};

const MembroEquipeItemSchema = z.unknown().transform((raw): MembroEquipe => {
  const d = raw as Record<string, unknown>;
  return {
    nome:          String(d['nome'] ?? d['nomeColaborador'] ?? ''),
    saldoHoras:    String(d['saldoHoras'] ?? '0'),
    saldoFerias:   String(d['saldoFerias'] ?? '0'),
    feriasInicio:  String(d['feriasInicio'] ?? d['dataFeriasInicio'] ?? ''),
    feriasFim:     String(d['feriasFim']    ?? d['dataFeriasFinal'] ?? ''),
    ultimoProjeto: String(d['ultimoProjeto'] ?? d['projeto'] ?? ''),
    foto:          normalizeFoto(d['foto'] ?? d['fotoColaborador'] ?? null),
    login:         d['login'] ? String(d['login']) : undefined,
    id:            d['id']   ? Number(d['id'])    : undefined,
  };
});

const EquipeSchema = z.unknown().transform((raw): MembroEquipe[] => {
  const list = extractRetornoList(raw);
  return list.map((x) => MembroEquipeItemSchema.parse(x));
});

const HoraExtraItemSchema = z.unknown().transform((raw): HoraExtraItem => {
  const d = raw as Record<string, unknown>;
  return {
    solicitacaoID:     Number(d['solicitacaoID'] ?? d['id'] ?? 0),
    nomeColaborador:   String(d['nomeColaborador'] ?? d['colaborador'] ?? ''),
    foto:              normalizeFoto(d['foto'] ?? d['fotoColaborador'] ?? null),
    dataSolicitacao:   String(d['dataSolicitacao'] ?? d['data'] ?? ''),
    qtdadeHoras:       Number(d['qtdadeHoras'] ?? d['horas'] ?? 0),
    projetoId:         Number(d['projetoId'] ?? 0),
    projetoDescricao:  String(d['projetoDescricao'] ?? d['projeto'] ?? ''),
    solicitacaoTipo:   String(d['solicitacaoTipo'] ?? ''),
    statusSolicitacao: Number(d['statusSolicitacao'] ?? 0),
    isNoturno:         d['isNoturno'] == null ? null : Boolean(d['isNoturno']),
  };
});

const HoraExtraListSchema = z.unknown().transform((raw): HoraExtraItem[] =>
  extractRetornoList(raw).map((x) => HoraExtraItemSchema.parse(x))
);

const ApropriacaoItemSchema = z.unknown().transform((raw): ApropriacaoItem => {
  const d = raw as Record<string, unknown>;
  return {
    id:              Number(d['idSolicitacaoLiberacaoFalta'] ?? d['id'] ?? 0),
    idFalta:         Number(d['idFalta'] ?? 0),
    nomeColaborador: String(d['nomeColaborador'] ?? d['colaborador'] ?? ''),
    foto:            normalizeFoto(d['foto'] ?? d['fotoColaborador'] ?? null),
    data:            String(d['data'] ?? d['dataFalta'] ?? ''),
    status:          String(d['status'] ?? ''),
  };
});

const ApropriacaoListSchema = z.unknown().transform((raw): ApropriacaoItem[] => {
  const list = Array.isArray(raw) ? raw : extractRetornoList(raw);
  return list.map((x) => ApropriacaoItemSchema.parse(x));
});

const AbonoEquipeItemSchema = z.unknown().transform((raw): AbonoEquipeItem => {
  const d = raw as Record<string, unknown>;
  return {
    idUnico:         (d['idUnico'] ?? d['id'] ?? 0) as string | number,
    nomeColaborador: String(d['nomeColaborador'] ?? d['colaborador'] ?? ''),
    foto:            normalizeFoto(d['foto'] ?? null),
    tipo:            String(d['tipo'] ?? ''),
    data:            String(d['data'] ?? d['periodo'] ?? ''),
    horas:           Number(d['horas'] ?? d['quantidadeHoras'] ?? 0),
    status:          String(d['status'] ?? 'P'),
    motivo:          String(d['motivo'] ?? d['descricao'] ?? ''),
  };
});

const AbonoEquipeListSchema = z.unknown().transform((raw): AbonoEquipeItem[] => {
  const list = Array.isArray(raw) ? raw : extractRetornoList(raw);
  return list.map((x) => AbonoEquipeItemSchema.parse(x));
});

function extractGestaoList(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return extractRetornoList(raw);
  if (raw.length > 0 && typeof raw[0] === 'number') {
    const last = raw[raw.length - 1];
    return Array.isArray(last) ? last : [];
  }
  return raw;
}

const ServicosGestorSchema = z.unknown().transform((raw): ServicoGestor[] => {
  const rows = extractRetornoList(raw);
  const map  = new Map<string | number, ServicoGestor>();
  for (const row of rows) {
    const d  = row as Record<string, unknown>;
    const id = (d['projetoId'] ?? d['projetoID'] ?? d['id'] ?? 0) as string | number;
    const nome = String(d['projetoDescricao'] ?? d['projetoNome'] ?? d['nomeProjeto'] ?? d['nome'] ?? '');
    if (!id || !nome) continue;
    if (!map.has(id)) {
      map.set(id, {
        id,
        nome,
        cliente:     String(d['clienteNome'] ?? d['nomeCliente'] ?? ''),
        subprojetos: [],
      });
    }
    const proj   = map.get(id)!;
    const subId  = (d['subProjetoId'] ?? d['subProjetoID'] ?? d['subprojetoId']) as string | number | undefined;
    const subNome = String(d['subProjetoDescricao'] ?? d['subProjetoNome'] ?? d['subprojetoNome'] ?? '');
    if (subId && !proj.subprojetos.some((s) => s.id == subId)) {
      proj.subprojetos.push({ id: subId, nome: subNome || 'Subprojeto' });
    }
  }
  return Array.from(map.values()).sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
});

const PapelItemSchema = z.unknown().transform((raw): Papel => {
  const d = raw as Record<string, unknown>;
  return {
    id:        Number(d['id'] ?? 0),
    nomePapel: String(d['nomePapel'] ?? d['nome'] ?? ''),
  };
});

const PapeisSchema = z.unknown().transform((raw): Papel[] =>
  extractRetornoList(raw).map((x) => PapelItemSchema.parse(x))
);

// ─── Ponto schemas ───────────────────────────────────────────────────────────

export type ApontamentoDia = {
  horaInicio:      string;
  horaTermino:     string;
  projeto:         string;
  tipoApontamento: string;
};

export type DadosHoraExtra = {
  solicitacaoID:     number;
  dataSolicitacao:   string;
  qtdadeHoras:       number;
  projetoId:         number;
  projetoDescricao:  string;
  solicitacaoTipo:   string;
  statusSolicitacao: number;
  isNoturno:         boolean | null;
};

export type PontoDia = {
  data:                        string;   // DD/MM/YYYY
  diaSemana:                   string;
  fimDeSemana:                 boolean;
  horasRealizadas:             string;   // "08:00"
  horasPrevistas:              string;   // "08:00"
  horasAbono:                  string;
  projeto:                     ApontamentoDia[] | null;
  falta:                       boolean;
  horaExtra:                   string;
  horasFalta:                  string;
  isFalta:                     boolean;
  isAbono:                     boolean;
  isTravadoId:                 number;
  solicitacaoTravadoId:        number;
  solicitacaoTravadoStatus:    string;
  statusAbono:                 string;
  descricaoTipoAbono:          string;
  idUnico:                     number;
  confirmaFalta:               boolean;
  dadosHoraExtra:              DadosHoraExtra[] | null;
  faltaId:                     number;
  solicitacaoLiberacaoFaltaId: number;
  liberacaoGestor:             string;
  statusLiberacaoFalta:        string;
  permissaoLiberacao:          boolean;
};

export type MesPonto = {
  saldo:          string;
  mes:            string;
  dataFechamento: string;
  dados:          PontoDia[];
};

export type DiasSemApontamentoItem = {
  data:            string;   // DD/MM/YYYY
  possuiFalta:     boolean;
  liberacaoGestor: boolean;
};

export type SubProjeto     = { id: number; nome: string };

export type ProjetoAlocado = {
  id:          number;
  nome:        string;
  cliente:     string;
  subProjetos: SubProjeto[];
};

export type NovoApontamentoPayload = {
  dadosGeraisApontamento: { usuarioId: number; login: string };
  apontamentos: Array<{
    projetoId:       number;
    subProjetoId:    number;
    descricao:       string;
    data:            string;  // YYYY-MM-DD
    horaInicio:      string;
    horaFinal:       string;
    tipoApropriacao: 'JORNADA';
  }>;
  justificativas: Array<{ data: string; textoJustificativa: string }>;
  aceites:        Array<{ data: string }>;
};

const ApontamentoDiaItemSchema = z.unknown().transform((raw): ApontamentoDia => {
  const d = raw as Record<string, unknown>;
  return {
    horaInicio:      String(d['horaInicio'] ?? ''),
    horaTermino:     String(d['horaTermino'] ?? ''),
    projeto:         String(d['projeto'] ?? ''),
    tipoApontamento: String(d['tipoApontamento'] ?? ''),
  };
});

const DadosHoraExtraItemSchema = z.unknown().transform((raw): DadosHoraExtra => {
  const d = raw as Record<string, unknown>;
  return {
    solicitacaoID:     Number(d['solicitacaoID'] ?? 0),
    dataSolicitacao:   String(d['dataSolicitacao'] ?? ''),
    qtdadeHoras:       Number(d['qtdadeHoras'] ?? 0),
    projetoId:         Number(d['projetoId'] ?? 0),
    projetoDescricao:  String(d['projetoDescricao'] ?? ''),
    solicitacaoTipo:   String(d['solicitacaoTipo'] ?? ''),
    statusSolicitacao: Number(d['statusSolicitacao'] ?? 0),
    isNoturno:         d['isNoturno'] == null ? null : Boolean(d['isNoturno']),
  };
});

const PontoDiaItemSchema = z.unknown().transform((raw): PontoDia => {
  const d = raw as Record<string, unknown>;
  const projList  = Array.isArray(d['projeto'])       ? d['projeto']       : [];
  const extraList = Array.isArray(d['dadosHoraExtra']) ? d['dadosHoraExtra'] : [];
  return {
    data:                        String(d['data'] ?? ''),
    diaSemana:                   String(d['diaSemana'] ?? ''),
    fimDeSemana:                 Boolean(d['fimDeSemana'] ?? false),
    horasRealizadas:             String(d['horasRealizadas'] ?? '00:00'),
    horasPrevistas:              String(d['horasPrevistas'] ?? '00:00'),
    horasAbono:                  String(d['horasAbono'] ?? '00:00'),
    projeto:                     projList.length ? projList.map((x) => ApontamentoDiaItemSchema.parse(x)) : null,
    falta:                       Boolean(d['falta'] ?? false),
    horaExtra:                   String(d['horaExtra'] ?? '00:00'),
    horasFalta:                  String(d['horasFalta'] ?? '00:00'),
    isFalta:                     Boolean(d['isFalta'] ?? false),
    isAbono:                     Boolean(d['isAbono'] ?? false),
    isTravadoId:                 Number(d['isTravadoId'] ?? 0),
    solicitacaoTravadoId:        Number(d['solicitacaoTravadoId'] ?? 0),
    solicitacaoTravadoStatus:    String(d['solicitacaoTravadoStatus'] ?? ''),
    statusAbono:                 String(d['statusAbono'] ?? ''),
    descricaoTipoAbono:          String(d['descricaoTipoAbono'] ?? ''),
    idUnico:                     Number(d['idUnico'] ?? 0),
    confirmaFalta:               Boolean(d['confirmaFalta'] ?? false),
    dadosHoraExtra:              extraList.length ? extraList.map((x) => DadosHoraExtraItemSchema.parse(x)) : null,
    faltaId:                     Number(d['faltaId'] ?? 0),
    solicitacaoLiberacaoFaltaId: Number(d['solicitacaoLiberacaoFaltaId'] ?? 0),
    liberacaoGestor:             String(d['liberacaoGestor'] ?? ''),
    statusLiberacaoFalta:        String(d['statusLiberacaoFalta'] ?? ''),
    permissaoLiberacao:          Boolean(d['permissaoLiberacao'] ?? false),
  };
});

const MesPontoItemSchema = z.unknown().transform((raw): MesPonto => {
  const d = raw as Record<string, unknown>;
  const dados = Array.isArray(d['dados']) ? d['dados'] : [];
  return {
    saldo:          String(d['saldo'] ?? '00:00'),
    mes:            String(d['mes'] ?? ''),
    dataFechamento: String(d['dataFechamento'] ?? ''),
    dados:          dados.map((x) => PontoDiaItemSchema.parse(x)),
  };
});

const DadosColabSchema = z.unknown().transform((raw): MesPonto[] => {
  const d = raw as Record<string, unknown>;
  const retorno = Array.isArray(d['retorno']) ? d['retorno'] : [];
  return retorno.map((x) => MesPontoItemSchema.parse(x));
});

const ProjetosAlocadosSchema = z.unknown().transform((raw): ProjetoAlocado[] => {
  const d = raw as Record<string, unknown>;
  const retorno = Array.isArray(d['retorno']) ? d['retorno'] : (Array.isArray(raw) ? raw : []);
  const map = new Map<number, ProjetoAlocado>();
  for (const item of retorno) {
    const r = item as Record<string, unknown>;
    const id = Number(r['ProjetoID'] ?? 0);
    if (!map.has(id)) {
      map.set(id, {
        id,
        nome:        String(r['Nome'] ?? ''),
        cliente:     String(r['NomeCliente'] ?? ''),
        subProjetos: [],
      });
    }
    const proj = map.get(id)!;
    const subId = Number(r['subProjetoId'] ?? 0);
    if (subId) {
      proj.subProjetos.push({ id: subId, nome: String(r['subProjetoNome'] ?? '') });
    }
  }
  return Array.from(map.values());
});

// ─── Schema exports (for unit testing) ──────────────────────────────────────

export {
  extractRetornoList,
  FeriasDadosSchema,
  ServicosGestorSchema,
  PapeisSchema,
  PercentualDataSchema2 as PercentualDataSchema,
  // ── Fase 2 (additive exports for unit testing) ──
  AbonoRHItemSchema,
  AbonoListSchema,
  FeriasRHListSchema,
  LoginUpstreamSchema,
  UsuariosUpstreamSchema,
  PermissoesUpstreamSchema,
  PessoaItemSchema,
  PerfilSchema,
  PostItemSchema,
  DadosColabSchema,
};

// ─── Squadra namespace map ──────────────────────────────────────────────────

export const squadra = {
  auth: {
    async login(usuario: string, senha: string) {
      return sq('POST', '/v1/autenticacao/login', { usuario, senha }, '', LoginUpstreamSchema);
    },
    async usuarios(login: string, token: string) {
      return sq('GET', `/v1/usuarios/${encodeURIComponent(login)}`, null, token, UsuariosUpstreamSchema);
    },
    async pessoa(token: string) {
      return sq('GET', '/v1/pessoa', null, token, PessoaUpstreamSchema);
    },
    async permissoes(pessoaId: number, token: string) {
      return sq('GET', `/v1/pessoa/permissoes/${pessoaId}`, null, token, PermissoesUpstreamSchema);
    },
  },

  home: {
    async aniversariantes(token: string) {
      return sq('GET', '/v1/pessoas/aniversariantes', null, token, ColabListSchema);
    },
    async novosColabs(token: string) {
      return sq('GET', '/v1/pessoas/novosColaboradores', null, token, ColabListSchema);
    },
    async saldoProprio(gestorId: number, token: string) {
      return sq('GET', `/v1/retornaSaldoHoras/${gestorId}`, null, token, SaldoProprioSchema);
    },
    async saldoGlobal(token: string) {
      return sq('GET', '/v1/retornaSaldoHoras', null, token, SaldoGlobalSchema);
    },
  },

  holerite: {
    async getAno(ano: number, token: string) {
      return sq('GET', `/v1/holerite/${ano}`, null, token, HoleriteAnoSchema);
    },
    async getHistorico(token: string) {
      return sq('GET', '/v1/holerite/historico', null, token, HistoricoSalarialSchema);
    },
  },

  ferias: {
    async getDados(gestorId: number, token: string) {
      return sq('GET', `/v1/pendenciasFerias/${gestorId}`, null, token, FeriasDadosSchema);
    },
    async getHistorico(gestorId: number, token: string) {
      return sq('GET', `/v1/retornaHistoricoFerias/${gestorId}`, null, token, HistoricoFeriasSchema);
    },
    async solicitar(body: FeriasSolicitarInput, token: string) {
      return sq('POST', '/v1/ferias/cadastraSolicitacao', body, token, OkSchema);
    },
  },

  perfil: {
    async get(token: string) {
      return sq('GET', '/v1/pessoa', null, token, PerfilSchema);
    },
    async getById(id: number, token: string) {
      return sq('GET', `/v1/pessoas/${id}`, null, token, PerfilSchema);
    },
    async atualizar(payload: unknown, token: string) {
      return sq('PUT', '/v1/pessoas', payload, token, OkSchema, true, 'application/json-patch+json');
    },
    async atualizarCompetencias(payload: unknown, token: string) {
      return sq('PUT', '/v1/pessoas/atualizarCompetencias', payload, token, OkSchema);
    },
  },

  pessoas: {
    async getById(id: number, token: string) {
      return sq('GET', `/v1/pessoas/${id}`, null, token, PessoaSchema);
    },
    async buscar(body: BuscarPessoasBody, token: string, baseUrl?: string) {
      return sq('POST', '/v1/pessoas/buscarpessoas', {
        nome:                body.nome,
        ativo:               body.ativo ?? true,
        unidade:             '',
        cidade:              '',
        cargo:               '',
        gerente:             '',
        empresa:             '',
        departamento:        '',
        telefone:            '',
        experiencia:         '',
        certificacao:        '',
        projetos:            '',
        interesses:          '',
        projetosPessoais:    '',
        dataDisponibilidade: '',
        pagina:              body.pagina ?? 0,
        tamanhoPagina:       body.tamanhoPagina ?? 0,
        comunidades:         '',
      }, token, PessoaListSchema, true, 'application/json', baseUrl);
    },
    // Relatório completo de pessoas — inclui o gestor atual (gerente) de cada colaborador.
    // Resposta pesada (~585KB / ~25s) → timeout estendido.
    async relatorio(token: string, baseUrl?: string) {
      return sq('GET', '/v1/pessoasRelatorio', null, token, ColaboradorComGestorListSchema, true, 'application/json', baseUrl, 60_000);
    },
  },

  rh: {
    async getAbonos(status: 'P' | 'A' | 'R', token: string) {
      return sq('GET', `/v1/listaAbonosDP/0/0/${status}`, null, token, AbonoListSchema);
    },
    async getFerias(gestorId: number, token: string) {
      return sq('GET', `/v1/retornaListaFeriasgestor/${gestorId}`, null, token, FeriasRHListSchema);
    },
    async avaliarAbono(body: AvaliarAbonoBody, token: string) {
      return sq('POST', '/v1/avaliaSolicitacaoAbonoColab', body, token, OkSchema);
    },
    // /v1/abono/downloadAnexo/{id} retorna 404 — o base64 do anexo (campo `arquivo`)
    // já vem na própria listagem. Extraímos dela, igual ao vanilla.
    async getAbonoAnexo(id: string | number, status: 'P' | 'A' | 'R', token: string) {
      const raw = await sq('GET', `/v1/listaAbonosDP/0/0/${status}`, null, token, z.unknown());
      const item = extractRetornoList(raw).find((x) => {
        const r = x as Record<string, unknown>;
        return Number(r['id'] ?? r['idUnico'] ?? 0) === Number(id);
      });
      const r = (item ?? {}) as Record<string, unknown>;
      return { arquivo: String(r['arquivo'] ?? '') };
    },
    async avaliarFerias(body: AvaliarFeriasBody, token: string) {
      return sq('POST', '/v1/avaliaSolicitacaoFeriasColab', body, token, OkSchema);
    },
  },

  solicitacoes: {
    async getAbonos(pessoaId: number, token: string) {
      const raw = await sq('GET', `/v1/retornaListaAbonoscoloborador/${pessoaId}`, null, token, z.unknown());
      const d = raw as Record<string, unknown>;
      const items = (d['retorno'] as Record<string, unknown>)?.['retorno']
        ?? (d['retorno'] as unknown[])
        ?? (Array.isArray(raw) ? raw : []) as unknown[];
      return AbonoItemListSchema.parse(Array.isArray(items) ? items : []);
    },
    async getTiposAbono(token: string) {
      return sq('GET', '/v1/retornaListaTipoAbono', null, token, TipoAbonoListSchema);
    },
    async solicitarAbono(body: Record<string, unknown>, token: string) {
      return sq('POST', '/v1/abono/cadastraSolicitacao', body, token, OkSchema);
    },
    async solicitarHoraExtra(body: Record<string, unknown>, token: string) {
      return sq('POST', '/v1/horaExtra/cadastraSolicitacao', body, token, OkSchema);
    },
  },

  feed: {
    async getPosts(offset: number, token: string) {
      return sq('GET', `/v1/squadraEmRede/${Math.max(1, offset)}`, null, token, PostListSchema);
    },
    async getComunicados(token: string) {
      return sq('GET', '/v1/squadraEmRede/buscaEmailsComunicados', null, token, ComunicadoListSchema);
    },
    async getComentarios(postId: number, token: string) {
      return sq('GET', `/v1/squadraEmRede/RetornaComentario/${postId}`, null, token, ComentarioListSchema);
    },
    async criarPost(body: Record<string, unknown>, token: string) {
      return sq('POST', '/v1/squadraEmRede', body, token, OkSchema);
    },
    async addLike(postId: number, gestorId: number, token: string) {
      return sq('PUT', `/v1/squadraEmRede/adicionarCurtir?idPost=${postId}&idUsuario=${gestorId}`, {}, token, OkSchema);
    },
    async removeLike(postId: number, gestorId: number, token: string) {
      return sq('DELETE', `/v1/squadraEmRede/removerCurtir?idPost=${postId}&idUsuario=${gestorId}`, null, token, OkSchema);
    },
    async comentar(postId: number, texto: string, autorId: number, token: string) {
      const encoded = encodeURIComponent(texto);
      return sq('POST', `/v1/squadraEmRede/comentario?DESCComentario=${encoded}&IDPost=${postId}&Autor=${autorId}`, null, token, OkSchema);
    },
    async deletarPost(postId: number, token: string) {
      return sq('DELETE', `/v1/squadraEmRede/deletar/${postId}`, null, token, OkSchema);
    },
    async deletarComentario(comentarioId: number, token: string) {
      return sq('DELETE', `/v1/squadraEmRede/excluirComentario?id=${comentarioId}`, null, token, OkSchema);
    },
  },

  percentual: {
    async getDados(gestorId: number, mes: number, ano: number, token: string) {
      return sq('GET', `/v1/gestor/listarHorasPercentuais/${gestorId}/${mes}/${ano}`, null, token, PercentualDataSchema2);
    },
    async lancar(body: Record<string, unknown>, token: string) {
      return sq('POST', '/v1/gestor/horasPercentuais', body, token, OkSchema);
    },
    async fechar(usuarioID: number, mes: number, ano: number, token: string) {
      return sq('POST', '/v1/gestor/fecharPercentual', { usuarioID, mes, ano }, token, OkSchema);
    },
    async deletar(id: number | string, token: string) {
      return sq('DELETE', `/v1/percentual/deletar/${id}`, null, token, OkSchema);
    },
    async buscarProjetos(q: string, token: string, baseUrl?: string) {
      return sq('POST', '/v2/projetos/pornomev2', { nome: q }, token, ProjetosBuscaListSchema, true, 'application/json', baseUrl);
    },
    async getSubprojetos(id: number | string, token: string) {
      return sq('GET', `/v1/projetos/subprojetos/${id}`, null, token, SubprojetosListSchema);
    },
  },

  gestao: {
    async getEquipe(gestorId: number, token: string) {
      return sq('GET', `/v1/retornaDadosEquipe/${gestorId}`, null, token, EquipeSchema);
    },
    async getPendencias(gestorId: number, token: string) {
      return sq('GET', `/v2/gestor/pendenciasv2/${gestorId}`, null, token, z.unknown());
    },
    async getHorasExtras(gestorId: number, token: string) {
      return sq('GET', `/v1/gestor/solicitacoesHorasAlemDoPrevistoPendentes/${gestorId}`, null, token, HoraExtraListSchema);
    },
    async getSolicitacoesApropriacao(gestorId: number, token: string) {
      return sq('GET', `/v1/falta/ListarSolicitacoesLiberacaoFaltaPendentesPorGestor/${gestorId}`, null, token, ApropriacaoListSchema);
    },
    async getSolicitacoesFerias(gestorId: number, token: string) {
      return sq('GET', `/v1/retornaListaFeriasgestor/${gestorId}`, null, token, FeriasRHListSchema);
    },
    async getAbonosEquipe(gestorId: number, token: string) {
      return sq('GET', `/v1/retornaListaAbonosEquipe/${gestorId}`, null, token, AbonoEquipeListSchema);
    },
    async getDayoffPendentes(gestorId: number, token: string) {
      return sq('GET', `/v1/retornaListaAbonosPendentesDayOffGestor/${gestorId}`, null, token, AbonoEquipeListSchema);
    },
    async aprovarHorasExtras(gestorId: number, solicitacaoID: number, acao: 'A' | 'R', tipoAprovacao: string, observacaoGestor: string, projeto: number, token: string) {
      const payload = [{ id: solicitacaoID, solicitacaoID, acao, tipoAprovacao: tipoAprovacao || 'B', observacaoGestor: observacaoGestor || '', projeto: projeto || 0 }];
      return sq('POST', '/v1/gestor/AprovarReprovarSolicitacaoHorasAlemDoPrevisto', payload, token, OkSchema);
    },
    async avaliarApropriacao(idFalta: number, idSolicitacao: number, acao: 'A' | 'R', token: string) {
      return sq('PUT', '/v1/falta/aprovarOuReprovarFaltaColaborador', { idFalta, idSolicitacaoLiberacaoFalta: idSolicitacao, acao }, token, OkSchema);
    },
    async avaliarFerias(idFerias: number, acao: 'A' | 'R', observacao: string, token: string) {
      return sq('POST', '/v1/avaliaSolicitacaoFeriasColab', { idFerias, acao, observacao }, token, OkSchema);
    },
    async avaliarAbono(idUnico: string | number, acao: 'A' | 'R', justificativa: string, token: string) {
      return sq('POST', '/v1/avaliaSolicitacaoAbonoColab', { idUnico, acao, justificativa }, token, OkSchema);
    },
    async alocar(payload: AlocarPayload, token: string) {
      return sq('POST', '/v2/gestor/alocacaoV2', payload, token, OkSchema);
    },
    async getServicos(gestorId: number, token: string) {
      return sq('GET', `/v1/gestor/retornaProjetosDeUmGestor/${gestorId}`, null, token, ServicosGestorSchema);
    },
    async getPapeis(token: string) {
      return sq('GET', '/v1/projetos/papeis', null, token, PapeisSchema);
    },
    async resolveLogin(login: string, token: string): Promise<number | null> {
      const raw = await sq('GET', `/v1/usuarios/${encodeURIComponent(login)}`, null, token, z.unknown()) as Record<string, unknown>;
      const retorno = (Array.isArray(raw['retorno']) ? raw['retorno'] : []) as Record<string, unknown>[];
      const first = retorno[0] ?? {};
      const id = Number(first['id'] ?? 0);
      return id > 0 ? id : null;
    },
    // ── Alterar gestor (HML) — coordId = id do USUÁRIO do novo gestor ────────
    // recId = id da pessoa do colaborador · prjId = id do projeto. POST sem body.
    async alteraGestorColaborador(coordId: number, recId: number, token: string) {
      return sq('POST', `/v1/alteraGestorColaborador/${coordId}/${recId}`, {}, token, OkSchema, true, 'application/json', HML_API_URL);
    },
    async alteraGestorProjeto(coordId: number, prjId: number, token: string) {
      return sq('POST', `/v1/alteraGestorProjeto/${coordId}/${prjId}`, {}, token, OkSchema, true, 'application/json', HML_API_URL);
    },
    // Relatório de projetos cadastrados — inclui cpfGerente (gestor atual, por CPF).
    async relatorioProjetos(token: string, baseUrl?: string) {
      return sq('GET', '/v1/gestor/relatorioProjetosCadastrados', null, token, ProjetoComGestorListSchema, true, 'application/json', baseUrl);
    },
  },

  ponto: {
    async getDadosColab(sqhorasId: number, inicio: string, fim: string, token: string) {
      const [ay, am, ad] = inicio.split('-');
      const [fy, fm, fd] = fim.split('-');
      const inicioEnc = encodeURIComponent(`${ad}/${am}/${ay}`);
      const fimEnc    = encodeURIComponent(`${fd}/${fm}/${fy}`);
      return sq('GET', `/v1/retornaDadosColab/${sqhorasId}/${inicioEnc}/${fimEnc}`, null, token, DadosColabSchema);
    },
    async getProjetosAlocados(gestorId: number, token: string) {
      return sq('GET', `/v1/projetos/alocados/${gestorId}`, null, token, ProjetosAlocadosSchema);
    },
    async novoApontamento(body: NovoApontamentoPayload, token: string) {
      return sq('POST', '/v3/apontamentos/novo/v3', body, token, OkSchema);
    },
    async solicitarLiberacao(idFalta: number, idUsuario: number, token: string) {
      return sq('POST', '/v1/falta/solicitarLiberacaoFalta', { idFalta, idUsuario }, token, OkSchema);
    },
    async marcarFalta(idUsuario: number, data: string, token: string): Promise<{ ok: true }> {
      return sq('POST', '/v1/marcaFalta/cadastrar', { idUsuario, data }, token, OkSchema);
    },
    async getDiasSemApontamento(token: string): Promise<DiasSemApontamentoItem[]> {
      const raw = await sq('GET', '/v2/RetornaDiasSemApontamento', null, token, z.unknown());
      const list = Array.isArray(raw) ? raw : [];
      return list.map((item) => {
        const d = item as Record<string, unknown>;
        return {
          data:            String(d['dia'] ?? d['date'] ?? ''),
          possuiFalta:     Boolean(d['possuiFalta'] ?? false),
          liberacaoGestor: Boolean(d['liberacaoGestor'] ?? false),
        };
      });
    },
  },
};
