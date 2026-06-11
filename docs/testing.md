# Testes — Referência Técnica (web-app-next)

Estado: **265 testes, 20 suítes, 0 falhas** · atualizado 2026-06-11
Plano de evolução e raciocínio por trás das fases: [test-plan.md](./test-plan.md).

Este documento descreve a suíte **como ela está implementada** — arquitetura, convenções e como rodar.

---

## Visão geral

| Camada | Ferramenta | Ambiente | Escopo |
|--------|-----------|----------|--------|
| Unitário / integração | **Vitest 4** + `@vitest/coverage-v8` | `node` (default) | lógica pura, schemas, API routes |
| Mock de HTTP upstream | **MSW 2** (`msw/node`) | — | intercepta `fetch` p/ a API Squadra |
| E2E | **Playwright** | Chromium | 8 fluxos críticos ponta a ponta |

**Estratégia: cobertura ponderada por risco.** Não perseguimos % global — cobrimos 100% do que é barato e perigoso (lógica pura, guards de segurança) e deixamos UI/telas para o e2e. Por isso o número global (~12%) é baixo de propósito; o que importa é a cobertura **por área**.

### Cobertura por área (medida com `v8`)

| Área | Arquivos | Cobertura (stmts) |
|------|----------|-------------------|
| Rotas sensíveis de segurança | `src/app/api/{auth,rh,ponto,...}` | **88–91%** |
| Utilitários / regras (`src/lib`) | horas, status, mime, dp-access, check-origin | **64%** (76% branch) |
| Integração API Squadra | `src/services/squadra-client.ts` | **~53%** |
| **Global** | `src/**` | ~12% (resto via e2e) |

---

## Como rodar

```bash
npm run test            # roda toda a suíte uma vez (vitest run)
npm run test:watch      # modo watch
npm run test:coverage   # com relatório de cobertura (text + html + json-summary)
npm run e2e             # Playwright (precisa: npx playwright install chromium)
```

O relatório HTML de cobertura fica em `coverage/index.html`.

---

## Arquitetura dos arquivos de teste

Tudo em `src/__tests__/`:

```
fixtures.ts            Massa central — derivada do código real (squadra-client).
                       Sessões, payloads brutos do upstream e tabelas de casos puros.
                       NÃO contém PII. Read-only para os testes.
setup-msw.ts           Server MSW global (listen/reset/close) — registrado em
                       vitest.config.ts → test.setupFiles. onUnhandledRequest: 'bypass'.
route-helpers.ts       Helpers de teste de rota: makeRequest, makeSession,
                       re-export do server MSW, UPSTREAM, ALLOWED_ORIGIN.

schemas.test.ts            (legado) extractRetornoList + schemas base
schemas-{rh,auth,pessoa,feed,ponto}.test.ts   transforms do squadra-client
dp-access / check-origin / status / mime / horas .test.ts   lib/ puro
usePonto-logic.test.ts     toMin, parseDMY, computeFaltaStatus, computePendentes
ponto-service.test.ts      buildNovoApontamentoPayload
route-videos.test.ts       piloto + sanity de interceptação MSW
route-{auth,rh,ponto,feed}.test.ts   API routes (segurança/borda) via MSW
```

---

## Convenções

### Ambiente
- Default é **`node`** (rápido, sem DOM). Testes de componente (futuros) declaram
  `// @vitest-environment jsdom` no topo do arquivo — não muda o default global.
- Imports via alias `@/` (ex.: `@/lib/horas`, `@/__tests__/fixtures`).
- `import { describe, it, expect, vi } from 'vitest'` — o projeto **não** usa globals.

### Funções puras (lib/, schemas, cálculos)
Entrada → saída esperada, sem mocks. Tabelas em `it.each(...)` quando há muitos casos
(ver `casosDPAccess`, `casosHoras`, etc. em `fixtures.ts`).

Para funções que dependem de relógio (`computePendentes` usa `new Date()`):
```ts
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 5, 30)); });
afterEach(() => vi.useRealTimers());
```

### API Routes (segurança/borda)
Padrão (ver `route-videos.test.ts` como modelo):
```ts
import { server, makeRequest, makeSession, UPSTREAM } from '@/__tests__/route-helpers';
import { http, HttpResponse } from 'msw';

vi.mock('@/lib/session', () => ({ getSession: vi.fn() }));   // hoisted, isolado por arquivo
import { getSession } from '@/lib/session';
import { POST } from '@/app/api/rh/abonos/[id]/avaliar/route';

it('403 sem acesso DP', async () => {
  vi.mocked(getSession).mockResolvedValue(makeSession({ cargo: 'Dev' }) as never);
  const res = await POST(
    makeRequest('http://localhost/api/rh/abonos/1/avaliar', { method: 'POST', body: { acao: 'A' } }),
    { params: Promise.resolve({ id: '1' }) },
  );
  expect(res.status).toBe(403);
});
```
Regras de borda:
- A função da rota (`GET`/`POST`/`PUT`/`DELETE`) é importada e chamada **direto** — não sobe servidor.
- **Sessão**: `makeSession(overrides) as never`. Ausente (401) = `makeSession({ token: '' })`.
- **CSRF**: `makeRequest` já manda origin permitido; para 403 passe `origin: 'https://evil.com'`.
- **Acesso DP**: `makeSession({ permissoes: { perfilDP: true } })` ou `makeSession({ cargo: 'PERSONNEL ANALYST' })`.
- **Upstream**: registre handler MSW na URL real (`${UPSTREAM}/v1/...`) — confira o path em `squadra-client.ts`.
- Rota dinâmica recebe 2º arg `{ params: Promise.resolve({ id }) }`.

### Princípios
- Testar **contrato e comportamento** (status codes, transformações), não implementação.
- Mockar só a **fronteira** (sessão, HTTP upstream) — nunca a lógica sob teste.
- Cada bug de QA/review vira **teste de regressão** (hora extra noturna, idUnico, dp-access, data futura, anexo por status, exposição de CPF, data da hora extra em ISO, hora extra liberada no ponto `statusSolicitacao===3`, `tipoApropriacao` JORNADA/HORA_EXTRA).

> Isso **não é opcional**: é parte da Definition of Done. Regra completa em `CONTRIBUTING.md` e `CLAUDE.md` → "Definition of Done — Testes". AGENTS.md replica para agentes de contexto-zero.

---

## Receita de paralelização (multi-agente)

A suíte foi construída paralelizando o trabalho com segurança. O princípio:

1. **Pré-passo sequencial** cria tudo que é **compartilhado e mutável** (config de cobertura,
   refactors de produção, helpers) e é validado/commitado **antes** do fan-out.
2. **Fan-out**: cada agente só **cria arquivos `.test.ts` novos** de módulos disjuntos e,
   no máximo, adiciona *exports aditivos* a **um** arquivo de produção exclusivo seu.
3. **Fechamento**: medição de cobertura agregada numa rodada única.

Sem o pré-passo, N agentes criariam N versões divergentes do mesmo helper/config.

---

## Cobertura e gate (CI)

`vitest.config.ts` define thresholds como **piso de não-regressão**, que sobe a cada fase
(hoje: 12/13/7/12 — stmts/branch/funcs/lines). O objetivo NÃO é bater % global, e sim
travar o ganho para que ninguém remova testes. O fechamento (Fase 6) trocará o gate global
por **alvo por-pasta** (`lib/` e `services/` a 70/60) e plugará `test:coverage` no CI.

Exclusões de cobertura (`coverage.exclude`): testes, `src/__tests__/**`, `layout.tsx`,
`src/components/ui/**` (primitivos shadcn), `assets.ts`, stories.

---

## Achados convertidos em correção

Os testes de rota revelaram 2 divergências entre comentário e código, já corrigidas:

1. **`perfil` PUT** — o schema prometia rejeitar chave desconhecida mas usava só `.partial()`.
   Agora é `.partial().strict()` → chave extra retorna **400** (anti mass-assignment).
2. **`ponto` POST data futura** — a validação existia (Zod `.refine`) mas a mensagem se perdia
   no retorno genérico. Agora a rota inspeciona `error.issues` e expõe **"Data futura não permitida"**.

---

## Pendente

- **Fase 5 (componentes)**: requer instalar `jsdom` + `@testing-library/{react,user-event,jest-dom}`.
  Alvos densos: `PontoCalendar`, `ApontamentoForm`, `AnexoViewer`. Menor retorno marginal —
  boa parte já coberta pelo Playwright.
- **Fase 6 (fechamento)**: thresholds por-pasta + `test:coverage` no CI.
