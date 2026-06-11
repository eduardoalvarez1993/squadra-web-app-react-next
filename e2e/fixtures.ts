/** Payloads de resposta mockados para os testes E2E. */

import type { Page } from '@playwright/test';
import { sealData } from 'iron-session';

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? 'KJhhQKLoqInNipASrxHGwWqY0Pr1X6xh6a3quFIL2lI=';

export const ME_COLABORADOR = {
  ok: true,
  id: 100,
  pessoaId: 200,
  sqhorasId: 300,
  login: 'joao.silva',
  nome: 'João Silva',
  cargo: 'Desenvolvedor',
  foto: null,
  permissoes: {
    gerenteFuncional: false,
    perfilDP: false,
    bateRep: false,
    perfilCoordenador: false,
    perfilTI: false,
    perfilMarketing: false,
  },
  simulando: false,
  podeSimular: false,
};

export const ME_GESTOR = {
  ...ME_COLABORADOR,
  id: 995,
  permissoes: { ...ME_COLABORADOR.permissoes, gerenteFuncional: true },
  podeSimular: true,
};

export const ME_SIMULANDO = {
  ...ME_GESTOR,
  simulando: true,
};

export const HOME_SALDO            = { saldoHoras: 12.5 };
export const HOME_ANIVERSARIANTES  = { retorno: [] };
export const HOME_NOVOS_COLABS     = { retorno: [] };
export const HOME_SALDO_GLOBAL     = [];

/**
 * Injeta cookie de sessão iron-session selado diretamente no contexto do browser,
 * sem depender da rota POST /api/auth. Os dados são mapeados do ME_COLABORADOR mock.
 */
export async function injectSession(
  page: Page,
  overrides: Record<string, unknown> = {},
): Promise<void> {
  const sessionData = {
    token:       'mock-bearer-token',
    gestorId:    ME_COLABORADOR.id,
    pessoaId:    ME_COLABORADOR.pessoaId,
    sqhorasId:   ME_COLABORADOR.sqhorasId,
    login:       ME_COLABORADOR.login,
    nome:        ME_COLABORADOR.nome,
    cargo:       ME_COLABORADOR.cargo,
    bateRep:     ME_COLABORADOR.permissoes.bateRep,
    permissoes:  ME_COLABORADOR.permissoes,
    simulando:   false,
    podeSimular: false,
    ...overrides,
  };

  const sealed = await sealData(sessionData, { password: SESSION_SECRET });

  await page.context().addCookies([
    {
      name:     'squadra-session',
      value:    sealed,
      domain:   'localhost',
      path:     '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}
