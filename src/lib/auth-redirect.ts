/**
 * Helpers de sessão expirada (client-side).
 *
 * Contexto: a sessão é um cookie iron-session contendo o token da Squadra.
 * Quando o token expira (ou o cookie some), TODA chamada /api/* responde 401.
 * Sem um tratamento global, cada componente mostra "não autenticado" e o app
 * vira uma casca quebrada. Estes helpers centralizam: detectar o 401 e mandar
 * a pessoa para o /login preservando a rota atual em ?next=.
 */

/** Detecta 401 de forma robusta: alguns hooks lançam `new Error('401')`
 *  (status só na mensagem), outros anexam `.status`. Cobre os dois. */
export function is401(error: unknown): boolean {
  const e = error as { status?: number; message?: string } | null;
  return e?.status === 401 || e?.message === '401';
}

/** Lê o destino pós-login do ?next=, validando que é um caminho interno
 *  (evita open-redirect via `//host` ou URL absoluta). */
export function safeNext(raw: string | null, fallback = '/home'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
}

/** Monta /login?reason=expired&next=<rota atual>. Sem efeito se já estamos
 *  no /login (evita loop de redirect). Só roda no browser. */
export function loginUrlWithNext(): string {
  if (typeof window === 'undefined') return '/login';
  const { pathname, search } = window.location;
  if (pathname.startsWith('/login')) return '/login';
  return `/login?reason=expired&next=${encodeURIComponent(pathname + search)}`;
}

/** Redireciona para o login preservando a rota atual. */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/login')) return;
  window.location.href = loginUrlWithNext();
}
