import {
  squadra,
  type MesPonto,
  type ProjetoAlocado,
  type NovoApontamentoPayload,
  type DiasSemApontamentoItem,
  type ApontamentoSqHora,
} from './squadra-client';

export type { ApontamentoSqHora };

// Apontamentos de um dia (YYYY-MM-DD) — o upstream espera DD/MM/YYYY no GET.
export async function getApontamentosDia(usuarioId: number, dataISO: string, token: string): Promise<ApontamentoSqHora[]> {
  const [y, m, d] = dataISO.split('-');
  return squadra.ponto.getApontamentosDia(usuarioId, `${d}/${m}/${y}`, token);
}

export async function deletarApontamento(id: number, tipo: string, usuarioId: number, dataISO: string, token: string): Promise<{ ok: true }> {
  return squadra.ponto.deletarApontamento(id, tipo, usuarioId, dataISO, token);
}

export async function getDadosColab(
  sqhorasId: number,
  inicio: string,
  fim: string,
  token: string,
): Promise<MesPonto[]> {
  return squadra.ponto.getDadosColab(sqhorasId, inicio, fim, token);
}

export async function getProjetosAlocados(gestorId: number, token: string): Promise<ProjetoAlocado[]> {
  return squadra.ponto.getProjetosAlocados(gestorId, token);
}

export type Periodo = { horaInicio: string; horaFinal: string };

export type TipoApropriacao = 'JORNADA' | 'HORA_EXTRA';

export type NovoApontamentoInput = {
  data:            string;  // YYYY-MM-DD
  periodos:        Periodo[];   // ≥1 período (início/fim) → vira N apontamentos
  projetoId:       number;
  subprojetoId?:   number;
  tipoApropriacao: TipoApropriacao;
  justificativa?:  string;
  usuarioId:       number;
  login:           string;
};

/**
 * Monta o payload aninhado esperado pelo upstream a partir do input do cliente.
 * Função pura, exportada para teste de regressão (subprojetoId default 0,
 * cada período vira um item em `apontamentos`, data YYYY-MM-DD nos 3 blocos).
 */
export function buildNovoApontamentoPayload(input: NovoApontamentoInput): NovoApontamentoPayload {
  const ehHoraExtra = input.tipoApropriacao === 'HORA_EXTRA';
  // Upstream exige descrição com ≥1 caractere; batida normal vem sem justificativa → '.'
  // Para hora extra, espelha o app-react ("hora extra aprovada").
  const descricao = input.justificativa?.trim() || (ehHoraExtra ? 'hora extra aprovada' : '.');
  const textoJustificativa = ehHoraExtra ? 'Hora Extra Aprovada Via APP' : 'Apontamento Realizado Via APP';
  return {
    dadosGeraisApontamento: { usuarioId: input.usuarioId, login: input.login },
    apontamentos: input.periodos.map((p) => ({
      projetoId:       input.projetoId,
      subProjetoId:    input.subprojetoId ?? 0,
      descricao,
      data:            input.data,
      horaInicio:      p.horaInicio,
      horaFinal:       p.horaFinal,
      tipoApropriacao: input.tipoApropriacao,
    })),
    justificativas: [{ data: input.data, textoJustificativa }],
    aceites:        [{ data: input.data }],
  };
}

export async function novoApontamento(
  input: NovoApontamentoInput,
  token: string,
): Promise<{ ok: true }> {
  const payload = buildNovoApontamentoPayload(input);
  return squadra.ponto.novoApontamento(payload, token);
}

export async function marcarFalta(idUsuario: number, data: string, token: string): Promise<{ ok: true }> {
  return squadra.ponto.marcarFalta(idUsuario, data, token);
}

export async function liberarFaltaLivre(idUsuario: number, data: string, token: string): Promise<{ ok: true }> {
  return squadra.ponto.liberarFaltaLivre(idUsuario, data, token);
}

export async function getDiasSemApontamento(token: string): Promise<DiasSemApontamentoItem[]> {
  return squadra.ponto.getDiasSemApontamento(token);
}

export async function solicitarLiberacaoFalta(
  idFalta: number,
  sqhorasId: number,
  token: string,
): Promise<{ ok: true }> {
  return squadra.ponto.solicitarLiberacao(idFalta, sqhorasId, token);
}
