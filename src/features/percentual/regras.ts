// Regra de alteração da apropriação por percentual (espelha canDeleteAllocation do
// app-react): pode alterar/deletar o mês M se HOJE está no próprio mês M (corrente,
// a qualquer momento), OU na carência até o dia 6 (fim do dia) do mês seguinte (M+1).
// Ex.: até 06/06 ainda dá pra editar maio; a partir de 07/06, maio trava.
export function podeAlterarMes(mes: number, ano: number, hoje: Date = new Date()): boolean {
  const ehMesCorrente = hoje.getFullYear() === ano && hoje.getMonth() === mes - 1;
  const inicioMes     = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fimCarencia   = new Date(ano, mes, 6, 23, 59, 59, 999); // dia 6 do mês seguinte
  return ehMesCorrente || (hoje.getTime() > inicioMes.getTime() && hoje.getTime() <= fimCarencia.getTime());
}
