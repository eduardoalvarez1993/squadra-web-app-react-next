# Design Decisions — web-app-next

Decisões não-óbvias tomadas durante a implementação e ciclos de QA/auditoria.
Ordenadas do mais recente para o mais antigo.

---

## RH / DP e Ponto (2026-06-03/04)

### Decisão: acesso ao RH/DP por cargo, com `perfilDP` como fonte oficial
- **Data:** 2026-06-03
- **Contexto:** O endpoint `/v1/pessoa/permissoes/{id}` retorna `perfilDP: false` para TODOS — inclusive a gerente do DP. Validado por curl em 180+ pessoas (ver `known-issues.md` TI-DP-001). Os 3 apps (vanilla, next, react) dependem dessa flag, então ninguém do DP veria o menu.
- **Decisão tomada:** `temAcessoDP(perfilDP, cargo)` em `src/lib/dp-access.ts` — usa `perfilDP` quando `true`; senão, fallback para cargo que **começa com** "Personnel" (cobre "PERSONNEL ANALYST" e "PERSONNEL ADMINISTRATION MANAGER", reais do DP).
- **Alternativa considerada:** Esperar a TI popular `perfilDP`; ou match por projeto ("DEPTO DE PESSOAL").
- **Por que descartada:** Bloquearia o DP indefinidamente; cargo é mais barato que projeto. Fallback é **provisório** — remover quando a flag for corrigida no backend.

### Decisão: anexo de abono via base64 da listagem (não endpoint dedicado)
- **Data:** 2026-06-03
- **Contexto:** `/v1/abono/downloadAnexo/{id}` retorna **404** (não existe). O base64 do anexo já vem no campo `arquivo` de `/v1/listaAbonosDP/0/0/{status}` — é assim que o vanilla exibe.
- **Decisão tomada:** `getAbonoAnexo(id, status)` rebusca a listagem do status e extrai o `arquivo` do item. O `AnexoViewer` recebe o status do próprio abono e renderiza via Blob URL.
- **Trade-off aceito:** N+1 (rebusca a lista por anexo) — registrado em `platform-review.md` P2-10.

### Decisão: `AbonoRH` mapeia campos reais da API (não os do spec)
- **Data:** 2026-06-03
- **Contexto:** A API real usa `id`/`nome`/`descricao`/`dataInicio`/`horas:"HH:MM"`/`status:"PENDENTE"`, divergente do schema inicial (`idUnico`/`nomeColaborador`/`horas:number`). Causava key duplicada e status errado.
- **Decisão tomada:** `AbonoRHItemSchema` lê os campos reais, normaliza status para `P/A/R/C` e mantém `horas` como string.

### Decisão: visualização de ponto de outro colaborador é somente-leitura
- **Data:** 2026-06-04
- **Contexto:** Ao ver o ponto de outro (`?sqhorasId=`), abrir o drawer de apontamento usaria os projetos e a identidade do **usuário logado**, gravando no lugar errado.
- **Decisão tomada:** Com `outraSqhorasId` presente, bloquear registrar/apontar e ocultar Dias Pendentes (guards em `openFromCalendar`/`openFromPendente`).

### Decisão: omitir campos sensíveis do spread em vez de remover o spread
- **Data:** 2026-06-04
- **Contexto:** Schemas de pessoa/perfil fazem `...d` para preservar campos ricos (kudos, interesses, skills) que a UI usa. Mas isso vazava CPF para qualquer colaborador.
- **Decisão tomada:** `semSensiveis()` remove apenas `cpf/senha/token/...` do spread, mantendo o resto. Menos frágil que um whitelist completo (que quebraria a UI a cada campo novo).

---

## Infraestrutura / Foundation

### Decisão: middleware em `proxy.ts` separado de `middleware.ts`
- **Data:** 2026-06-02
- **Contexto:** O Next.js App Router exige `src/middleware.ts` com `export default`. A lógica foi escrita em `src/proxy.ts` (função nomeada `proxy`), mas o arquivo de entrada faltava.
- **Decisão tomada:** Criar `src/middleware.ts` com uma única linha: `export { proxy as default } from './proxy'`. Manter `proxy.ts` como o módulo real para facilitar testes unitários isolados da lógica de middleware sem depender do runtime do Next.js.
- **Alternativa considerada:** Colocar tudo diretamente em `middleware.ts`.
- **Por que descartada:** `proxy.ts` como módulo separado permite importar e testar `proxy()` e `hasValidSession()` em isolamento (sem mock do Next.js middleware runtime).

---

### Decisão: `checkOrigin` em POST `/api/auth` (login)
- **Data:** 2026-06-02
- **Contexto:** CSRF em endpoints de login tem impacto menor que em mutations de dados (o atacante precisaria das credenciais da vítima). Mesmo assim, a política do projeto ("checkOrigin em todo handler de mutação") foi violada.
- **Decisão tomada:** Adicionar `checkOrigin` na primeira linha do POST handler de `/api/auth`, consistente com todos os outros handlers de mutação.
- **Alternativa considerada:** Excepcionar login da regra de checkOrigin por ser um endpoint de autenticação público.
- **Por que descartada:** Consistência de política reduz surface de erro humano. O rate limiting via Upstash já cobre abuso de força-bruta; o checkOrigin cobre CSRF.

---

### Decisão: foto do usuário fora do cookie de sessão
- **Data:** 2026-06-01
- **Contexto:** Iron Session usa cookies httpOnly com limite de ~4 KB. Fotos de avatar chegam como base64 da API Squadra e podem ter vários KB.
- **Decisão tomada:** `foto` não é salva no cookie. O campo existe no store Zustand (carregado via `/api/auth/me`) mas é obtido diretamente na resposta do login e populado no store client-side.
- **Alternativa considerada:** Salvar URL da foto (não base64) no cookie.
- **Por que descartada:** A API Squadra retorna base64, não URL. Converter implicaria um serviço de upload adicional fora do escopo atual.

---

### Decisão: `podeSimular` hardcoded para `id === 995`
- **Data:** 2026-06-01
- **Contexto:** O modo de simulação (impersonation de colaboradores) é uma feature de debug/suporte restrita ao administrador principal.
- **Decisão tomada:** `session.podeSimular = upstream.id === 995` — hardcoded para o ID do gestor Eduardo.
- **Alternativa considerada:** Flag via permissão da API (`permissoes.podeSimular`).
- **Por que descartada:** A API Squadra não expõe esse campo. Hardcode é explícito e auditável; uma flag invisível na API seria difícil de rastrear.

---

### Decisão: `normalizeFoto` sem `startsWith('/')`
- **Data:** 2026-06-01
- **Contexto:** JPEG base64 começa com `/9j/` — usar `startsWith('/')` para detectar URLs causaria falso positivo e quebraria a exibição de fotos.
- **Decisão tomada:** `normalizeFoto` checa `startsWith('data:') || startsWith('http')` e, para qualquer outro valor string, assume que é base64 e prefixa com `data:image/jpeg;base64,`.
- **Alternativa considerada:** Usar regex para detectar base64 válida.
- **Por que descartada:** Desnecessário — a API Squadra só retorna base64 puro ou null. A detecção simples é suficiente e mais legível.

---

### Decisão: retry 1× em erros 5xx no `squadra-client`
- **Data:** 2026-06-01
- **Contexto:** A API Squadra é instável e retorna 502/503 esporadicamente.
- **Decisão tomada:** `sq()` faz retry automático 1× em `SquadraServerError`. Retry não ocorre em 4xx (erro do cliente) nem em timeout (AbortError).
- **Alternativa considerada:** Retry via TanStack Query (retryDelay).
- **Por que descartada:** O retry precisa acontecer dentro do Route Handler (server-side), antes de retornar para o cliente. TanStack Query faz retry client-side, o que implicaria uma segunda round-trip de rede.

---

## Acessibilidade

### Decisão: `PostCard` como `role="button"` em vez de `<article>`
- **Data:** 2026-06-02
- **Contexto:** O card do post precisa ser ativável via teclado (abre o drawer de detalhes). A marcação original era `<div>` sem semântica interativa.
- **Decisão tomada:** Adicionar `role="button"` + `tabIndex={0}` + `onKeyDown` no div container. Manter como div (não `<button>`) para evitar conflitos de estilo com os botões internos de like/comentário.
- **Alternativa considerada:** Transformar em `<article>` com um link/botão interno "Ver detalhes".
- **Por que descartada:** A UX intencional é que clicar em qualquer parte do card abre o drawer. Um link interno forçaria o usuário a encontrar o elemento específico, quebrando a paridade com o vanilla.

### Decisão: `aria-pressed` nos botões de like
- **Data:** 2026-06-02
- **Contexto:** O botão de like tem estado binário (curtido/não curtido) — é semanticamente um toggle button.
- **Decisão tomada:** `aria-pressed={liked}` além do `aria-label` dinâmico.
- **Alternativa considerada:** Apenas `aria-label` descrevendo o estado.
- **Por que descartada:** `aria-pressed` é o atributo semântico correto para toggle buttons e é anunciado explicitamente por screen readers como "pressionado" / "não pressionado", independente do `aria-label`.

### Decisão: `DialogTitle` sr-only no `FluenciaModal`
- **Data:** 2026-06-02
- **Contexto:** shadcn/ui `Dialog` usa `aria-labelledby` apontando para o ID do `DialogTitle`. Sem `DialogTitle`, o atributo fica sem alvo e o diálogo não tem nome acessível.
- **Decisão tomada:** Adicionar `<DialogTitle className="sr-only">` com texto descritivo. Não exibir visualmente pois o logo da FluencIA já serve como identidade visual do modal.
- **Alternativa considerada:** `aria-label` diretamente no `DialogContent`.
- **Por que descartada:** Vai contra a convenção do shadcn/ui e pode ser sobrescrito internamente. `DialogTitle` é a forma oficial.

---

## Feed

### Decisão: DOMPurify com guard `typeof window !== 'undefined'`
- **Data:** 2026-06-01
- **Contexto:** Next.js App Router pode renderizar componentes no servidor (RSC) e no cliente. DOMPurify requer o DOM e falha em ambientes Node.js.
- **Decisão tomada:** `typeof window !== 'undefined' ? DOMPurify.sanitize(c.corpo) : c.corpo` — em SSR retorna o HTML não sanitizado (que não é renderizado no servidor de qualquer forma), em CSR sanitiza antes de `dangerouslySetInnerHTML`.
- **Alternativa considerada:** `isomorphic-dompurify` ou sanitização server-side.
- **Por que descartada:** `isomorphic-dompurify` adiciona dependência. A sanitização server-side via regex é perigosa. O guard é simples e suficiente pois `dangerouslySetInnerHTML` só executa no cliente.

### Decisão: delete de posts/comentários sem validação de autoria no Route Handler
- **Data:** 2026-06-01
- **Contexto:** Para validar autoria server-side seria necessário buscar o post antes de deletar (round-trip adicional à API Squadra).
- **Decisão tomada:** Delegar a validação de autoria para a API Squadra upstream. O frontend só exibe o botão ✕ para posts/comentários próprios.
- **Alternativa considerada:** Buscar o post antes de deletar para verificar `remetenteID === session.pessoaId`.
- **Por que descartada:** Dobra a latência de toda operação de delete. A API Squadra deve rejeitar deleções não autorizadas — **pendente confirmação** (ver `known-issues.md` INCONC-003).

---

## Ponto

### Decisão: `sqhorasId` livre via query param em GET `/api/ponto`
- **Data:** 2026-06-01
- **Contexto:** Gestores precisam visualizar o ponto de membros da equipe no `MembroDrawer`. A alternativa seria um endpoint separado como `/api/gestao/membro/[id]/ponto` (que também existe e usa `gerenteFuncional`).
- **Decisão tomada:** GET `/api/ponto?sqhorasId=X` aceita sqhorasId externo para qualquer usuário com `bateRep: true`, sem verificar vínculo gestor↔colaborador.
- **Alternativa considerada:** Exigir `gerenteFuncional` para consultar sqhorasId externo.
- **Por que descartada:** Usuários com `bateRep` mas sem `gerenteFuncional` podem precisar consultar próprio histórico em dispositivos diferentes. **Pendente decisão de produto** (ver `known-issues.md` INCONC-004).
