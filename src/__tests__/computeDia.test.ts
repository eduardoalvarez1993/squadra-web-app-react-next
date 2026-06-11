import { describe, it, expect } from 'vitest';
import { computeDia } from '@/features/ponto/components/PontoCalendar';
import type { PontoDia } from '@/services/squadra-client';

// "Hoje" fixo (11/06/2026) — os dias testados são passados (não futuros, não hoje).
const HOJE = new Date(2026, 5, 11);

function dia(over: Partial<PontoDia>): PontoDia {
  return {
    data: '05/06/2026', diaSemana: 'Sexta-Feira', fimDeSemana: false,
    horasRealizadas: '00:00', horasPrevistas: '08:00', horasAbono: '00:00',
    projeto: null, falta: false, horaExtra: '00:00', horasFalta: '00:00',
    isFalta: false, isAbono: false, isTravadoId: 0, solicitacaoTravadoId: 0,
    solicitacaoTravadoStatus: '', statusAbono: '', descricaoTipoAbono: '',
    idUnico: 0, confirmaFalta: false, dadosHoraExtra: null, faltaId: 0,
    solicitacaoLiberacaoFaltaId: 0, liberacaoGestor: '', statusLiberacaoFalta: '',
    permissaoLiberacao: false,
    ...over,
  };
}

const temCta = (c: ReturnType<typeof computeDia>, tipo: string) => c.ctas.some((x) => x.tipo === tipo);

describe('computeDia — falta liberada', () => {
  it('liberada pelo gestor (liberacaoGestor S, sem status) e incompleta → "Registrar" (regressão 05/06)', () => {
    const c = computeDia(dia({
      isFalta: true, falta: true, liberacaoGestor: 'S', statusLiberacaoFalta: '',
      horasRealizadas: '06:00', horasFalta: '02:00',
      projeto: [{ horaInicio: '10:00', horaTermino: '13:00', projeto: 'X', tipoApontamento: 'JORNADA' }],
    }), HOJE);
    expect(c.statusText).toBe('Liberado');
    expect(temCta(c, 'registrar')).toBe(true);
    expect(c.aguardarBtn).toBe(false);
  });

  it('liberada (status A) e nada lançado → "Apontar"', () => {
    const c = computeDia(dia({ isFalta: true, statusLiberacaoFalta: 'A', horasRealizadas: '00:00' }), HOJE);
    expect(temCta(c, 'apontar')).toBe(true);
  });

  it('liberada e jornada completa → selo "Liberado", sem CTA', () => {
    const c = computeDia(dia({
      isFalta: true, liberacaoGestor: 'S', horasRealizadas: '08:00',
      projeto: [{ horaInicio: '09:00', horaTermino: '18:00', projeto: 'X', tipoApontamento: 'JORNADA' }],
    }), HOJE);
    expect(c.liberadoBtn).toBe(true);
    expect(c.ctas).toHaveLength(0);
  });

  it('falta NÃO liberada e não solicitada → "Solicitar"', () => {
    const c = computeDia(dia({ isFalta: true, falta: true, faltaId: 123 }), HOJE);
    expect(temCta(c, 'solicitar')).toBe(true);
  });
});

describe('computeDia — feriado vs sem hora prevista', () => {
  it('feriado em dia útil (fimDeSemana true, carga 0) → "Feriado"', () => {
    const c = computeDia(dia({ data: '04/06/2026', diaSemana: 'Quinta-Feira', fimDeSemana: true, horasPrevistas: '00:00' }), HOJE);
    expect(c.statusText).toBe('Feriado');
  });

  it('fim de semana real (sábado) → "Sem hora prevista"', () => {
    const c = computeDia(dia({ data: '06/06/2026', diaSemana: 'Sabado', fimDeSemana: true, horasPrevistas: '00:00' }), HOJE);
    expect(c.statusText).toBe('Sem hora prevista');
  });
});

describe('computeDia — apontamento', () => {
  it('dia sem apontamento → "Registrar"', () => {
    const c = computeDia(dia({ horasRealizadas: '00:00' }), HOJE);
    expect(temCta(c, 'registrar')).toBe(true);
    expect(c.statusText).toBe('Sem apontamento');
  });

  it('jornada incompleta (parte do dia) → "Registrar"', () => {
    const c = computeDia(dia({
      horasRealizadas: '03:22',
      projeto: [{ horaInicio: '09:00', horaTermino: '12:22', projeto: 'X', tipoApontamento: 'JORNADA' }],
    }), HOJE);
    expect(temCta(c, 'registrar')).toBe(true);
  });

  it('jornada completa → sem CTA', () => {
    const c = computeDia(dia({
      horasRealizadas: '08:00',
      projeto: [{ horaInicio: '09:00', horaTermino: '18:00', projeto: 'X', tipoApontamento: 'JORNADA' }],
    }), HOJE);
    expect(c.ctas).toHaveLength(0);
  });
});
