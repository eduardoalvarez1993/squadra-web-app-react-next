# Platform Review — web-app-next (revisão ampla)
Gerado em: 2026-06-04 · Escopo: plataforma inteira (não só a última leva) · 3 frentes: Segurança/Backend, Frontend/UX/A11y, Arquitetura/Qualidade

> Saúde geral: **Boa.** Arquitetura em camadas limpa, sessão sólida (iron-session httpOnly, checkOrigin nos writes, rate-limit no login, token nunca exposto ao cliente). Os achados abaixo são **novos** (não duplicam review-report.md / qa-report.md / known-issues.md).

## Padrão transversal (tema #1)
**Autorização por flag global sem checar escopo de equipe.** O app confia em `gerenteFuncional`/`perfilDP` mas não valida que o alvo (sqhorasId, colaboradorId, idFalta…) pertence à equipe do gestor. Vários IDOR derivam disso. Muitos podem estar mitigados pelo upstream Squadra — **confirmar com TI** se a API rejeita ações/leituras cross-equipe; se não, são exploráveis.

---

## 🔴 P0 — Exploráveis do nosso lado (corrigir já)

| # | Achado | Local |
|---|--------|-------|
| P0-1 | **`/api/videos` é público** (sem checagem de sessão) — anônimo aciona chamada autenticada ao Airtable (token de serviço), permite esgotar quota | `api/videos/route.ts` |
| P0-2 | **Deletar post de qualquer usuário** — autorização compara `remetenteID` (query param do cliente) com a sessão, mas não confere o dono real do post. Basta passar o próprio id | `api/feed/posts/route.ts:25` |
| P0-3 | **PUT `/api/perfil/competencias` sem `checkOrigin`** — único mutation sem proteção CSRF | `api/perfil/competencias/route.ts:9` |
| P0-4 | **Páginas autenticadas fora do middleware** — `/feed`, `/recursos/*`, `/stack` não estão em `PROTECTED_PREFIXES` e o layout `(app)` não tem gate de sessão server-side | `middleware.ts:7`, `(app)/layout.tsx` |

## 🟠 P1 — IDOR / exposição (confirmar com TI + idealmente checar escopo)

| # | Achado | Local |
|---|--------|-------|
| P1-1 | **IDOR leitura de ponto** — qualquer `gerenteFuncional` lê ponto/projetos/faltas de QUALQUER `sqhorasId` (read path; o QA cobriu só o write) | `api/ponto/route.ts:40` |
| P1-2 | **IDOR sistêmico na Gestão** — aprovar/reprovar, alocar, marcar falta, ler ponto/férias e deletar percentual de IDs arbitrários sem checar a equipe | `api/gestao/**`, `api/percentual/[id]` |
| P1-3 | **Sobre-exposição de dados de pessoas** — schemas usam `...d`/`...ret` (spread do objeto bruto); `/api/pessoas/[id]` aberto a qualquer logado → vaza campos não-tipados (CPF, etc. se a API retornar) | `squadra-client.ts:391,362,406` |
| P1-4 | **PUT `/api/perfil` sem schema Zod** — read-modify-write de 25 campos sem validação nem controle de concorrência | `services/perfil.ts:54`, `api/perfil/route.ts` |
| P1-5 | **Vazamento de erro do upstream ao cliente** — repassa `err.message` bruto da API Squadra | `gestao/membro/[id]/ponto:60`, `perfil/route.ts:36`, `perfil/competencias:25` |

## 🟡 P2 — Arquitetura / dívida técnica

| # | Achado | Local |
|---|--------|-------|
| P2-1 | **`z.unknown().transform()` em ~todos os schemas** — não valida estrutura; mudança de contrato da API passa como `0`/`''`/`null` silencioso (raiz dos bugs tipo `idUnico`). Usar `z.object().passthrough()` onde o contrato é estável | `squadra-client.ts` |
| P2-2 | **`fetchJson`/`postJson` duplicado em ~10 hooks** com versões divergentes (uns extraem `error`, outros só status) → erros chegam inconsistentes ao usuário | `features/*/hooks/*` |
| P2-3 | **Formatadores de data/hora/saldo duplicados (5+ versões)** com tratamentos divergentes; `new Date('YYYY-MM-DD')` como UTC → off-by-one no fuso BRT | `SaldoCard`, `MembroDrawer`, `gestao`, `holerite`, `GreetingCard` |
| P2-4 | **Normalização de status em 3-5 lugares** (statusMap, statusLabel, STATUS_COLORS, schema do abono, computeFaltaStatus) — convenções divergentes (P vs PENDENTE) | (transversal) — reforça DEBT-001 |
| P2-5 | **Tipo divergente p/ mesmo campo** — `AbonoRH.horas: string` vs `AbonoEquipeItem.horas: number` | `squadra-client.ts:430,751` |
| P2-6 | **Token dobrado no cookie** durante simulação (`_simOrig` guarda o token original) — pressão no limite de 4 KB + material sensível duplicado | `auth/simulate/route.ts` |
| P2-7 | **Cache TanStack não escopado por usuário** — seguro hoje só porque simular/logout fazem reload (hard nav). Sem `qc.clear()`; migração futura p/ soft-nav vazaria dados | `query-client.ts`, hooks |
| P2-8 | **Código morto**: `components/shared/PostCard.tsx` nunca importado; comentário/recópia redundante em `store/user.ts:75` | — |
| P2-9 | **Boilerplate de rota repetido em ~50 handlers** — wrapper `withSession()` uniformizaria (hoje algumas tratam SquadraClientError, outras não) | `api/**` |
| P2-10 | **`getAbonoAnexo` rebusca a lista inteira** por anexo (N+1) e depende do status | `squadra-client.ts:1203` |

## 🟢 A11y / UX

| # | Achado | Local |
|---|--------|-------|
| A-1 | **Páginas sem `<h1>`** — holerite, ferias, solicitacoes, feed, rh (título só no Topbar como `<span>`). WCAG 1.3.1/2.4.6 | (várias) |
| A-2 | **CropModal sem focus-trap/Esc/retorno de foco** — modal manual (mesmo problema já corrigido no AnexoViewer) | `ProfileForm.tsx:69` |
| A-3 | **Login: foco invisível** — `outline:none` + realce via onFocus; botão Entrar e toggle de senha sem `focus-visible`. WCAG 2.4.7 | `LoginForm.tsx` |
| A-4 | **`<select>`/`<input>` sem `htmlFor`/`id` associado** — percentual, solicitações. WCAG 1.3.1 | `percentual:208`, `solicitacoes:263` |
| A-5 | **Empty states inconsistentes** — imagem vs ícone vs `<p>` solto em telas equivalentes (holerite, percentual, recursos, gestao) | (várias) |
| A-6 | **Retry com `window.location.reload()`** em vez de `refetch()` (recarrega app, pisca) | `ferias:33`, `rh:263` |
| A-7 | **`ComposeBox`/home feed sem tratamento de erro** de publicação e sem `isError` do feed na home | `ComposeBox.tsx:101`, `home/page.tsx:212` |
| A-8 | **Áreas de toque < 44px** em mobile (like/comentário, remover alocação/interesse, "ver conteúdo") | (várias) |
| A-9 | **Componentes duplicados** — ComunicadoCard (feed/home), PostCardHome vs PostCard, header avatar perfil/pessoas, EmptyState vs IllustratedState | (várias) |

## Contagem consolidada
- Segurança/Backend: 2 críticos, 6 importantes, 5 menores
- Arquitetura: 1 crítico, 7 importantes, 9 menores
- Frontend/A11y: 4 críticos(a11y), 11 importantes, 9 menores

## Recomendação de sequência
1. **P0** (4 itens) — rápidos e exploráveis sem privilégio: videos auth, feed delete, competencias CSRF, middleware.
2. **Confirmar com TI** o escopo de autorização (P1-1/P1-2) — define se precisamos checar equipe no nosso lado.
3. **P1 restantes** (exposição de pessoas, erro upstream, schema do perfil).
4. **Dívida P2** — `lib/format.ts` + `lib/api-client.ts` + `withSession` pagam a maior parte da duplicação.
5. **A11y** — h1, CropModal, foco do login.
