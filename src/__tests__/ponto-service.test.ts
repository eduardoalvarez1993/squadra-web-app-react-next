import { describe, it, expect } from 'vitest';
import { buildNovoApontamentoPayload } from '@/services/ponto';

describe('buildNovoApontamentoPayload', () => {
  const baseInput = {
    data:            '2026-06-02',
    horaInicio:      '08:00',
    horaFinal:       '17:00',
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

  it('descricao vazia quando justificativa ausente', () => {
    const { justificativa: _omit, ...semJust } = baseInput;
    void _omit;
    const payload = buildNovoApontamentoPayload(semJust);
    expect(payload.apontamentos[0].descricao).toBe('');
  });

  it('REGRESSÃO: data propagada no formato YYYY-MM-DD nos 3 blocos', () => {
    const payload = buildNovoApontamentoPayload({ ...baseInput, data: '2026-12-31' });
    expect(payload.apontamentos[0].data).toBe('2026-12-31');
    expect(payload.justificativas[0].data).toBe('2026-12-31');
    expect(payload.aceites[0].data).toBe('2026-12-31');
    // não pode ser DD/MM/YYYY
    expect(payload.apontamentos[0].data).not.toContain('/');
  });

  it('tipoApropriacao sempre JORNADA', () => {
    const payload = buildNovoApontamentoPayload(baseInput);
    expect(payload.apontamentos[0].tipoApropriacao).toBe('JORNADA');
  });
});
