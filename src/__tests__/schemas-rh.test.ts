import { describe, it, expect } from 'vitest';
import {
  AbonoRHItemSchema,
  AbonoListSchema,
  FeriasRHListSchema,
} from '@/services/squadra-client';
import { rawAbonosRH, rawFeriasRH } from '@/__tests__/fixtures';

// ── AbonoRHItemSchema ──────────────────────────────────────────────────────────
// Raiz dos bugs idUnico/AbonoRH: upstream manda aliases (`id`, `nome`, `descricao`,
// `dataInicio`) e o schema os mapeia para o contrato interno.

describe('AbonoRHItemSchema', () => {
  it('mapeia aliases id→idUnico, nome→nomeColaborador, descricao→tipo, dataInicio→data', () => {
    const r = AbonoRHItemSchema.parse(rawAbonosRH.retorno[0]);
    expect(r.idUnico).toBe(9001);
    expect(r.nomeColaborador).toBe('Carlos Pereira');
    expect(r.tipo).toBe('Atestado médico');
    expect(r.data).toBe('2026-06-02');
  });

  it('mantém horas como string "00:50" (não converte para número)', () => {
    const r = AbonoRHItemSchema.parse(rawAbonosRH.retorno[0]);
    expect(r.horas).toBe('00:50');
    expect(typeof r.horas).toBe('string');
  });

  it('normaliza status "PENDENTE"→P', () => {
    expect(AbonoRHItemSchema.parse({ status: 'PENDENTE' }).status).toBe('P');
  });

  it('normaliza status "APROVADO"→A', () => {
    expect(AbonoRHItemSchema.parse({ status: 'APROVADO' }).status).toBe('A');
  });

  it('normaliza status "RECUSADO"→R', () => {
    expect(AbonoRHItemSchema.parse({ status: 'RECUSADO' }).status).toBe('R');
  });

  it('normaliza status "REPROVADO"→R', () => {
    expect(AbonoRHItemSchema.parse({ status: 'REPROVADO' }).status).toBe('R');
  });

  it('normaliza status "CANCELADO"→C', () => {
    expect(AbonoRHItemSchema.parse({ status: 'CANCELADO' }).status).toBe('C');
  });

  it('status desconhecido/ausente cai em P', () => {
    expect(AbonoRHItemSchema.parse({}).status).toBe('P');
    expect(AbonoRHItemSchema.parse({ status: '???' }).status).toBe('P');
  });

  it('anexo com path não-vazio → temAnexo=true', () => {
    const r = AbonoRHItemSchema.parse(rawAbonosRH.retorno[0]);
    expect(r.temAnexo).toBe(true);
  });

  it('anexo vazio mas campo arquivo (base64) presente → temAnexo=true', () => {
    const r = AbonoRHItemSchema.parse(rawAbonosRH.retorno[1]);
    expect(r.temAnexo).toBe(true);
  });

  it('anexo vazio e sem arquivo → temAnexo=false', () => {
    const r = AbonoRHItemSchema.parse(rawAbonosRH.retorno[2]);
    expect(r.temAnexo).toBe(false);
  });
});

// ── AbonoListSchema ────────────────────────────────────────────────────────────

describe('AbonoListSchema', () => {
  it('parseia lista dentro de retorno e preserva ordem', () => {
    const result = AbonoListSchema.parse(rawAbonosRH);
    expect(result).toHaveLength(3);
    expect(result[0].idUnico).toBe(9001);
    expect(result[1].idUnico).toBe(9002);
    expect(result[2].status).toBe('R');
  });

  it('retorna [] para estrutura desconhecida', () => {
    expect(AbonoListSchema.parse({ foo: 'bar' })).toEqual([]);
  });
});

// ── FeriasRHListSchema ─────────────────────────────────────────────────────────

describe('FeriasRHListSchema', () => {
  it('filtra item sentinela com idFerias:0', () => {
    const result = FeriasRHListSchema.parse(rawFeriasRH);
    expect(result).toHaveLength(1);
    expect(result[0].idFerias).toBe(700);
    expect(result.some((i) => i.idFerias === 0)).toBe(false);
  });

  it('mapeia aliases solicitacaoID/dataInicioSolicitacao/dataFimSolicitacao', () => {
    const result = FeriasRHListSchema.parse(rawFeriasRH);
    const item = result[0];
    expect(item.idFerias).toBe(700);
    expect(item.nomeColaborador).toBe('Fábio Melo');
    expect(item.dataInicio).toBe('2026-08-01');
    expect(item.dataFim).toBe('2026-08-20');
    expect(item.status).toBe('P');
  });

  it('retorna [] quando só há sentinelas', () => {
    expect(FeriasRHListSchema.parse({ retorno: [{ idFerias: 0 }] })).toEqual([]);
  });
});
