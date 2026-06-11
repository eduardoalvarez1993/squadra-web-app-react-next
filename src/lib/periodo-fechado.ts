// Bloqueio de período fechado do Ponto.
//
// Regra de negócio: um mês fecha às 12:00 (horário de Brasília) do dia 1º do mês
// seguinte. A partir desse instante, nenhum dia daquele mês (ou anterior) aceita
// qualquer ação — registrar, apontar, excluir ou solicitar liberação.
//
// "agora" e "deadline" são comparados como string ISO "YYYY-MM-DDTHH:MM" no fuso
// BRT, o mesmo padrão lexicográfico já usado em page.tsx e nas route handlers.
// Módulo puro (sem React / sem 'use client') para servir client e servidor.

export function isMesFechado(year: number, month: number, now = new Date()): boolean {
  const proxAno = month === 12 ? year + 1 : year;
  const proxMes = month === 12 ? 1 : month + 1;
  const deadline = `${proxAno}-${String(proxMes).padStart(2, '0')}-01T12:00`;

  const hojeIso   = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const horaAgora = now.toLocaleTimeString('en-GB', { timeZone: 'America/Sao_Paulo', hour12: false }).slice(0, 5);

  return `${hojeIso}T${horaAgora}` >= deadline; // "após 12:00" ⇒ a partir do meio-dia
}

// Conveniência p/ rotas e formulário: recebe a data ISO do apontamento (YYYY-MM-DD).
export function isPeriodoFechado(dataISO: string, now = new Date()): boolean {
  const [y, m] = dataISO.split('-').map(Number);
  return isMesFechado(y, m, now);
}
