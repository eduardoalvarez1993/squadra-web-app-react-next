import { describe, it, expect } from 'vitest';
import {
  LoginUpstreamSchema,
  UsuariosUpstreamSchema,
  PermissoesUpstreamSchema,
} from '@/services/squadra-client';
import {
  rawLogin,
  rawLoginAliases,
  rawUsuarios,
  rawUsuariosVazio,
  rawPermissoesDP,
  rawPermissoesVazio,
} from '@/__tests__/fixtures';

// ── LoginUpstreamSchema ────────────────────────────────────────────────────────

describe('LoginUpstreamSchema', () => {
  it('lê campos principais accessToken/idUsuario/login/cargo/nome', () => {
    const r = LoginUpstreamSchema.parse(rawLogin);
    expect(r.token).toBe('jwt-abc.def.ghi');
    expect(r.id).toBe(100);
    expect(r.login).toBe('joao.silva');
    expect(r.cargo).toBe('Desenvolvedor');
    expect(r.nome).toBe('João Silva');
  });

  it('aceita aliases token/id/perfil.nome', () => {
    const r = LoginUpstreamSchema.parse(rawLoginAliases);
    expect(r.token).toBe('jwt-abc.def.ghi');
    expect(r.id).toBe(100);
    expect(r.cargo).toBe('Analista');
  });

  it('aplica defaults quando tudo ausente', () => {
    const r = LoginUpstreamSchema.parse({});
    expect(r.token).toBe('');
    expect(r.id).toBe(0);
    expect(r.login).toBe('');
    expect(r.cargo).toBe('');
    expect(r.nome).toBe('');
  });
});

// ── UsuariosUpstreamSchema ─────────────────────────────────────────────────────

describe('UsuariosUpstreamSchema', () => {
  it('mapeia usuarioIdSQHoras do primeiro item → sqhorasId', () => {
    expect(UsuariosUpstreamSchema.parse(rawUsuarios).sqhorasId).toBe(300);
  });

  it('retorna sqhorasId=0 quando retorno vazio', () => {
    expect(UsuariosUpstreamSchema.parse(rawUsuariosVazio).sqhorasId).toBe(0);
  });

  it('retorna sqhorasId=0 quando campo ausente no item', () => {
    expect(UsuariosUpstreamSchema.parse({ retorno: [{ id: 1 }] }).sqhorasId).toBe(0);
  });
});

// ── PermissoesUpstreamSchema ───────────────────────────────────────────────────

describe('PermissoesUpstreamSchema', () => {
  it('lê flags dentro do wrapper retorno', () => {
    const r = PermissoesUpstreamSchema.parse(rawPermissoesDP);
    expect(r.perfilDP).toBe(true);
    expect(r.gerenteFuncional).toBe(false);
    expect(r.bateRep).toBe(false);
  });

  it('todas as flags → false quando retorno vazio', () => {
    const r = PermissoesUpstreamSchema.parse(rawPermissoesVazio);
    expect(r).toEqual({
      perfilDP:          false,
      gerenteFuncional:  false,
      bateRep:           false,
      perfilCoordenador: false,
      perfilTI:          false,
      perfilMarketing:   false,
    });
  });

  it('coerciona flags presentes para boolean', () => {
    const r = PermissoesUpstreamSchema.parse({
      retorno: { perfilTI: true, perfilCoordenador: false, perfilMarketing: true },
    });
    expect(r.perfilTI).toBe(true);
    expect(r.perfilCoordenador).toBe(false);
    expect(r.perfilMarketing).toBe(true);
  });
});
