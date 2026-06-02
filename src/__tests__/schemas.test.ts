import { describe, it, expect } from 'vitest';
import {
  FeriasDadosSchema,
  ServicosGestorSchema,
  PapeisSchema,
  PercentualDataSchema,
  extractRetornoList,
} from '@/services/squadra-client';

// ── extractRetornoList ────────────────────────────────────────────────────────

describe('extractRetornoList', () => {
  it('retorna array direto quando raw é array', () => {
    expect(extractRetornoList([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('extrai retorno.retorno quando existe', () => {
    const raw = { retorno: { retorno: ['a', 'b'] } };
    expect(extractRetornoList(raw)).toEqual(['a', 'b']);
  });

  it('extrai retorno quando é array direto', () => {
    const raw = { retorno: ['x', 'y'] };
    expect(extractRetornoList(raw)).toEqual(['x', 'y']);
  });

  it('retorna [] para estrutura desconhecida', () => {
    expect(extractRetornoList({ foo: 'bar' })).toEqual([]);
  });
});

// ── FeriasDadosSchema ─────────────────────────────────────────────────────────

describe('FeriasDadosSchema', () => {
  it('parseia response com wrapper retorno', () => {
    const raw = {
      retorno: {
        saldoFeriasColaborador:            15,
        inicioPeriodoDeGozoColaborador:    '2026-07-01',
        terminoPeriodoDeGozoColaborador:   '2026-07-30',
        dataLimiteFerias:                  '2026-12-31',
        inicioFeriasPlanejadaColaborador:  null,
        terminoFeriasPlanejadaColaborador: null,
      },
    };
    const result = FeriasDadosSchema.parse(raw);
    expect(result.saldoFeriasColaborador).toBe(15);
    expect(result.inicioPeriodoDeGozoColaborador).toBe('2026-07-01');
    expect(result.dataLimiteFerias).toBe('2026-12-31');
    expect(result.inicioFeriasPlanejadaColaborador).toBeNull();
  });

  it('parseia response direto (sem wrapper)', () => {
    const raw = {
      saldoFeriasColaborador: '20.5',
      dataLimiteFerias:       '2027-01-31',
    };
    const result = FeriasDadosSchema.parse(raw);
    expect(result.saldoFeriasColaborador).toBe(20.5);
    expect(result.dataLimiteFerias).toBe('2027-01-31');
    expect(result.inicioPeriodoDeGozoColaborador).toBeNull();
  });

  it('retorna 0 para saldo inválido', () => {
    const result = FeriasDadosSchema.parse({ retorno: { saldoFeriasColaborador: 'NaN' } });
    expect(result.saldoFeriasColaborador).toBe(0);
  });
});

// ── ServicosGestorSchema ──────────────────────────────────────────────────────

describe('ServicosGestorSchema', () => {
  it('agrupa linhas flat por projetoId e coleta subprojetos', () => {
    const raw = {
      retorno: [
        { projetoId: 1, projetoDescricao: 'Projeto Alpha', clienteNome: 'Cliente A', subProjetoId: 10, subProjetoDescricao: 'Sub 1' },
        { projetoId: 1, projetoDescricao: 'Projeto Alpha', clienteNome: 'Cliente A', subProjetoId: 11, subProjetoDescricao: 'Sub 2' },
        { projetoId: 2, projetoDescricao: 'Projeto Beta',  clienteNome: 'Cliente B', subProjetoId: 20, subProjetoDescricao: 'Sub X' },
      ],
    };
    const result = ServicosGestorSchema.parse(raw);
    expect(result).toHaveLength(2);

    const alpha = result.find((s) => s.id === 1)!;
    expect(alpha.nome).toBe('Projeto Alpha');
    expect(alpha.cliente).toBe('Cliente A');
    expect(alpha.subprojetos).toHaveLength(2);
    expect(alpha.subprojetos[0].id).toBe(10);
    expect(alpha.subprojetos[1].id).toBe(11);

    const beta = result.find((s) => s.id === 2)!;
    expect(beta.subprojetos).toHaveLength(1);
  });

  it('não duplica subprojetos quando a mesma linha repete', () => {
    const raw = {
      retorno: [
        { projetoId: 5, projetoNome: 'P', subProjetoId: 50, subProjetoNome: 'S' },
        { projetoId: 5, projetoNome: 'P', subProjetoId: 50, subProjetoNome: 'S' },
      ],
    };
    const result = ServicosGestorSchema.parse(raw);
    expect(result[0].subprojetos).toHaveLength(1);
  });

  it('aceita aliases alternativos de campos', () => {
    const raw = {
      retorno: [
        { projetoID: 9, projetoNome: 'Nome via alias', nomeCliente: 'CX', subProjetoID: 90, subprojetoNome: 'Sub via alias' },
      ],
    };
    const result = ServicosGestorSchema.parse(raw);
    expect(result[0].id).toBe(9);
    expect(result[0].subprojetos[0].id).toBe(90);
  });

  it('retorna [] para retorno vazio', () => {
    expect(ServicosGestorSchema.parse({ retorno: [] })).toEqual([]);
  });

  it('ordena projetos por nome', () => {
    const raw = {
      retorno: [
        { projetoId: 2, projetoDescricao: 'Zebra' },
        { projetoId: 1, projetoDescricao: 'Alpha' },
      ],
    };
    const result = ServicosGestorSchema.parse(raw);
    expect(result[0].nome).toBe('Alpha');
    expect(result[1].nome).toBe('Zebra');
  });
});

// ── PapeisSchema ──────────────────────────────────────────────────────────────

describe('PapeisSchema', () => {
  it('parseia array dentro de retorno', () => {
    const raw = { retorno: [{ id: 1, nomePapel: 'Desenvolvedor' }, { id: 2, nomePapel: 'Analista' }] };
    const result = PapeisSchema.parse(raw);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, nomePapel: 'Desenvolvedor' });
  });

  it('aceita alias nome quando nomePapel ausente', () => {
    const raw = { retorno: [{ id: 3, nome: 'Arquiteto' }] };
    const result = PapeisSchema.parse(raw);
    expect(result[0].nomePapel).toBe('Arquiteto');
  });

  it('retorna [] para retorno vazio', () => {
    expect(PapeisSchema.parse({ retorno: [] })).toEqual([]);
  });
});

// ── PercentualDataSchema ──────────────────────────────────────────────────────

describe('PercentualDataSchema', () => {
  const itemBase = { id: 1, projetoNome: 'P1', horasRegistradas: 8, percentual: 50 };

  it('parseia via retorno.itens', () => {
    const raw = { retorno: { itens: [itemBase], horasPrevistas: 160, horasRegistradas: 8, fechado: false } };
    const result = PercentualDataSchema.parse(raw);
    expect(result.itens).toHaveLength(1);
    expect(result.itens[0].horasRegistradas).toBe(8);
    expect(result.horasPrevistas).toBe(160);
    expect(result.fechado).toBe(false);
  });

  it('parseia via retorno.horasPercentuais (alias)', () => {
    const raw = { retorno: { horasPercentuais: [itemBase], horasContratadas: 180 } };
    const result = PercentualDataSchema.parse(raw);
    expect(result.itens).toHaveLength(1);
    expect(result.horasPrevistas).toBe(180);
  });

  it('parseia via retorno.retorno (alias profundo)', () => {
    const raw = { retorno: { retorno: [itemBase] } };
    const result = PercentualDataSchema.parse(raw);
    expect(result.itens).toHaveLength(1);
  });

  it('parseia via d.itens (raiz)', () => {
    const raw = { itens: [itemBase], horasPrevistas: 100 };
    const result = PercentualDataSchema.parse(raw);
    expect(result.itens).toHaveLength(1);
  });

  it('dataFechamento null quando ausente', () => {
    const raw = { retorno: { itens: [] } };
    const result = PercentualDataSchema.parse(raw);
    expect(result.dataFechamento).toBeNull();
  });

  it('aceita aliases de campos no item', () => {
    const raw = {
      retorno: {
        itens: [{ id: 5, servicoDescricao: 'Serv', horas: 4, subProjetoDescricao: 'SubX' }],
      },
    };
    const result = PercentualDataSchema.parse(raw);
    expect(result.itens[0].projetoNome).toBe('Serv');
    expect(result.itens[0].horasRegistradas).toBe(4);
    expect(result.itens[0].subProjetoNome).toBe('SubX');
  });
});
