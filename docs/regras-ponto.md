# Regras de Negócio — Ponto (`/ponto`)

> Levantamento das regras de negócio da batida de Ponto no **web-app-next**.
> Referências de arquivo entre parênteses. Última atualização: 2026-06-11.

## 1. Acesso à tela

- **Quem entra é decidido só pelo `bateRep`** — quem tem `bateRep: true` vê a tela de Ponto; quem não bate ponto (`bateRep: false`) apropria horas por percentual e é redirecionado com `AccessDenied` ("Use o menu Percentual"). Não depende de ser gestor nem de ter equipe (`src/app/(app)/ponto/page.tsx:36-37`).
- **Todas as rotas de API exigem** sessão autenticada (`token`) **e** `bateRep: true` — senão 401/403. Vale para GET ponto, projetos, dias-sem-apontamento, POST apontamento, liberação e DELETE.
- Enquanto a sessão não hidrata (`gestorId === 0`), mostra "Verificando credenciais".
- **Sem conta no SQHoras**: se o upstream devolve código 8, a API retorna `sqhoras_not_found` (404) e a tela mostra "Sem conta no SQHoras".

## 2. Período / mês fechado

- **Um mês fecha às 12:00 (horário de Brasília) do dia 1º do mês seguinte.** A partir desse instante o mês (e anteriores) fica somente-leitura (`src/lib/periodo-fechado.ts`).
- Mês fechado: oculta o botão "Realizar apontamento", o card de pendências e a seção "Dias sem apontamento"; mostra a faixa "Mês fechado, nenhuma mudança autorizada"; calendário fica sem botões de ação.
- O bloqueio é **reforçado no servidor**: POST apontamento (422), solicitar liberação (422) e DELETE apontamento (422) recusam datas de mês fechado, mesmo que o front deixasse passar.

## 3. Registrar apontamento (batida)

Validações do formulário (`src/features/ponto/components/ApontamentoForm.tsx:80-103`) **e** replicadas no schema do servidor (`src/app/api/ponto/route.ts:17-40`):

- **Projeto obrigatório**; se o projeto tem subprojetos, o **subprojeto também é obrigatório**.
- Auto-seleção: projeto único já vem selecionado; subprojeto único também.
- **Pelo menos 1 período** (início/fim). Cada período vira um apontamento separado.
- Em cada período, **fim deve ser depois do início**.
- **Períodos não podem se sobrepor**.
- **Data futura proibida** (compara `YYYY-MM-DD` lexicograficamente em BRT).
- **No próprio dia, nenhum horário pode ser futuro** — fim não pode passar da hora atual (BRT); o picker limita com `max={horaAgora}`.
- Justificativa é opcional. No payload: batida normal vira descrição `'.'`; hora extra vira `'hora extra aprovada'` / texto "Hora Extra Aprovada Via APP" (`src/services/ponto.ts:55-75`).
- A **data fica travada** no dia clicado (campo read-only).
- Erros de negócio do upstream (almoço, sobreposição, futuro…) são repassados ao usuário com status 422.

## 4. Jornada × Hora Extra (classificação automática)

- O **excedente da carga vira `HORA_EXTRA` automaticamente** — sem toggle por padrão (`src/features/ponto/components/ApontamentoForm.tsx:69-78`).
- O **toggle Jornada/Hora Extra só aparece quando há hora extra APROVADA no dia** (`heAprovadaMin > 0`). Sem aprovação não faz sentido marcar HE — o backend recusaria o excedente.
- Default quando há HE aprovada e o dia excede a carga → `HORA_EXTRA`; senão → `JORNADA`. O usuário pode sobrepor manualmente quando o toggle aparece.
- **Teto da HE aprovada**: ao marcar HORA_EXTRA, o excedente não pode ultrapassar o total aprovado, senão bloqueia com a mensagem do valor.
- **Hora extra aprovada** = `dadosHoraExtra` com `statusSolicitacao === 3` (3 = aprovada, 5 = pendente do gestor — códigos próprios, ≠ statusLabel) (`src/features/ponto/hooks/usePonto.ts:29-35`).
- HE aprovada ainda não registrada aparece como pendência prioritária ("H.Extra liberada" / chip verde) e **some sozinha** quando `dia.horaExtra` atinge o valor aprovado.

## 5. Faltas e liberação

- **Status da falta** derivado por prioridade (`src/features/ponto/hooks/usePonto.ts:56-63`): `statusLiberacaoFalta` A=aprovado / R=recusado / P=pendente → senão `liberacaoGestor === 'S'` = aprovado → senão `solicitacaoLiberacaoFaltaId > 0` = pendente → senão não solicitado.
- Falta **detectada** por `isFalta || (falta && faltaId > 0)` (flags do backend não confiáveis isoladamente).
- Fluxo do colaborador num dia de falta:
  - **Não solicitado** → "Solicitar liberação" (envia ao gestor).
  - **Pendente** → "Aguardando gestor" (sem ação).
  - **Aprovado e sem horas** → "Liberado — bater ponto" (pode apontar).
  - **Recusado** → "Recusado — solicitar novamente".
- A solicitação de liberação usa `faltaId` (não `idUnico`) e envia data ISO para reforço do mês-fechado no servidor.

## 6. Pendências (card "Dias pendentes")

Um dia entra como pendente se (`src/features/ponto/hooks/usePonto.ts:70-119`):
- **Data ≤ hoje** (dias futuros nunca são pendentes).
- **HE aprovada não registrada** → pendência prioritária, vale inclusive fim de semana e dia com abono.
- Caso contrário, **ignora**: fim de semana, dias com `horasPrevistas == 0`, e **abono real**.
- **Abono real** = `horasAbono` ≠ "00:00" **e** com `descricaoTipoAbono` — discrimina pelos *dados*, não pelas flags `isAbono`/`isFalta` (que vêm espúrias) (`src/features/ponto/hooks/usePonto.ts:41-43`).
- Dia **incompleto** (realizado < previsto e não é falta) → "Sem apontamento" (se 0) ou "Apontamento incompleto".
- Pendências ordenadas da mais recente para a mais antiga.

## 7. Calendário (exibição)

- Remove **sábados/domingos reais**; feriado no meio da semana permanece (`src/features/ponto/components/PontoCalendar.tsx:209-212`).
- Divisores "hoje" e "futuro"; linhas futuras ficam cinza, sem horários nem ações.
- Cores de barra: verde=OK, âmbar=Pendente, vermelho=Falta/Recusado, azul=Feriado/Abono, cinza=Futuro.
- "Dia com apontamento" considera **jornada OU hora extra** — um dia 100% HE tem `realMin=0` mas não está "sem apontamento" (`src/features/ponto/components/PontoCalendar.tsx:83`).
- **Modo gestor** sobrescreve CTAs (Liberar / Confirmar falta) seguindo a regra do app-react; "Liberar" só aparece em dias passados, falta já confirmada vira chip read-only.

## 8. Editar / excluir apontamentos

- Exclusão individual de períodos liberada em **qualquer dia do mês aberto** (o backend só barra mês fechado) (`src/app/(app)/ponto/page.tsx:216-217`).
- **Read-only** quando: mês fechado **ou** visualizando ponto de outro colaborador.
- DELETE reforça mês-fechado no servidor (422).

## 9. Ver ponto de outro colaborador

- Via `?sqhorasId=X&nome=Y` — banner "Visualizando ponto de X".
- **Somente leitura total**: sem botão de apontamento, sem pendências, sem dias-sem-apontamento, sem abrir drawer de registrar/apontar/solicitar (o POST gravaria no usuário logado e os projetos seriam os do gestor).
- A rota `/api/ponto` própria sempre usa o `sqhorasId` da sessão; ponto de terceiros passa por `/api/gestao/membro/[id]/ponto` com checagem de equipe.
- "Dias sem apontamento" desabilitado ao ver outro usuário ou durante simulação.

## 10. Resumo do topo

- **Saldo** (do mês), **Carga** e **Realizado** somam apenas dias úteis com previsão > 0. Saldo negativo (começa com "-") fica em vermelho.

---

# Regras de Ponto no app-react (referência)

O app-react (`C:\Users\eduar\Downloads\squadra-app-react`) concentra o ponto na tela **Horas** (`app/(screens)/horas/`), com 5 abas: **Apropriação**, **Banco de horas**, **Abonos**, **Pendências**, **Alocações**. O coração da batida está em `ApropriacaoView.tsx` (visão do dia) e `adicionarPeriodos.tsx` (formulário).

> ⚠️ Diferença estrutural: o app-react trabalha **dia a dia** (DateSelector), não com calendário do mês inteiro como o web-app-next.

## A. Dados do dia (`retornaCargaHoraria`)

Cada dia carrega: `cargaHoraria`, `falta`, `faltaId`, `horaExtra`, `statusHoraExtra`, `horaAbono`, `tipoAbono`, `statusHoraAbono`, `liberacaoGestor`, `marcaFalta`, `permissaoLiberacao`, `reducaoDeCarga`, `solicitacaoLiberacaoFaltaId`, `statusLiberacaoFalta`.
- `cargaHoraria === "0"` → "Sem previsão de atividades" (fim de semana/feriado), sem barra de progresso.
- HE aprovada = `horaExtra > 0` **e** `statusHoraExtra === "APROVADO"` (rótulo textual; o web-app-next usa o código `statusSolicitacao === 3`).

## B. Registrar apontamento (`adicionarPeriodos.tsx`)

- **Data nunca futura** (date picker com `maximumDate`).
- **Limite de 6h por período** (360 min) — limpa o período e alerta.
- **Períodos já lançados** vêm pré-preenchidos (`source: "api"`), read-only; remover um "api" chama o delete real.
- **Sem sobreposição** com períodos existentes (`hasOverlap`).
- **Teto da carga**: total trabalhado não pode passar de `carga + HE aprovada` → modal "excedeu" + limpa períodos.
- Campos: Projeto (auto-seleção se 1), Subserviço (texto), Atividade (texto, máx 300).
- Payload idêntico ao que o web-app-next replica (descrição `"hora extra aprovada"`/`"apontamento normal"`).

## C. Jornada × Hora Extra

- Fim de semana: excedente → `HORA_EXTRA` automático, sem toggle.
- Dia útil com HE aprovada e carga > 0: toggle JORNADA/HORA EXTRA.
- Carga 0 + HE aprovada: força `HORA_EXTRA`, título "Apropriação de Hora Extra".
- Teto: total de HE no dia (já apontada + nova) ≤ aprovado.

## D. Solicitar hora extra ("Horas Além do Previsto")

Modal em `ApropriacaoView` (`cadastraSolicitacao`):
- **Quantidade ≤ 2h** (máx 02:00).
- **Projeto e motivo obrigatórios** (motivo máx 300).
- Switch **Hora Noturna** (S/N).
- **Tipo `E` ou `C`**: saldo do dia ≥ 0 → `E` (extra); senão `C` (compensação/banco).

## E. Faltas

- Banner quando `falta || faltaId > 0` e não liberado: amarelo (liberação enviada) ou vermelho (falta aplicada).
- **"SOLICITAR REVISÃO DE FALTA"**: só com `faltaId`, sem liberação enviada, não liberada e **no último dia útil** (`isLastWorkingDay`). → o web-app-next afrouxou para liberação livre de qualquer falta passada.
- **"SOLICITAR ABONO"**: quando há falta e não liberada → tela `/abono`.

## F. Botão "ADICIONAR PERÍODOS"

Aparece quando `cargaHoraria > 0` OU (HE aprovada); E (sem falta) OU (falta liberada pelo gestor). Se já apontou exatamente a carga sem HE → alerta para usar "Horas Além do Previsto".

## G. Solicitar abono (`abono/index.tsx`)

Fluxo rico, por **tipo de abono** (id):
- Tipos com cálculo automático de data fim e horas: férias (12 → +19 dias, 20×8h), licença (13 → +1 dia, 2×8h), luto/parentesco (9/10 → grau de parentesco define 5 ou 2 dias), tipos 21/11 → opção "Dia Inteiro" vs "Definir Horas".
- "Definir Horas": período **mín 1h, máx 8h**.
- **Anexo** (foto/galeria/documento — PNG/JPG/PDF, base64), grau de parentesco, motivo.
- `recId` = id do colaborador.

## H. Modal "Falta de ontem"

Ao abrir **hoje**, chama `GET /v1/falta/VerificaFaltaOntem/{usuarioId}`. Se `true`, abre modal "Apropriação Pendente" (lembrete proativo, não bloqueia).

## I. Pendências (aba)

`retornaPendencias`. Badge vermelho se `possuiFalta === "S"`, senão amarelo. Texto: "Não há apontamento para o dia" (0h) ou "Só apontou Xhrs no dia".

---

# Comparação app-react ↔ web-app-next

| Aspecto | app-react | web-app-next |
|---|---|---|
| Visão principal | Dia a dia | Calendário do mês |
| HE aprovada | `statusHoraExtra === "APROVADO"` | `statusSolicitacao === 3` |
| Solicitar HE | Modal na tela de ponto | **Existe em `/solicitacoes` (aba Hora Extra)**, mas sem atalho no ponto |
| Solicitar Abono/Day-off | Tela `/abono` (rica) | **Existe em `/solicitacoes`** (abas Abono/Day-off, versão simplificada), sem atalho no ponto |
| Limite 6h por período | Sim | **Não** (a implementar) |
| Teto da carga no submit | Bloqueia (modal) | Excedente vira HORA_EXTRA automático |
| Liberação de falta | Só "último dia útil" | Liberação livre de falta passada |
| Mês fechado | Não trava | Trava (12:00 do dia 1º) |
| Falta de ontem | Modal proativo | Coberto pelo card "Dias pendentes" |

---

# Plano de aproximação (finalizado 2026-06-11)

Objetivo: aproximar o ponto do web-app-next ao app-react, reaproveitando `/solicitacoes`.

> ✅ **Entregue (2026-06-11)** como melhoria no fluxo de ponto (changelog v1.6.0) — branch `feat/ponto-aproximacao-appreact`.
> Fases 1, 2 e 3 implementadas com testes (suíte: 301 testes / 24 suítes, 0 falhas).
> Pendente de validação com a TI: o contrato real do `/v1/abono/cadastraSolicitacao`
> (nomes de campo) e os IDs de tipo de abono hardcoded (9,10,11,12,13,21).

## Já feito (base)
- **Limite de 6h por período** — cliente (`ApontamentoForm`) + servidor (`PeriodoSchema`), msg "O período não pode exceder 6 horas".
- **Atalhos inline** de Hora Extra e Abono no drawer do dia em `/ponto` (modos `hora-extra`/`abono`), reusando `useSolicitacoes()`, com o dia pré-preenchido (`SolicitacaoInline.tsx`).

## Fase 1 — Teto de jornada (bloqueio + aviso)
Bloquear JORNADA acima da carga; excedente só via toggle Hora Extra.
- `ApontamentoForm.tsx`: aviso **em tela** ao vivo quando `jaApontado + novo > carga` e tipo JORNADA; bloquear submit com msg "Você só pode apontar até {carga} como jornada. Para exceder, registre como Hora Extra."
- Caminho HORA_EXTRA mantém o teto atual (excedente ≤ HE aprovada).
- Reforço no servidor é **opcional** (exigiria buscar a carga do dia) — fica no cliente + rejeição do upstream.
- Lógica do teto extraída para função pura + teste unitário.

## Fase 2 — Hora Extra: fonte + polish do form
- **HE aprovada**: centralizar a regra `statusSolicitacao === 3` (já em `horaExtraAprovadaMin`); toggle + teto da Fase 1 usam ela. (O web não tem `statusHoraExtra` textual do app — usa o código 3, confirmado = aprovada.)
- Form de HE (`SolicitacaoInline` + aba HE de `/solicitacoes`): quantidade `number` livre (step 0.5, **máx 2h**, sem travar digitação); **motivo `maxLength=300`**.

## Fase 3 — Abono completo (a grande)
Trazer o fluxo rico do app-react para `/solicitacoes` **e** o drawer inline do ponto, com componente compartilhado.
- **Backend** (`services/solicitacoes.ts` + `api/solicitacoes/abono/route.ts`): aceitar `dataInicio`, `dataFim`, `anexo`, `nomeAnexo`, `descricao` (upstream `/v1/abono/cadastraSolicitacao` já suporta).
- **`AbonoForm` compartilhado**: tipo, data início, data fim (condicional), grau de parentesco (tipos 9/10), "Dia inteiro" vs "Definir horas" (tipos 11/21, mín 1h/máx 8h), anexo (foto/galeria/PDF → base64), motivo.
- **Cálculo automático**: tipo 12 → +19 dias/160h; 13 → +1 dia/16h; 9–10 por parentesco → 5 dias (PAI/MÃE/CÔNJUGE/FILHO) ou 2 dias (AVÓS/TIOS/IRMÃOS); 11/21 → dias×8 ou horas; default 8h. Extraído para função pura + teste.
- ⚠️ IDs de tipo hardcoded (9,10,11,12,13,21) espelham o app-react — frágil se o backend mudar; confirmar com a TI se há campo na lista de tipos que indique a regra.

## Sem mudança (confirmado)
- Campos Subserviço/Atividade no apontamento → web fica enxuto.
- Botão de abono no ponto → mantém como está (não condicionado a falta).
- **Liberação de falta livre** mantida (vale p/ gestor "Liberar" e p/ pedido do colaborador; ambos livres no web).
- Modal "falta de ontem" → coberto pelo card "Dias pendentes".
- Visão calendário (web) vs dia a dia (app-react) → estrutural, mantida.

---

# 2º ciclo de aproximação (2026-06-11)

Após novo cruzamento, fechados mais 3 pontos (suíte: 310 testes / 26 suítes):

1. **Dia de carga 0 (fim de semana/feriado)** — decisão: **mais restritivo que o app**. O web bloqueia a batida quando não há HE aprovada (o app marcava HORA_EXTRA livremente). Com HE aprovada, libera como HORA_EXTRA até o teto. Regra em `apontamento-rules.ts` (`cargaZeroBloqueio`).
2. **"Sem hora prevista"** — o calendário deixa de ocultar fim de semana/feriado; esses dias aparecem com esse rótulo (e HE aprovada num sábado passa a aparecer).
3. **Falha de sincronização APP × ERP** — o web passa a ler o `rm` do `/v2/RetornaApontamentosPorDia` e avisa quando `sqHoras`/`rm` divergem (`ApontamentosDiaResult.rmCount`).
4. **Banco de horas** — card abaixo do resumo com a data prevista de desconto + regra de ciclo (`banco-horas.ts`). O histórico dia a dia do app permanece coberto pelo calendário.

**Ainda fora do escopo (próxima rodada)**: aba **Banco de Horas** completa (histórico próprio), aba **Alocações**.
