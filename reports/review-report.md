# Review Report — web-app-next (Rodada 2)
Gerado em: 2026-06-02

## Resultado Geral: ✅ APROVADO — Pronto para qa-agent

> Todos os issues da rodada anterior resolvidos. 1 fix aplicado inline nesta rodada.

---

## Perspectivas da Squad

| Perspectiva | Status | Issues |
|-------------|--------|--------|
| Front-end   | ✅ Aprovado | — |
| Back-end    | ✅ Aprovado | — |
| QA          | ✅ Aprovado | 1 corrigido inline |
| Arquiteto   | ✅ Aprovado | — |
| Segurança   | ✅ Aprovado | — |
| PO          | ✅ Aprovado | 1 nota informativa |

---

## Verificação dos fixes da Rodada 1 — todos passaram

| Fix | Arquivo | Status |
|-----|---------|--------|
| `checkOrigin()` no `DELETE /api/auth` | `api/auth/route.ts:76-77` | ✅ Presente |
| `prefers-reduced-motion` para `drawerIn` | `globals.css:140-142` | ✅ Presente |
| `prefers-reduced-motion` para `feed-heart-burst` | `globals.css:1170-1172` | ✅ Presente |
| `key={String(pr['id'] ?? pr['projetoId'] ?? i)}` em projetos | `DrawerColaborador.tsx:102` | ✅ Presente |

---

## Segurança ✅ — varredura completa (49 route.ts)

- ✅ **Todos os 49 route handlers** de mutação (POST/PUT/DELETE) têm `checkOrigin()` como primeira chamada — zero exceções
- ✅ `dangerouslySetInnerHTML` em `home/page.tsx:154` e `feed/page.tsx` — ambos passam por `DOMPurify.sanitize()` ✓
- ✅ `FeedDrawer` delete de comentário usa `pessoaIdAtual` (store `pessoaId`), não `gestorId` ✓
- ✅ Zero `console.log` com dados sensíveis em client-side; `console.error` server-side usa apenas labels de contexto ✓
- ✅ Sem tokens, senhas ou PII hardcoded ✓

---

## QA ✅ (1 corrigido)

**[CORRIGIDO]** `src/features/solicitacoes/hooks/useSolicitacoes.ts:98-110`
- `horaExtraMutation` estava sem `onSuccess: invalidate` — adicionado para manter consistência com abono/dayoff

**[OK]** Todas as 3 tabs de solicitação têm `<FormFeedback type="error">` no caminho de erro ✓

**[OK]** `FeedDrawer` — após delete de comentário: `onSuccess` invalida query + local state removido via `setLocalComentarios` ✓

**[OK]** `AnivCard` — empty state corretamente diferente: aniversariantes têm imagem, novos colabs têm só texto ✓

**[OK]** `KudosTab` — dados vêm do `perfil` pré-carregado (não async), logo sem loading state próprio — correto ✓

---

## Arquiteto ✅

**[OK]** `KudosTab` importa `PostCard` de `@/features/feed/components/PostCard` ✓

**[OK]** `FeedDrawer` usa `useUserStore` para `pessoaIdAtual`, `nomeAtual`, `fotoAtual` — sem dependência de props para dados do usuário ✓

**[OK]** Sem duplicatas de componentes — `components/shared/PostCard.tsx` não existe (falso positivo da rodada 1) ✓

---

## PO ✅ — nota informativa

**[OK]** Todas as features das fases 1-8 entregues ✓

**[NOTA INFORMATIVA]** `/feed` existe como rota mas não está no `Sidebar` nem no `BottomNav`.
- O feed é acessível pela `home/page.tsx` (seção "Squadra em Rede" integrada).
- A rota `/feed` parece ser uma versão standalone para tela cheia — válido como rota direta, não precisa estar no nav principal.
- `BottomNav` tem botão "Mais" que abre `MobileNav` com todas as rotas condicionais. ✓

**[OK]** `FluenciaModal` — conectado em Sidebar, BottomNav e MobileNav via `setFluencia(true)` ✓ (falso positivo da rodada 1)

**[OK]** 404 page (`src/app/not-found.tsx`) implementada ✓

---

## Fix aplicado nesta rodada

| Arquivo | Fix |
|---------|-----|
| `src/features/solicitacoes/hooks/useSolicitacoes.ts:110` | `onSuccess: invalidate` adicionado ao `horaExtraMutation` |

---

## Status para qa-agent

✅ **Aprovado para iniciar** `qa-agent` — todos os checks de segurança, integração, QA e arquitetura passaram.

**Pendências restantes (não bloqueiam QA):**
| Prioridade | Item |
|------------|------|
| 🟢 Baixa | Testes Playwright (8 fluxos críticos) |
| 🟢 Baixa | Vitest para schemas e regras puras |
| 🟢 Baixa | `PercentualItemRawSchema` — aguardar lançamentos para verificar itens |
