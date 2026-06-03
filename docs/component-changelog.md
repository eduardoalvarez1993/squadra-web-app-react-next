# Component Changelog — web-app-next

Changelog cronológico de todos os componentes e módulos. Do mais recente para o mais antigo.

---

## 2026-06-03

### Recursos / Extras (novo)
- Nova seção **Extras** no menu (desktop e mobile), reunindo três áreas de apoio ao colaborador
- **Links Importantes**: lista por grupos (Sistemas Internos, Materiais de Apoio, Internet & Redes Sociais, Políticas da Empresa) com busca, copiar URL e abertura em nova aba; itens sem link aparecem desabilitados
- **Vídeos**: galeria de vídeos institucionais com miniaturas do YouTube, busca por título e filtro por categoria; tela de carregamento animada própria
- **Ajuda**: central de dúvidas frequentes (62 perguntas em 12 categorias) com busca e destaque do termo, navegação em árvore (categoria → subcategoria → pergunta) e layout de dois painéis no desktop; quando a dúvida exige formulário, mostra o departamento responsável e botão "Entrar em contato" com e-mail pré-preenchido

### Ponto
- **Calendário do mês redesenhado**: cada dia em linha compacta com data, dia da semana, horários do projeto, horas realizadas (hora extra destacada), barra colorida de status e ação contextual; divisores de "hoje" e "futuro"; dias futuros esmaecidos
- **Ações por dia** mais claras: Registrar, Apontar, Solicitar (com "✓ Solicitado" inline), Aguardar e selo "Liberado"; tratamento fiel de feriados, abonos e faltas aprovadas/recusadas
- **Resumo do topo** simplificado para uma faixa única com **Saldo, Carga e Realizado** (saldo negativo em vermelho)
- **Dias Pendentes** repaginado (visual âmbar com chips por tipo de pendência)
- **Botão "Realizar apontamento"** com novo destaque visual
- **Apontamento**: o seletor de projeto/subprojeto passa a exibir o nome do projeto (antes podia mostrar o código); campo de data travado para visualização
- Mensagem dedicada quando o colaborador não tem conta ativa no sistema de ponto, no lugar de erro genérico
- Item **Ponto** reposicionado logo abaixo de "Home" no menu

### RH / DP
- Menu **RH** disponibilizado para o time de Departamento Pessoal (antes ficava indisponível por uma pendência no sistema de origem)
- **Abonos**: filtros por situação repaginados como abas (**Pendentes / Aprovados / Reprovados**); tela de carregamento animada; detalhes mais tolerantes a campos vazios; situação (pendente/aprovado/recusado) exibida corretamente
- **Visualizador de anexo** corrigido — passou a abrir a imagem/PDF do anexo de forma confiável
- **Férias**: tela de carregamento animada própria

### Gestão
- **Aprovação direta nas solicitações**: cada item (Hora Extra, Apropriação, Férias, Abono/Day-off) ganhou botões **Aprovar** e **Reprovar** no próprio cartão, com indicador de processamento
- **Hora Extra** com opção de contabilizar como **Banco de Horas** ou **Folha de Pagamento**, com projeto e observação
- **Fotos dos colaboradores** passam a aparecer nos cartões de pendência e nas solicitações
- Datas de falta/sem apontamento em destaque (caixinhas de calendário); ordem das abas ajustada (Apropriação primeiro)

### Solicitações
- **Hora Extra** reformulada: colaborador informa **Justificativa** (obrigatória) e marca **período noturno**, com seletor de projeto simplificado e limite de 2h por solicitação

### Navegação, Perfil e UI
- Novo item **Extras** e reposicionamento de **Ponto** nos menus (sidebar e mobile)
- Avatares neutros quando não há nome/foto (sem o "?" anterior) — Perfil, Home, Topbar e formulário de foto
- **VerificandoCredenciais** (novo): tela "Verificando credenciais…" usada em Ponto, Gestão e Percentual para evitar "acesso negado" indevido enquanto os dados carregam
- **Cursor de clique** restaurado em todos os botões (padrão alterado pelo Tailwind v4)
- Selos/cartões de solicitação e modal de aprovação com mais flexibilidade visual (subtítulo, conteúdo à direita, campos somente-leitura)

---

## 2026-06-02 (sessão 2)

### EmptyState — mapeamento de assets ilustrados
- fix: 13 call sites usavam `EmptyState` sem passar `image` — todos exibiam o `InboxIcon` genérico mesmo com assets específicos disponíveis em `public/assets/`
- fix: `home/page.tsx` — publicações e comunicados recebem `image="/assets/feed-empty.webp"`
- fix: `feed/page.tsx` — publicações (`ASSETS.emptyFeed`) e comunicados (`ASSETS.emptyComunicados`)
- fix: `gestao/page.tsx` — pendências da equipe recebem `image={ASSETS.emptyPendencias}`
- fix: `rh/page.tsx` — férias pendentes recebem `image="/assets/rh-ferias-empty.webp"`
- fix: `ferias/page.tsx` — histórico de férias recebe `image="/assets/rh-ferias-empty.webp"`
- note: `pessoas/page.tsx` já estava correto; solicitações, holerite, percentual, alocações e sub-listas de gestão seguem com ícone genérico (sem asset específico disponível)

### AlocarForm — `src/features/gestao/components/AlocarForm.tsx` v1.1
- fix: `SelectTrigger` sem `className="w-full"` — todos os selects ficavam com largura `w-fit`, fora do padrão dos forms
- fix: `SelectValue` sem `children` expunha comportamento do Base UI de exibir o `value` (ID numérico) em vez do label quando o `ItemText` continha JSX misto (texto + `<span>`) — corrigido com função de lookup explícita `(v) => array.find(…)?.nome` nos 3 selects (Serviço, Subprojeto, Papel)

### percentual/page.tsx — botão "Fechar mês" ocultado
- fix: botão "Fechar mês" removido da UI por solicitação — lógica, hook `fechar` e drawer de confirmação preservados no código para reativação futura
- fix: botão "Adicionar" passa a ocupar largura total (`w-full`)

---

## 2026-06-02 (sessão 1)

### Infraestrutura — `src/middleware.ts` criado
- fix: middleware de proteção de rotas não estava ativo — `proxy.ts` existia mas não era carregado pelo Next.js
- fix: rate limiting de login (Upstash) estava inativo
- Correção: criado `src/middleware.ts` com `export { proxy as default } from './proxy'`

### Auth — `src/app/api/auth/route.ts`
- fix(security): `checkOrigin` ausente no POST handler — adicionado na primeira linha, alinhando com todos os outros handlers de mutação

### PostCard — `src/features/feed/components/PostCard.tsx` v1.1
- fix(a11y): div container agora tem `role="button"` + `tabIndex={0}` + `onKeyDown` — WCAG 2.1.1
- fix(a11y): botão like com `aria-label` dinâmico + `aria-pressed` — WCAG 4.1.2
- fix(a11y): botão comentário com `aria-label` dinâmico — WCAG 4.1.2
- fix(a11y): emojis ❤️/🤍/💬 marcados com `aria-hidden="true"`

### home/page.tsx — PostCardHome (componente local) v1.1
- fix(a11y): mesmas correções de keyboard/aria-label do PostCard (card clicável + like + comentário)

### FluenciaModal — `src/components/shared/FluenciaModal.tsx` v1.1
- fix(a11y): adicionado `<DialogTitle className="sr-only">FluencIA — plataforma de IA da Squadra</DialogTitle>` — WCAG 4.1.2

### Sidebar — `src/components/layout/Sidebar.tsx` v1.1
- fix(a11y): `<aside>` recebeu `aria-label="Menu lateral de navegação"` para distinção de múltiplos landmarks
- fix(a11y): logo link recebeu `focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm` — WCAG 2.4.7

### Topbar — `src/components/layout/Topbar.tsx` v1.1
- fix(a11y): botão nome/cargo recebeu `focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md` — WCAG 2.4.7
- fix(a11y): `aria-label` do botão nome/cargo alterado para `"Ver perfil de {nome}"` — elimina duplicação com botão avatar — WCAG 1.3.1

### BottomNav — `src/components/layout/BottomNav.tsx` v1.1
- fix(a11y): `<nav>` recebeu `aria-label="Menu inferior"` — WCAG 2.4.1

### not-found — `src/app/not-found.tsx` v1.1
- fix(a11y): metadata `title` corrigido para `'Página não encontrada — Horas'` (com acentos) — WCAG 3.1.1

---

## 2026-06-01 — Implementação inicial (Fases 1–8)

### Foundation
- feat: `src/lib/session.ts` — Iron Session com cookie httpOnly, 8h, secure=production, sameSite=lax
- feat: `src/lib/check-origin.ts` — CSRF protection via `origin` header, suporta ALLOWED_ORIGINS e APP_URL
- feat: `src/lib/config.ts` — variáveis de ambiente tipadas
- feat: `src/lib/query-client.ts` — TanStack Query v5 singleton
- feat: `src/store/user.ts` — Zustand store para sessão do usuário + UI state
- feat: `src/services/squadra-client.ts` — HTTP client tipado com retry, timeout, schemas Zod, User-Agent okhttp/4.9.2
- feat: `src/proxy.ts` — middleware logic (proteção de rotas, rate limiting, redirects)

### Auth
- feat: `POST /api/auth` — login com Zod validation, permissões, cookie httpOnly
- feat: `DELETE /api/auth` — logout com checkOrigin
- feat: `GET /api/auth/me` — dados da sessão sem expor token
- feat: `POST /api/auth/simulate` — impersonation com checkOrigin + podeSimular check
- feat: `DELETE /api/auth/simulate` — rollback via _simOrig
- feat: `LoginForm` — loading, erro 401/429/5xx, show/hide senha, role="alert"

### Shell / Layout
- feat: `Shell.tsx` — QueryClientProvider, auth/me query, SimulandoBanner, FluenciaModal, Toaster
- feat: `Sidebar.tsx` — navegação desktop colapsável, itens condicionais por permissão
- feat: `Topbar.tsx` — título dinâmico por rota, avatar, hamburger mobile
- feat: `MobileNav.tsx` — Sheet com SheetTitle sr-only, navegação mobile
- feat: `BottomNav.tsx` — navegação fixa mobile, min-h-[44px], pb-safe, 4 itens

### Shared Components
- feat: `AvatarGradient` — anel gradiente para foto, iniciais coloridas sem foto, padding proporcional
- feat: `TabNav` — role=tablist, roving tabindex, navegação por setas, focus-visible
- feat: `DrawerForm` — Sheet com aria-modal, título, scroll interno
- feat: `ApprovalModal` — Dialog com DialogTitle, campos dinâmicos, role="alert" no erro
- feat: `EmptyState`, `ErrorSection`, `FormFeedback`, `HistoricoTable`, `Skeleton`, `StatusChip`
- feat: `PostCard`, `PessoaCard`, `SolicitacaoCard`, `PerfilLoader`, `SimulandoBanner`
- feat: `FluenciaModal` — Dialog, abertura em nova aba com noopener/noreferrer
- feat: `IllustratedState` — página de erro genérica com h1, h2, imagem, ações
- feat: `AccessDenied`

### Features (Fases 5–6)
- feat: home, feed, ferias, holerite, ponto, perfil, pessoas, gestao, rh, solicitacoes, percentual
- feat: todas as animações CSS portadas do vanilla (9 keyframes): pessoas, holerite, perfil, ponto, feed, comunicados, aniversariantes, novos-colabs, pendencias, alocar, hora-extra, ferias-coco, abonos, equipe-search
- feat: `prefers-reduced-motion` implementado em todas as animações

### Fase 7 — Simulate
- feat: SimularBtn, SimulandoBanner, `/api/auth/simulate`

### Fase 8 — Paridade visual com vanilla
- feat: AvatarGradient com anel gradiente rosa→roxo→azul
- feat: PerfilLoader extraído como componente shared (perfil/page + DrawerColaborador)
- feat: PostCard extraído como componente shared (feed/page + home/page + KudosTab)
- fix: AnivCard — bug no operador ternário usava asset errado para novos-colabs
- fix: FeedDrawer — delete de comentário usava gestorId errado (era gestorId, deve ser pessoaId)
- fix: DrawerColaborador — Fragment key corrige warning "Each child in list must have unique key"
- feat: Holerite — grid com nomes completos de meses, resumo 3 colunas, histórico salarial formatado
- feat: Solicitações — aba Dayoff adicionada (não existe no vanilla colab mas foi pedida)
- fix: SolCard — título usa `descricao` em vez de `motivo` para evitar "." como título
- fix: Perfil/Kudos — fallback para `/v1/pessoas/{pessoaId}` quando `kudosWalls === null`
