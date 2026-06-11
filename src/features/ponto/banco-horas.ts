// Banco de horas — data e tipo do próximo ciclo (espelha getNextDiscountDate do app-react).
//
// Regra de ciclos:
// - saldo NEGATIVO → desconto no pagamento, no 1º dia do mês seguinte;
// - saldo POSITIVO → pagamento das horas, no início do próximo trimestre (1º de mar/jun/set/dez).

export type CicloBanco = {
  tipo:   'desconto' | 'pagamento';
  verbo:  string;   // "descontado" | "pago"
  rotulo: string;   // "negativo" | "positivo"
  dataBR: string;   // DD/MM/YYYY
};

export function cicloBancoHoras(saldoNegativo: boolean, now: Date = new Date()): CicloBanco {
  return {
    tipo:   saldoNegativo ? 'desconto'   : 'pagamento',
    verbo:  saldoNegativo ? 'descontado' : 'pago',
    rotulo: saldoNegativo ? 'negativo'   : 'positivo',
    dataBR: proximoDescontoBR(saldoNegativo, now),
  };
}

export function proximoDescontoBR(saldoNegativo: boolean, now: Date = new Date()): string {
  const y = now.getFullYear();
  let alvo: Date;

  if (saldoNegativo) {
    alvo = new Date(y, now.getMonth() + 1, 1); // 1º do mês seguinte
  } else {
    const trimestres = [
      new Date(y, 2, 1),  // 1º mar
      new Date(y, 5, 1),  // 1º jun
      new Date(y, 8, 1),  // 1º set
      new Date(y, 11, 1), // 1º dez
    ];
    alvo = trimestres.find((d) => d > now) ?? new Date(y + 1, 2, 1);
  }

  const dd = String(alvo.getDate()).padStart(2, '0');
  const mm = String(alvo.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${alvo.getFullYear()}`;
}
