# Painel Marketing — substituir o Airtable como fonte da verdade

> **Status:** plano aprovado para detalhamento — **não implementado**.
> **Data:** 2026-06-08 · **Autor do plano:** Eduardo Alvarez (HEAD OF COMMUNITY).
>
> Objetivo: criar um menu **Marketing** (`/marketing`) no `web-app-next` que seja um painel
> CRUD e a **fonte da verdade** de todo o conteúdo editorial hoje mantido no **Airtable**,
> consumido pelo app mobile (`squadra-app-react`) e pelo próprio `web-app-next`.

---

## 1. Escopo — o que sai do Airtable

Hoje o app mobile (`squadra-app-react/app/services/airtableService.ts`) lê **4 bases** do Airtable.
O painel passa a gerenciar **todas** elas. (Comunicados por **e-mail** vêm da API Squadra
`/v1/squadraEmRede/buscaEmailsComunicados` — **não são Airtable** e ficam fora de escopo.)

| Recurso | Base Airtable | Tabela | Função no app RN | Estado atual no `web-app-next` |
|---|---|---|---|---|
| **Vídeos** | `appMa5ZLb8ppxiqzy` | `Vídeos` (view `Vídeos`) | `fetchVideos` | proxy `/api/videos` → Airtable (cache 1h) |
| **Comunicados (banner)** | `appl65SdsNQNKdINc` | `Comunicados` | `fetchComunicados` | **ainda não consumido** (só no app RN) |
| **Links importantes** | `app3hBxGVsYmD7j7v` | `links` | `fetchLinksImportantes` | estático em `src/data/links.json` |
| **Ajuda / FAQ** | `appET3Dcy4R6gNpN6` | `categorias`, `subcategorias`, `perguntas` | `fetchCategorias/Subcategorias/Perguntas` | estático em `src/data/ajuda.json` |

### 1.1 Campos exatos (origem Airtable)

Extraídos de `airtableService.ts` (interfaces TS) e dos JSONs já migrados.

**Vídeos** (`Video.fields`)
- `Título do vídeo` (string)
- `Link no youtube` (string — URL completa)
- `Categoria` (string — usado no proxy `/api/videos`; default `"Geral"`)
- `Thumbnail` (string|null — opcional; se vazio, derivado do YouTube via `img.youtube.com/vi/{id}/hqdefault.jpg`)

**Comunicados — banner** (`Comunicado.fields`)
- `Texto` (string — opcional; se vazio, é só imagem)
- `CorTexto` (string — cor hex do texto sobreposto)
- `urlImagem` (string — link do Google Drive, convertido por `getDirectGoogleDriveLink`)
- `Data` (string — data de publicação, exibida `DD/MM/YYYY`)
- `Validade` (string — **filtro**: só aparece se `Validade >= hoje`, ver `HomeScreen.tsx:333`)

**Links importantes** (`LinkImportante.fields` no RN / `links.json` no web)
- No RN: `Titulo`, `Link`, `Data` (lista plana).
- No web (`links.json`) já está **agrupado**: `{ grupo, icone, items:[{ texto, link, icone }] }`.
- → Decisão de modelo: adotar o formato **agrupado** do web (mais rico) como alvo.

**Ajuda / FAQ** (3 tabelas relacionadas no RN; achatado em `ajuda.json` no web)
- `categorias`: `Nome`, `Icone`, `Cor`
- `subcategorias`: `Nome`, `Categoria` (FK por nome), `Icone`
- `perguntas`: `Problema`, `Categoria`, `Subcategoria`, `Tipo`, `Resposta`, `Email`, `Data`, `Departamento`
- No web (`ajuda.json`) os registros são **planos** (`problema, categoria, subcategoria, tipo, resposta, email, departamento`) — a árvore categoria→subcategoria→pergunta é derivada em runtime.

---

## 2. Decisões de arquitetura (fechadas com o solicitante)

### 2.1 Persistência — **PENDENTE (em validação com o time Squadra)**
O store final ainda não está definido. Como a infra vai para **GKE/GCP**, as candidatas naturais são
**Cloud SQL (Postgres)** ou **Firestore**. Para não travar o desenvolvimento:

- Definir uma **camada de repositório (port/adapter)** — interface única por recurso
  (`MarketingRepo<T>` com `list/get/create/update/remove/reorder`), e um adapter trocável.
- Adapter inicial de desenvolvimento: **Upstash Redis** (já é dependência: `@upstash/redis`),
  ou os próprios JSON do `src/data` em modo leitura, atrás da mesma interface.
- Quando o time Squadra decidir, implementar o adapter definitivo **sem tocar
  na UI nem nas rotas** — só o adapter muda.
- 🟢 **Restrição do time (2026-06-08):** evitar **introduzir um banco novo** — "seria ruim ter 3 bancos".
  Preferência por **reusar o banco já existente do app** (o SQL da própria aplicação Squadra) em vez de
  provisionar Cloud SQL/Firestore só para o painel. A abstração de repositório segue valendo; muda só
  o destino do adapter definitivo (schema/tabelas no banco do app).
- ⚠️ **Ação:** confirmar com o time qual é o banco do app e registrar a decisão final em
  `docs/design-decisions.md`.

### 2.2 Imagens — **Google Cloud Storage (bucket)**
Infra em GKE/GCP → o recurso recomendado é um **bucket GCS** dedicado (ex.: `squadra-marketing-assets`):
- Upload no painel via **signed URL** (rota gera URL assinada; browser faz `PUT` direto no bucket).
- Servir por URL pública do bucket ou **Cloud CDN** na frente (recomendado para cache/perf).
- Substitui os links do Google Drive do Airtable (frágeis, exigem `getDirectGoogleDriveLink`).
- next/image: registrar o domínio do bucket/CDN em `next.config.ts` (`images.remotePatterns`).
- ⚠️ **Doc a atualizar:** `PADRAO_IMAGENS.md` — acrescentar seção "Conteúdo dinâmico (Marketing)"
  explicando que assets editoriais vão para o **bucket GCS**, não para `public/assets/`
  (que continua sendo só para ilustrações estáticas do produto).

### 2.3 Acesso — flag **`perfilMarketing`** (já existe no pipeline)
A permissão **`perfilMarketing`** já trafega por toda a sessão (confirmado no payload de
`/auth/me`: `permissoes.perfilMarketing`). Hoje vem `false` para todos e **não gateia nenhuma UI**.

- Gatear o menu/rota Marketing por `permissoes.perfilMarketing` (espelha o padrão de `perfilDP`).
- Criar helper `src/lib/marketing-access.ts` → `temAcessoMarketing(perfilMarketing, cargo)`:
  - Fonte oficial: `perfilMarketing`.
  - **Fallback provisório** (igual ao `temAcessoDP`): cargo que contenha `COMMUNITY`/`MARKETING`
    (ex.: `HEAD OF COMMUNITY`) — até a TI popular a flag. Remover o fallback quando populada.
- ⚠️ **Pendência TI:** popular `perfilMarketing = true` para os responsáveis (Marketing/Comunidade).
- Já está cabeado em: `api/auth/route.ts`, `api/auth/me/route.ts`, `api/auth/simulate/route.ts`,
  e no store `useUserStore.permissoes`.

---

## 3. Modelo de dados (alvo do painel)

Schemas Zod centralizados (ex.: `src/services/marketing.ts` + `squadra-client` se necessário).
Todo registro ganha metadados de gestão: `id` (uuid), `ordem` (int, p/ ordenação manual),
`ativo` (bool), `criadoEm`, `atualizadoEm`, `atualizadoPor` (login).

- **Video**: `{ titulo, youtubeId, categoria, thumbnailUrl? }`
  - guardar `youtubeId` já extraído (não a URL crua) — consumidores montam o embed.
- **Comunicado**: `{ texto?, corTexto, imagemUrl, data, validade }`
  - `imagemUrl` agora aponta para o **bucket GCS**.
  - filtro de validade passa a ser server-side (não enviar expirados ao consumidor).
- **GrupoLinks**: `{ grupo, icone, items: [{ texto, link, icone }] }`
- **Ajuda**: modelar como **árvore** (`Categoria → Subcategoria → Pergunta`) com FKs por id,
  e expor um endpoint que devolve no formato plano de `ajuda.json` para compatibilidade.

---

## 4. API routes (novas, sob `/api/marketing`)

Padrão dos handlers existentes: validar sessão (`getSession`) + permissão
(`temAcessoMarketing`) → `403` se não autorizado; envelopar erros como nas outras rotas.

| Recurso | Rotas |
|---|---|
| Vídeos | `GET/POST /api/marketing/videos`, `GET/PATCH/DELETE /api/marketing/videos/[id]` |
| Comunicados | `GET/POST /api/marketing/comunicados`, `GET/PATCH/DELETE .../[id]` |
| Links | `GET/POST /api/marketing/links`, `PATCH/DELETE .../[id]` (grupo) |
| Ajuda | `GET/POST /api/marketing/ajuda/categorias`, `.../subcategorias`, `.../perguntas` (+ `[id]`) |
| Upload | `POST /api/marketing/upload` → devolve signed URL do bucket GCS |
| Reorder | `PATCH /api/marketing/{recurso}/reorder` (lista de ids) |

- **Leitura (GET)** dessas rotas exige sessão mas **não** `perfilMarketing` (qualquer colaborador lê).
- **Escrita (POST/PATCH/DELETE)** exige `temAcessoMarketing`.

---

## 5. Consumo (quem lê o conteúdo)

A migração precisa redirecionar os consumidores para o painel **sem quebrar nada**:

1. **`web-app-next`**
   - `recursos/videos`: trocar `/api/videos` (Airtable) por `/api/marketing/videos`.
   - `recursos/links`: trocar `import links.json` por fetch de `/api/marketing/links`.
   - `recursos/ajuda`: trocar `import ajuda.json` por fetch de `/api/marketing/ajuda`.
   - **Comunicados-banner (novo):** adicionar carrossel na Home consumindo
     `/api/marketing/comunicados` (paridade com o app RN — hoje só o e-mail é exibido).
2. **`squadra-app-react` (mobile)**
   - Substituir as chamadas Airtable em `airtableService.ts` por chamadas à API Squadra/painel
     (manter as **mesmas formas de retorno** para minimizar mudança nas telas).
   - Telas afetadas: `videos/index.tsx`, `LinksImportantesScreen.tsx`, `ajuda/*`,
     `HomeScreen.tsx` (carrossel de comunicados, `renderBannerItem`).

---

## 6. UI do painel

- **Menu:** novo item condicional no `src/components/layout/Sidebar.tsx` (e `BottomNav`/`MobileNav`):
  `if (temAcessoMarketing(permissoes.perfilMarketing, cargo)) push({ href:'/marketing', label:'Marketing', icon: Megaphone })`.
- **Página `/marketing`** com abas (padrão do array `TABS` usado em `/gestao`):
  **Vídeos · Comunicados · Links · Ajuda/FAQ**.
- Por aba: lista com busca + ordenação (drag/`ordem`), toggle `ativo`, criar/editar em modal/sheet,
  preview (embed YouTube, preview do banner com `corTexto`, árvore da Ajuda).
- Feature folder: `src/features/marketing/` (components + hooks `useMarketing*`), seguindo o padrão
  de `features/gestao`. Reusar `@tanstack/react-query` para cache/mutations e `react-hook-form`+`zod`.

---

## 7. Migração inicial (seed)

Script único (`scripts/seed-marketing.ts`) que popula o store a partir das fontes atuais:
- **Vídeos / Comunicados:** ler do Airtable uma última vez (tokens já em env: `AIRTABLE_VIDEOS_*`).
- **Links / Ajuda:** importar de `src/data/links.json` e `src/data/ajuda.json`.
- **Imagens dos comunicados:** baixar do Drive e re-subir para o bucket GCS, reescrevendo `imagemUrl`.
- Rodar em dry-run primeiro; validar contagem por recurso antes de gravar.

Depois da migração e da virada dos consumidores: **desativar** o proxy `/api/videos` (Airtable)
e remover os `src/data/*.json` (ou deixá-los como fallback de leitura por 1 release).

---

## 8. Fases de entrega

1. **Fundação (sem UI):** interface `MarketingRepo` + adapter de dev + schemas Zod + rotas GET.
2. **Acesso:** `marketing-access.ts` + gating no Sidebar + pendência TI da flag.
3. **CRUD por recurso:** Vídeos → Links → Ajuda → Comunicados (escrita + UI das abas).
4. **Imagens:** rota de upload (signed URL) + bucket GCS + `next.config.ts` + doc.
5. **Migração:** script de seed + virada dos consumidores no `web-app-next`.
6. **Mobile:** apontar `squadra-app-react` para a nova API.
7. **Store definitivo:** implementar adapter Cloud SQL/Firestore quando o time Squadra decidir.
8. **Limpeza:** desligar proxy Airtable + remover JSON estáticos.

---

## 9. Pendências e decisões abertas

- ⛔ **Store de persistência** — em validação com o time Squadra (GCP: Cloud SQL vs Firestore).
- ⛔ **TI: popular `perfilMarketing`** para os responsáveis (até lá, fallback por cargo).
- ⛔ **Bucket GCS** — provisionar (`squadra-marketing-assets`), credenciais/IAM no GKE, Cloud CDN.
- ❓ Versionamento/aprovação de conteúdo (rascunho vs publicado)? — fora do MVP, avaliar depois.
- ❓ Migrar o **app mobile** nesta fase ou só o `web-app-next` primeiro? (recomendado: web primeiro).

## 10. Riscos

- Tokens Airtable estão **hardcoded** no app RN (`airtableService.ts`) — ao desativar, garantir que
  nenhuma versão antiga do app em produção dependa deles (manter Airtable read-only durante transição).
- Imagens do Drive podem ter URLs quebradas na migração — validar cada `imagemUrl` no seed.
- Filtro de `Validade` dos comunicados precisa virar server-side para não vazar expirados.
