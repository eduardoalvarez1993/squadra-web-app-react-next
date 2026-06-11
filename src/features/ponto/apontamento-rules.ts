// Regras puras do apontamento de Ponto — sem React, testáveis isoladamente.
// Espelham as validações do app-react (adicionarPeriodos.tsx).

export type TipoApropriacao = 'JORNADA' | 'HORA_EXTRA';

export const MSG_CARGA_ZERO = 'Dia sem hora prevista. Para registrar, solicite hora extra.';

// Dia de carga 0 (fim de semana/feriado): só permite registrar se houver HORA
// EXTRA aprovada (vira HORA_EXTRA até o teto). Sem aprovação, bloqueia — não há
// jornada a cumprir nesse dia. Retorna a mensagem de bloqueio ou null.
export function cargaZeroBloqueio(cargaMin: number, heAprovadaMin: number): string | null {
  if (cargaMin === 0 && heAprovadaMin <= 0) return MSG_CARGA_ZERO;
  return null;
}

// Excedente da jornada sobre a carga do dia, em minutos (0 quando não excede).
export function jornadaExcedeMin(jaApontadoMin: number, novoMin: number, cargaMin: number): number {
  return Math.max(0, jaApontadoMin + novoMin - cargaMin);
}

// Teto da jornada: como JORNADA, o total do dia (já apontado + novo) não pode
// ultrapassar a carga prevista — o excedente só entra como HORA_EXTRA aprovada.
// Retorna a mensagem de bloqueio ou null. `cargaLabel` é a carga formatada (HH:MM).
export function tetoJornadaError(args: {
  tipoApropriacao: TipoApropriacao;
  jaApontadoMin:   number;
  novoMin:         number;
  cargaMin:        number;
  cargaLabel:      string;
  temHEAprovada:   boolean;
}): string | null {
  if (args.tipoApropriacao !== 'JORNADA') return null;
  if (args.jaApontadoMin + args.novoMin <= args.cargaMin) return null;
  // Com HE aprovada o usuário só precisa alternar o toggle; sem ela, precisa
  // solicitar hora extra antes de poder registrar além do previsto.
  return args.temHEAprovada
    ? `Para registrar além de ${args.cargaLabel}, selecione Hora Extra.`
    : `A carga de ${args.cargaLabel} não pode ser excedida como jornada. Solicite hora extra para registrar além do previsto.`;
}
