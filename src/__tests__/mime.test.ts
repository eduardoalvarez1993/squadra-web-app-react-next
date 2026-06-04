import { describe, it, expect } from 'vitest';
import { detectMime } from '@/lib/mime';
import { casosMime } from '@/__tests__/fixtures';

describe('detectMime', () => {
  it.each(casosMime)('%s → %s', (b64, esperado) => {
    expect(detectMime(b64)).toBe(esperado);
  });

  it('JPEG base64 começa com /9j/ → image/jpeg (não octet-stream)', () => {
    expect(detectMime('/9j/4AAQSkZJ')).toBe('image/jpeg');
  });

  it('vazio e lixo → application/octet-stream', () => {
    expect(detectMime('')).toBe('application/octet-stream');
    expect(detectMime('xxxxlixo')).toBe('application/octet-stream');
  });
});
