import { squadra, type AbonoItem, type TipoAbono } from './squadra-client';

export { type AbonoItem, type TipoAbono };

function toUpstreamDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export async function getAbonos(pessoaId: number, token: string): Promise<AbonoItem[]> {
  return squadra.solicitacoes.getAbonos(pessoaId, token);
}

export async function getTiposAbono(token: string): Promise<TipoAbono[]> {
  return squadra.solicitacoes.getTiposAbono(token);
}

export async function solicitarAbono(
  input: { tipoAbonoId: number; data: string; qtdadeHoras: number; justificativa: string; pessoaId: number },
  token: string,
): Promise<{ ok: true }> {
  return squadra.solicitacoes.solicitarAbono({
    tipoAbonoId:   input.tipoAbonoId,
    recId:         input.pessoaId,
    data:          toUpstreamDate(input.data),
    qtdadeHoras:   input.qtdadeHoras,
    justificativa: input.justificativa,
  }, token);
}

export async function solicitarHoraExtra(
  input: { projetoId: number; data: string; horaInicio: string; horaFim: string; tipo: string; pessoaId: number },
  token: string,
): Promise<{ ok: true }> {
  return squadra.solicitacoes.solicitarHoraExtra({
    usuarioId:  input.pessoaId,
    projetoId:  input.projetoId,
    data:       toUpstreamDate(input.data),
    horaInicio: input.horaInicio,
    horaFim:    input.horaFim,
    tipo:       input.tipo,
  }, token);
}
