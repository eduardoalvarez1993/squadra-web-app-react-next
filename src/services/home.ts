import { squadra, type ColaboradorResumo, type SaldoHoras, type SaldoGlobalItem } from './squadra-client';

export async function getAniversariantes(token: string): Promise<ColaboradorResumo[]> {
  return squadra.home.aniversariantes(token);
}

export async function getNovosColabs(token: string): Promise<ColaboradorResumo[]> {
  return squadra.home.novosColabs(token);
}

export async function getSaldoProprio(gestorId: number, token: string): Promise<SaldoHoras> {
  return squadra.home.saldoProprio(gestorId, token);
}

export async function getSaldoGlobal(token: string): Promise<SaldoGlobalItem[]> {
  return squadra.home.saldoGlobal(token);
}
