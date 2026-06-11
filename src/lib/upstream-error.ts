// Extrai a mensagem de negócio do corpo de erro do upstream Squadra.
// Formato comum: { sucesso:false, erros:[...] } (erros podem ser strings ou
// objetos { mensagem }) ou { Mensagem }. Cai no fallback se não for JSON.
export function extractUpstreamMsg(raw: string, fallback = 'Solicitação rejeitada pela API'): string {
  try {
    const d = JSON.parse(raw) as { erros?: unknown; Mensagem?: unknown };
    if (Array.isArray(d?.erros) && d.erros.length) {
      const msg = d.erros
        .map((e) => (typeof e === 'string' ? e : (e as { mensagem?: string })?.mensagem ?? ''))
        .filter(Boolean)
        .join(' ');
      if (msg) return msg;
    }
    if (typeof d?.Mensagem === 'string' && d.Mensagem) return d.Mensagem;
  } catch { /* não é JSON — usa o fallback */ }
  return fallback;
}
