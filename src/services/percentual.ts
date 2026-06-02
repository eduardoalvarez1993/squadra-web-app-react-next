import {
  squadra,
  type PercentualData,
  type PercentualItem,
  type ProjetoBuscaItem,
  type SubprojetoPercentual,
} from './squadra-client';

export type { PercentualData, PercentualItem, ProjetoBuscaItem, SubprojetoPercentual };

export async function getDados(gestorId: number, mes: number, ano: number, token: string): Promise<PercentualData> {
  return squadra.percentual.getDados(gestorId, mes, ano, token);
}

export async function lancar(
  input: { subProjetoId: number; mes: number; ano: number; horas: number; percentual: number; gestorId: number },
  token: string,
): Promise<{ ok: true }> {
  return squadra.percentual.lancar({
    usuarioId:    input.gestorId,
    subProjetoId: input.subProjetoId,
    mes:          input.mes,
    ano:          input.ano,
    horas:        input.horas,
    percentual:   input.percentual,
  }, token);
}

export async function fechar(gestorId: number, mes: number, ano: number, token: string): Promise<{ ok: true }> {
  return squadra.percentual.fechar(gestorId, mes, ano, token);
}

export async function deletar(id: number | string, token: string): Promise<{ ok: true }> {
  return squadra.percentual.deletar(id, token);
}

export async function buscarProjetos(q: string, token: string): Promise<ProjetoBuscaItem[]> {
  return squadra.percentual.buscarProjetos(q, token);
}

export async function getSubprojetos(id: number | string, token: string): Promise<SubprojetoPercentual[]> {
  return squadra.percentual.getSubprojetos(id, token);
}
