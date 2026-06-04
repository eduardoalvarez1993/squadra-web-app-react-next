# CLAUDE.md — web-app-next

## O que é este projeto

Migração do app interno de gestão de horas da Squadra de SPA vanilla (HTML/CSS/JS + PHP)
para Next.js App Router + TypeScript. O SDD (Spec Driven Development) completo vive em
`../web-app/specs/` e é a **fonte de verdade** para toda implementação.

**Antes de escrever qualquer linha de código, leia o SDD.**

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 App Router + TypeScript strict |
| Estilo | Tailwind CSS + shadcn/ui + CSS vanilla (globals.css para animações) |
| Estado servidor | TanStack Query v5 |
| Estado cliente | Zustand |
| Forms | React Hook Form + Zod |
| Sessão | Iron Session (httpOnly cookie) |
| Rate limiting | Upstash Redis (só `/api/auth`) |
| Testes unit | Vitest + MSW |
| Testes e2e | Playwright |
| Deploy | Auto-hospedado (Node) — coexistência com o vanilla via DNS |

---

## Onde está o SDD

```
../web-app/specs/
├── foundation/          # config, session, middleware, squadra-client, check-origin, build-sequence
├── api/                 # specs de cada Route Handler (openapi.yaml + docs por feature)
├── features/            # feature.md + schema.ts + hooks + componentes por feature
│   ├── auth/
│   ├── home/
│   ├── feed/
│   ├── ponto/           ← spec mais completa — inclui regras de faltaStatus
│   ├── ferias/
│   ├── holerite/
│   ├── perfil/
│   ├── pessoas/
│   ├── gestao/
│   ├── rh/
│   ├── solicitacoes/
│   ├── percentual/
│   └── fluencia/        ← modal global no Shell, não é rota
└── components/shared/   # specs dos componentes compartilhados + asset-map.md
```

Também consultar:
- `../web-app/CLAUDE.md` — contexto do app vanilla, regras de permissão, bugs conhecidos
- `../web-app/specs/foundation/build-sequence.md` — **ordem obrigatória de implementação**

---

## Status de implementação (atualizado 2026-06-04)

| Fase | Conteúdo | Estado |
|------|----------|--------|
| 1 | Foundation: config, session, check-origin, squadra-client, middleware, query-client, store | ✅ Completo |
| 2 | Auth: POST/DELETE /api/auth, GET /api/auth/me, LoginForm, login/page, (app)/layout | ✅ Completo |
| 3 | Shared: Skeleton, AvatarGradient, StatusChip, FormFeedback, EmptyState, ErrorSection, AlertCard, TabNav, HistoricoTable, DrawerForm, ApprovalModal, SolicitacaoCard, PessoaCard, PerfilLoader, FluenciaModal, SimulandoBanner, VerificandoCredenciais | ✅ Completo |
| 4 | Shell: Sidebar, Topbar, MobileNav, BottomNav, Shell + SimulandoBanner wired | ✅ Completo |
| 5 | Features baixa/média: home, holerite, ferias, perfil, pessoas (incl. [id] page), rh | ✅ Completo |
| 6 | Features alta: ponto, gestao, solicitacoes, feed, percentual | ✅ Completo |
| 7 | Simulate: /api/auth/simulate, SimularBtn, SimulandoBanner | ✅ Completo |
| 8 | Paridade visual + funcional com web-app vanilla | ✅ Completo (2026-06-02) |
| 9 | QA + Acessibilidade WCAG 2.1 AA | ✅ Aprovado (2026-06-02) |
| 10 | **Recursos/Extras** (Links, Vídeos, Ajuda) + redesign do Ponto + RH/DP funcional (abonos/anexos/férias) | ✅ Completo (2026-06-03) |
| 11 | **Hardening pós-review** (QA funcional + review amplo da plataforma): correções de bugs, P0/P1 de segurança, a11y | ✅ Completo (2026-06-04) — ver `docs/platform-review.md` |

---

## Status das páginas (atualizado 2026-06-04)

| Página / Módulo | QA | Acessibilidade | Issues abertos |
|---|---|---|---|
| Login | ✅ Aprovado | ✅ foco visível | — |
| Home | ✅ Aprovado | ✅ | — |
| Feed (Squadra em Rede) | ✅ Aprovado | ✅ `<h1>` | delete valida dono real do post |
| Férias | ✅ Aprovado | ✅ `<h1>` | — |
| Holerite | ✅ Aprovado | ✅ `<h1>` | — |
| Ponto | ✅ Aprovado | ✅ | TI-AUTHZ-001 (sqhorasId/escopo equipe) |
| Gestão | ✅ Aprovado | ✅ | TI-AUTHZ-001 (escopo equipe) |
| RH / DP | ✅ Aprovado | ✅ `<h1>` | acesso por cargo (fallback) — TI-DP-001 |
| Solicitações | ✅ Aprovado | ✅ `<h1>` | — |
| Perfil | ✅ Aprovado | ✅ | CropModal sem focus-trap (A11Y-PEND) |
| Pessoas | ✅ Aprovado | ✅ | — |
| Percentual | ✅ Aprovado | ✅ | INCONC: schema sem dados reais (jun/2026) |
| **Recursos/Extras** (Links, Vídeos, Ajuda) | ✅ | ✅ | — |
| 404 / Acesso negado | ✅ Aprovado | ✅ | — |

---

## Sequência de implementação (resumo)

```
Fase 1 → Foundation                                                               ✅
Fase 2 → Auth                                                                     ✅
Fase 3 → Shared components                                                        ✅
Fase 4 → Shell                                                                    ✅
Fase 5 → Features baixa/média                                                     ✅
Fase 6 → Features alta: ponto, gestao, solicitacoes, feed, percentual             ✅
Fase 7 → Simulate                                                                 ✅
Fase 8 → Paridade visual + funcional                                              ✅
```

**Pendente para deploy / validação com TI (ver `docs/known-issues.md` e `docs/platform-review.md`):**
- **TI-AUTHZ-001** (Alta) — IDOR de escopo de equipe (ponto/gestão agem por flag global sem checar a equipe); confirmar se a API valida cross-equipe
- **TI-DP-001** — `perfilDP` nunca vem `true` na API; acesso ao RH usa fallback por cargo
- Testes unitários — cobertura baixa (~26%); meta a definir (ver seção Testes)
- Testes Playwright (8 fluxos críticos) — INCONC-001
- `PercentualItemRawSchema` — itens não verificáveis sem dados reais — INCONC-002
- **DEBT-002** — refactors planejados (fetchJson único, withSession, z.object)
- **A11Y-PEND** — CropModal focus-trap, selects `htmlFor`, skip link

Dentro de cada feature, sempre nesta ordem:
```
services/[feature].ts  →  app/api/[feature]/route.ts  →  hooks/  →  components/  →  page.tsx
```

> O hook nunca chama a Squadra diretamente — sempre via Route Handler interno.

---

## Componentes compartilhados (`src/components/shared/`)

| Componente | Descrição |
|------------|-----------|
| `AvatarGradient` | Avatar com anel gradiente rosa→roxo→azul quando tem foto; iniciais coloridas quando não tem |
| `DrawerForm` | Painel lateral (direito) — título + slot de conteúdo + scroll |
| `EmptyState` | Estado vazio com imagem opcional + título + descrição + CTA |
| `ErrorSection` | Faixa de erro com botão Retry |
| `FormFeedback` | Feedback inline de form (ok/error) |
| `HistoricoTable` | Tabela genérica de histórico |
| `PerfilLoader` | Loading card flip 3D (frente + verso) — reutilizado em perfil/page e DrawerColaborador |
| `PessoaCard` | Card de resultado de busca de pessoa |
| `Skeleton` | Placeholder de carregamento |
| `StatusChip` | Badge de status colorido |
| `TabNav` | Navegação por abas |
| `VerificandoCredenciais` | Tela "Verificando credenciais…" enquanto as permissões carregam (Ponto, Gestão, Percentual) |

> O `PostCard` vive em `src/features/feed/components/PostCard.tsx` (usado por feed, home e KudosTab). O antigo `src/components/shared/PostCard.tsx` era órfão e foi removido em 2026-06-04.

---

## Animações CSS (globals.css)

Todas as animações do web-app vanilla foram portadas para `src/app/globals.css`:

| Animação | Classes CSS | Usado em |
|----------|-------------|---------|
| Teclado + mão (hint pessoas) | `.pessoas-search-hint`, `.pessoas-type-stage`, `@keyframes pessoas-finger-type` | pessoas/page |
| Lupa scan (busca pessoas) | `.pessoas-search-loader`, `.search-stage`, `.search-lens`, `@keyframes lens-scan` | pessoas/page |
| Holerite scan | `.holerite-loading-wrap`, `.holerite-loading-scan`, `@keyframes holerite-scan` | HoleriteGrid |
| Card flip 3D (perfil) | `.perfil-loading-wrap`, `.perfil-flip-card`, `@keyframes perfil-card-flip` | PerfilLoader |
| Relógio caminhando (ponto) | `.ponto-loading-wrap`, `.ponto-clock-marker`, `@keyframes ponto-clock-walk` | PontoCalendar |
| Cards swipe (feed posts) | `.feed-loading-wrap`, `.feed-swipe-card`, `@keyframes feed-card-swipe` | feed/page |
| Caixinha de correio (comunicados) | `.comunicados-loading-wrap`, `.comunicados-mail-flag`, `@keyframes comunicados-flag` | feed/page |
| Chamas de bolo (aniversariantes) | `.is-aniversariantes-loading`, `.aniversariantes-flame`, `@keyframes aniversariantes-flame` | AnivCard |
| Crachá caindo (novos colabs) | `.is-novos-colaboradores-loading`, `.novos-colaboradores-badge`, `@keyframes novos-colaboradores-badge-drop` | AnivCard |
| Grid meses holerite | `.holerite-mes-card`, `.hol-resumo`, `.hol-table` | HoleriteGrid, holerite/page |

---

## IDs no sistema — distinção importante

| Campo | Valor (Eduardo) | Descrição |
|-------|----------------|-----------|
| `session.gestorId` | 995 | `idUsuario` do login — ID no sistema de RH/Squadra (usado em endpoints de gestão, ponto, etc.) |
| `session.pessoaId` | 995 | ID da pessoa no Squadra (`/v1/pessoa`) — usado em `idAutor` de comentários e `remetenteID` de posts |

Para este usuário são iguais, mas podem diferir. Regra: usar `gestorId` para endpoints de gestão/ponto/equipe; `pessoaId` para autoria de conteúdo (comentários, posts, kudos).

---

## Variáveis de ambiente necessárias

Criar `.env.local` (nunca commitar):

```env
SESSION_SECRET=           # 32+ chars — gerar: openssl rand -base64 32
SQUADRA_API_URL=https://api.squadra.com.br/api
APP_URL=http://localhost:3000
ALLOWED_ORIGINS=          # origens permitidas para checkOrigin (CSRF)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
AIRTABLE_VIDEOS_TOKEN=    # fonte dos vídeos (Recursos/Extras)
AIRTABLE_VIDEOS_BASE=
```

---

## Regras críticas de segurança

- **IDOR:** Route Handlers usam `session.pessoaId` / `session.gestorId` — nunca query param do cliente
- **Token:** nunca em response body, nunca no bundle JS, nunca logado
- **CSRF:** `checkOrigin()` na primeira linha de todo Route Handler de mutação
- **NB-07:** campo `corpo` de comunicados é HTML da API → `DOMPurify + dangerouslySetInnerHTML`
- **Simulate:** `podeSimular === true` hardcoded para `session.data.id === 995`
- **Acesso RH/DP:** `temAcessoDP(perfilDP, cargo)` em `src/lib/dp-access.ts` — `perfilDP` é a fonte oficial, mas como a API nunca retorna `true` (ver `docs/known-issues.md` TI-DP-001) há fallback provisório por cargo iniciando com "Personnel". Validar com TI.
- **Dados sensíveis:** schemas de pessoa/perfil fazem spread do retorno bruto mas omitem campos sensíveis (CPF) via `semSensiveis()` no `squadra-client.ts`.

---

## Schemas — status de verificação (testado 2026-06-02)

| Schema | Implementação em squadra-client.ts | Status API real | Notas |
|--------|-----------------------------------|----------------|-------|
| `FeriasSaldoSchema` | `FeriasDadosSchema` | ✅ Bateu exatamente | Resposta flat (sem wrapper `retorno`). `saldoFeriasColaborador` chega como `number`. Datas em DD/MM/YYYY |
| `ServicoGestorSchema` | tipo `Servico` | ✅ Bateu exatamente | `id: number`, `nome`, `cliente`, `subprojetos: [{id, nome}]` |
| `PapelSchema` | `PapelItemSchema` + tipo `Papel` | ✅ Bateu exatamente | `id: number`, `nomePapel: string` |
| `PercentualItemRawSchema` | `PercentualData` + `PercentualItemSchema2` | ✅ Estrutura externa OK | `itens` veio vazio em jun/2026. Schema defensivo (múltiplos aliases) está correto. Verificar com dados reais quando houver lançamentos |

---

## Changelog

> Detalhe completo por componente em `docs/component-changelog.md`. Revisões em `docs/{review-report,qa-report,platform-review}.md`.

### 2026-06-04 — Hardening pós-review
- **QA funcional + review amplo da plataforma** (3 frentes: segurança/backend, frontend/a11y, arquitetura)
- Bugs corrigidos: hora extra noturna (meia-noite), ponto "ver outro" read-only, bloqueio de data futura, anexo por status do abono (Dialog + Blob), `aprovandoId` composto na Gestão
- Segurança P0/P1: `/api/videos` exige sessão; feed delete valida dono real; `checkOrigin` em competências; middleware cobre /feed,/recursos,/stack; CPF omitido do spread; `PUT /api/perfil` com Zod; erros genéricos (não vaza upstream); `dp-access` restrito; validação de id nas rotas RH
- A11y: `<h1>` nas páginas; foco visível no login; código morto removido (PostCard shared)
- Pendências registradas: TI-AUTHZ-001, DEBT-002, A11Y-PEND

### 2026-06-03 — Recursos/Extras + redesign do Ponto + RH/DP
- **Recursos/Extras** (novo): Links, Vídeos (Airtable) e Ajuda (FAQ com busca/árvore)
- **Ponto**: calendário redesenhado, resumo Saldo/Carga/Realizado, ações por dia, apontamento com nome do projeto
- **RH/DP**: menu liberado para o DP; abonos em abas; anexo corrigido (base64 da listagem); férias
- **Gestão**: aprovação direta no cartão; hora extra Banco/Folha; fotos
- UI: `VerificandoCredenciais`, cursor de clique global, avatares neutros

### 2026-06-02 — Paridade visual + funcional com web-app vanilla

#### Animações e loading states
- Portadas todas as animações do vanilla para `globals.css` (9 keyframes + classes)
- `pessoas/page`: hint state (teclado+mão animada) + search loader (lupa scan)
- `HoleriteGrid`: scan animation substituindo skeletons
- `PontoCalendar`: clock walk animation substituindo skeletons
- `feed/page`: swipe cards (posts) + mailbox (comunicados) substituindo skeletons
- `AnivCard`: chamas no bolo (aniversariantes) + crachá caindo (novos colabs); bug corrigido (novos colabs mostrava bolo errado)
- `DrawerColaborador`: substituído skeleton por `PerfilLoader` (card flip 3D)

#### `AvatarGradient` — anel gradiente
- Fotos agora exibem anel gradiente rosa→roxo→azul (`.avatar-wrap` do vanilla)
- Proporcional ao tamanho: `padding = max(1.5px, size * 6%)`

#### `PerfilLoader` — componente compartilhado
- Extraído para `src/components/shared/PerfilLoader.tsx`
- Usado em: `perfil/page.tsx`, `DrawerColaborador.tsx`

#### `PostCard` — componente compartilhado
- Extraído para `src/features/feed/components/PostCard.tsx`
- Usado em: `feed/page.tsx`, `home/page.tsx`, `KudosTab.tsx`
- Botão ✕ para deletar posts próprios (`remetenteID === gestorId`)

#### Holerite
- Grid: nome completo dos meses (Janeiro, não Jan); card nativo `.holerite-mes-card`
- Drawer: cabeçalho resumo 3 colunas (Proventos verde / Descontos vermelho / Líquido azul)
- Título: "Janeiro 2024" em vez de "01/2024"
- Histórico salarial: datas formatadas `MM/AAAA` (era ISO raw)
- `LoadingDoc` para histórico substituído pelo scan animation

#### Solicitações
- Removida aba Férias (não existe no vanilla colab)
- Adicionada aba **Dayoff** com form + histórico + `/api/solicitacoes/dayoff` route
- `/api/solicitacoes/projetos` — projetos alocados sem exigir permissão especial
- Hora Extra: select de projetos (dinâmico), fix de campos
- `SolCard`: título usa `descricao` (tipo) em vez de `motivo` (evita "." como título)
- `isDayoff`: inclui "FOLGA" além de "DAY OFF"

#### Perfil — Kudos
- `getPerfil` agora faz fallback para `/v1/pessoas/{pessoaId}` quando `kudosWalls === null`
- `KudosTab` reescrito com `PostCard` completo (like + comment + drawer)
- `useLikers` no `FeedDrawer`: busca nomes/fotos via `/api/pessoas/{id}` em paralelo

#### Pessoas — DrawerColaborador
- `PessoaItemSchema` agora usa spread `...d` — preserva `kudosWalls`, `listaInteresses`, `listaExperiencias`, etc.
- Tabs Kudos / Interesses / Habilidades funcionais

#### Feed — delete
- `DELETE /api/feed/posts?postId=X` → `DELETE /v1/squadraEmRede/deletar/{id}`
- `DELETE /api/feed/comentarios?id=X` → `DELETE /v1/squadraEmRede/excluirComentario?id={id}`
- `FeedDrawer` agora tem mutation interna para delete de comentário (sem prop threading)
- Botão ✕ nos comentários próprios (`idAutor === pessoaIdAtual` do store)
- Botão ✕ nos posts próprios no `PostCard` (`remetenteID === gestorId`)

#### Bugfixes
- `DrawerColaborador` — `<Fragment key>` corrige warning "Each child in list must have unique key"
- `AnivCard` — `emptyAsset` usava `emptyAniversariantes` em ambos os casos (bug no operador ternário)
- `FeedDrawer` — delete de comentário usava `gestorId` (errado) em vez de `pessoaId`

---

### 2026-06-02 — QA + Acessibilidade + Correções de segurança

#### Infraestrutura (QA FAIL-1)
- `src/middleware.ts` criado — `proxy.ts` existia mas não estava registrado como middleware do Next.js; todas as proteções de rota estavam inativas

#### Segurança (QA FAIL-2)
- `POST /api/auth`: `checkOrigin` adicionado — alinhado com política CSRF do projeto

#### Acessibilidade WCAG 2.1 AA (9 issues corrigidos)
- `PostCard` + `PostCardHome`: div clicável → `role="button"` + `tabIndex` + `onKeyDown`
- `PostCard` + `PostCardHome`: botões like/comentário → `aria-label` dinâmico + `aria-pressed` + emojis com `aria-hidden`
- `FluenciaModal`: `DialogTitle` sr-only adicionado (diálogo sem nome acessível)
- `Sidebar`: logo link → `focus-visible:ring-*`; `<aside>` → `aria-label="Menu lateral de navegação"`
- `Topbar`: botão nome/cargo → `focus-visible:ring-*`; `aria-label` diferenciado do botão avatar
- `BottomNav`: `<nav>` → `aria-label="Menu inferior"`
- `not-found`: metadata com acentos pt-BR corrigidos

#### Documentação
- `docs/` criada: `design-decisions.md`, `component-changelog.md`, `known-issues.md`
- `CLAUDE.md`: tabela de status de páginas + pendências atualizadas

---

### 2026-06-01 — Implementação inicial (Fases 1–7)

- `services/auth.ts`: 3 chamadas upstream (login → usuarios → pessoa)
- `SQUADRA_API_URL` corrigido para `https://api.squadra.com.br/api`
- `squadra-client.ts`: header `User-Agent: okhttp/4.9.2` obrigatório (Cloudflare)
- `getPermissoes` usa `upstream.id` (gestorId)
- SDD gaps documentados: auth, gestao, solicitacoes, perfil, percentual, ponto, feed

---

## Estratégia de deploy

Coexistência — vanilla em produção enquanto Next.js é validado em paralelo.
Troca via DNS quando paridade funcional + testes e2e passando.
Rollback = reverter DNS.
