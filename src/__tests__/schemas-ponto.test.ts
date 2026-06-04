import { describe, it, expect } from 'vitest';
import { DadosColabSchema } from '@/services/squadra-client';
import { rawDadosColab, pontoDias } from '@/__tests__/fixtures';

// ── DadosColabSchema ───────────────────────────────────────────────────────────
// retorno → MesPonto[]; cada mês traz dados → PontoDia[].

describe('DadosColabSchema', () => {
  const meses = DadosColabSchema.parse(rawDadosColab);

  it('retorno → array de MesPonto', () => {
    expect(meses).toHaveLength(1);
    expect(meses[0].saldo).toBe('02:30');
    expect(meses[0].mes).toBe('Junho/2026');
    expect(Array.isArray(meses[0].dados)).toBe(true);
    expect(meses[0].dados).toHaveLength(5);
  });

  it('dia com projeto → projeto vira array de ApontamentoDia', () => {
    const dias = meses[0].dados;
    const diaOk = dias.find((d) => d.data === '02/06/2026')!;
    expect(Array.isArray(diaOk.projeto)).toBe(true);
    expect(diaOk.projeto).toHaveLength(1);
    expect(diaOk.projeto![0]).toEqual({
      horaInicio:      '08:00',
      horaTermino:     '17:00',
      projeto:         'Alpha',
      tipoApontamento: 'JORNADA',
    });
  });

  it('dia sem projeto → projeto null', () => {
    const dias = meses[0].dados;
    const pendente = dias.find((d) => d.data === '03/06/2026')!;
    expect(pendente.projeto).toBeNull();
  });

  it('mapeia isFalta para dia de falta', () => {
    const dias = meses[0].dados;
    const falta = dias.find((d) => d.data === '01/06/2026')!;
    expect(falta.isFalta).toBe(true);
    expect(falta.falta).toBe(true);
  });

  it('mapeia isAbono e campos de abono', () => {
    const dias = meses[0].dados;
    const abono = dias.find((d) => d.data === '04/06/2026')!;
    expect(abono.isAbono).toBe(true);
    expect(abono.horasAbono).toBe('08:00');
    expect(abono.descricaoTipoAbono).toBe('Atestado');
    expect(abono.statusAbono).toBe('A');
  });

  it('preserva horaExtra default e fimDeSemana', () => {
    const dias = meses[0].dados;
    const fds = dias.find((d) => d.data === '06/06/2026')!;
    expect(fds.fimDeSemana).toBe(true);
    expect(fds.horaExtra).toBe('00:00');
  });

  it('parseia PontoDia isolado com dadosHoraExtra null quando vazio', () => {
    const mes = DadosColabSchema.parse({
      retorno: [{ saldo: '00:00', mes: 'X', dataFechamento: '', dados: [pontoDias.pontoDiaOk] }],
    });
    expect(mes[0].dados[0].dadosHoraExtra).toBeNull();
    expect(mes[0].dados[0].horaExtra).toBe('00:00');
  });

  it('retorna [] quando retorno ausente', () => {
    expect(DadosColabSchema.parse({})).toEqual([]);
  });
});
