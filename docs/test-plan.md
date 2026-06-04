# Plano de Testes — web-app-next
Criado em: 2026-06-04 · Meta: ~70% de cobertura **ponderada por risco** (lógica pura primeiro)

> **Status de execução (2026-06-04):** Fases **0–4 concluídas** — 234 testes, 18 suítes, 0 falhas.
> Cobertura por área: rotas sensíveis 88–91%, `lib/` 64–76%, `squadra-client` ~53% (global ~12%, resto via e2e).
> Pendentes: **Fase 5** (componentes — requer jsdom + Testing Library) e **Fase 6** (thresholds por-pasta + CI).
> Referência técnica da suíte implementada: [testing.md](./testing.md).

## Estratégia
Não perseguir 70% global de forma cega (leva a testar JSX trivial). Priorizar a **lógica pura** — schemas, transforms, cálculos e guards de segurança — que é barata de testar e onde os bugs reais apareceram no QA. Componentes/páginas ficam majoritariamente para o Playwright (e2e).

- **Cobrir 100%** do que é função pura (`lib/`, schemas, cálculos).
- **Cobrir caminhos críticos** das API routes (auth, CSRF, permissão, validação) via MSW.
- **Thresholds incrementais** no CI (começar baixo, subir a cada fase) — nunca exigir 70% de uma vez e travar o time.

## Baseline atual (medido 2026-06-04)
- **26% stmts / 13% branch / 7% funcs** — 1 arquivo (`src/__tests__/schemas.test.ts`, 21 testes) cobrindo parte do `squadra-client`.
- Já testado: `extractRetornoList`, `FeriasDadosSchema`, `ServicosGestorSchema`, `PapeisSchema`, `PercentualDataSchema`.
- Sem teste: `lib/`, 12 hooks, 13 services, 52 API routes, todos os componentes.

---

## Fase 0 — Infraestrutura (habilitar antes de escrever)

1. **Config de cobertura** em `vitest.config.ts`:
   - `coverage: { provider: 'v8', reporter: ['text','html','json-summary'] }`
   - `include: ['src/**/*.{ts,tsx}']`
   - `exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/app/**/layout.tsx', 'src/components/ui/**', 'src/lib/assets.ts', '**/*.stories.*']`
   - `thresholds: { statements: 30, branches: 25, functions: 30, lines: 30 }` (subir por fase)
2. **Ambiente por arquivo**: manter `node` como default; usar `// @vitest-environment jsdom` no topo dos testes de componente (instalar `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`).
3. **MSW** (já citado na stack) para testar API routes/hooks — `src/__tests__/setup-msw.ts` com handlers do upstream Squadra; `setupFiles` no config.
4. **Refator leve para testabilidade** — exportar funções puras hoje locais:
   - `calcHoras` (`api/solicitacoes/hora-extra/route.ts`) → mover para `src/lib/horas.ts` e exportar
   - `computePendentes` (`features/ponto/hooks/usePonto.ts`) → exportar
   - `statusMap` (rh), `statusLabel` (gestao), `detectMime` (rh) → mover para `src/lib/status.ts` / `src/lib/mime.ts` (resolve também a duplicação DEBT-002/P2-4)
   - `semSensiveis` (`squadra-client.ts`) → exportar

**Esforço:** ~0,5 dia. **Entrega:** `npm run test:coverage` com relatório e thresholds.

---

## Fase 1 — `lib/` puro 🔥 (alto valor, baixo esforço)

| Arquivo | Função | Casos de teste |
|---------|--------|----------------|
| `dp-access.test.ts` | `temAcessoDP` | perfilDP=true→true; cargo "PERSONNEL ANALYST"→true; "PERSONNEL ADMINISTRATION MANAGER"→true; "SENIOR PERSONNEL"→false (não começa); ""/null/undefined→false; perfilDP=false + cargo vazio→false |
| `check-origin.test.ts` | `checkOrigin` | origin na allowlist→null; origin estranho→403; sem header Origin→403; env vazio (fail-closed)→403; método/URL montados |
| `status.test.ts` | `statusMap`/`statusLabel` | 'A'/'R'/'C'/'P'; "PENDENTE"/"APROVADO"/"RECUSADO"; numérico '1'/'2' (gestao); desconhecido→pendente |
| `mime.test.ts` | `detectMime` | `JVBERi`→pdf; `/9j/`→jpeg; `iVBOR`→png; `R0lGO`→gif; vazio/lixo→octet-stream |
| `horas.test.ts` | `calcHoras` | 08:00→10:00 = 2h; diurno fim≤início→≤0 (rejeita); **noturno 23:00→01:00 = 2h** (regressão); noturno fim>início mesmo dia; >2h |

**~35 casos. Esforço:** ~1 dia. **Cobre os bugs:** dp-access, hora extra noturna, status, mime.

---

## Fase 2 — Schemas/transforms (`squadra-client`) 🔥

Estender `schemas.test.ts`. Priorizar os que originaram bugs:

| Schema | Casos |
|--------|-------|
| `AbonoRHItemSchema` | lê `id` (não idUnico)→idUnico; `nome`→nomeColaborador; `descricao`→tipo; `dataInicio`→data; `horas:"00:50"` mantém string; status "PENDENTE/APROVADO/RECUSADO"→P/A/R; `anexo` path não-vazio→temAnexo=true; anexo ""→false |
| `semSensiveis` | remove `cpf`/`senha`/`token`; **preserva** `login`/`email`/`cidade`/`kudosWalls` |
| `PessoaItemSchema` / `PerfilSchema` | id/nome/login com fallbacks; cpf omitido; campos ricos preservados (spread) |
| `UsuariosUpstreamSchema` | `usuarioIdSQHoras`→sqhorasId; ausente→0 |
| `LoginUpstreamSchema` | accessToken/idUsuario/login com aliases |
| `PermissoesUpstreamSchema` | flags boolean; ausente→false |
| `FeriasRHListSchema` | filtra `idFerias:0` (sentinela vazio) |
| `PostItemSchema` | idPost/remetenteID; curtidas array |
| `DadosColabSchema` (ponto) | dias, projeto array, horaExtra, isFalta/abono |

**~40 casos. Esforço:** ~1,5 dia. **Cobre:** raiz dos bugs idUnico/AbonoRH e a exposição de CPF.

---

## Fase 3 — Cálculos / regras de negócio 🔥

| Arquivo | Função | Casos |
|---------|--------|-------|
| `usePonto-logic.test.ts` | `toMin` | "08:30"→510; ""→0; "ab:cd"→0 (NaN-safe); undefined→0 |
| | `parseDMY` | "02/06/2026"→Date correta |
| | `computeFaltaStatus` | st 'A'→aprovado; 'R'→recusado; 'P'→pendente; gestor 'S'→aprovado; solId>0→pendente; nada→nao_solicitado |
| | `computePendentes` | exclui fim de semana/feriado(prevMin0)/futuro/abono; classifica registrar/solicitar/aguardar/apontar; ordena desc |
| `ponto-service.test.ts` | `novoApontamento` | monta payload aninhado (`dadosGeraisApontamento`+`apontamentos`+`justificativas`+`aceites`); subprojetoId 0 default; data YYYY-MM-DD (regressão) |

**~30 casos. Esforço:** ~1 dia. **Cobre:** FAILs do QA no ponto e o payload do apontamento.

---

## Fase 4 — API routes (segurança) 🟠 (MSW)

Helper comum: mockar `getSession` (vi.mock) + handlers MSW do upstream. Testar **comportamento de borda**, não o upstream.

| Rota | Casos |
|------|-------|
| `videos` | sem sessão→401; com sessão→200 |
| `rh/abonos` + `[id]/avaliar` + `[id]/anexo` | sem perfilDP/cargo→403; id inválido (`abc`)→400; ok→chama service |
| `perfil/competencias` (PUT) | sem checkOrigin→403; payload inválido→400 |
| `perfil` (PUT) | Zod rejeita chave desconhecida→400; campos válidos→ok |
| `ponto` (POST) | data futura→400; bateRep ausente→403; payload válido→ok |
| `solicitacoes/hora-extra` | fim≤início→400 "término"; >2h→400 "máx 2h"; noturno meia-noite→ok |
| `feed/posts` (DELETE) | postId inválido→400; dono diferente→403 |
| `auth/simulate` | !podeSimular→403; simular a si→400 |

**~35 casos. Esforço:** ~2,5 dias (setup MSW + mocks de sessão). **Cobre:** todos os P0/P1 de segurança como testes de regressão.

---

## Fase 5 — Componentes-chave 🟡 (jsdom + Testing Library)

Só os de lógica densa (o resto via e2e):

| Componente | Casos |
|------------|-------|
| `PontoCalendar` | cada variante (ok/pendente/falta/feriado/futuro/abono) → barra+badge+cta corretos; divisores hoje/futuro; onSolicitar inline |
| `ApontamentoForm` | validações (projeto obrigatório, subprojeto, fim>início, data futura); select mostra nome |
| `AnexoViewer` | render por mime (img/iframe/download); estado erro; loading |
| `SimularBtn` | só renderiza com podeSimular e id≠próprio |

**~25 casos. Esforço:** ~2 dias.

---

## Fase 6 — Thresholds finais + CI
- Subir thresholds para **70% statements/lines, 60% branches** após Fases 1–4.
- Adicionar `npm run test:coverage` ao CI (bloqueia PR abaixo do threshold).
- Playwright (e2e) cobre os 8 fluxos críticos (INCONC-001) — complementar, não conta no threshold unit.

---

## Resumo de esforço e progressão esperada

| Fase | Escopo | Esforço | Cobertura acum. estimada |
|------|--------|---------|--------------------------|
| 0 | Infra | 0,5d | — |
| 1 | lib/ puro | 1d | ~35% |
| 2 | schemas | 1,5d | ~50% |
| 3 | cálculos | 1d | ~58% |
| 4 | API routes | 2,5d | ~70% |
| 5 | componentes | 2d | ~75% |
| 6 | CI/thresholds | 0,5d | — |
| | **Total** | **~9 dias úteis** | **~70-75%** |

> Fases 1–3 (≈3,5 dias) já entregam **~58%** cobrindo toda a lógica pura e os bugs do QA — melhor relação valor/esforço. As Fases 4–5 levam aos 70% mas custam mais (mocks/MSW/jsdom).

## Paralelização

```
Fase 0 (infra)  ──┬──► Fase 1 (lib/ puro)      ┐
 [SEQUENCIAL,      ├──► Fase 2 (schemas)        │
  vem primeiro]    ├──► Fase 3 (cálculos)       ├──► Fase 6 (thresholds/CI)
                   ├──► Fase 4 (API routes/MSW) │   [SEQUENCIAL, fecha]
                   └──► Fase 5 (componentes)    ┘
```

- **Fase 0 NÃO paraleliza** (gargalo inicial): mexe em arquivos de produção compartilhados (`vitest.config.ts`, refator de exports `calcHoras`→`lib/horas`, `statusMap`→`lib/status`, exportar `computePendentes`/`semSensiveis`, setup MSW/jsdom). Tem de ser concluída e commitada antes do fan-out.
- **Fases 1–5 paralelizam bem** após a Fase 0: cada uma só **cria arquivos `.test.ts` novos** testando módulos independentes (lib ≠ schemas ≠ ponto ≠ rotas ≠ componentes) → zero sobreposição. Fatiáveis por agente/pessoa e até *dentro* de cada fase (cada `*.test.ts` é independente).
- **Fase 6 é o fechamento sequencial** — agrega a cobertura de todas e sobe o threshold no CI.

**Cuidados ao paralelizar:**
| Risco | Mitigação |
|-------|-----------|
| `vitest.config.ts` editado por vários | Fase 0 deixa a config **final e permissiva**; ninguém mais toca |
| Threshold subindo em paralelo | Manter threshold **baixo** até a Fase 6 |
| Fases 4/5 sem setup | Dependem do MSW/jsdom da Fase 0 (por isso 0 vem antes) |
| Aferir 70% | Só faz sentido **agregado** — cada agente roda seu subconjunto; medição final é única |

**Sequência de execução recomendada:**
1. Fase 0 sozinha (sequencial) → commit.
2. Fan-out das Fases 1–5 (agentes/worktrees independentes, sem conflito).
3. Fase 6 ao final (cobertura agregada + threshold no CI).

> Por ser multi-agente após a Fase 0, é um candidato natural a orquestração via workflow (Fase 0 inline → fan-out 1–5 → fechamento).

---

## Princípios
- Cada bug encontrado no QA/review vira um **teste de regressão** (hora extra noturna, idUnico, dp-access, data futura, anexo por status).
- Testar **contrato e comportamento**, não implementação.
- Mock só a fronteira (sessão, upstream HTTP) — nunca a lógica sob teste.
