import { describe, it, expect } from 'vitest';
import {
  PessoaItemSchema,
  PerfilSchema,
} from '@/services/squadra-client';
import { rawPerfilComSensiveis, rawPessoaList } from '@/__tests__/fixtures';

// ── PerfilSchema / semSensiveis ────────────────────────────────────────────────
// Prova que campos sensíveis somem e que campos ricos sobrevivem ao spread.

describe('PerfilSchema (semSensiveis)', () => {
  const r = PerfilSchema.parse(rawPerfilComSensiveis);

  it('remove cpf/cpfColaborador', () => {
    expect(r).not.toHaveProperty('cpf');
    expect(r).not.toHaveProperty('cpfColaborador');
  });

  it('remove senha/password', () => {
    expect(r).not.toHaveProperty('senha');
    expect(r).not.toHaveProperty('password');
  });

  it('remove token/accessToken', () => {
    expect(r).not.toHaveProperty('token');
    expect(r).not.toHaveProperty('accessToken');
  });

  it('preserva login/email/cidade/kudosWalls via spread', () => {
    expect(r.login).toBe('joao.silva');
    expect(r.email).toBe('joao@example.com');
    expect(r.cidade).toBe('São Paulo');
    expect(r.kudosWalls).toEqual([{ de: 'Maria', texto: 'Mandou bem!' }]);
  });

  it('preenche campos tipados id/nome/nomeSocial/cargo/celular', () => {
    expect(r.id).toBe(200);
    expect(r.nome).toBe('João Silva');
    expect(r.nomeSocial).toBe('João');
    expect(r.cargo).toBe('Desenvolvedor');
    expect(r.celular).toBe('(11) 90000-0000');
  });
});

// ── PessoaItemSchema ───────────────────────────────────────────────────────────

describe('PessoaItemSchema', () => {
  const list = rawPessoaList.retorno.map((x) => PessoaItemSchema.parse(x));

  it('parseia item completo e remove cpf', () => {
    const ana = list[0];
    expect(ana.id).toBe(1);
    expect(ana.nome).toBe('Ana');
    expect(ana.login).toBe('ana');
    expect(ana.email).toBe('ana@example.com');
    expect(ana).not.toHaveProperty('cpf');
  });

  it('aplica fallback idPessoa→id e usuario→login', () => {
    const bruno = list[1];
    expect(bruno.id).toBe(2);
    expect(bruno.nome).toBe('Bruno');
    expect(bruno.login).toBe('bruno');
  });

  it('nomeSocial cai para nome quando ausente', () => {
    const r = PessoaItemSchema.parse({ id: 9, nome: 'Zé' });
    expect(r.nomeSocial).toBe('Zé');
  });

  it('aplica defaults quando objeto vazio', () => {
    const r = PessoaItemSchema.parse({});
    expect(r.id).toBe(0);
    expect(r.nome).toBe('');
    expect(r.login).toBe('');
    expect(r.foto).toBeNull();
  });
});
