import {
  squadra,
  type PercentualData,
  type PercentualItem,
  type ProjetoBuscaItem,
  type SubprojetoPercentual,
  type ProjetoAlocado,
} from './squadra-client';

export type { PercentualData, PercentualItem, ProjetoBuscaItem, SubprojetoPercentual, ProjetoAlocado };

export async function getDados(gestorId: number, mes: number, ano: number, token: string): Promise<PercentualData> {
  return squadra.percentual.getDados(gestorId, mes, ano, token);
}

// Uma alocação está ativa no mês se o período [dataAlocacao, dataTermino]
// cobre qualquer parte do mês selecionado (overlap). Datas ausentes = sem limite.
function ativaNoMes(p: ProjetoAlocado, mes: number, ano: number): boolean {
  const mesIni = Date.UTC(ano, mes - 1, 1);
  const mesFim = Date.UTC(ano, mes, 0, 23, 59, 59);
  const ini = p.dataAlocacao ? Date.parse(p.dataAlocacao) : NaN;
  const fim = p.dataTermino  ? Date.parse(p.dataTermino)  : NaN;
  if (!Number.isNaN(ini) && ini > mesFim) return false;
  if (!Number.isNaN(fim) && fim < mesIni) return false;
  return true;
}

// Projetos para pré-preencher a distribuição do mês vazio.
// Primária: /projetos/alocados (traz dataAlocacao/dataTermino) → só as alocações
// ATIVAS no mês escolhido. Gestores sem alocação de ponto caem nos projetos que
// gerem (retornaProjetosDeUmGestor, sem datas). Só ficam linhas com subprojeto.
export async function getAlocacoesParaDistribuir(gestorId: number, mes: number, ano: number, token: string): Promise<ProjetoAlocado[]> {
  const alocados = await squadra.ponto.getProjetosAlocados(gestorId, token);
  const ativas = alocados.filter((p) => p.subProjetos.length > 0 && ativaNoMes(p, mes, ano));
  if (ativas.length > 0) return ativas;

  let servicos: Awaited<ReturnType<typeof squadra.gestao.getServicos>> = [];
  try {
    servicos = await squadra.gestao.getServicos(gestorId, token);
  } catch { /* sem permissão/sem projetos — devolve vazio */ }

  return servicos
    .filter((s) => s.subprojetos.length > 0)
    .map((s): ProjetoAlocado => ({
      id:           Number(s.id),
      nome:         s.nome,
      cliente:      s.cliente,
      dataAlocacao: null,
      dataTermino:  null,
      subProjetos:  s.subprojetos.map((sp) => ({ id: Number(sp.id), nome: sp.nome })),
    }));
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
