/**
 * Acesso ao módulo RH / Departamento Pessoal.
 *
 * Fonte ÚNICA: a permissão `perfilDP` de `GET /v1/pessoa/permissoes/{id}`.
 *
 * O fallback provisório por cargo ("PERSONNEL …") foi removido — o acesso passa a
 * ser controlado exclusivamente pela permissão. Quem precisar do menu deve ter
 * `perfilDP` marcado pela TI (mesma política do Marketing).
 */
export function temAcessoDP(perfilDP: boolean | undefined): boolean {
  return Boolean(perfilDP);
}
