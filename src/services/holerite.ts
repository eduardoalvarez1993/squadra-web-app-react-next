import { squadra, type HoleriteAno, type HistoricoSalarialItem } from './squadra-client';

export async function getHoleriteAno(ano: number, token: string): Promise<HoleriteAno> {
  return squadra.holerite.getAno(ano, token);
}

export async function getHistoricoSalarial(token: string): Promise<HistoricoSalarialItem[]> {
  return squadra.holerite.getHistorico(token);
}
