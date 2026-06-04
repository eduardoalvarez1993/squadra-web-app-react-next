# QA Report — qa-agent (analítico, sem browser)
Gerado em: 2026-06-03 · Ciclo v1 · Escopo: leva b7f4420..362ae03

## Resultado Geral: PENDENTE (6 FAILs funcionais, 0 bloqueante de auth)

| Fluxo | PASS | FAIL | INCONC |
|-------|------|------|--------|
| Ponto | 12 | 2 | 3 |
| RH/DP | 8 | 1 | 3 |
| Gestão | 7 | 1 | 2 |
| Solicitações | 5 | 2 | 2 |
| Extras | 8 | 0 | 2 |
| **TOTAL** | **40** | **6** | **12** |

## FAILs funcionais (acionáveis, não duplicam o review)

1. **Hora extra noturna cruzando meia-noite calcula 0h e é rejeitada** — `api/solicitacoes/hora-extra/route.ts:18-26,61-63`
   Com `isNoturno='S'` e ex. início 23:00 / fim 01:00, `diff` negativo → 0h → 400 "máx 2h". A feature noturna está quebrada na borda da meia-noite. Correção: somar 24h ao fim quando noturno e fim<=início. **(bug real de feature)**

2. **Ponto — "ver outro usuário" usa projetos/identidade do gestor logado no apontamento** — `ponto/page.tsx:43,253,323` + `api/ponto/projetos/route.ts:13`
   Se o drawer "apontar" abrir ao ver outro colaborador, o select lista projetos do gestor e o POST grava no `pessoaId` do gestor. Correção: suprimir modos registrar/apontar quando `outraSqhorasId` presente.

3. **Ponto — drawer "registrar" abre para data futura/fim de semana** — `ponto/page.tsx:96-123`
   `openDiaSemApontamento` na virada de mês usa `dias` desatualizado e cria dia fake "registrar"; sem bloqueio de data futura no form/rota. Correção: validar data no `validate()` e no schema da rota.

4. **RH — `AnexoViewer` busca o anexo pelo status da ABA, não do abono** — `rh/page.tsx:201`
   Passa `statusAbono` (aba ativa) em vez do status real do item; anexo pode não ser encontrado. Correção: passar o status do próprio `a.status`.

5. **Gestão — `aprovandoId` único colide entre tipos** — `gestao/page.tsx:259`
   Abono/apropriação/férias com mesmo número de id desabilitam o botão errado. Correção: chave composta `${tipo}-${id}`.

6. **Solicitações — fim<=início devolve "máx 2h" (mensagem confusa)** — `hora-extra/route.ts:62-63`
   Mesma mensagem para >2h e para fim<=início. Correção: validar fim>início no form com mensagem própria + separar condições na rota.

## Itens para validação humana / dados reais (INCONC)
- Ponto: status por dia com massa real (falta pendente com horas, abono parcial); timezone na borda do mês; aceite/rejeição 422 do POST
- RH: escopo das férias (`getRHFerias(session.gestorId)` — DP global vs equipe); formatos de anexo além de pdf/jpeg/png/gif; quais cargos contêm "personnel"
- Gestão: códigos reais de status (1/2 vs A/R); unicidade de nomes no cross-reference
- Solicitações: drawer fecha ou mantém feedback após sucesso (decisão de PO); aceitação real pela API
- Extras: conteúdo curado de links.json/ajuda (esquemas de URL); catálogo real de vídeos

## Nota
Achados de segurança (fallback "personnel", IDOR do anexo, validação NaN, calcTipo silencioso) estão no `review-report.md` — não repetidos aqui.
