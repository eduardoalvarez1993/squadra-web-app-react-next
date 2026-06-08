/**
 * Acesso ao módulo Marketing.
 *
 * Fonte ÚNICA: a permissão `perfilMarketing` de `GET /v1/pessoa/permissoes/{id}`.
 *
 * ✅ A flag está populada e o endpoint funciona corretamente (validado 2026-06-08):
 * retorna `true` para o time de Marketing — Aglaia Oliveira (566) e Giulia Cardoso (1056).
 * Por decisão (2026-06-08), o acesso é controlado SOMENTE pela permissão — sem fallback
 * por cargo. Quem precisar do menu (ex.: HEAD OF COMMUNITY) deve ter `perfilMarketing`
 * marcado pela TI.
 */
export function temAcessoMarketing(perfilMarketing: boolean | undefined): boolean {
  return Boolean(perfilMarketing);
}
