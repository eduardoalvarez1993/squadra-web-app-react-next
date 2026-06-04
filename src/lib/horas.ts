/**
 * Cálculo de horas para solicitações (hora extra).
 * Extraído de api/solicitacoes/hora-extra/route.ts para ser testável (Fase 1).
 */

/** "HH:MM" → minutos. NaN-safe via fallback "00:00". */
export function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = (hhmm ?? '00:00').split(':').map(Number);
  return h * 60 + m;
}

/**
 * Duração em horas (decimal). Para hora extra noturna que cruza a meia-noite
 * (ex.: 23:00→01:00), o fim é no dia seguinte: soma 24h quando fim <= início.
 */
export function calcHoras(inicio: string, fim: string, isNoturno: 'S' | 'N'): number {
  let diff = toMinutes(fim) - toMinutes(inicio);
  if (diff <= 0 && isNoturno === 'S') diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}
