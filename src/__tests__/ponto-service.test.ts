import { describe, it, expect } from 'vitest';
import { buildNovoApontamentoPayload } from '@/services/ponto';

describe('buildNovoApontamentoPayload', () => {
  const baseInput = {
    data:            '2026-06-02',
    periodos:        [{ horaInicio: '08:00', horaFinal: '17:00' }],
    projetoId:       1,
    subprojetoId:    10,
    tipoApropriacao: 'JORNADA' as const,
    justificativa:   'Reunião',
    usuarioId:       100,
    login:           'joao.silva',
  };

  it('monta o payload aninhado (dadosGerais + apontamentos + justificativas + aceites)', () => {
    const payload = buildNovoApontamentoPayload(baseInput);

    expect(payload.dadosGeraisApontamento).toEqual({ usuarioId: 100, login: 'joao.silva' });

    expect(payload.apontamentos).toHaveLength(1);
    expect(payload.apontamentos[0]).toEqual({
      projetoId:       1,
      subProjetoId:    10,
      descricao:       'Reunião',
      data:            '2026-06-02',
      horaInicio:      '08:00',
      horaFinal:       '17:00',
      tipoApropriacao: 'JORNADA',
    });

    expect(payload.justificativas).toEqual([
      { data: '2026-06-02', textoJustificativa: 'Apontamento Realizado Via APP' },
    ]);

    expect(payload.aceites).toEqual([{ data: '2026-06-02' }]);
  });

  it('subProjetoId default 0 quando subprojetoId ausente', () => {
    const { subprojetoId: _omit, ...semSub } = baseInput;
    void _omit;
    const payload = buildNovoApontamentoPayload(semSub);
    expect(payload.apontamentos[0].subProjetoId).toBe(0);
  });

  it('subProjetoId default 0 quando subprojetoId é undefined explícito', () => {
    const payload = buildNovoApontamentoPayload({ ...baseInput, subprojetoId: undefined });
    expect(payload.apontamentos[0].subProjetoId).toBe(0);
  });

  it('descricao default "." quando justificativa ausente (upstream exige ≥1 char)', () => {
    const { justificativa: _omit, ...semJust } = baseInput;
    void _omit;
    const payload = buildNovoApontamentoPayload(semJust);
    expect(payload.apontamentos[0].descricao).toBe('.');
  });

  it('descricao default "." quando justificativa é só espaços', () => {
    const payload = buildNovoApontamentoPayload({ ...baseInput, justificativa: '   ' });
    expect(payload.apontamentos[0].descricao).toBe('.');
  });

  it('REGRESSÃO: data propagada no formato YYYY-MM-DD nos 3 blocos', () => {
    const payload = buildNovoApontamentoPayload({ ...baseInput, data: '2026-12-31' });
    expect(payload.apontamentos[0].data).toBe('2026-12-31');
    expect(payload.justificativas[0].data).toBe('2026-12-31');
    expect(payload.aceites[0].data).toBe('2026-12-31');
    // não pode ser DD/MM/YYYY
    expect(payload.apontamentos[0].data).not.toContain('/');
  });

  it('tipoApropriacao JORNADA propaga e usa justificativa padrão de jornada', () => {
    const payload = buildNovoApontamentoPayload(baseInput);
    expect(payload.apontamentos[0].tipoApropriacao).toBe('JORNADA');
    expect(payload.justificativas[0].textoJustificativa).toBe('Apontamento Realizado Via APP');
  });

  it('tipoApropriacao HORA_EXTRA propaga e usa textos de hora extra', () => {
    const { justificativa: _omit, ...semJust } = baseInput;
    void _omit;
    const payload = buildNovoApontamentoPayload({ ...semJust, tipoApropriacao: 'HORA_EXTRA' });
    expect(payload.apontamentos[0].tipoApropriacao).toBe('HORA_EXTRA');
    // descrição default específica de hora extra (sem justificativa do usuário)
    expect(payload.apontamentos[0].descricao).toBe('hora extra aprovada');
    expect(payload.justificativas[0].textoJustificativa).toBe('Hora Extra Aprovada Via APP');
  });

  it('vários períodos viram vários apontamentos (mesmo projeto/sub/descrição)', () => {
    const payload = buildNovoApontamentoPayload({
      ...baseInput,
      periodos: [
        { horaInicio: '08:00', horaFinal: '12:00' },
        { horaInicio: '13:00', horaFinal: '17:00' },
      ],
    });
    expect(payload.apontamentos).toHaveLength(2);
    expect(payload.apontamentos[0]).toMatchObject({ horaInicio: '08:00', horaFinal: '12:00', subProjetoId: 10, descricao: 'Reunião' });
    expect(payload.apontamentos[1]).toMatchObject({ horaInicio: '13:00', horaFinal: '17:00', subProjetoId: 10, descricao: 'Reunião' });
  });
});
