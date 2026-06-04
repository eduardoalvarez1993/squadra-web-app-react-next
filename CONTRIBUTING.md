# Contribuindo — web-app-next

Guia curto de processo. Para arquitetura e stack, veja `CLAUDE.md`; para o SDD (fonte de
verdade), `../web-app/specs/`.

---

## Definition of Done (DoD)

Uma alteração só está **pronta** quando, além de funcionar:

1. **Tem teste.** Veja a regra de testes abaixo — é obrigatória, não opcional.
2. **`npx tsc --noEmit` passa** (sem erros de tipo).
3. **`npm run test` está verde** localmente.
4. **Segue o SDD** da feature (`../web-app/specs/`) e as **Regras críticas de segurança** do `CLAUDE.md` (IDOR, CSRF, token, DOMPurify, dados sensíveis).

> Enquanto não há CI, os passos 2–3 são **manuais e obrigatórios** antes de abrir PR/fechar a tarefa.

---

## Regra de testes (regressão) — obrigatória

Sustenta a promessa do produto: *"cada defeito vira teste automático, impedindo que volte"*.
Toda mudança de código cumpre o que se aplica:

| Mudança | Teste exigido |
|---------|---------------|
| **Correção de bug** | Um teste que **falha sem a correção e passa com ela**. Referencie o bug no nome do teste. |
| **Feature nova / mudança de comportamento** | Cobre a **lógica pura, schemas e guards de segurança** afetados. Telas e fluxo visual ficam para o **e2e (Playwright)**. |
| **Route Handler (API)** | Guards de borda: **401 / 403 / CSRF / validação**, no padrão de `src/__tests__/route-helpers.ts`. |
| **Schema / transform (`squadra-client`)** | Caso(s) cobrindo o contrato real (use payloads de `src/__tests__/fixtures.ts`). |

**Sem o teste correspondente, a tarefa não está pronta** — mesmo que o código funcione.

### Onde e como
- Os testes vivem em `src/__tests__/`.
- O **como** (ambiente, fixtures, MSW, mock de sessão, exemplos por tipo de teste) está
  documentado em **[`docs/testing.md`](./docs/testing.md)**.
- Estratégia e fases em [`docs/test-plan.md`](./docs/test-plan.md).

---

## Comandos

```bash
npm run dev             # desenvolvimento
npx tsc --noEmit        # checagem de tipos
npm run test            # suíte unitária (vitest run)
npm run test:watch      # modo watch
npm run test:coverage   # com relatório de cobertura (coverage/index.html)
npm run e2e             # Playwright (npx playwright install chromium)
npm run lint            # eslint
```

---

## Fluxo de implementação (dentro de cada feature)

```
services/[feature].ts → app/api/[feature]/route.ts → hooks/ → components/ → page.tsx
```
O hook **nunca** chama a API Squadra direto — sempre via Route Handler interno (padrão BFF).

---

## Cobertura

O `vitest.config.ts` mantém um **piso de não-regressão** (sobe a cada fase). O objetivo
**não** é % global e sim cobrir o que é arriscado: segurança, regras de negócio e contratos
de dados. Não remova testes para "passar" — ajuste o código. Detalhes em `docs/testing.md`.
