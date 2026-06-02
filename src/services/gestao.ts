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
    datasSemApontamento:             Array.isArray(c['datasSemApontamento']) ? (c['datasSemApontamento'] as string[]) : [],
    preFechamentoPendente:           Array.isArray(c['preFechamentoPendenteColaborador']) && (c['preFechamentoPendenteColaborador'] as unknown[]).length > 0,
  }));
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
