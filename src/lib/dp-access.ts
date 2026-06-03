/**
 * Acesso ao módulo RH / Departamento Pessoal.
 *
 * Fonte oficial: a permissão `perfilDP` de `GET /v1/pessoa/permissoes/{id}`.
 *
 * ⚠️ PENDÊNCIA TI: hoje essa flag está não-populada na API Squadra — retorna `false`
 * para todos, inclusive para a gerente do DP (Vera, "PERSONNEL ADMINISTRATION MANAGER").
 * Enquanto a TI não corrige/popula o `perfilDP`, liberamos o acesso TAMBÉM por cargo
 * que contenha "PERSONNEL". Quando o backend for ajustado, remover o fallback por cargo
 * e manter apenas o `perfilDP`.
 */
export function temAcessoDP(
  perfilDP: boolean | undefined,
  cargo: string | null | undefined,
): boolean {
  if (perfilDP) return true;                 // fonte oficial (quando populada)
  return /personnel/i.test(cargo ?? '');     // fallback provisório por cargo — validar com TI
}
