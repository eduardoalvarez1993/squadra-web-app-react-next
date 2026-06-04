import { describe, it, expect } from 'vitest';
import { PostItemSchema } from '@/services/squadra-client';
import { rawPosts } from '@/__tests__/fixtures';

// ── PostItemSchema ─────────────────────────────────────────────────────────────

describe('PostItemSchema', () => {
  it('lê idPost/remetenteID e curtidas como array de números', () => {
    const r = PostItemSchema.parse(rawPosts.retorno[0]);
    expect(r.idPost).toBe(1);
    expect(r.remetenteID).toBe(200);
    expect(r.curtidas).toEqual([200, 300]);
    expect(r.numComentarios).toBe(2);
  });

  it('aplausos usa valor explícito quando presente', () => {
    const r = PostItemSchema.parse(rawPosts.retorno[0]);
    expect(r.aplausos).toBe(2);
  });

  it('aplica alias id→idPost e default aplausos=curtidas.length', () => {
    const r = PostItemSchema.parse(rawPosts.retorno[1]);
    expect(r.idPost).toBe(2);
    expect(r.remetenteNome).toBe('Maria');
    expect(r.curtidas).toEqual([]);
    expect(r.aplausos).toBe(0);
  });

  it('tipoPublicacao default "C" quando ausente', () => {
    expect(PostItemSchema.parse({ idPost: 5 }).tipoPublicacao).toBe('C');
  });

  it('curtidas não-array vira []', () => {
    expect(PostItemSchema.parse({ idPost: 6, curtidas: null }).curtidas).toEqual([]);
  });

  it('campos opcionais ausentes ficam null', () => {
    const r = PostItemSchema.parse({ idPost: 7 });
    expect(r.destinatarioNome).toBeNull();
    expect(r.mensagem).toBeNull();
    expect(r.titulo).toBeNull();
    expect(r.categoria).toBeNull();
  });
});
