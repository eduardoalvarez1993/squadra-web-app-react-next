/**
 * Setup global do MSW (Mock Service Worker) para testes de API routes / serviços.
 *
 * Registrado em `vitest.config.ts → test.setupFiles`. Sobe um servidor que
 * intercepta o `fetch` para o upstream Squadra (SQUADRA_API_URL). Testes puros
 * (lib/, schemas) não fazem requisições, então `onUnhandledRequest: 'bypass'`
 * mantém o setup inofensivo para eles.
 *
 * Uso num teste de rota:
 *
 *   import { server } from '@/__tests__/setup-msw';
 *   import { http, HttpResponse } from 'msw';
 *
 *   server.use(
 *     http.get('https://api.squadra.com.br/api/v1/...', () =>
 *       HttpResponse.json(rawAlgumaCoisa)),
 *   );
 */
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';

/** Sem handlers default — cada teste registra os seus via `server.use(...)`. */
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
