# Prompts para o Google Stitch — ponto & letra

Uma tela por mensagem. Cada prompt abaixo é curto de propósito: o Stitch desenha tudo que
lê, então descrever o produto inteiro numa mensagem só produz uma tela empilhada.

**Como usar:** cole um prompt da seção 2 ou 3, e **sempre cole o bloco de REGRAS (seção 1)
logo abaixo dele, na mesma mensagem**. As regras não são lembradas entre mensagens.

---

## 1. REGRAS — repetir ao fim de todo prompt

```
REGRAS DESTA TELA

Cores, e só estas: fundo #EDF4FB · texto #384959 · texto secundário #6A89A7 ·
bordas #C9DCEF · fundo do quadro de trabalho #DCE9F6 · destaque e estado ativo #FFE566
com borda #B3B347 · alerta #BE5103. Sem verde, sem âmbar, sem gradiente.

Tipografia: títulos e botões numa mono pixelada, caixa baixa, 13 a 16px. Texto corrido em
sans-serif do sistema, 14 ou 15px. No máximo três tamanhos de texto na tela inteira. Nada
abaixo de 12px.

Não desenhe: avatar, perfil, login, conta, ícone ou palavra ligada a nuvem, selo, badge,
etiqueta colorida, barra de progresso de etapas, botão "Avançar", botão de teste ou
simulação, código de linha DMC, número de agulha, gramatura de papel, tipo de fio, marca
d'água, ilustração decorativa.

Não invente campo, número, unidade ou texto que não esteja escrito neste prompt. Se faltar
um dado, deixe o espaço vazio em vez de preencher.

Não repita a mesma informação em dois lugares da tela.

Português do Brasil em tudo.
```

---

## 2. Desktop (modo Web)

### D1 — Editor principal

```
Tela de um editor de molde de bordado para desktop, largura total.

Uma única barra superior, de 56px: à esquerda a marca "ponto & letra" em mono pixelada com
um traço amarelo #FFE566 embaixo; no centro a frase "Área do molde: 12,4 × 9,1 cm. Cabe numa
folha A4 em tamanho real."; à direita o botão sólido amarelo "baixar molde pdf".

Abaixo da barra, só duas áreas:

1. O centro, ocupando no mínimo 65% da largura: um quadro de fundo #DCE9F6 com uma folha de
papel branca em pé no meio, sombra suave. Dentro da folha, um retângulo tracejado
representando uma foto e, sobre ele, a palavra "amor" desenhada como uma grade de
quadradinhos pequenos em azul-escuro. Réguas em centímetros nas bordas de cima e da
esquerda do quadro. No canto inferior direito do quadro, um controle de zoom discreto.

2. Um painel à direita de 320px, fundo branco, com exatamente estes campos, nesta ordem, um
por linha: Texto (campo de texto com "amor") · Fonte (um botão largo que mostra a palavra
"amor" desenhada na própria fonte) · Altura 18 pontos (controle deslizante) · Espessura do
traço 2 (deslizante) · Sensibilidade 35% (deslizante) · Inclinação 0° (deslizante) ·
Espaçamento entre furos 2,5 mm (deslizante).

Rodapé de 32px: à esquerda "salvo neste navegador às 14:32"; à direita os links discretos
"prévia png" e "recalcular".

Nada mais na tela. Sem segunda barra, sem painel à esquerda, sem lista de etapas.
```

### D2 — Editor com o painel do papel e da foto aberto

```
Mesma tela do editor de molde de bordado para desktop, agora com o painel lateral mostrando
os ajustes do papel e da foto em vez dos ajustes do texto.

O painel de 320px fica à direita, fundo branco, dividido em duas seções com título em mono
pixelada caixa baixa:

"papel" — Tamanho (lista, valor "A4 — 21 × 29,7 cm") · Orientação (dois botões lado a lado,
"retrato" selecionado e "paisagem").

"foto" — Tamanho impresso (lista, valor "10 × 15 cm") · Orientação (dois botões, "retrato"
selecionado) · Imagem (área de soltar arquivo, texto "arraste uma imagem ou toque para
escolher — serve só para você visualizar") · e três botões iguais em linha: "girar foto",
"centralizar foto", "centralizar em cima".

O centro e a barra superior ficam como na tela anterior: quadro #DCE9F6, folha branca em pé,
réguas em centímetros, barra de 56px com a marca, a linha da área do molde e o botão amarelo
"baixar molde pdf".

Nada mais. Sem painel à esquerda, sem lista de etapas, sem rodapé de estatísticas.
```

### D3 — Aviso de escala, os três estados

```
Três variações da mesma faixa horizontal, empilhadas uma sobre a outra para comparação, cada
uma com 900px de largura e 56px de altura, sobre fundo #EDF4FB.

Primeira, estado normal: fundo branco, borda #C9DCEF, um ponto azul #88BDF2 à esquerda e o
texto "Área do molde: 12,4 × 9,1 cm. Cabe numa folha A4 em tamanho real."

Segunda, estado de atenção: fundo branco, borda #FFE566 mais grossa à esquerda, o texto
"Área do molde: 18,9 × 26,4 cm. Cabe numa A4, com 4 mm de folga."

Terceira, estado de erro: fundo #BE5103, texto branco, ocupando a faixa inteira: "Área do
molde: 24,0 × 18,5 cm — não cabe numa A4 em tamanho real: o PDF sairia reduzido a 78% e os
furos não vão bater." À direita da faixa, um botão de contorno branco escrito "aproximar as
peças".

Só as três faixas na tela, uma embaixo da outra, com 24px entre elas. Sem título, sem
legenda, sem ícone além do ponto da primeira.
```

### D4 — Confirmação do Recalcular

```
Um diálogo modal centrado, 420px de largura, sobre um véu azul-escuro translúcido.

Fundo branco, cantos de 8px. Título em mono pixelada caixa baixa: "recalcular as peças?".

Corpo em duas linhas de texto: "As peças serão refeitas a partir dos controles." e, na linha
seguinte, em destaque: "Você acendeu ou apagou 47 quadradinhos à mão. Eles serão perdidos."

Rodapé do diálogo com dois botões do mesmo tamanho: "cancelar", de contorno; e "recalcular",
sólido na cor #BE5103 com texto branco.

Abaixo dos dois botões, alinhado à esquerda, um link discreto: "recalcular só a peça
selecionada".

Nada mais no diálogo. Sem ícone de alerta, sem caixa de marcar, sem terceira linha de texto.
```

---

## 3. Mobile (modo Mobile)

### M1 — Editor principal

```
Tela de celular de um editor de molde de bordado.

Metade de cima, fixa: um quadro de fundo #DCE9F6 com uma folha de papel branca em pé, sombra
suave, um retângulo tracejado de foto dentro dela e a palavra "amor" por cima, desenhada como
uma grade de quadradinhos pequenos em azul-escuro #384959.

Logo abaixo do quadro, uma linha fina de texto centralizada: "Área do molde: 12,4 × 9,1 cm.
Cabe numa folha A4 em tamanho real."

Metade de baixo, painel branco de cantos arredondados no topo, com uma barra curta cinza no
meio indicando que sobe e desce por arraste. Dentro dele, exatamente estes cinco controles,
um por linha, com rótulo pequeno acima: Texto (campo com "amor") · Fonte (botão largo
mostrando a palavra "amor" desenhada na própria fonte) · Altura 18 pontos (deslizante) ·
Inclinação 0° (deslizante) · Espaçamento entre furos 2,5 mm (deslizante).

No pé da tela, fixas, quatro abas em mono pixelada caixa baixa, a segunda selecionada com um
traço amarelo #FFE566 embaixo: papel · foto · peças · linha.

Sem barra superior. Sem botão de exportar nesta tela. Sem números de contagem.
```

### M2 — Escolher a fonte

```
Folha que sobe de baixo cobrindo 85% da tela de um celular, fundo #EDF4FB.

No topo, um campo de busca com o texto de exemplo "buscar fonte". Abaixo dele, uma fileira
rolável de botões arredondados pequenos, o primeiro selecionado em azul-escuro: todas ·
caligrafia fina · cursiva encorpada · letra de mão · serifada itálica · gótica · pixel.

Abaixo, uma lista vertical de cartões brancos, um por fonte, cada cartão com 88px de altura.
Dentro do cartão, lado a lado: à esquerda a palavra "amor" escrita grande naquela fonte; à
direita a mesma palavra "amor" desenhada como grade de quadradinhos, do jeito que ela vira
furos. Embaixo, em texto pequeno cinza, o nome da fonte.

Mostre seis cartões. O terceiro é o selecionado: borda azul-escura e um traço amarelo
#FFE566 na lateral esquerda.

No pé, fixo, um botão sólido azul-escuro de largura total: "usar esta fonte".

Sem título de cabeçalho. Sem contagem de resultados. Sem ícone nos cartões.
```

### M3 — Ajuste ponto a ponto

```
Tela de celular, modo de edição detalhada de uma grade de bordado.

No topo, uma faixa amarela #FFE566 de 48px atravessando a tela: à esquerda, em mono pixelada
caixa baixa, "ajustando ponto a ponto"; à direita, o botão de contorno escuro "terminar".

O resto da tela é a grade ampliada sobre fundo #DCE9F6: quadradinhos grandes, de no mínimo
44px, separados por linhas finas claras, parte deles preenchidos em azul-escuro #384959
formando o começo da palavra "amor", com uma foto muito apagada atrás.

Sobrepostos à grade, no canto inferior direito, três botões redondos empilhados na vertical,
o de cima selecionado: acender, apagar, mover a vista.

No canto inferior esquerdo, dois botões redondos lado a lado: desfazer e refazer.

Acima do rodapé, centralizada, uma linha de texto pequena e discreta: "o botão Recalcular
refaz as peças a partir dos controles e descarta estes ajustes".

Sem painel de controles. Sem abas no rodapé. Sem barra de zoom.
```

### M4 — Baixar o molde

```
Folha que sobe de baixo cobrindo 90% da tela de um celular, fundo #EDF4FB.

No topo, centralizada, a miniatura de uma folha A4 em pé, branca com sombra, mostrando por
dentro uma moldura tracejada e pontinhos pretos dispostos formando uma palavra.

Abaixo da miniatura, três linhas de informação, cada uma numa faixa branca de cantos
arredondados, com o rótulo pequeno em cinza e o valor em mono pixelada:
"tamanho de impressão — 100%, tamanho real" · "cole a foto a 5,5 cm da borda esquerda e 6,0
cm do topo" · "1.284 furos".

Abaixo delas, quatro passos numerados em texto corrido, sem ícone e sem cartão:
1. Imprima sem ajustar a escala.
2. Recorte pela moldura tracejada.
3. Prenda sobre a foto com fita crepe nos quatro cantos.
4. Fure com agulha grossa, apoiado em EVA ou cortiça.

No pé, fixos, dois botões de largura total empilhados: "baixar molde pdf", sólido amarelo
#FFE566 com texto azul-escuro; e "baixar prévia png", de contorno.

Sem barra de progresso. Sem botão de compartilhar.
```

---

## 4. Como avaliar o que voltar

Rejeite e peça de novo se a tela tiver qualquer um destes:

- Mais de uma barra de navegação, ou painel dos dois lados do canvas.
- O canvas ocupando menos da metade da largura (desktop) ou da altura (mobile).
- Qualquer dado que você não escreveu no prompt: gramatura, número de agulha, código DMC,
  horário inventado, contagem que não pediu.
- A mesma informação aparecendo duas vezes.
- Verde, âmbar ou qualquer cor fora da lista.
- Texto abaixo de 12px, ou mais de três tamanhos de texto.
- Selo, badge, etiqueta ou pílula colorida em volta de um número.

Para corrigir sem recomeçar, responda ao Stitch com uma instrução só, direta — por exemplo:
"remova a coluna da esquerda inteira e alargue o quadro central até ela", ou "tire todos os
selos e deixe os números em texto simples".

## 5. Se quiser mais telas depois

Peça uma de cada vez, sempre com o bloco de REGRAS junto:

- A lista de peças do desktop (palavras e símbolos já criados, com duplicar e excluir).
- A aba "linha" do mobile (as 8 paletas e as 4 amostras de cor de cada uma).
- O painel de instruções "do arquivo ao material".
- A escolha de símbolo (coração cheio, coração vazado, estrela, seta).
