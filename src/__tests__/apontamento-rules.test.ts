import { describe, it, expect } from 'vitest';
import { jornadaExcedeMin, tetoJornadaError } from '@/features/ponto/apontamento-rules';

describe('jornadaExcedeMin', () => {
  it('0 quando dentro da carga', () => {
    expect(jornadaExcedeMin(0, 480, 480)).toBe(0);
    expect(jornadaExcedeMin(240, 120, 480)).toBe(0);
  });
  it('excedente positivo quando passa da carga', () => {
    expect(jornadaExcedeMin(480, 60, 480)).toBe(60);
    expect(jornadaExcedeMin(0, 600, 480)).toBe(120);
  });
});

describe('tetoJornadaError', () => {
  const base = { jaApontadoMin: 0, novoMin: 480, cargaMin: 480, cargaLabel: '08:00', temHEAprovada: false };

  it('null quando o tipo é HORA_EXTRA (excedente é permitido)', () => {
    expect(tetoJornadaError({ ...base, tipoApropriacao: 'HORA_EXTRA', novoMin: 600 })).toBeNull();
  });

  it('null quando JORNADA dentro da carga (igual também passa)', () => {
    expect(tetoJornadaError({ ...base, tipoApropriacao: 'JORNADA', novoMin: 480 })).toBeNull();
    expect(tetoJornadaError({ ...base, tipoApropriacao: 'JORNADA', jaApontadoMin: 240, novoMin: 120 })).toBeNull();
  });

  it('bloqueia JORNADA acima da carga sem HE aprovada (orienta solicitar)', () => {
    const msg = tetoJornadaError({ ...base, tipoApropriacao: 'JORNADA', novoMin: 540 });
    expect(msg).toContain('08:00');
    expect(msg).toMatch(/Solicite hora extra/i);
  });

  it('bloqueia JORNADA acima da carga com HE aprovada (orienta o toggle)', () => {
    const msg = tetoJornadaError({ ...base, tipoApropriacao: 'JORNADA', novoMin: 540, temHEAprovada: true });
    expect(msg).toMatch(/selecione Hora Extra/i);
  });

  it('considera horas já apontadas no total', () => {
    const msg = tetoJornadaError({ ...base, tipoApropriacao: 'JORNADA', jaApontadoMin: 480, novoMin: 60 });
    expect(msg).not.toBeNull();
  });
});
