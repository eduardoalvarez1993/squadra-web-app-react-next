# Padrao de imagens - Squadra Web App Next

Este documento foi trazido do `web-app` legado e define o estilo visual usado nas imagens ilustrativas do `web-app-next`, especialmente estados vazios como "Nenhuma pendencia no momento".

No Next, os assets finais ficam em `public/assets/` e devem ser referenciados pelo mapa central `src/lib/assets.ts`, exportado como `PADRAO_IMAGENS` e `ASSETS`.

## Direcao geral

As imagens devem ter aparencia de produto digital moderno, com clima corporativo, leve e humano. O objetivo e comunicar organizacao, eficiencia e tranquilidade, sem parecer banco de imagem generico ou comemoracao exagerada.

O estilo atual e uma ilustracao 3D flat premium: objetos simples, volumetria suave, luz difusa, sombras leves, superficies limpas e acabamento de SaaS/consultoria de tecnologia.

## Paleta

Usar tons inspirados na comunicacao visual da Squadra, com foco em azul, roxo e magenta.

- Azul principal: `#1d4ed8`, `#2563eb`, `#3157d9`
- Azul profundo: `#163b9f`, `#17327f`
- Roxo/violeta: `#6d28d9`, `#7c3aed`, `#8b5cf6`
- Magenta/pink de luz: `#e946a9`, `#ff4fa3`, `#f472b6`
- Neutros claros: `#ffffff`, `#f5f7fb`, `#eef2ff`
- Verde apenas para sucesso/checks: `#22c55e`, `#16a34a`

Evitar paletas muito monocromaticas. O visual deve misturar azul e roxo, com magenta como acento de luz, e nao como cor dominante.

## Iluminacao

- Luz principal suave e clara.
- Brilhos azulados e violetas nos objetos.
- Acentos magenta discretos nas bordas ou reflexos.
- Fundo limpo ou transparente.
- Evitar fundo escuro preenchendo toda a imagem.

## Composicao

Preferir composicoes centradas, com bastante respiro ao redor, para funcionar bem em estados vazios e cards.

Para estado vazio de pendencias, o conceito aprovado e:

- Mesa de trabalho organizada no fim do expediente.
- Notebook fechado ou laptop fino.
- Checklist com todos os itens marcados.
- Caneca.
- Relogio ou calendario limpo para representar horas/gestao.
- Opcional: bloco de notas, caneta, planta ou pequenos elementos digitais.

Nao usar pessoas nesses estados vazios, a menos que seja solicitado explicitamente.

## Regras de estilo

- Ilustracao 3D flat premium, nao cartoon infantil.
- Visual amigavel, mas profissional.
- Sem textos legiveis dentro da imagem.
- Sem logo, marca escrita ou watermark.
- Sem confete, trofeu, fogos ou comemoracao exagerada.
- Sem excesso de detalhes que prejudiquem a leitura em tamanho pequeno.
- Checks verdes podem aparecer, mas devem ser poucos e claros.
- Objetos brancos internos, como papel ou checklist, devem ser preservados mesmo quando o fundo for transparente.
- Lupa animada deve ser vazada: manter aro e cabo, mas deixar o centro transparente, sem textura/vidro/reflexo preenchendo a area interna.

## Transparencia

Quando a imagem for usada em estado vazio, preferir PNG com fundo transparente.

Manter uma copia da versao original com fundo quando possivel, usando nomes como:

- `empty-pendencias.png` - versao final usada na tela, com transparencia.
- `empty-pendencias-com-fundo.png` - backup/original com fundo.

## Tamanho e uso

Na interface, usar a imagem com largura responsiva aproximada:

```css
width: min(340px, 82vw);
height: auto;
```

Ela deve ficar acima da mensagem principal do estado vazio. Exemplo:

```html
<div class="empty-state empty-state-visual">
  <img src="assets/empty-pendencias.png" alt="" loading="lazy">
  <strong>✅ Nenhuma pendência no momento.</strong>
  <span>Está tudo organizado por aqui.</span>
</div>
```

## Prompt base

Use este prompt como ponto de partida para novas imagens:

```text
Create a light premium 3D flat illustration for a corporate web app empty state.
Scene: an organized desk at the end of the workday, with a closed slim laptop, a checklist with every item checked, a coffee mug, and a small clean clock or calendar detail representing time and management.
Style: sophisticated 3D flat illustration, modern technology consultancy aesthetic, polished SaaS product visual, friendly but not cartoonish.
Composition: centered object group with generous padding, isolated enough to work above an empty-state message. No actual readable text in the image.
Lighting: calm, accomplished, organized, softly lit with blue-purple ambient glow and subtle magenta highlights.
Color palette: light neutral base, deep blue, royal purple, violet gradients, subtle magenta/pink lighting accents, small green accents only on completed checkmarks.
Constraints: no people, no readable text, no logo, no brand names, no watermark, no confetti, no busy background, no dark full background.
```

## Imagem atual

Imagem usada em Pendencias:

- `assets/empty-pendencias.png`
- `assets/empty-pendencias-com-fundo.png`

Imagens usadas em Minha Equipe:

- `assets/buscando-equipe.png` - estado de carregamento/busca da equipe
- `assets/buscando-equipe-base.png` - camada base do loader de busca sem lupa
- `assets/buscando-lupa.png` - camada da lupa animada via CSS sobre os cards
- `assets/buscando-lupa-com-vidro.png` - backup da lupa original antes de remover o miolo
- `assets/select-colaborador.png` - estado vazio do painel de detalhe
- `assets/buscando-equipe-chroma.png`, `assets/buscando-equipe-base-chroma.png`, `assets/buscando-lupa-chroma.png` e `assets/select-colaborador-chroma.png` - fontes com fundo verde para recorte

Imagens usadas em loaders animados:

- `assets/holerite-loading.png` - base transparente do loader de holerite; animacao por scanner CSS
- `assets/holerite-loading-chroma.png` - fonte com fundo verde para recorte
- `assets/pendencias-loading.png` - base transparente do loader de pendencias do gestor; animacao por carimbo/check CSS
- `assets/pendencias-loading-chroma.png` - fonte com fundo verde para recorte
- `assets/ponto-loading.png` - base transparente do loader de registros de ponto; animacao por relogio/ponteiro CSS
- `assets/ponto-loading-chroma.png` - fonte com fundo verde para recorte
- `assets/alocar-loading.png` - base transparente do loader da aba Alocar; animacao por ponto CSS percorrendo a rota entre colaborador e projeto
- `assets/alocar-loading-chroma.png` - fonte com fundo verde para recorte
- `assets/pessoas-busca-teclado.png` - base transparente do estado inicial da view Pessoas, com teclado 3D flat premium
- `assets/pessoas-busca-teclado-chroma.png` - fonte com fundo verde para recorte
- `assets/pessoas-busca-mao.png` - camada transparente animada do estado inicial da view Pessoas, com dedo/mao digitando
- `assets/pessoas-busca-mao-chroma.png` - fonte com fundo verde para recorte
- `assets/pessoas-empty.png` - estado vazio da busca de Pessoas, com cards de perfil abstratos e lupa
- `assets/pessoas-empty-chroma.png` - fonte com fundo verde para recorte
- `assets/novos-colaboradores-loading.png` - base transparente do loader da aba Novos na Squadra; animacao por cracha CSS encaixando no kit de onboarding
- `assets/novos-colaboradores-loading-chroma.png` - fonte com fundo verde para recorte
- `assets/aniversariantes-loading.png` - base transparente do loader de Aniversariantes; animacao por tres chamas CSS nas velas
- `assets/aniversariantes-loading-chroma.png` - fonte com fundo verde para recorte
- `assets/aniversariantes-empty.png` - estado vazio pequeno de Aniversariantes com fatia de bolo mordida
- `assets/aniversariantes-empty-chroma.png` - fonte com fundo verde para recorte
- `assets/feed-card-1.png`, `assets/feed-card-2.png`, `assets/feed-card-3.png` e `assets/feed-card-4.png` - cards transparentes do loader de Squadra em Rede; animacao por swipe/carrossel CSS
- `assets/feed-card-1-chroma.png`, `assets/feed-card-2-chroma.png`, `assets/feed-card-3-chroma.png` e `assets/feed-card-4-chroma.png` - fontes geradas dos cards para ajuste/recorte
- `assets/feed-empty.png` - estado vazio pequeno de Squadra em Rede com card social rasgado
- `assets/feed-empty-chroma.png` - fonte com fundo verde para recorte do estado vazio de Squadra em Rede
- `assets/feed-loading.png` - versao anterior do loader de Squadra em Rede; mantida como backup
- `assets/feed-loading-chroma.png` - fonte com fundo verde da versao anterior
- `assets/comunicados-loading.png` - base transparente do loader de Comunicados; animacao por bandeirinha CSS na caixa de correio
- `assets/comunicados-loading-chroma.png` - fonte com fundo verde para recorte
- `assets/rh-ferias-loading.png` - base transparente do loader de RH/Ferias; animacao por coco CSS
- `assets/rh-ferias-loading-chroma.png` - fonte com fundo verde para recorte
- Minhas Ferias (`#ferias`) reaproveita `assets/rh-ferias-loading.png` com a mesma animacao de coco CSS e texto HTML: "Carregando suas ferias..."
- `assets/rh-ferias-empty.png` - estado vazio fixo de RH/Ferias com dois coqueiros e rede; usado quando nao ha solicitacoes pendentes
- `assets/rh-ferias-empty-chroma.png` - fonte com fundo verde para recorte
- `assets/rh-abonos-loading.png` - prancheta unica transparente do loader de RH/Abonos; duplicada no HTML/CSS para formar a pilha animada
- `assets/rh-abonos-loading-chroma.png` - fonte com fundo verde para recorte
- Abonos do gestor (`#abonos`) reaproveita `assets/rh-abonos-loading.png` com animacao propria de selo/check CSS percorrendo a prancheta e texto HTML: "Carregando abonos..."
- `assets/hora-extra-loading.png` - base transparente do loader de Solicitacoes/Horas Extras; conceito de card de solicitacao com relogio e simbolo de hora extra. Tambem reaproveitado como loader generico de "Solicitacoes enviadas" em Solicitacoes do colaborador
- `assets/hora-extra-loading-chroma.png` - fonte com fundo verde para recorte
- `assets/perfil-card-front.png` - frente transparente do card de identidade do loader Meu Perfil
- `assets/perfil-card-front-chroma.png` - fonte com fundo verde para recorte
- `assets/perfil-card-back.png` - verso transparente do card de identidade do loader Meu Perfil, com QR code e sem avatar
- `assets/perfil-card-back-chroma.png` - fonte com fundo verde para recorte
- `assets/perfil-card-back-com-avatar.png` - backup do verso anterior com avatar

Regra para loaders animados:

- Usar dois elementos: uma base estatica em PNG transparente e um elemento animado separado via CSS.
- Nao colocar texto legivel dentro da imagem. A frase do estado deve ficar no HTML, abaixo da imagem.
- Para Ponto, o conceito aprovado e um painel de jornada com timeline de quatro registros e um relogio/ponteiro animado percorrendo os pontos.
- Para Alocar, o conceito aprovado e um quadro de alocacao com card de colaborador conectado a card de projeto. O elemento animado e um ponto feito em HTML/CSS que percorre a rota entre os cards, sugerindo vinculo colaborador-projeto sendo preparado.
- Para o estado inicial de Pessoas, o conceito aprovado e um teclado 3D flat premium como base estatica e uma mao/dedo em PNG separado, animado via CSS com movimento de digitacao. A frase fica no HTML, abaixo da imagem, com "Digite 3" em destaque.
- Para busca sem resultado em Pessoas, o conceito aprovado e uma imagem fixa com cards de perfil abstratos e lupa, sem pessoas reais e sem texto dentro da imagem. A frase fica no HTML: "Nenhuma pessoa encontrada."
- Para Novos Colaboradores/Novos na Squadra, o conceito aprovado e um kit de boas-vindas/onboarding aberto como base estatica. O elemento animado e um cracha feito em HTML/CSS que desce, encaixa no espaco central do kit, da uma batida curta e reinicia. Esse loader deve ser aplicado dentro da aba Novos na Squadra, nao no carregamento geral da view Pessoas.
- Para Aniversariantes, o conceito aprovado e um bolo 3D flat premium com tres velas. As chamas devem ser feitas via HTML/CSS, oscilando de forma sutil.
- Para vazio de Aniversariantes, manter o card visivel e usar uma fatia de bolo mordida pequena, com frase HTML: "Que pena, nenhum aniversariante hoje para comemorar".
- Para Squadra em Rede, o conceito aprovado e um conjunto de quatro cards sociais separados, em tons de azul, roxo e magenta. A animacao deve ser feita por HTML/CSS em swipe lateral rapido: o card da frente sai para a direita, os cards de tras avancam na pilha e um novo card surge ao fundo, em loop suave e sem pausa longa.
- Para vazio de Squadra em Rede, manter o bloco visivel e usar um card social rasgado pequeno, no mesmo formato compacto do vazio de Aniversariantes. A frase fica no HTML: "Nenhuma publicacao encontrada."
- Para Comunicados, o conceito aprovado e uma caixa de correio classica estilo USA, sem texto e sem bandeirinha na imagem base. A bandeirinha lateral deve ser feita via HTML/CSS, subindo e descendo como indicativo de comunicado chegando.
- Para RH/Ferias e Minhas Ferias, o conceito aprovado e praia minimalista com coqueiro e cards abstratos. O elemento animado e um coco que cai, rola para o mar e desaparece.
- Para vazio de RH/Ferias, o conceito aprovado e uma imagem fixa com dois coqueiros e uma rede no meio, sem animacao e sem texto dentro da imagem.
- Para RH/Abonos, o conceito aprovado e uma pilha feita por HTML/CSS a partir de uma unica imagem de prancheta. A prancheta de tras aparece pequena, cresce para o meio, cresce para frente e a primeira sai, sugerindo uma fila continua de abonos sendo processada.
- Para Solicitacoes/Horas Extras e listas de Solicitacoes enviadas, o conceito aprovado e um card de solicitacao com relogio e simbolo de hora extra. O card respira suavemente, o relogio gira e o simbolo pulsa via CSS.
- Para Meu Perfil, o conceito aprovado e um card de identidade estilo RG/CNH corporativo, com frente e verso separados e animacao de flip 3D via CSS. O verso deve manter o QR code, mas nao deve ter avatar/persona.
- O mesmo RG/CNH girando pode ser reaproveitado como loading de detalhe de colaborador, especialmente ao abrir colaborador em Minha Equipe, Ferias/Solicitacoes e cards de perfil.

Imagem usada em pagina nao encontrada:

- `assets/notfound-404.png` - ilustracao final da pagina 404
- `assets/notfound-404-chroma.png` - fonte com fundo verde para recorte

Frase aprovada para 404:

- "Nao encontramos essa rota no mapa de horas."

Imagem usada em acesso negado:

- `assets/access-denied.webp` - ilustracao final da tela de acesso negado
- `assets/access-denied.png` - versao PNG transparente da tela de acesso negado
- `assets/access-denied-chroma.png` - fonte com fundo verde para recorte

Conceito aprovado para acesso negado:

- Tela/portal corporativo com porta bloqueada, escudo com X, cracha e elementos de controle de permissao. Deve lembrar a composicao do 404, mas comunicar permissao negada sem parecer erro assustador. Sem texto dentro da imagem.
