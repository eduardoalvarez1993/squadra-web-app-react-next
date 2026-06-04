# Known Issues / Tuning Pendente — web-app-next

Issues inconclusivos (INCONC) do qa-report e sugestões de acessibilidade que dependem de decisão humana ou dados reais.

---

## Em Aberto

| ID | Área | Descrição | Ciclo QA | Prioridade |
|----|------|-----------|----------|------------|
| INCONC-001 | Testes E2E | Testes Playwright pendentes — 8 fluxos críticos (login, ferias, ponto, gestão, feed, perfil, pessoas, holerite). Requerem dados de massa reais. | v2 | Alta |
| INCONC-002 | Percentual | `PercentualItemRawSchema` — campo `itens` retornou vazio em jun/2026 (período sem lançamentos). Schema defensivo correto mas precisa de verificação com dados reais. | v2 | Média |
| INCONC-005 | Hora Extra — Histórico | Não existe endpoint upstream para listar as próprias horas extras do colaborador. Verificado em: web-app vanilla (`solicitacoes-colab.js` — sem `carregarHorasExtras`), React Native (`c:\Users\eduar\Downloads\squadra-app-react\app\services\horaExtraService.ts` — só tem endpoint de gestor `/v1/gestor/solicitacoesHorasAlemDoPrevistoPendentes/{gestorId}`), e `APIS.md` do mesmo app. A única alternativa seria varrer `PontoDia.dadosHoraExtra` mês a mês, mas é pesado e limitado. Feature não implementada por ausência de API. **Não investigar novamente.** | 2026-06-03 | Baixa |
| SUG-A11Y-001 | Acessibilidade | `home/page.tsx` sem `<h1>`. O título da rota aparece no Topbar como `<span>`, não como heading. Screen reader users não têm referência de heading para a homepage. Adicionar `<h1 className="sr-only">Home</h1>` ou transformar o greeting em heading. | Auditoria 2026-06-02 | Baixa |
| SUG-A11Y-002 | Acessibilidade | Skip link "Pular para o conteúdo" ausente. Usuários de teclado precisam tabular por toda a navegação (Sidebar/Topbar) a cada mudança de rota. Adicionar `<a href="#main-content">` no Shell + `id="main-content"` no `<main>`. | Auditoria 2026-06-02 | Baixa |
| SUG-A11Y-003 | Acessibilidade | Auditar `<h1>` em todas as páginas de feature. `feed/page.tsx` tem `<h1>` explícito; outras páginas podem não ter. Confirmar e adicionar `<h1 sr-only>` onde faltar. | Auditoria 2026-06-02 | Baixa |
| TI-DP-001 | Segurança / Permissão | `perfilDP` da API nunca retorna `true` (nem para a gerente do DP). Acesso ao RH usa fallback por cargo "Personnel" (`dp-access.ts`). Validar com TI a correção da flag no backend e remover o fallback; confirmar lista exata de cargos do DP. | 2026-06-03 | Média |
| TI-DP-002 | Segurança / Escopo | `listaAbonosDP` e `getRHFerias(session.gestorId)` — confirmar com TI se o perfil DP deve ver abonos/férias de toda a empresa ou com segregação por unidade/equipe (anexo de abono não é escopado). | 2026-06-03 | Média |
| DEBT-001 | Arquitetura | Normalização de status duplicada com regras divergentes: `statusMap` (rh/page.tsx, P/A/R/C) vs `statusLabel` (gestao/page.tsx, aceita 1/2). Unificar num util único após alinhar as regras (gestão usa códigos numéricos). Não unificado agora por risco de regressão. | 2026-06-03 | Baixa |
| QA-INCONC-PONTO | Ponto | Cores/labels por dia, timezone na borda do mês e aceite/rejeição (422) do POST de apontamento dependem de massa real do SQHoras para validação. | 2026-06-03 | Média |

---

## Resolvidos

| ID | Área | Descrição | Resolvido em | Como |
|----|------|-----------|--------------|------|
| FAIL-QA-001 | Infraestrutura | `middleware.ts` inexistente — proteções de rota inativas, rate limiting desativado | QA v2 / 2026-06-02 | Criado `src/middleware.ts` com re-export do `proxy.ts` |
| FAIL-QA-002 | Segurança | POST `/api/auth` sem `checkOrigin` — violação da política CSRF | QA v2 / 2026-06-02 | Adicionado `checkOrigin` na primeira linha do handler |
| ACESS-001 | Acessibilidade | PostCard div clicável sem role/keyboard (WCAG 2.1.1) | Auditoria 2026-06-02 | `role="button"` + `tabIndex` + `onKeyDown` |
| ACESS-002 | Acessibilidade | Botões like/comentário sem `aria-label` (WCAG 4.1.2) | Auditoria 2026-06-02 | `aria-label` dinâmico + `aria-pressed` + `aria-hidden` nos emojis |
| ACESS-003 | Acessibilidade | FluenciaModal sem `DialogTitle` — diálogo sem nome acessível (WCAG 4.1.2) | Auditoria 2026-06-02 | Adicionado `<DialogTitle className="sr-only">` |
| ACESS-004 | Acessibilidade | Logo link Sidebar sem `focus-visible` (WCAG 2.4.7) | Auditoria 2026-06-02 | `focus-visible:ring-2 focus-visible:ring-ring` |
| ACESS-005 | Acessibilidade | Botão nome/cargo Topbar sem `focus-visible` (WCAG 2.4.7) | Auditoria 2026-06-02 | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md` |
| ACESS-006 | Acessibilidade | `<aside>` Sidebar sem `aria-label` | Auditoria 2026-06-02 | `aria-label="Menu lateral de navegação"` |
| ACESS-007 | Acessibilidade | `<nav>` BottomNav sem `aria-label` | Auditoria 2026-06-02 | `aria-label="Menu inferior"` |
| ACESS-008 | Acessibilidade | Dois botões com mesmo `aria-label="Ir para perfil"` no Topbar (WCAG 1.3.1) | Auditoria 2026-06-02 | Botão nome/cargo alterado para `"Ver perfil de {nome}"` |
| ACESS-009 | Acessibilidade | Metadado `not-found` sem acentos pt-BR (WCAG 3.1.1) | Auditoria 2026-06-02 | `'Página não encontrada — Horas'` |
| INCONC-003 | Feed — Segurança | `DELETE /api/feed/posts` e `DELETE /api/feed/comentarios` sem validação de autoria no BFF | 2026-06-02 | Posts: `remetenteID` obrigatório na query, comparado com `session.pessoaId`. Comentários: `postId` obrigatório, BFF busca a lista via `getComentarios` e verifica `idAutor === session.pessoaId` antes de deletar |
| INCONC-004 | Ponto — Autorização | `GET /api/ponto?sqhorasId=X` sem verificação de vínculo gestor↔colaborador — potencial IDOR | 2026-06-02 | Adicionado guard: `sqhorasId !== session.sqhorasId` exige `permissoes.gerenteFuncional`; sem essa permissão retorna 403 |
