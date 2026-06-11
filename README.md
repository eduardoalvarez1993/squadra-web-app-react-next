# Squadra Web App

> **Gerencie, conecte, reconheça.**  
> A Squadra num só lugar. Acompanhe sua jornada, reconheça colegas, gerencie equipes e mantenha tudo em dia — de forma simples e humana.

Plataforma interna de gestão de horas e colaboradores da Squadra. Migração da SPA vanilla (HTML/CSS/JS + PHP) para **Next.js 16 App Router + TypeScript**, mantendo paridade visual e funcional completa com a versão anterior.

---

## Funcionalidades

| Módulo | O que faz |
|--------|-----------|
| **Home** | Saldo de horas, aniversariantes do mês e novos colaboradores |
| **Squadra em Rede** | Feed corporativo com posts, Kudos, curtidas, comentários e comunicados |
| **Férias** | Saldo, período de gozo, histórico e solicitações |
| **Holerite** | Holerite do mês corrente e histórico salarial |
| **Ponto** | Calendário de apontamentos, registro de horas e dias sem entrada |
| **Solicitações** | Abono, hora extra e day off |
| **Gestão** | Equipe do gestor, aprovações, alocações e pendências |
| **RH** | Avaliação de férias e abonos da equipe |
| **Perfil** | Dados pessoais, competências, alocações ativas e Kudos recebidos |
| **Pessoas** | Busca e visualização de perfis de colaboradores |
| **Percentual** | Lançamento e fechamento de horas por projeto |
| **FluencIA** | Modal de fluência em IA — disponível em qualquer tela |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 App Router + TypeScript strict |
| UI | Tailwind CSS 4 + shadcn/ui (Base UI) |
| Estado servidor | TanStack Query v5 |
| Estado cliente | Zustand |
| Formulários | React Hook Form + Zod |
| Sessão | Iron Session (cookie httpOnly, 7 dias — alinhado ao token da API) |
| Rate limiting | Upstash Redis (somente `/api/auth`) |
| Testes unitários | Vitest — 265 testes (schemas, regras de negócio e segurança das rotas) |
| Testes E2E | Playwright — 8 fluxos críticos ponta a ponta |
| Package manager | pnpm |
| Deploy | Servidor Node.js |

> **Qualidade & confiabilidade:** suíte de **265 testes automatizados** com estratégia *ponderada por risco* — schemas de integração, regras de negócio e os pontos críticos de segurança (autenticação, CSRF, permissões de RH/gestor) são cobertos a fundo, com as **rotas sensíveis entre 88–91%** de cobertura. Cada bug encontrado em QA é convertido em teste de regressão, blindando o sistema contra reincidências.

---

## Arquitetura

O projeto usa o padrão **BFF (Backend for Frontend)**: o browser nunca chama a API Squadra diretamente. Todas as chamadas passam pelos Route Handlers internos em `src/app/api/`, que validam a sessão, aplicam CSRF e repassam para o upstream.

```
Browser → Route Handler (BFF) → API Squadra
```

### Estrutura de pastas

```
src/
├── app/
│   ├── (app)/              # Rotas autenticadas (protegidas pelo middleware)
│   │   ├── home/
│   │   ├── feed/
│   │   ├── ferias/
│   │   ├── holerite/
│   │   ├── ponto/
│   │   ├── gestao/
│   │   ├── rh/
│   │   ├── solicitacoes/
│   │   ├── percentual/
│   │   ├── perfil/
│   │   └── pessoas/
│   ├── api/                # 51 Route Handlers (BFF)
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── ferias/
│   │   ├── gestao/
│   │   ├── holerite/
│   │   ├── home/
│   │   ├── percentual/
│   │   ├── perfil/
│   │   ├── pessoas/
│   │   ├── ponto/
│   │   ├── rh/
│   │   └── solicitacoes/
│   ├── login/
│   └── acesso-negado/
├── components/
│   ├── layout/             # Shell, Sidebar, Topbar, BottomNav, MobileNav
│   ├── shared/             # 19 componentes reutilizáveis
│   └── ui/                 # Primitivos shadcn/ui
├── features/               # 12 módulos de feature (hook + components)
├── lib/                    # config, session, check-origin, query-client, utils
├── middleware.ts            # Proteção de rotas + rate limiting
├── services/               # Camada HTTP para a API Squadra
└── store/                  # Zustand — sessão do usuário + estado de UI
```

---

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Acesso à API Squadra (rede interna ou VPN)
- Conta Upstash Redis (opcional em desenvolvimento)

---

## Instalação

```bash
# Clone o repositório
git clone <url-do-repo>
cd web-app-next

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

---

## Variáveis de Ambiente

Edite o `.env.local` criado acima:

```env
# Obrigatórias
SESSION_SECRET=sua_chave_secreta_com_32_caracteres_ou_mais
SQUADRA_API_URL=https://api.squadra.com.br/api
APP_URL=http://localhost:3000

# Opcionais em desenvolvimento (obrigatórias em produção)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> `SESSION_SECRET` deve ter no mínimo 32 caracteres. Use `openssl rand -base64 32` para gerar.

---

## Scripts

```bash
pnpm dev          # Servidor de desenvolvimento com Turbopack
pnpm build        # Build de produção
pnpm start        # Inicia o servidor de produção
pnpm lint         # ESLint
pnpm test         # Testes unitários (Vitest)
pnpm test:watch   # Testes em modo watch
pnpm test:coverage # Cobertura de testes
pnpm e2e          # Testes E2E (Playwright)
pnpm e2e:ui       # Playwright com interface visual
```

---

## Segurança

- **CSRF**: `checkOrigin` obrigatório em todos os endpoints mutantes (POST, DELETE, PATCH)
- **Sessão**: Iron Session com cookie `httpOnly`, `sameSite: lax`, expiração em 8h
- **Rate limiting**: Upstash Redis em `POST /api/auth` para prevenir força bruta
- **Autoria no feed**: `DELETE /api/feed/posts` valida `remetenteID === session.pessoaId`; `DELETE /api/feed/comentarios` busca o comentário no upstream e verifica `idAutor` antes de deletar (fail closed — erro na verificação retorna 503)
- **Autorização no ponto**: `GET /api/ponto?sqhorasId=X` exige `permissoes.gerenteFuncional` quando o `sqhorasId` difere do usuário da sessão
- **XSS**: comunicados HTML sanitizados com DOMPurify antes de renderizar

---

## Testes

### Unitários (Vitest)

Cobrem schemas Zod e funções utilitárias do `squadra-client`.

```bash
pnpm test
```

### E2E (Playwright)

Cobrem fluxos de autenticação e shell:

| Fluxo | Descrição |
|-------|-----------|
| F1 | Login inválido exibe erro sem redirecionar |
| F2 | Login válido redireciona para `/home` |
| F3 | Rota protegida sem sessão redireciona para `/login` |
| F4 | Logout remove sessão e redireciona para `/login` |
| F5 | FluenciaModal abre pelo Sidebar (desktop) |
| F6 | FluenciaModal abre pelo MobileNav (mobile) |
| F7 | `/home` renderiza saudação e saldo de horas |
| F8 | SimulandoBanner aparece quando `simulando=true` |

```bash
pnpm e2e
pnpm e2e:ui   # Modo visual para debug
```

---

## Permissões de Acesso

O acesso às rotas depende das permissões da sessão:

| Permissão | Acesso |
|-----------|--------|
| Qualquer colaborador autenticado | Home, Feed, Férias, Holerite, Perfil, Pessoas, Solicitações |
| `bateRep: true` | Ponto (registro e consulta) |
| `permissoes.gerenteFuncional` | Gestão de equipe, aprovações, alocações |
| `permissoes.perfilDP` | Módulo RH |
| `podeSimular: true` | Simular sessão como outro colaborador |

---

## Deploy

A estratégia de deploy usa **coexistência com a SPA vanilla**:

1. Deploy em subdomínio paralelo (ex: `horas-next.squadra.com.br`)
2. Validação em produção paralela à versão atual
3. Migração via troca de DNS — sem downtime
4. Rollback disponível: basta reverter o DNS

### Headers de segurança

Configurados em `next.config.ts`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains
Permissions-Policy: camera=(), microphone=()
```

---

## Documentação interna

| Arquivo | Conteúdo |
|---------|----------|
| `CLAUDE.md` | Status de implementação, fases, regras de segurança e arquitetura |
| `AGENTS.md` | Briefing zero-contexto para agentes de IA |
| `docs/known-issues.md` | Issues em aberto e resolvidos (INCONC, FAIL, ACESS) |
| `docs/design-decisions.md` | Decisões arquiteturais documentadas |
| `../web-app/specs/` | SDD completo — fonte de verdade para toda implementação |

---

## Contexto do Projeto

Este projeto é a **migração Next.js** do app interno de gestão de horas da Squadra. A SPA vanilla (`../web-app/`) segue em produção durante a transição. O SDD (Spec Driven Development) completo vive em `../web-app/specs/` e é a fonte de verdade para qualquer nova implementação.
