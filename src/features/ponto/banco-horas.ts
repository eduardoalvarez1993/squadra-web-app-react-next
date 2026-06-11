// Banco de horas — data prevista de desconto (espelha getNextDiscountDate do app-react).
//
// Regra de ciclos: saldo NEGATIVO é descontado no 1º do mês seguinte; saldo
// POSITIVO zera no início do próximo trimestre (1º de mar/jun/set/dez).

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
