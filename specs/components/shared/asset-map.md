# Asset Map — Loading e Empty States

Todos os assets vivem em `public/assets/` na app Next.js (copiados de `web-app/assets/`).
Referenciados via `PADRAO_IMAGENS` ou `ASSETS` em `src/lib/assets.ts`.

---

## Estratégia geral

| Tipo | Abordagem | Quando usar |
|------|-----------|-------------|
| **Loading de dados** | `<Skeleton>` CSS | Fetch de lista/calendário/grid — padrão MVP em todas as features |
| **Loading animado PNG** | base PNG + animação CSS | Hero loaders com identidade visual forte — polish Fase 6/7 |
| **Estado vazio** | `<EmptyState image="...">` | Lista retornou vazia ou nenhuma busca iniciada |
| **Estado inicial** | PNG estático + animação CSS | View que exige input antes de buscar (Pessoas, Equipe detalhe) |
| **Animação JS pura** | DOM + CSS keyframes | Sem PNG — `burstHearts` (feed like), relógio CSS (saldo home) |

---

## Mapa por feature

### Auth
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading | — | Sem fetch inicial; spinner inline no botão |
| Empty | — | Não aplicável |

---

### Home
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading geral | `<Skeleton>` | GreetingCard + AnivCard avatares + PostCard × 3 |
| Banco de horas — loading | CSS puro | Relógio inline com ponteiros animados via keyframes — **sem PNG** |
| Aniversariantes — loading hero | `assets/aniversariantes-loading.webp` | Base PNG + 3 chamas CSS oscilando nas velas |
| Aniversariantes — empty | `assets/aniversariantes-empty.webp` | Fatia de bolo mordida; frase: "Nenhum aniversariante hoje" |
| Novos colabs — loading hero | `assets/novos-colaboradores-loading.webp` | Base PNG + crachá CSS descendo e encaixando no kit de onboarding |
| Novos colabs — empty | — | Seção some se lista vier vazia |

> Loaders hero são polish de Fase 6. `<Skeleton>` cobre o MVP.

---

### Feed (Squadra em Rede)
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading posts | `<Skeleton height="120px">` × 4 | Padrão MVP |
| Loading hero | `assets/feed-card-1.webp` … `feed-card-4.webp` | 4 cards; animação swipe lateral CSS — polish Fase 6 |
| Posts — empty | `assets/feed-empty.webp` | Card rasgado; frase: "Nenhuma publicação encontrada" |
| Loading comunicados | `<Skeleton height="80px">` × 3 | — |
| Comunicados — loading hero | `assets/comunicados-loading.webp` | Caixa de correio; bandeirinha CSS subindo/descendo |
| Comunicados — empty | `<EmptyState title="Nenhum comunicado">` | Sem image |
| Like — explosão | CSS/JS puro (`burstHearts`) | 8 corações `❤️` irradiando via CSS keyframes — **sem PNG** |

---

### Perfil
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading form | `<Skeleton>` avatar 80×80 + 6 campos | Padrão MVP |
| Loading hero | `assets/perfil-card-front.webp` + `assets/perfil-card-back.webp` | Flip 3D CSS (frente → verso); verso sem avatar — polish Fase 6 |
| Empty | — | Não aplicável |

> `idCardFlipLoader` (utils.js) reutiliza esses dois assets em qualquer drawer de detalhe de colaborador.

---

### Pessoas
| Situação | Asset | Observação |
|----------|-------|-----------|
| Estado inicial (nenhuma busca) | `assets/pessoas-busca-teclado.webp` (base) + `assets/pessoas-busca-mao.webp` (dedo animado CSS) | Frase: "Digite **3** ou mais letras para buscar" |
| Loading busca | `<Skeleton height="80px">` grid 2 × 6 | Substitui o estado inicial durante o fetch |
| Busca sem resultado | `assets/pessoas-empty.webp` | Cards abstratos + lupa; frase: "Nenhum colaborador encontrado" |
| Detalhe — loading | `assets/perfil-card-front.webp` + `assets/perfil-card-back.webp` | Flip 3D — `idCardFlipLoader` reaproveitado no drawer |

---

### Holerite
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading grid | `LoadingDoc` (CSS puro) | Skeleton de linhas pulsando — componente feature-local; **sem PNG** |
| Histórico — empty | `<EmptyState title="Nenhum histórico disponível">` | Sem image específico |

---

### Ponto
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading calendário | `<Skeleton>` (grid de dias) | Padrão MVP |
| Loading hero | `assets/ponto-loading.webp` | Painel de jornada + ponteiro CSS percorrendo timeline — polish Fase 7 |
| Empty | — | Calendário sempre renderiza o mês |

---

### Gestão — Tab Equipe
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading lista | `<Skeleton height="72px">` × 5 | MVP |
| Painel detalhe — inicial | `assets/select-colaborador.webp` | "Selecione um colaborador" |
| Painel detalhe — loading | `assets/buscando-equipe-base.webp` + `assets/buscando-lupa.webp` | Base estática + lupa sobreposta animada via CSS (scan lateral) |
| Lista vazia | `<EmptyState title="Nenhum membro na equipe">` | Sem image |

### Gestão — Tab Pendências
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading | `assets/pendencias-loading.webp` | Prancheta + carimbo ✓ CSS |
| Sem pendências | `assets/empty-pendencias.webp` | Mesa organizada; frase: "Nenhuma pendência no momento." |

### Gestão — Tab Alocar
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading | `assets/alocar-loading.webp` | Quadro colaborador→projeto + ponto CSS percorrendo a rota |

### Gestão — Tab Solicitações (gestor) — 4 loaders independentes
| Tab | Asset de loading | Animação CSS |
|-----|-----------------|--------------|
| Hora Extra | `assets/hora-extra-loading.webp` | Relógio girando + símbolo `+` pulsando |
| Apropriação | `assets/ponto-loading.webp` | Painel de jornada + ponteiro percorrendo timeline |
| Férias | `assets/rh-ferias-loading.webp` | Coco caindo/rolando |
| Day-off | `assets/rh-abonos-loading.webp` | Pilha de pranchetas em fila contínua |

> Os 4 carregam em paralelo — cada tab tem seu loader independente desde o primeiro render.

---

### Percentual
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading | `<Skeleton>` | Header cards + lista |
| Mês sem itens | `<EmptyState title="Nenhum lançamento neste mês">` | Sem image |

---

### Solicitações (colaborador)
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading por tab | `<Skeleton height="88px">` × 3 | MVP |
| Loading hero | `assets/hora-extra-loading.webp` | Card com relógio e símbolo HE pulsando — polish Fase 7 |
| Lista vazia | `<EmptyState title="Nenhuma solicitação encontrada">` | Sem image |

---

### RH (gestor DP)
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading férias | `<Skeleton>` | MVP |
| Loading hero férias | `assets/rh-ferias-loading.webp` | Praia + coco CSS |
| Férias — sem pendências | `assets/rh-ferias-empty.webp` | 2 coqueiros + rede; sem animação |
| Loading abonos | `<Skeleton>` | MVP |
| Loading hero abonos | `assets/rh-abonos-loading.webp` | Pilha de pranchetas CSS |
| Abonos — sem pendências | `<EmptyState title="Nenhum abono pendente">` | Sem image |

---

### Férias (colaborador)
| Situação | Asset | Observação |
|----------|-------|-----------|
| Loading | `<Skeleton>` | MVP |
| Loading hero | `assets/rh-ferias-loading.webp` | Reaproveitado — mesma animação de coco |
| Histórico vazio | `assets/rh-ferias-empty.webp` | Reaproveitado |

---

### FluencIA (modal global)
| Situação | Asset | Observação |
|----------|-------|-----------|
| Ícone no menu | `assets/fluencia-icon.webp` | Sidebar + bottom-nav + hamburger |
| Logo no modal | `assets/fluencia-logo.webp` | Exibido dentro do `<Dialog>` |

> Não é rota — é modal no Shell. Ver `specs/features/fluencia/feature.md`.

---

## Assets de páginas de sistema

| Página | Asset | Frase |
|--------|-------|-------|
| 404 Not Found | `assets/notfound-404.webp` | "Não encontramos essa rota no mapa de horas." |
| 403 Acesso Negado | `assets/access-denied.webp` | Tela com porta bloqueada + escudo + crachá |

---

## Assets que NÃO migram para o Next.js

Fontes de recorte e backups — não referenciar no código:

```
*-chroma.webp / *-chroma.png
assets/buscando-equipe.webp           ← substituído por buscando-equipe-base + buscando-lupa
assets/feed-loading.webp              ← versão anterior; substituída pelos 4 cards
assets/perfil-card-back-com-avatar.webp  ← backup; não usar
assets/buscando-lupa-com-vidro.webp   ← backup antes de remover o miolo
```

---

## Animações CSS-only (sem PNG)

| Interação | Implementação | Feature |
|-----------|--------------|---------|
| Relógio banco de horas | 2 `<span>` com CSS keyframes (hora + minuto) | Home — `GreetingCard` |
| Explosão de corações no like | `burstHearts()` — cria 8 `<span>` via JS + CSS `--dx`/`--dy` | Feed — `PostCard` |

---

## Constantes recomendadas (`src/lib/assets.ts`)

```ts
export const PADRAO_IMAGENS = {
  // Empty states
  emptyPendencias:        '/assets/empty-pendencias.webp',
  emptyFeed:              '/assets/feed-empty.webp',
  emptyComunicados:       '/assets/feed-empty.webp',
  emptyKudos:             '/assets/feed-empty.webp',
  emptyPessoas:           '/assets/pessoas-empty.webp',
  emptyInteresses:        '/assets/interesses-empty.webp',
  emptyAniversariantes:   '/assets/aniversariantes-empty.webp',
  emptyFerias:            '/assets/rh-ferias-empty.webp',
  emptyFeriasHistorico:   '/assets/rh-ferias-empty.webp',
  emptyGestaoHoraExtra:   '/assets/hora-extra-loading.webp',
  emptyGestaoApropriacao: '/assets/ponto-loading.webp',
  emptyGestaoFerias:      '/assets/rh-ferias-empty.webp',
  emptyGestaoAbonos:      '/assets/rh-abonos-stack-base.webp',

  // Initial states / detail panel
  selectColaborador:      '/assets/select-colaborador.webp',
  pessoasBuscaTeclado:    '/assets/pessoas-busca-teclado.webp',
  pessoasBuscaMao:        '/assets/pessoas-busca-mao.webp',
  buscandoEquipeBase:     '/assets/buscando-equipe-base.webp',
  buscandoLupa:           '/assets/buscando-lupa.webp',

  // Hero loaders (base PNG + animação CSS)
  loadingAniversariantes: '/assets/aniversariantes-loading.webp',
  loadingNovosColabs:     '/assets/novos-colaboradores-loading.webp',
  loadingFeedCards:       [1, 2, 3, 4].map(n => `/assets/feed-card-${n}.webp`) as string[],
  loadingComunicados:     '/assets/comunicados-loading.webp',
  loadingHolerite:        '/assets/holerite-loading.webp',
  loadingPonto:           '/assets/ponto-loading.webp',
  loadingAlocar:          '/assets/alocar-loading.webp',
  loadingPendencias:      '/assets/pendencias-loading.webp',
  loadingHoraExtra:       '/assets/hora-extra-loading.webp',
  loadingFerias:          '/assets/rh-ferias-loading.webp',
  loadingAbonos:          '/assets/rh-abonos-loading.webp',
  loadingAbonosBase:      '/assets/rh-abonos-stack-base.webp',
  loadingPerfilFront:     '/assets/perfil-card-front.webp',
  loadingPerfilBack:      '/assets/perfil-card-back.webp',

  // FluencIA
  fluenciaIcon:           '/assets/fluencia-icon.webp',
  fluenciaLogo:           '/assets/fluencia-logo.webp',

  // Sistema
  notFound:               '/assets/notfound-404.webp',
  accessDenied:           '/assets/access-denied.webp',
} as const;

export const ASSETS = PADRAO_IMAGENS;
```

---

## Prioridade de implementação

| Fase | O que implementar |
|------|------------------|
| **Fase 5 (MVP)** | `<Skeleton>` em todo loading + assets de empty state e initial state |
| **Fase 6 (polish)** | Hero loaders: Home, Feed (4 cards), Pessoas, Perfil (flip), Equipe detalhe |
| **Fase 7 (detalhe)** | Hero loaders: Ponto, Gestão/Pendências, Gestão/Alocar, Solicitações gestor (4 tabs), RH/Férias |
