/**
 * Massa de testes central — web-app-next
 * ----------------------------------------------------------------------------
 * Fixtures derivadas do CÓDIGO REAL (src/services/squadra-client.ts), não
 * inventadas. Cada bloco reflete o formato BRUTO que o upstream Squadra devolve
 * (com wrappers `retorno` e aliases de campo) — ou seja, a ENTRADA que os
 * schemas Zod parseiam. Use estas fixtures:
 *
 *   - Fase 2 (schemas)   → passe `raw*` direto para `Schema.parse(...)`.
 *   - Fase 4 (API routes)→ devolva `raw*` nos handlers MSW + use `session*`.
 *   - Fase 1/3 (puro)    → tabelas de entrada/saída ao final do arquivo.
 *
 * REGRAS:
 *   - ZERO PII real. CPFs são `000.*`, e-mails `@example.com`, nomes fictícios.
 *   - Fixtures `*ComSensiveis` incluem cpf/senha/token DE PROPÓSITO — os testes
 *     de `semSensiveis` devem provar que esses campos são removidos.
 *   - Aliases marcados com  // alias  reproduzem variações reais do upstream
 *     que originaram bugs (ex.: AbonoRH usa `id`, não `idUnico`).
 *
 * Convenção de nomes: `raw<Dominio><Caso>` para payload bruto upstream.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ SESSÃO  (Fase 4 — mock de getSession; espelha IronSessionData)            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const sessionColaborador = {
  token:       'mock-bearer-token',
  gestorId:    100,
  pessoaId:    200,
  sqhorasId:   300,
  login:       'joao.silva',
  nome:        'João Silva',
  cargo:       'Desenvolvedor',
  bateRep:     false,
  permissoes: {
    gerenteFuncional:  false,
    perfilDP:          false,
    perfilCoordenador: false,
    perfilTI:          false,
    perfilMarketing:   false,
    bateRep:           false,
  },
  simulando:   false,
  podeSimular: false,
  temEquipe:   false,
};

export const sessionGestor = {
  ...sessionColaborador,
  gestorId:    995,
  login:       'maria.gestora',
  nome:        'Maria Gestora',
  cargo:       'Gerente de Projetos',
  permissoes:  { ...sessionColaborador.permissoes, gerenteFuncional: true },
  podeSimular: true,
  temEquipe:   true,
};

/** DP via flag oficial perfilDP. */
export const sessionDP = {
  ...sessionColaborador,
  gestorId:   500,
  login:      'ana.dp',
  nome:       'Ana DP',
  cargo:      'PERSONNEL ANALYST',
  permissoes: { ...sessionColaborador.permissoes, perfilDP: true },
};

/** DP só pelo fallback de cargo (perfilDP=false) — caso real da Vera. */
export const sessionDPviaCargo = {
  ...sessionColaborador,
  gestorId:   501,
  login:      'vera.dp',
  nome:       'Vera DP',
  cargo:      'PERSONNEL ADMINISTRATION MANAGER',
  permissoes: { ...sessionColaborador.permissoes, perfilDP: false },
};

export const sessionBatePonto = {
  ...sessionColaborador,
  bateRep:    true,
  permissoes: { ...sessionColaborador.permissoes, bateRep: true },
};

export const sessionSimulando = { ...sessionGestor, simulando: true };

/** Ausência de sessão (cookie inexistente / expirado). */
export const sessionVazia = {} as Record<string, unknown>;

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ AUTH  (LoginUpstream / Usuarios / Pessoa / Permissoes)                    ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const rawLogin = {
  accessToken: 'jwt-abc.def.ghi',
  idUsuario:   100,
  login:       'joao.silva',
  cargo:       'Desenvolvedor',
  nome:        'João Silva',
};

/** Mesmo login, mas só com aliases (token/id/perfil.nome). */
export const rawLoginAliases = {
  token:  'jwt-abc.def.ghi',          // alias de accessToken
  id:     100,                        // alias de idUsuario
  perfil: { nome: 'Analista' },       // alias de cargo
};

export const rawUsuarios = {
  retorno: [{ id: 100, usuarioIdSQHoras: 300, login: 'joao.silva' }],
};
export const rawUsuariosVazio = { retorno: [] };   // → sqhorasId: 0

export const rawPessoa = {
  retorno: {
    id:         200,
    nome:       'João Silva',
    nomeSocial: 'João',
    foto:       '/9j/4AAQSkZJRgABAQ',  // JPEG base64 cru → normalizeFoto prefixa data:image/jpeg
    bateRep:    true,
  },
};

export const rawPermissoesDP = {
  retorno: { perfilDP: true, gerenteFuncional: false, bateRep: false },
};
export const rawPermissoesVazio = { retorno: {} };  // todas as flags → false

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ HOME  (ColabList / SaldoProprio / SaldoGlobal)                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const rawAniversariantes = {
  retorno: [
    { id: 11, nome: 'Carla Souza', cargo: 'UX', login: 'carla', foto: null },
    { idPessoa: 12, nomeColaborador: 'Pedro Lima', cargo: 'QA', login: 'pedro' }, // aliases
  ],
};
export const rawAniversariantesVazio = { retorno: [] };

export const rawSaldoProprio = { retorno: { saldoHoras: '12.5' } };  // string → 12.5
export const rawSaldoProprioAlias = { retorno: { saldo: '8' } };     // alias `saldo`

/** SaldoGlobal: contém CPF — bom para checar que a rota não vaza além do schema. */
export const rawSaldoGlobal = [
  {
    colaborador:      'João Silva',
    saldoHoras:       12.5,
    email:            'joao@example.com',
    saldoFechamento:  0,
    cpf:              '000.000.000-00',
    ultimoFechamento: '2026-05-31',
    diasPendentes:    ['02/06/2026', '03/06/2026'],
    alocacoes:        [],
  },
];

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ HOLERITE  (HoleriteAno / HistoricoSalarial)                               ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const rawHoleriteAno = {
  retorno: {
    contracheque: [
      {
        mesCompetencia: 5,
        anoCompetencia: 2026,
        nome:           'João Silva',
        funcao:         'Desenvolvedor',
        salarioBase:    10000,
        itensContracheque: [
          { codEvento: '001', referencia: '30', valor: 10000, descricao: 'Salário', provDescBase: 'P', tipoContraCheque: 'M' },
          { codEvento: '900', referencia: '11', valor: 1100,  descricao: 'INSS',     provDescBase: 'D', tipoContraCheque: 'M' },
        ],
      },
    ],
  },
};
export const rawHoleriteVazio = { retorno: {} };   // sem `contracheque` → []

export const rawHistoricoSalarial = {
  retorno: [
    { dataMudanca: '2025-01-01', mudanca: 'Promoção a Pleno' },
    { data: '2024-01-01', descricao: 'Mérito' },   // aliases data/descricao
  ],
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ FERIAS  (FeriasDados / HistoricoFerias)                                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const rawFeriasDados = {
  retorno: {
    saldoFeriasColaborador:            15,
    inicioPeriodoDeGozoColaborador:    '2026-07-01',
    terminoPeriodoDeGozoColaborador:   '2026-07-30',
    dataLimiteFerias:                  '2026-12-31',
    inicioFeriasPlanejadaColaborador:  null,
    terminoFeriasPlanejadaColaborador: null,
  },
};
export const rawFeriasDadosSemWrapper = { saldoFeriasColaborador: '20.5', dataLimiteFerias: '2027-01-31' };
export const rawFeriasDadosSaldoInvalido = { retorno: { saldoFeriasColaborador: 'NaN' } }; // → 0

/** HistoricoFerias usa wrapper duplo retorno.retorno (vide schema). */
export const rawHistoricoFerias = {
  retorno: {
    retorno: [
      {
        dataFeriasInicio:            '2025-01-10',
        dataFeriasFinal:             '2025-01-30',
        dataInicioPeriodoAquisitivo: '2024-01-01',
        dataFimPeriodoAquisitivo:    '2024-12-31',
        status:                      'GOZADA',
      },
    ],
  },
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ PERFIL / PESSOAS  (Perfil / Pessoa / PessoaList + semSensiveis)           ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * Inclui campos sensíveis E campos ricos preservados pelo spread.
 * Os testes devem provar:  cpf/senha/token  → REMOVIDOS;
 *                          login/email/cidade/kudosWalls → PRESERVADOS.
 */
export const rawPerfilComSensiveis = {
  retorno: {
    id:          200,
    nome:        'João Silva',
    nomeSocial:  'João',
    foto:        null,
    celular:     '(11) 90000-0000',
    cargo:       'Desenvolvedor',
    email:       'joao@example.com',
    login:       'joao.silva',
    cidade:      'São Paulo',
    kudosWalls:  [{ de: 'Maria', texto: 'Mandou bem!' }],
    // sensíveis — DEVEM sumir:
    cpf:            '000.000.000-00',
    cpfColaborador: '000.000.000-00',
    senha:          'segredo123',
    password:       'segredo123',
    token:          'jwt-leak',
    accessToken:    'jwt-leak',
  },
};

export const rawPessoaList = {
  retorno: [
    { id: 1, nome: 'Ana', login: 'ana', email: 'ana@example.com', cargo: 'PO', celular: '1', foto: null, cpf: '000.000.000-00' },
    { idPessoa: 2, nome: 'Bruno', usuario: 'bruno' }, // aliases idPessoa/usuario(login)
  ],
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ RH  (AbonoList / FeriasRHList)                                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * AbonoRH — raiz dos bugs idUnico/AbonoRH:
 *   - upstream manda `id` (NÃO idUnico)  → schema mapeia para idUnico
 *   - `nome` → nomeColaborador; `descricao` → tipo; `dataInicio` → data
 *   - horas vem STRING "00:50" e deve permanecer string
 *   - status textual → normaliza P/A/R/C
 *   - anexo: caminho não-vazio OU campo `arquivo` presente → temAnexo=true
 */
export const rawAbonosRH = {
  retorno: [
    {
      id:          9001,                 // alias de idUnico
      nome:        'Carlos Pereira',     // alias de nomeColaborador
      descricao:   'Atestado médico',    // alias de tipo
      dataInicio:  '2026-06-02',         // alias de data
      horas:       '00:50',
      status:      'PENDENTE',
      anexo:       '/uploads/atestado-9001.pdf',
      motivo:      'Consulta',
    },
    {
      id: 9002, nome: 'Diana Reis', descricao: 'Folga', dataInicio: '2026-06-03',
      horas: '08:00', status: 'APROVADO', anexo: '',          // sem anexo path…
      arquivo: 'JVBERi0xLjcK',                                 // …mas tem base64 → temAnexo=true
    },
    { id: 9003, nome: 'Edu Santos', descricao: 'Dayoff', dataInicio: '2026-06-04', horas: '08:00', status: 'RECUSADO', anexo: '' },
  ],
};

/** FeriasRH — filtra idFerias:0 (sentinela "vazio"). */
export const rawFeriasRH = {
  retorno: [
    { solicitacaoID: 700, nomeColaborador: 'Fábio Melo', dataInicioSolicitacao: '2026-08-01', dataFimSolicitacao: '2026-08-20', status: 'P' },
    { idFerias: 0, nomeColaborador: 'sentinela vazia' },   // ← deve ser FILTRADO
  ],
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ SOLICITAÇÕES  (TipoAbonoList / AbonoItemList)                             ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const rawTiposAbono = {
  retorno: [
    { id: 1, tipoAbono: 'Atestado' },
    { id: 2, tipo: 'Folga' },         // alias
    { id: 3, descricao: 'Dayoff' },   // alias
  ],
};

/** AbonoItemList parseia ARRAY direto (não usa retorno). */
export const rawAbonosColaborador = [
  { id: 5001, dataInicio: '2026-06-01', dataFim: '2026-06-01', descricao: 'Atestado', status: 'PENDENTE', justificativa: 'Consulta', dias: 1, motivo: 'Saúde', horas: '08:00', nome: null },
  { idAbono: 5002, data: '2026-06-05', tipo: 'Folga' },  // aliases idAbono/data/tipo; defaults preenchem o resto
];

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ FEED  (PostList / ComentarioList / ComunicadoList)                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const rawPosts = {
  retorno: [
    {
      idPost: 1, remetenteID: 200, remetenteNome: 'João', remetenteFoto: null,
      destinatarioNome: null, mensagem: 'Olá time!', titulo: null, categoria: null,
      tipoPublicacao: 'C', dataPostagem: '2026-06-01T10:00:00', numComentarios: 2,
      curtidas: [200, 300], aplausos: 2,
    },
    { id: 2, remetenteNome: 'Maria', tipoPublicacao: 'A' }, // alias id; aplausos default = curtidas.length (0)
  ],
};

export const rawComentarios = {
  retorno: [
    { id: 10, descComentario: 'Top!', idAutor: 300, nomeAutor: 'Pedro', fotoAutor: null },
    { id: 11, comentario: 'Curti', idAutor: 400, nomeAutor: 'Ana' },  // alias comentario
  ],
};

export const rawComunicados = {
  retorno: [
    { assunto: 'Aviso geral', remetente: 'RH', dataRecebimento: '2026-06-01', corpo: 'Texto...' },
    { titulo: 'Outro', data: '2026-06-02', mensagem: 'Corpo via aliases' },  // aliases
  ],
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ PERCENTUAL  (PercentualData / ProjetosBusca / Subprojetos)                ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const rawPercentual = {
  retorno: {
    itens: [
      { id: 1, clienteNome: 'Cliente A', projetoNome: 'Projeto Alpha', subProjetoNome: 'Sub 1', horasRegistradas: 80, percentual: 50 },
      { id: 2, servicoDescricao: 'Serv X', horas: 40, subProjetoDescricao: 'Sub Y' }, // aliases
    ],
    horasPrevistas:   160,
    horasRegistradas: 120,
    fechado:          false,
  },
};
export const rawPercentualAliasContratadas = { retorno: { horasPercentuais: [{ id: 1, projetoNome: 'P', horasRegistradas: 8 }], horasContratadas: 180 } };

export const rawProjetosBusca = {
  retorno: [
    { id: 1, nome: 'Projeto Alpha', cliente: 'Cliente A' },
    { projetoId: 2, nomeProjeto: 'Projeto Beta' },  // aliases
  ],
};

export const rawSubprojetos = { retorno: [{ id: 10, nome: 'Sub 1' }, { subProjetoId: 11, subProjetoNome: 'Sub 2' }] };
export const rawSubprojetosSemSucesso = { sucesso: false, retorno: [] };  // → []

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ GESTÃO  (Equipe / HoraExtra / Apropriacao / AbonoEquipe / Servicos /      ║
// ║          Papeis)                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const rawEquipe = {
  retorno: [
    { id: 100, login: 'joao', nome: 'João Silva', saldoHoras: '12.5', saldoFerias: '15', feriasInicio: '2026-07-01', feriasFim: '2026-07-30', ultimoProjeto: 'Alpha', foto: null },
    { nome: 'Bruno', dataFeriasInicio: '2026-09-01', dataFeriasFinal: '2026-09-20', projeto: 'Beta' }, // aliases
  ],
};

export const rawHorasExtras = {
  retorno: [
    { solicitacaoID: 800, nomeColaborador: 'João', dataSolicitacao: '2026-06-02', qtdadeHoras: 2, projetoId: 1, projetoDescricao: 'Alpha', solicitacaoTipo: 'B', statusSolicitacao: 0, isNoturno: true },
    { id: 801, colaborador: 'Maria', data: '2026-06-03', horas: 1, projeto: 'Beta', isNoturno: null }, // aliases + isNoturno null
  ],
};

export const rawApropriacoes = {
  retorno: [
    { idSolicitacaoLiberacaoFalta: 900, idFalta: 50, nomeColaborador: 'João', data: '2026-06-01', status: 'PENDENTE', foto: null },
  ],
};

export const rawAbonosEquipe = {
  retorno: [
    { idUnico: 'ab-1', nomeColaborador: 'João', tipo: 'Folga', data: '2026-06-02', horas: 8, status: 'P', motivo: 'Descanso', foto: null },
    { id: 'ab-2', colaborador: 'Maria', periodo: '2026-06-05', quantidadeHoras: 4, descricao: 'Meio período' }, // aliases
  ],
};

/** ServicosGestor: linhas FLAT agrupadas por projetoId; coleta subprojetos. */
export const rawServicos = {
  retorno: [
    { projetoId: 1, projetoDescricao: 'Projeto Alpha', clienteNome: 'Cliente A', subProjetoId: 10, subProjetoDescricao: 'Sub 1' },
    { projetoId: 1, projetoDescricao: 'Projeto Alpha', clienteNome: 'Cliente A', subProjetoId: 11, subProjetoDescricao: 'Sub 2' },
    { projetoID: 2, projetoNome: 'Projeto Beta', nomeCliente: 'Cliente B', subProjetoID: 20, subprojetoNome: 'Sub X' }, // aliases
  ],
};

export const rawPapeis = {
  retorno: [{ id: 1, nomePapel: 'Desenvolvedor' }, { id: 2, nome: 'Analista' }],  // 2º via alias nome
};

export const rawResolveLogin = { retorno: [{ id: 100 }] };  // resolveLogin → 100
export const rawResolveLoginVazio = { retorno: [] };        // → null

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ PONTO  (DadosColab → MesPonto[]; ProjetosAlocados; DiasSemApontamento)    ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/** Um dia "normal" trabalhado, com projeto apontado. */
const pontoDiaOk = {
  data: '02/06/2026', diaSemana: 'Segunda', fimDeSemana: false,
  horasRealizadas: '08:00', horasPrevistas: '08:00', horasAbono: '00:00',
  projeto: [{ horaInicio: '08:00', horaTermino: '17:00', projeto: 'Alpha', tipoApontamento: 'JORNADA' }],
  falta: false, horaExtra: '00:00', horasFalta: '00:00', isFalta: false, isAbono: false,
  isTravadoId: 0, solicitacaoTravadoId: 0, solicitacaoTravadoStatus: '', statusAbono: '',
  descricaoTipoAbono: '', idUnico: 1, confirmaFalta: false, dadosHoraExtra: null,
  faltaId: 0, solicitacaoLiberacaoFaltaId: 0, liberacaoGestor: '', statusLiberacaoFalta: '',
  permissaoLiberacao: false,
};
/** Dia sem apontamento que ainda dá pra registrar (prevista>0, sem projeto). */
const pontoDiaPendente = { ...pontoDiaOk, data: '03/06/2026', horasRealizadas: '00:00', projeto: null, idUnico: 2 };
/** Falta confirmada. */
const pontoDiaFalta = { ...pontoDiaOk, data: '01/06/2026', horasRealizadas: '00:00', projeto: null, isFalta: true, falta: true, idUnico: 3 };
/** Feriado: previstas 0. */
const pontoDiaFeriado = { ...pontoDiaOk, data: '07/09/2026', horasPrevistas: '00:00', horasRealizadas: '00:00', projeto: null, idUnico: 4 };
/** Fim de semana. */
const pontoDiaFimDeSemana = { ...pontoDiaOk, data: '06/06/2026', diaSemana: 'Sábado', fimDeSemana: true, horasPrevistas: '00:00', horasRealizadas: '00:00', projeto: null, idUnico: 5 };
/** Dia com abono. */
const pontoDiaAbono = { ...pontoDiaOk, data: '04/06/2026', horasRealizadas: '00:00', horasAbono: '08:00', projeto: null, isAbono: true, descricaoTipoAbono: 'Atestado', statusAbono: 'A', idUnico: 6 };

export const pontoDias = { pontoDiaOk, pontoDiaPendente, pontoDiaFalta, pontoDiaFeriado, pontoDiaFimDeSemana, pontoDiaAbono };

export const rawDadosColab = {
  retorno: [
    { saldo: '02:30', mes: 'Junho/2026', dataFechamento: '', dados: [pontoDiaFalta, pontoDiaOk, pontoDiaPendente, pontoDiaAbono, pontoDiaFimDeSemana] },
  ],
};

/** ProjetosAlocados: chaves PascalCase (ProjetoID/Nome/NomeCliente). */
export const rawProjetosAlocados = {
  retorno: [
    { ProjetoID: 1, Nome: 'Projeto Alpha', NomeCliente: 'Cliente A', subProjetoId: 10, subProjetoNome: 'Sub 1' },
    { ProjetoID: 1, Nome: 'Projeto Alpha', NomeCliente: 'Cliente A', subProjetoId: 11, subProjetoNome: 'Sub 2' },
    { ProjetoID: 2, Nome: 'Projeto Beta', NomeCliente: 'Cliente B', subProjetoId: 20, subProjetoNome: 'Sub X' },
  ],
};

/** DiasSemApontamento: array direto, chave `dia`. */
export const rawDiasSemApontamento = [
  { dia: '02/06/2026', possuiFalta: false, liberacaoGestor: false },
  { date: '03/06/2026', possuiFalta: true,  liberacaoGestor: true },  // alias date
];

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ ENVELOPES genéricos  (extractRetornoList / wrappers)                      ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export const envelopes = {
  arrayDireto:     [1, 2, 3],
  retornoArray:    { retorno: ['x', 'y'] },
  retornoRetorno:  { retorno: { retorno: ['a', 'b'] } },
  desconhecido:    { foo: 'bar' },        // → []
};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ FASE 1 — entradas de funções puras (lib/)                                 ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/** temAcessoDP(perfilDP) → esperado — controle exclusivo pela permissão */
export const casosDPAccess: Array<[boolean | undefined, boolean]> = [
  [true,      true],   // flag oficial
  [false,     false],
  [undefined, false],
];

/** checkOrigin: env ALLOWED_ORIGINS/APP_URL + header Origin → 403? (null=ok) */
export const ALLOWED_ORIGINS = 'http://localhost:3000,https://app.squadra.com.br';
export const casosCheckOrigin: Array<{ env: string; origin: string; ok: boolean }> = [
  { env: ALLOWED_ORIGINS, origin: 'http://localhost:3000',        ok: true  },
  { env: ALLOWED_ORIGINS, origin: 'https://app.squadra.com.br',   ok: true  },
  { env: ALLOWED_ORIGINS, origin: 'https://evil.com',             ok: false },
  { env: ALLOWED_ORIGINS, origin: '',                             ok: false }, // sem header
  { env: '',              origin: 'http://localhost:3000',        ok: false }, // fail-closed
];

/** detectMime(base64) → mime esperado.  (JPEG começa com /9j/ — vide memória) */
export const casosMime: Array<[string, string]> = [
  ['JVBERi0xLjcK', 'application/pdf'],
  ['/9j/4AAQSkZJ', 'image/jpeg'],
  ['iVBORw0KGgo',  'image/png'],
  ['R0lGODlhAQAB', 'image/gif'],
  ['',             'application/octet-stream'],
  ['xxxxlixo',     'application/octet-stream'],
];

/**
 * statusLabel(s) → StatusKey ('pendente'|'aprovado'|'reprovado'|'cancelado').
 * Função consolidada em lib/status.ts: aceita single-char, texto e numérico,
 * case-insensitive. (NB: é 'reprovado', não 'recusado'.)
 */
export const casosStatus: Array<[string | number, string]> = [
  ['A', 'aprovado'], ['R', 'reprovado'], ['C', 'cancelado'], ['P', 'pendente'],
  ['aprovado', 'aprovado'], ['reprovado', 'reprovado'], ['cancelado', 'cancelado'],
  ['1', 'aprovado'], ['2', 'reprovado'], [1, 'aprovado'], [2, 'reprovado'],
  ['PENDENTE', 'pendente'], ['???', 'pendente'], ['', 'pendente'],
];

/**
 * calcHoras(inicio, fim, isNoturno) → horas (decimal).
 * Regressão: noturno 23:00→01:00 = 2h (só soma 24h quando isNoturno='S').
 */
export const casosHoras: Array<[string, string, 'S' | 'N', number]> = [
  ['08:00', '10:00', 'N', 2],
  ['08:00', '08:00', 'N', 0],    // fim ≤ início (diurno) → ≤0 (rota rejeita)
  ['23:00', '01:00', 'S', 2],    // 🔥 noturno cruza meia-noite
  ['22:30', '00:30', 'S', 2],    // noturno fracionado
  ['23:00', '01:00', 'N', -22],  // mesmo horário, sem flag noturno → negativo (rejeita)
  ['09:00', '11:30', 'N', 2.5],
];

/** toMin("HH:MM") → minutos; NaN-safe */
export const casosToMin: Array<[string | undefined, number]> = [
  ['08:30', 510], ['00:00', 0], ['', 0], ['ab:cd', 0], [undefined, 0],
];
