# Audit Report — Acessibilidade WCAG 2.1 AA
Gerado em: 2026-06-02
Escopo: Acessibilidade (SEO ignorado por instrução)
TypeScript após correções: ✅ zero erros

## Resumo
- **Críticos:** 3 → 0 (todos corrigidos)
- **Importantes:** 6 → 0 (todos corrigidos)
- **Sugestões:** 3 (decisão humana — não aplicadas)

---

## Issues Críticos (WCAG Level A)

### [ACESS-001] Div clicável sem role/keyboard ✅ CORRIGIDO
- **Localização:** `src/features/feed/components/PostCard.tsx` + `src/app/(app)/home/page.tsx` (PostCardHome)
- **Critério WCAG:** 2.1.1 Keyboard (Level A)
- **Problema:** O card do post era um `<div>` com `onClick` e `cursor-pointer` mas sem `role`, `tabIndex` ou handler de teclado. Usuários de teclado não conseguiam abrir o drawer do post.
- **Correção aplicada:**
  ```tsx
  <div
    role="button"
    tabIndex={0}
    aria-label={`Ver post de ${post.remetenteNome}`}
    onClick={() => setDrawerOpen(true)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerOpen(true); } }}
  >
  ```

---

### [ACESS-002] Botões like e comentário sem aria-label ✅ CORRIGIDO
- **Localização:** `src/features/feed/components/PostCard.tsx` + `src/app/(app)/home/page.tsx` (PostCardHome)
- **Critério WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Problema:** Botões usavam apenas emojis (❤️/🤍 e 💬) como conteúdo. Screen readers anunciam o emoji mas sem contexto de ação ("coração vermelho médio" em vez de "Curtir, 5 curtidas").
- **Correção aplicada:**
  ```tsx
  // Like
  aria-label={liked ? `Descurtir. ${post.curtidas.length} curtidas` : `Curtir. ${post.curtidas.length} curtidas`}
  aria-pressed={liked}
  // emoji com aria-hidden="true"

  // Comentário
  aria-label={`Ver ${post.numComentarios} comentário${post.numComentarios !== 1 ? 's' : ''}`}
  // emoji com aria-hidden="true"
  ```

---

### [ACESS-003] FluenciaModal sem nome acessível no diálogo ✅ CORRIGIDO
- **Localização:** `src/components/shared/FluenciaModal.tsx`
- **Critério WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Problema:** shadcn/ui `DialogContent` usa `aria-labelledby` internamente e espera um `DialogTitle` para dar nome ao diálogo. Sem ele, screen readers anunciam o diálogo sem identificá-lo ("diálogo" sem contexto).
- **Correção aplicada:** adicionado `<DialogTitle className="sr-only">FluencIA — plataforma de IA da Squadra</DialogTitle>` como primeiro elemento do `DialogContent`.

---

## Issues Importantes (WCAG Level AA)

### [ACESS-004] Logo link do Sidebar sem indicador de foco ✅ CORRIGIDO
- **Localização:** `src/components/layout/Sidebar.tsx` linha 103
- **Critério WCAG:** 2.4.7 Focus Visible (Level AA)
- **Problema:** Link tinha `focus:outline-none` sem `focus-visible` alternativo. Foco via teclado era invisível.
- **Correção aplicada:** adicionado `focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm`

---

### [ACESS-005] Botão nome/cargo no Topbar sem indicador de foco ✅ CORRIGIDO
- **Localização:** `src/components/layout/Topbar.tsx` linha 66
- **Critério WCAG:** 2.4.7 Focus Visible (Level AA)
- **Problema:** Botão com `focus:outline-none` sem `focus-visible` — foco invisível via teclado.
- **Correção aplicada:** adicionado `focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md`

---

### [ACESS-006] `<aside>` do Sidebar sem aria-label ✅ CORRIGIDO
- **Localização:** `src/components/layout/Sidebar.tsx` linha 96
- **Critério WCAG:** 1.3.6 Identify Purpose / Best Practice de landmarks
- **Problema:** Com múltiplas regiões de navegação na página (Sidebar + BottomNav), o `<aside>` sem `aria-label` não permite que screen reader users distingam a navegação lateral.
- **Correção aplicada:** `aria-label="Menu lateral de navegação"`

---

### [ACESS-007] `<nav>` do BottomNav sem aria-label ✅ CORRIGIDO
- **Localização:** `src/components/layout/BottomNav.tsx` linha 25
- **Critério WCAG:** 2.4.1 Bypass Blocks / Best Practice de landmarks
- **Problema:** Múltiplas `<nav>` sem label — screen readers não conseguem distinguir entre menu lateral e menu inferior.
- **Correção aplicada:** `aria-label="Menu inferior"`

---

### [ACESS-008] Dois botões com mesmo aria-label no Topbar ✅ CORRIGIDO
- **Localização:** `src/components/layout/Topbar.tsx`
- **Critério WCAG:** 1.3.1 Info and Relationships (Level A)
- **Problema:** O botão de nome/cargo e o botão do avatar tinham `aria-label="Ir para perfil"`. Screen reader listaria "Ir para perfil" duas vezes adjacentes sem distinção.
- **Correção aplicada:** botão nome/cargo agora usa `aria-label={`Ver perfil de ${nome}`}`; botão avatar mantém `"Ir para perfil"`.

---

### [ACESS-009] Metadado de not-found sem acentos ✅ CORRIGIDO
- **Localização:** `src/app/not-found.tsx` linha 5
- **Critério WCAG:** 3.1.1 Language of Page (Level A)
- **Problema:** `title: 'Pagina nao encontrada - Horas'` — screen readers com síntese pt-BR pronunciam incorretamente palavras sem acento ("pagina" em vez de "página").
- **Correção aplicada:** `title: 'Página não encontrada — Horas'`

---

## Sugestões (não aplicadas automaticamente)

### [SUG-001] Homepage sem `<h1>`
- **Localização:** `src/app/(app)/home/page.tsx`
- **Problema:** A página home não tem `<h1>`. O título da rota aparece apenas como `<span>` no Topbar, não como heading. Screen reader users não têm referência de heading para a página inicial.
- **Sugestão:** Adicionar um `<h1 className="sr-only">Home</h1>` ou tornar o greeting card em heading visível.

### [SUG-002] Skip link para conteúdo principal ausente
- **Problema:** Não há `<a href="#main-content">Pular para o conteúdo</a>` antes da navegação. Usuários de teclado precisam tabular por todos os itens do Sidebar/Topbar a cada navegação.
- **Sugestão:** Adicionar no início do `RootLayout` ou `Shell`:
  ```tsx
  <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:p-2 focus:bg-white focus:ring-2">
    Pular para o conteúdo
  </a>
  ```
  E no `<main>` do Shell: `id="main-content"`.

### [SUG-003] `<h1>` ausente em várias páginas de feature
- **Localização:** `home/page.tsx`, potencialmente `gestao/page.tsx`, `ponto/page.tsx` e outras
- **Problema:** O Topbar exibe o título da rota como `<span>` (não heading). Páginas como Feed têm `<h1>` explícito; outras podem não ter.
- **Sugestão:** Auditar cada page.tsx para garantir um `<h1>` por página — pode ser visível ou `sr-only`.

---

## O que já estava correto (PASS)

| Critério | Evidência |
|---|---|
| `lang="pt-BR"` no `<html>` | `layout.tsx:35` |
| `prefers-reduced-motion` em todas as animações | 12 blocos `@media` em `globals.css` |
| `role="status" aria-live="polite"` nos loading states | `FeedLoading`, `ComunicadosLoading` |
| `aria-hidden` nos Skeletons de loading | `Sidebar.tsx:121`, `MobileNav.tsx:98` |
| `<SheetTitle className="sr-only">` no MobileNav | `MobileNav.tsx:83` |
| `role="alert"` no bloco de erro do LoginForm | `LoginForm.tsx:135` |
| `role="alert"` no `ErrorSection` | `ErrorSection.tsx:10` |
| `role="alert"` no ApprovalModal | `ApprovalModal.tsx:120` |
| `role="tablist"` + `role="tab"` + `aria-selected` no TabNav | `TabNav.tsx:31–43` |
| Navegação por setas (ArrowLeft/ArrowRight) no TabNav | `TabNav.tsx:17–26` |
| `tabIndex={active ? 0 : -1}` no TabNav (roving tabindex) | `TabNav.tsx:39` |
| `focus-visible:ring-2` nos botões do TabNav | `TabNav.tsx:43` |
| `aria-label` no botão toggle sidebar | `Sidebar.tsx:154` |
| `aria-label` no botão Sair da Sidebar | `Sidebar.tsx:146` |
| `aria-label` no botão hamburger do Topbar | `Topbar.tsx:48` |
| `aria-label` no botão "Remover post" do PostCard | `PostCard.tsx:79` |
| `htmlFor`/`id` em todos os campos do ApprovalModal | `ApprovalModal.tsx:83–100` |
| `<label>` + `id` nos inputs do LoginForm | `LoginForm.tsx:76,99` |
| `autoComplete="username"/"current-password"` no LoginForm | `LoginForm.tsx:79,102` |
| `<h1>` presente em login, feed, not-found (via IllustratedState) | `login/page.tsx:38`, `feed/page.tsx:93`, `IllustratedState.tsx:42` |
| `alt=""` em imagens decorativas (EmptyState, FluencIA icon) | `EmptyState.tsx:17`, `Sidebar.tsx:135` |
| `alt` descritivo em imagens de conteúdo | `login/page.tsx` logo, `IllustratedState.tsx` |
| `DOMPurify.sanitize` antes de `dangerouslySetInnerHTML` | `feed/page.tsx:52`, `home/page.tsx:149` |
| `min-h-[44px]` em todos os itens do BottomNav | `BottomNav.tsx` |
| `focus-visible:ring-ring` no botão avatar do Topbar | `Topbar.tsx:77` |
| `focus-visible:ring-2 focus-visible:ring-ring` no botão FluencIA | `FluenciaModal.tsx:53` |

---

## Resultado Final

**Críticos: 0 / Importantes: 0 / Sugestões: 3**

Todos os issues críticos e importantes foram corrigidos em iteração única.
TypeScript: ✅ zero erros após todas as correções.
Pipeline desbloqueado para `squad-reviewer`.
