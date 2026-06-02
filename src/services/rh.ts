import {
  squadra,
  type AbonoRH,
  type FeriasRHItem,
  type AvaliarAbonoBody,
  type AvaliarFeriasBody,
} from './squadra-client';

export async function getRHAbonos(status: 'P' | 'A' | 'R', token: string): Promise<AbonoRH[]> {
  return squadra.rh.getAbonos(status, token);
}

export async function downloadAbonoAnexo(id: string | number, token: string): Promise<{ arquivo: string }> {
  return squadra.rh.downloadAnexo(id, token) as Promise<{ arquivo: string }>;
}

export async function getRHFerias(gestorId: number, token: string): Promise<FeriasRHItem[]> {
  return squadra.rh.getFerias(gestorId, token);
}

export async function avaliarAbono(body: AvaliarAbonoBody, token: string): Promise<{ ok: true }> {
  return squadra.rh.avaliarAbono(body, token);
}

export async function avaliarFeriasRH(
  body: AvaliarFeriasBody,
  token: string,
): Promise<{ ok: true }> {
  return squadra.rh.avaliarFerias(body, token);
}
