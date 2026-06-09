// Cache da foto de perfil (base64) em sessionStorage, indexado por pessoaId.
//
// Por que sessionStorage e não localStorage:
//  - A foto é PII derivada da sessão; sobrevive ao F5 (objetivo) mas é limpa ao
//    fechar a aba — mínima retenção, melhor em máquina compartilhada.
//  - O source of truth continua sendo o cookie httpOnly + /api/auth/me.
//
// Por que indexar por pessoaId:
//  - Durante simulação o /me busca a foto do SIMULADO (getById(pessoaId)). Com a
//    chave por pessoaId, cada identidade tem seu slot — entrar/sair da simulação
//    lê/grava o slot certo, sem foto stale vazando entre gestor e simulado.

const PREFIX = 'sq:foto:';
const MAX_LEN = 2_000_000; // ~2MB de base64; acima disso não cacheia (evita estourar a cota)

export function getFotoCache(pessoaId: number | null | undefined): string | null {
  if (!pessoaId || typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(PREFIX + pessoaId);
  } catch {
    return null; // modo privado / cota — cache é best-effort
  }
}

export function setFotoCache(pessoaId: number | null | undefined, foto: string | null): void {
  if (!pessoaId || typeof window === 'undefined') return;
  try {
    if (foto && foto.length <= MAX_LEN) {
      window.sessionStorage.setItem(PREFIX + pessoaId, foto);
    } else if (!foto) {
      window.sessionStorage.removeItem(PREFIX + pessoaId);
    }
    // foto > MAX_LEN: não cacheia, mas também não apaga um cache válido anterior.
  } catch {
    /* cota cheia / modo privado — ignora */
  }
}
