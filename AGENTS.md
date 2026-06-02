<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Contexto para agentes com contexto zero

## O que é este projeto

Migração do app interno de gestão de horas da Squadra (SPA vanilla HTML/CSS/JS + PHP)
para Next.js App Router + TypeScript. Veja `CLAUDE.md` para stack, variáveis de ambiente e sequência de fases.

## Fonte de verdade do SDD

Os specs completos estão em `../web-app/specs/`. **Leia sempre o spec antes de implementar.**

Estrutura crítica:
```
../web-app/specs/
├── foundation/          # config, session, middleware, squadra-client, build-sequence
├── api/                 # contratos dos Route Handlers — inclui seção "Orquestração upstream"
├── features/            # feature.md + schema.ts + hooks + componentes por feature
└── components/shared/   # specs dos shared components
```

## Estado atual (2026-06-01)

**Todas as 7 fases concluídas.** A migração está funcionalmente completa.

| Fase | Conteúdo | Estado |
|------|----------|--------|
| 1–4 | Foundation, Auth, Shared, Shell | ✅ |
| 5 | home, holerite, ferias, perfil, pessoas, rh | ✅ |
| 6 | ponto, gestao, solicitacoes, feed, percentual | ✅ |
| 7 | Simulate (/api/auth/simulate, SimularBtn, SimulandoBanner) | ✅ |

**Pendente antes de deploy:**
1. FluenciaModal: componente criado (`src/components/shared/FluenciaModal.tsx`), mas estado `fluenciaOpen` ainda não wired ao Sidebar/BottomNav
2. Testes Playwright — 8 fluxos críticos (login, ponto, gestão aprovar HE, solicitação abono, ferias, feed like, percentual lançar, simulate)
3. Vitest — schemas e regras puras
4. Verificar 4 schemas pendentes com API real antes de ajustar se necessário:
   - `FeriasSaldoSchema` — action `colab_ferias`
   - `ServicoGestorSchema` — action `servicos_gestor`
   - `PapelSchema` — action `papeis`
   - `PercentualItemRawSchema` — action `gestor_horas_percentuais`

## Atenção: Next.js 16 Breaking Change

- O arquivo de proxy/middleware se chama `src/proxy.ts` (NÃO `src/middleware.ts`)
- Exporta função `proxy` (não `middleware`) + `config`
- Criar `middleware.ts` causa build error

## Regras críticas

- **IDOR:** Route Handlers usam `session.data.pessoaId` / `gestorId` — nunca query param externo
- **CSRF:** `checkOrigin()` na primeira linha de todo Route Handler de mutação
- **Token:** nunca em response body, nunca no bundle JS, nunca logado
- **User-Agent:** `squadra-client.ts` já envia `okhttp/4.9.2` (obrigatório — Cloudflare bloqueia sem ele)
- **NB-07:** campo `corpo` de comunicados é HTML da API → `DOMPurify.sanitize()` + `dangerouslySetInnerHTML`
- **Datas upstream:** API Squadra espera DD/MM/YYYY — conversão obrigatória em `services/` (YYYY-MM-DD vem do cliente)
- **3 sistemas de ID:** `gestorId` (AspNetUsers), `pessoaId` (tabela pessoa), `sqhorasId` (SqHoras) — não intercambiáveis
- **ponto:** usa `sqhorasId` (não `pessoaId`) + datas como path URL-encoded (`DD%2FMM%2FYYYY`)
- **projetos_alocados:** usa `gestorId` (não `pessoaId`)

## Shared components disponíveis

```
src/components/shared/   — Skeleton, AvatarGradient, StatusChip, FormFeedback,
                           EmptyState, ErrorSection, AlertCard, TabNav,
                           HistoricoTable, DrawerForm, ApprovalModal,
                           SolicitacaoCard, PessoaCard, PostCard,
                           FluenciaModal, SimulandoBanner
src/components/layout/   — Shell (+SimulandoBanner wired), Sidebar, Topbar, BottomNav, MobileNav
src/components/ui/       — shadcn/ui (@base-ui/react/select — onValueChange passa string|null, não string)
```

## Variável de ambiente crítica

`SQUADRA_API_URL=https://api.squadra.com.br/api` — já configurada em `.env.local`.
