/**
 * Detecção de MIME por assinatura (magic bytes) de um base64.
 * Extraído de rh/page.tsx para ser testável (Fase 1).
 *
 * ⚠️ JPEG base64 começa com "/9j/" — nunca usar startsWith('/') para inferir URL.
 */
export function detectMime(b64: string): string {
  if (b64.startsWith('JVBERi')) return 'application/pdf';
  if (b64.startsWith('/9j/'))   return 'image/jpeg';
  if (b64.startsWith('iVBOR'))  return 'image/png';
  if (b64.startsWith('R0lGO'))  return 'image/gif';
  return 'application/octet-stream';
}
