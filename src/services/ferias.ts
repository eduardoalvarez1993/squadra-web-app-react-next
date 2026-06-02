import {
  squadra,
  type FeriasDados,
  type FeriasHistoricoItem,
  type FeriasSolicitarInput,
} from './squadra-client';

function toUpstreamDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export async function getFeriasDados(gestorId: number, token: string): Promise<FeriasDados> {
  return squadra.ferias.getDados(gestorId, token);
}

export async function getFeriasHistorico(
  gestorId: number,
  token: string,
): Promise<FeriasHistoricoItem[]> {
  return squadra.ferias.getHistorico(gestorId, token);
}

export async function solicitarFerias(
  gestorId: number,
  dataInicio: string,
  dataFim: string,
  token: string,
): Promise<{ ok: true }> {
  const body: FeriasSolicitarInput = {
    idColaborador: gestorId,
    dataInicio:    toUpstreamDate(dataInicio),
    dataFim:       toUpstreamDate(dataFim),
  };
  return squadra.ferias.solicitar(body, token);
}
