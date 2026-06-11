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
  input: {
    tipoAbonoId:   number;
    dataInicio:    string;   // ISO yyyy-MM-dd
    dataFim:       string;   // ISO yyyy-MM-dd
    qtdadeHoras:   number;
    justificativa: string;
    anexo?:        string;   // base64 (sem o prefixo data:)
    nomeAnexo?:    string;
    pessoaId:      number;
  },
  token: string,
): Promise<{ ok: true }> {
  // Payload espelha o app-react (/v1/abono/cadastraSolicitacao): faixa de datas
  // dd/MM/yyyy, `tipo` (id), `recId`, `descricao` e anexo opcional em base64.
  return squadra.solicitacoes.solicitarAbono({
    tipo:                  input.tipoAbonoId,
    recId:                 input.pessoaId,
    dataInicioSolicitacao: toUpstreamDate(input.dataInicio),
    dataFimSolicitacao:    toUpstreamDate(input.dataFim),
    qtdadeHoras:           input.qtdadeHoras,
    descricao:             input.justificativa,
    ...(input.anexo     ? { anexo: input.anexo }         : {}),
    ...(input.nomeAnexo ? { nomeAnexo: input.nomeAnexo } : {}),
  }, token);
}

export async function solicitarHoraExtra(
  input: {
    gestorId:   number;
    projetoId:  number;
    data:       string;   // ISO yyyy-MM-dd
    qtdadeHoras: number;
    motivo:     string;
    tipo:       string;
    isNoturno?: 'S' | 'N';
  },
  token: string,
): Promise<{ ok: true }> {
  return squadra.solicitacoes.solicitarHoraExtra({
    id:                input.gestorId,
    // O endpoint horaExtra/cadastraSolicitacao espera ISO yyyy-MM-dd (igual ao
    // app-react: dayjs().format("YYYY-MM-DD")). Enviar dd/MM/yyyy fazia o backend
    // (.NET, cultura US) ler como MM/dd → trocava dia↔mês (09/06 virava 6 set).
    dataSolicitacao:   input.data,
    qtdadeHoras:       input.qtdadeHoras,
    motivoSolicitacao: input.motivo,
    tipo:              input.tipo,
    projeto:           input.projetoId,
    isNoturno:         input.isNoturno ?? 'N',
  }, token);
}
