// Regras puras do Abono — espelham o app-react (abono/index.tsx). Sem React.
//
// ⚠️ Os IDs de tipo de abono (9,10,11,12,13,21) são hardcoded como no app-react.
// É frágil: se o backend renumerar os tipos, a regra quebra. Idealmente o
// /v1/retornaListaTipoAbono traria um campo indicando a regra (dias/horas).

export const ABONO_TIPO = {
  FERIAS:  12,  // +19 dias corridos, 20 × 8h
  LICENCA: 13,  // +1 dia, 2 × 8h
} as const;

// Tipos que exibem grau de parentesco (luto) e calculam dias por grau.
export const TIPOS_PARENTESCO: readonly number[] = [9, 10];
// Tipos que permitem "Dia inteiro" vs "Definir horas".
export const TIPOS_DEFINIR_HORAS: readonly number[] = [11, 21];

export const GRAUS_PARENTESCO = ['PAI', 'MÃE', 'CÔNJUGE', 'FILHO', 'AVÓS', 'TIOS', 'IRMÃOS'] as const;
export type GrauParentesco = typeof GRAUS_PARENTESCO[number];

export function tipoExibeParentesco(tipo: number): boolean {
  return TIPOS_PARENTESCO.includes(tipo);
}
export function tipoExibeDefinirHoras(tipo: number): boolean {
  return TIPOS_DEFINIR_HORAS.includes(tipo);
}

// Soma dias a uma data ISO (yyyy-MM-dd) usando UTC para não sofrer com fuso.
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

// Quantidade de dias entre início e fim (inclusivo). Mínimo 1.
export function diffDaysInclusive(inicioISO: string, fimISO: string): number {
  const [y1, m1, d1] = inicioISO.split('-').map(Number);
  const [y2, m2, d2] = fimISO.split('-').map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  const dias = Math.round((b - a) / 86_400_000) + 1;
  return Math.max(1, dias);
}

// Defaults ao escolher o tipo (espelha handleTypeChange do app-react).
export function defaultsForTipo(tipo: number, dataInicioISO: string): { dataFim: string; qtdadeHoras: number } {
  switch (tipo) {
    case ABONO_TIPO.FERIAS:  return { dataFim: addDaysISO(dataInicioISO, 19), qtdadeHoras: 20 * 8 };
    case ABONO_TIPO.LICENCA: return { dataFim: addDaysISO(dataInicioISO, 1),  qtdadeHoras: 2 * 8 };
    default:                 return { dataFim: dataInicioISO,                 qtdadeHoras: 8 };
  }
}

// Defaults ao escolher o grau de parentesco (tipos 9/10).
export function defaultsForParentesco(grau: GrauParentesco, dataInicioISO: string): { dataFim: string; qtdadeHoras: number } {
  switch (grau) {
    case 'PAI':
    case 'MÃE':
    case 'CÔNJUGE':
    case 'FILHO':
      return { dataFim: addDaysISO(dataInicioISO, 4), qtdadeHoras: 5 * 8 };
    case 'AVÓS':
    case 'TIOS':
    case 'IRMÃOS':
      return { dataFim: addDaysISO(dataInicioISO, 1), qtdadeHoras: 2 * 8 };
    default:
      return { dataFim: dataInicioISO, qtdadeHoras: 8 };
  }
}

// "Dia inteiro": dias selecionados × 8h.
export function horasDiaInteiro(dataInicioISO: string, dataFimISO: string): number {
  return diffDaysInclusive(dataInicioISO, dataFimISO) * 8;
}

// "Definir horas": horas a partir de um intervalo HH:MM (mín 1h, máx 8h).
export function horasFromRange(inicio: string, fim: string): { horas: number; error: string | null } {
  if (!inicio || !fim) return { horas: 0, error: 'Informe horário de início e fim.' };
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  const diffMin = (hf * 60 + mf) - (hi * 60 + mi);
  if (diffMin <= 0) return { horas: 0, error: 'O horário final deve ser maior que o inicial.' };
  const horas = diffMin / 60;
  if (horas < 1) return { horas: 0, error: 'O período mínimo é de 1 hora.' };
  if (horas > 8) return { horas: 0, error: 'O período máximo é de 8 horas.' };
  return { horas, error: null };
}
