/**
 * Normalização de status de solicitações (abono/férias/falta/hora-extra) para a
 * chave usada pelos badges da UI.
 *
 * Consolida as duas implementações antes duplicadas (DEBT-002):
 *   - `statusMap`   (rh/page.tsx)    — só tratava 'A'/'R'/'C' maiúsculos
 *   - `statusLabel` (gestao/page.tsx) — versão robusta (texto + numérico)
 *
 * Esta é a versão robusta: aceita single-char, texto por extenso e o código
 * numérico do upstream (1=aprovado, 2=reprovado), case-insensitive.
 */
export type StatusKey = 'pendente' | 'aprovado' | 'reprovado' | 'cancelado';

export function statusLabel(s: string | number): StatusKey {
  const v = String(s).toLowerCase();
  if (v === 'a' || v === 'aprovado'  || v === '1') return 'aprovado';
  if (v === 'r' || v === 'reprovado' || v === '2') return 'reprovado';
  if (v === 'c' || v === 'cancelado')              return 'cancelado';
  return 'pendente';
}
