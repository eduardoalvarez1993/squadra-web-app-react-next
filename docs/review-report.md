# Review Report — squad-reviewer
Gerado em: 2026-06-03 · Escopo: leva b7f4420..362ae03 (Extras, Ponto, RH/DP, Gestão, Solicitações, UI)

## Resultado Geral: APROVADO com ressalvas
Nenhum issue Crítico. Sem bypass de auth, sem XSS explorável, sem bloqueio para o orchestrator.
**Porém** 2 itens Importantes de Segurança devem ser confirmados com TI antes de produção.

## Perspectivas da Squad
| Perspectiva | Status | Issues |
|-------------|--------|--------|
| Front-end   | ⚠️ | 1 importante, 3 menores |
| Back-end    | ⚠️ | 2 importantes, 2 menores |
| QA          | ⚠️ | 2 importantes, 3 menores |
| Arquiteto   | ⚠️ | 1 importante, 2 menores |
| Segurança   | ⚠️ (0 crítico) | 2 importantes, 3 menores |
| PO          | ⚠️ | 1 importante, 3 menores |

Totais: **0 Crítico · 9 Importante · 14 Menor**

## Importantes (priorizar)

### Segurança
1. **Fallback `dp-access` por "personnel" é amplo demais** — `src/lib/dp-access.ts:17`
   `/personnel/i.test(cargo)` libera o RH (aprovar/reprovar abonos e férias de toda a empresa) para qualquer cargo que contenha "personnel". Restringir (match mais específico ou allowlist validada com RH) e priorizar a correção do `perfilDP` no backend. **Maior risco da leva.**
2. **Anexo de abono não escopado (IDOR potencial entre DPs)** — `squadra-client.ts:1203` + `abonos/[id]/anexo/route.ts`
   `getAbonoAnexo` busca a lista global e filtra por id; qualquer usuário com acesso DP vê o anexo de qualquer abono. Confirmar com PO/TI se DP deve ver tudo ou há segregação por unidade.

### Back-end
3. **Validação de `id` (NaN) nas rotas RH `[id]`** — `abonos/[id]/avaliar:25`, `ferias/[id]/avaliar:26`, `abonos/[id]/anexo:15`
   Usar `z.coerce.number().int().positive()` antes de chamar o service (`Number("abc")` → NaN é repassado).
4. **`calcTipo` engole erro e assume 'C' (banco) silenciosamente** — `solicitacoes/hora-extra/route.ts:28`
   Se `getDadosColab` falhar, a hora extra pode ser registrada no tipo errado. Logar o fallback.

### Front-end / A11y
6. **AnexoViewer sem `role=dialog`/focus-trap** — `rh/page.tsx:67`
   Migrar para o `Dialog` (Radix) usado no ApprovalModal — foco, aria-modal e retorno de foco.

### QA
7. **base64 grande em `data:` URI pode travar a UI** — `rh/page.tsx:64`
   PDFs/imagens grandes: considerar `Blob` + `URL.createObjectURL`.
8. **`detectMime` por prefixo base64 é frágil** — `rh/page.tsx:31`
   Trata só 4 tipos; base64 com whitespace/prefixo cai em octet-stream.

### Arquiteto
9. **Duplicação de helpers** — `statusMap`/`statusLabel`/normalizador de status; `toMin` (3 arquivos); `SEM_ABREV` (2 arquivos). Centralizar em utils.

### PO
5. **Erro "máx 2h" cobre também caso `<= 0`** — `hora-extra/route.ts:62` vs `solicitacoes/page.tsx:247`
   Mensagens distintas: "fim deve ser após o início" vs "máximo de 2h".

## Menores
- Regra global de cursor não cobre `[data-disabled]` — `globals.css:135`
- Valores visuais hardcoded no Ponto (port fiel do vanilla — dívida registrada)
- `min-w-[140px]` no calendário: validar a 320px
- `PontoLoading`/`RHAbonosLoader` sem `role=status` (inconsistente com VideosLoader/VerificandoCredenciais)
- `videos/route.ts` expõe detalhe de erro só em dev (garantir NODE_ENV=production no deploy)
- `parseDMY`/`toMin` sem proteção contra datas malformadas (NaN)
- chaves de lista por índice em gestao/page.tsx (listas estáticas — baixo impacto)
- race em `aprovandoId` único na Gestão (baixo impacto)
- `_simOrig` via `(session as any)` — tipar no schema de sessão
- `renderMarkdown` (Ajuda) aceita qualquer URL, inclusive `javascript:` — JSON estático, mas validar esquema
- "Carregando videos..." sem acento — `recursos/videos/page.tsx:21`
- empty states de RH/buscas só texto (inconsistente com Gestão)
- "✓ Solicitado" é estado local efêmero — confirmar ausência de flash no refetch
- sem rate limiting em simulate/hora-extra (app interno — registrar)

## 🚨 Escalados ao Orchestrator
Nenhum (0 críticos). Segurança #1 e #2 recomendados para validação com TI antes de produção.
