import {
  squadra,
  type MesPonto,
  type ProjetoAlocado,
  type NovoApontamentoPayload,
  type DiasSemApontamentoItem,
} from './squadra-client';

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

export async function novoApontamento(
  input: {
    data:            string;  // YYYY-MM-DD
    horaInicio:      string;
    horaFinal:       string;
    projetoId:       number;
    subprojetoId?:   number;
    tipoApropriacao: 'JORNADA';
    justificativa?:  string;
    usuarioId:       number;
    login:           string;
  },
  token: string,
): Promise<{ ok: true }> {
  const payload: NovoApontamentoPayload = {
    dadosGeraisApontamento: { usuarioId: input.usuarioId, login: input.login },
    apontamentos: [{
      projetoId:       input.projetoId,
      subProjetoId:    input.subprojetoId ?? 0,
      descricao:       input.justificativa ?? '',
      data:            input.data,
      horaInicio:      input.horaInicio,
      horaFinal:       input.horaFinal,
      tipoApropriacao: 'JORNADA',
    }],
    justificativas: [{ data: input.data, textoJustificativa: 'Apontamento Realizado Via APP' }],
    aceites:        [{ data: input.data }],
  };
  return squadra.ponto.novoApontamento(payload, token);
}

export async function marcarFalta(idUsuario: number, data: string, token: string): Promise<{ ok: true }> {
  return squadra.ponto.marcarFalta(idUsuario, data, token);
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
