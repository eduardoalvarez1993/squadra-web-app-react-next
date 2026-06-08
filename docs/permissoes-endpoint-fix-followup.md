# Plano de correção — quando `/v1/pessoa/permissoes/{pessoaId}` honrar o pessoaId

> **Gatilho:** o backend (Fernando Medeiros) corrigir o endpoint
> `GET /v1/pessoa/permissoes/{pessoaId}` para retornar as permissões da **pessoa do path**,
> e não mais as do **usuário do token**.
> **Status:** aguardando correção do backend (solicitada em 2026-06-08).
> **Relacionado:** `docs/marketing-painel.md`, `docs/marketing-perfil-usuarios.md`,
> memória `squadra-perfildp-quebrado`.

## Contexto do bug

Hoje `GET /v1/pessoa/permissoes/{pessoaId}` **ignora o `{pessoaId}`** e devolve as permissões
do dono do token. Provado em 2026-06-08: ids 995/1/28/1235 (pessoas distintas) → resposta idêntica
(`gerenteFuncional:true`, = permissões do Eduardo). Importante: `GET /v1/pessoa` e
`pessoas.getById` **funcionam** com o token de outro consultando dados de terceiros — o defeito é
**específico** do endpoint de permissões.

### O que o bug afeta hoje (e o que NÃO afeta)
- ✅ **Não afeta** o login normal: lá o id consultado É o do próprio token (`auth/route.ts` →
  `getPermissoes(upstream.id, upstream.token)`). O gate de menu por `permissoes.*` continua correto.
- ❌ **Afeta a SIMULAÇÃO** (`api/auth/simulate/route.ts:74`): chama
  `squadra.auth.permissoes(id_do_alvo, session.token_do_admin)`. Com o bug, simular um colaborador
  carrega as permissões do **admin** na sessão simulada (menus errados). Após a correção, passará a
  carregar as permissões **do alvo** — comportamento desejado, mas precisa ser revalidado.
- ❌ **Inviabiliza** qualquer varredura de permissões de terceiros (probe de `perfilMarketing`,
  varredura de `perfilDP`).

---

## Fase 0 — Confirmar que a correção subiu (pré-requisito)

Antes de qualquer outra fase, **verificar** que o endpoint passou a honrar o path.

- **Como:** logado como `eduardo.alvarez` (perfis: `gerenteFuncional:true`, resto `false`),
  consultar o id de alguém com perfil diferente e comparar.
  - Critério de aceite: respostas de ids diferentes **divergem** entre si.
  - Sinal mais forte: achar ao menos um id cuja resposta **difira** da do Eduardo
    (ex.: alguém com `perfilDP:true` ou `gerenteFuncional:false`).
- **Ferramenta:** o trecho de comparação já usado na investigação (login → `pessoasRelatorio` →
  consulta 3-4 ids → imprime `retorno`). Pode virar `scripts/check-permissoes-fix.mjs`.
- ⚠️ Enquanto a Fase 0 não passar, **não** confiar em nenhuma varredura.

---

## Fase 1 — Levantar quem tem `perfilMarketing = true`

- **Re-rodar** `scripts/probe-perfil-marketing.mjs` (já pronto; login via `SQ_USER`/`SQ_PASS`).
- Gera de novo `docs/marketing-perfil-usuarios.md` com a lista real (pessoaId · login · nome · cargo).
- **Dois cenários:**
  1. **Vir gente com a flag** → ótimo: gate por `perfilMarketing` puro já funciona; planejar
     remoção do fallback por cargo (Fase 4).
  2. **Continuar 0** → a flag existe no contrato mas **não está populada** → abrir/cobrar pendência
     de TI para popular `perfilMarketing` aos responsáveis de Marketing/Comunidade; manter fallback.

---

## Fase 2 — Fechar a questão do `perfilDP` (memória `squadra-perfildp-quebrado`)

A conclusão antiga ("varredura de 180, ninguém com `perfilDP=true`") foi **confundida pelo mesmo bug**
(varredura com um único token). Com o endpoint corrigido:

- **Re-rodar** a varredura (adaptar o probe para coletar `perfilDP` em vez de `perfilMarketing`, ou
  generalizar para imprimir todas as flags).
- **Conferir alvos conhecidos:** Vera Lucia (id 7, "PERSONNEL ADMINISTRATION MANAGER") e Andressa
  (id 1656, "PERSONNEL ANALYST").
  - Se `perfilDP=true` para elas → a flag **funciona**; planejar remoção do fallback `/personnel/i`.
  - Se ainda `false` → confirma flag não-populada (aí sim, de verdade) → cobrar TI.
- **Atualizar** a memória `squadra-perfildp-quebrado` com o resultado definitivo.

---

## Fase 3 — Revalidar e corrigir a SIMULAÇÃO

A correção do backend **muda o comportamento** da simulação. Tratar como mudança que exige teste.

- **Código:** `src/app/api/auth/simulate/route.ts`
  - Remover o comentário/assunção stale da linha ~71 ("pessoaId == usuarioId... mesmo ID do login real")
    que se apoiava no comportamento antigo.
  - Garantir que `session.permissoes` passa a refletir o **alvo** (não o admin).
- **Teste manual (E2E):** admin com `podeSimular` simula:
  1. um **colaborador comum** (sem `gerenteFuncional`) → menus Gestão/Percentual/RH **somem**.
  2. alguém do **DP** → menu RH **aparece** (se `perfilDP` ou cargo bater).
  3. **encerrar simulação** → permissões do admin restauradas (`_simOrig`).
- **Teste automatizado:** ajustar/!criar caso em `src/__tests__` cobrindo o simulate com mock do
  endpoint retornando permissões do alvo (hoje o mock pode estar espelhando o comportamento buggado).
- **Regressão:** revisar `e2e/` para cenários de simulação.

---

## Fase 4 — Reavaliar os fallbacks por cargo

Os fallbacks foram criados porque as flags não eram confiáveis. Com o endpoint correto + flags
populadas, eles podem sair (reduz risco de falso-positivo por cargo).

- **`temAcessoDP`** (`src/lib/dp-access.ts`): `perfilDP || /personnel/i.test(cargo)`.
- **`temAcessoMarketing`** (`src/lib/marketing-access.ts`, a criar no painel): `perfilMarketing ||
  /community|marketing/i.test(cargo)`.
- **Decisão por flag:**
  - Flag **populada e correta** (validado nas Fases 1/2) → **remover** o fallback por cargo;
    manter só a flag. Atualizar guards de UI e server-side.
  - Flag **ainda não populada** → **manter** o fallback e o aviso de pendência.
- **Locais a revisar ao remover o fallback:** menu (`Sidebar.tsx`, `MobileNav.tsx`), guard de página
  (`rh/page.tsx` e a futura `marketing/page.tsx`) e os guards server-side das rotas
  (`api/rh/*`, futuras `api/marketing/*`).

---

## Fase 5 — Atualizar documentação e memória

- `docs/marketing-perfil-usuarios.md` → substituir o aviso de bug pela **lista real** (ou pelo
  resultado "flag não populada", agora confiável).
- `docs/marketing-painel.md` → ajustar a seção 2.3 (Acesso) conforme a flag passe a funcionar.
- `docs/design-decisions.md` → registrar o desfecho (flag ok vs. fallback mantido).
- Memórias `squadra-perfildp-quebrado` e `project-marketing-painel` → atualizar com o resultado final.

---

## Checklist de execução (na ordem)

1. [ ] Fase 0 — confirmar que o endpoint honra o `pessoaId` (ids diferentes → respostas diferentes).
2. [ ] Fase 1 — re-rodar probe `perfilMarketing` e regravar a lista.
3. [ ] Fase 2 — re-rodar varredura `perfilDP`; conferir Vera/Andressa; atualizar memória.
4. [ ] Fase 3 — limpar assunção stale no simulate; testar simulação (E2E + unit) e encerramento.
5. [ ] Fase 4 — decidir manter/remover fallbacks por cargo conforme o estado das flags.
6. [ ] Fase 5 — atualizar docs/decisões/memória.
