# Gestão Funcional / Gestão de Projeto — alterar gestor

Duas abas novas no menu **Gestão** (`/gestao`) para alterar o gestor de um **colaborador** ou de um **projeto**. Cada aba tem um **formulário** (autocomplete do alvo + autocomplete do novo gestor + salvar) e um **accordion "Ver todos"** com lazy-load + busca.

## Endpoints (validados via curl + Swagger HML)

Só estes usam **HML** (`https://api-hml.squadra.com.br/api`); o resto da app segue em produção.

| Ação | Método | Path | Params |
|------|--------|------|--------|
| Alterar gestor de colaborador | `POST` | `/v1/alteraGestorColaborador/{coordId}/{recId}` | sem body |
| Alterar gestor de projeto | `POST` | `/v1/alteraGestorProjeto/{coordId}/{prjId}` | sem body |
| Listar pessoas + gestor | `GET` | `/v1/pessoasRelatorio` | — (513 itens, campo `gerente`) |
| Listar projetos + gestor | `GET` | `/v1/gestor/relatorioProjetosCadastrados` | — (176 itens, `cpfGerente`) |
| Buscar projeto (form) | `POST` | `/v2/projetos/pornomev2` | `{nome}` (global) |
| Buscar pessoa (form) | `POST` | `/v1/pessoas/buscarpessoas` | `{nome,...}` |

### IDs (confirmados)
- **`coordId`** = `usuarioId` do novo gestor (id de **usuário**). `buscarpessoas` retorna `usuarioId`. Fallback: `id`.
- **`recId`** = `id` (pessoa) do colaborador.
- **`prjId`** = `id` do projeto.
- POST sem corpo de negócio; envia-se `{}` (precisa de `Content-Length`; sem ele a API dá 411).
- Auth: **Bearer**. O token de sessão de **prod é aceito no HML** (mesma chave JWT) → o proxy só encaminha `session.token`.
- Envelope: `{sucesso, retorno, erros:[{codigo,mensagem}]}`. Sucesso → 200; erro de negócio → 400 (mensagem repassada como 422 ao front).

## Ambiente: estas 2 telas são 100% HML

As APIs de `alteraGestor*` **só existem em HML** (prod → 404). Por isso, **toda** a Gestão Funcional / Gestão de Projeto opera em HML — escritas **e** leituras (listas "ver todos" + buscas dos forms), via rotas dedicadas que passam `HML_API_URL` ao `sq()`. O restante do app (página Pessoas, Alocar, Percentual, etc.) **continua em prod** — as buscas compartilhadas têm variantes HML próprias (`buscarPessoasHml`, `buscarProjetosHml`, rotas `/api/gestao/pessoas-busca` e `/api/gestao/projetos-busca`) para não afetar prod. Cada aba mostra um **chip "HML"** no topo. Quando a feature for pra prod, basta remover os `HML_API_URL` dessas chamadas e o chip.

Cache server-side (in-memory, TTL 10min) para `pessoasRelatorio` (~25s/585KB) e `relatorioProjetos`, invalidado ao alterar um gestor.

## Arquitetura (aditiva — nada do `web-app` PHP foi tocado)

- **`src/services/squadra-client.ts`**: `HML_API_URL` + parâmetro `baseUrl` opcional no `sq()` (default = prod). Campo `usuarioId` em `PessoaData`. Métodos `gestao.alteraGestorColaborador/alteraGestorProjeto/relatorioProjetos` e `pessoas.relatorio`. Schemas `ColaboradorComGestor`, `ProjetoComGestor`.
- **`src/services/gestao.ts`**: wrappers `alteraGestorColaborador/Projeto`, `listarColaboradoresComGestor`, `listarProjetosComGestor` (junta `cpfGerente`→nome via `pessoasRelatorio`).
- **Route handlers** (`src/app/api/gestao/`): `altera-gestor-colaborador`, `altera-gestor-projeto` (POST, validam sessão + `gerenteFuncional`, repassam a mensagem de erro), `colaboradores-gestores`, `projetos-gestores` (GET). Busca de projeto reusa `/api/percentual/projetos`.
- **Hooks** (`src/features/gestao/hooks/useAlterarGestor.ts`): mutations + queries lazy (`enabled` no expand do accordion) + `useProjetosBusca`.
- **UI**: `PessoaAutocomplete.tsx` (reusa `usePessoas`), `GestaoFuncionalTab.tsx`, `GestaoProjetoTab.tsx`. Registradas no array `TABS` de `src/app/(app)/gestao/page.tsx`. Permissão = mesma do menu (`gerenteFuncional` + `temEquipe`).

## Verificação
- curl HML: ambos POST → `200 {"sucesso":true,"retorno":"Gestor editador com sucesso!"}` (coordId=995, recId=1060; coordId=995, prjId=42244). Body `{}` + `application/json` confirmado.
- `tsc --noEmit` e `eslint` nos arquivos: sem erros.
- Pendente (manual, logado): abrir `/gestao`, ver as 2 abas, submeter forms, abrir accordions (lazy + busca), botão "Alterar" pré-preenche.

## Observações
- `buscarpessoas` e a busca de projetos **não** retornam o gestor atual; por isso os accordions usam os relatórios (`pessoasRelatorio` / `relatorioProjetosCadastrados`).
- A busca de projetos é **global** (acha qualquer projeto, não só os do gestor logado).
