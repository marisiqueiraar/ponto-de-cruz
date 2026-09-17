# Prompts para o Google Stitch — ponto & letra

A referência de layout é o **Canva**: a tela de trabalho no centro, um trilho de ícones à
esquerda que abre um painel, e uma barra no topo que muda conforme o que está selecionado.
Nada do lado direito.

Uma tela por mensagem. Cole o prompt e, **na mesma mensagem, o bloco de REGRAS da seção 1** —
o Stitch não lembra regra entre mensagens.

---

## 0. A estrutura, em uma página

Por que o modelo do Canva resolve o problema deste app: são cerca de 20 controles, mas eles
nunca se aplicam ao mesmo tempo. Os da palavra (fonte, altura, espessura, sensibilidade) não
existem para um símbolo; os da foto (girar, centralizar) não existem para uma palavra. Na
barra contextual, cada seleção mostra só os seus — cinco ou seis por vez, nunca vinte.

**Barra superior, muda conforme a seleção:**

| Selecionado | O que aparece na barra |
|---|---|
| nada | nome do papel ("A4 · retrato") |
| uma palavra | botão da fonte · altura · espessura do traço · sensibilidade · inclinação · ajustar ponto a ponto · duplicar · excluir |
| um símbolo | desenho · tamanho · inclinação · ajustar ponto a ponto · duplicar · excluir |
| a foto | girar · centralizar · centralizar em cima |

À direita da barra, sempre fixos: o aviso de escala e o botão de baixar o PDF. Os dois ficam
juntos de propósito — o aviso é sobre o que vai acontecer quando o botão for apertado.

**Trilho de ícones à esquerda (72px), abre um painel de 300px:**

papel · foto · texto · símbolos · linha · molde

**Painel "molde"** guarda o que vale para o trabalho inteiro, não para a peça selecionada:
espaçamento entre furos, a contagem de pontos e furos, e o botão Recalcular. No código, o
espaçamento é lido uma vez e aplicado a todas as peças e ao PDF — se ele aparecesse na barra
contextual, a interface estaria mentindo que é ajuste daquela palavra.

**Centro:** o papel sobre fundo #DCE9F6, com réguas em centímetros. **Rodapé:** zoom à
direita, "salvo neste navegador" à esquerda.

---

## 1. REGRAS — repetir ao fim de todo prompt

```
REGRAS DESTA TELA

Layout de editor no estilo Canva: trilho estreito de ícones à esquerda, um painel ao lado
dele, a tela de trabalho centralizada ocupando o resto, barra de ferramentas no topo, zoom no
rodapé. Nunca coloque painel do lado direito. Nunca desenhe duas barras superiores nem duas
colunas de navegação.

Não copie cores, logo, ícones nem tipografia do Canva. Só a arrumação dos espaços.

Cores, e só estas: fundo #EDF4FB · texto #384959 · texto secundário #6A89A7 · bordas #C9DCEF ·
fundo da mesa de trabalho #DCE9F6 · destaque e estado ativo #FFE566 com borda #B3B347 ·
alerta #BE5103. Sem verde, sem âmbar, sem gradiente.

Tipografia: títulos, botões e rótulos numa mono pixelada, caixa baixa, 13 a 16px. Texto
corrido em sans-serif do sistema, 14 ou 15px. No máximo três tamanhos de texto na tela
inteira. Nada abaixo de 12px.

Não desenhe: avatar, perfil, login, conta, ícone ou palavra ligada a nuvem, selo, badge,
etiqueta colorida, barra de progresso de etapas, botão "Avançar", botão de teste ou
simulação, código de linha DMC, número de agulha, gramatura de papel, tipo de fio.

Não invente campo, número, unidade ou texto que não esteja escrito neste prompt. Faltando um
dado, deixe vazio em vez de preencher.

Não repita a mesma informação em dois lugares da tela.

Português do Brasil em tudo.
```

---

## 2. Desktop (modo Web)

### D1 — Editor, com uma palavra selecionada

```
Editor de design para desktop, arrumado como o Canva.

TRILHO À ESQUERDA, 72px, fundo branco: seis ícones empilhados, cada um com um rótulo de 11px
embaixo em mono pixelada caixa baixa — papel, foto, texto, símbolos, linha, molde. O terceiro,
"texto", está ativo: fundo #FFE566 e cantos arredondados.

PAINEL, 300px, colado no trilho, fundo branco: título "texto". Um botão largo de contorno
escrito "nova palavra" e, abaixo, uma lista vertical de cartões de fonte. Cada cartão mostra a
palavra "amor" escrita grande naquela fonte, com o nome da fonte pequeno embaixo. Mostre cinco
cartões; o segundo está selecionado, com borda escura e um traço #FFE566 na lateral esquerda.

BARRA SUPERIOR, 56px, atravessando só a área à direita do painel, fundo branco: à esquerda,
em sequência e separados por divisórias finas, os controles da palavra selecionada — um botão
mostrando "amor" na fonte atual, depois "altura 18", "espessura 2", "sensibilidade 35%",
"inclinação 0°", e os ícones de ajustar ponto a ponto, duplicar e excluir. À direita da mesma
barra, a frase "cabe em A4 · tamanho real" e o botão sólido #FFE566 "baixar molde pdf".

CENTRO: mesa de fundo #DCE9F6 com uma folha de papel branca em pé, centralizada, sombra suave.
Réguas em centímetros nas bordas de cima e da esquerda da mesa. Dentro da folha, um retângulo
tracejado de foto e, sobre ele, a palavra "amor" desenhada como grade de quadradinhos
azul-escuros, com alças de seleção nos cantos.

RODAPÉ, 40px: à esquerda "salvo neste navegador"; à direita um controle de zoom com "100%".
```

### D2 — A mesma tela com a foto selecionada e o painel do papel aberto

```
Mesmo editor de design para desktop no estilo Canva da tela anterior, com duas diferenças.

No TRILHO de 72px, o ícone ativo agora é o primeiro, "papel", com fundo #FFE566.

O PAINEL de 300px mostra o conteúdo de "papel": o campo Tamanho, como lista fechada com o
valor "A4 — 21 × 29,7 cm"; e Orientação, como dois botões lado a lado, "retrato" selecionado
em azul-escuro e "paisagem" de contorno. Abaixo deles, dois campos numéricos desativados,
esmaecidos, rotulados "largura em mm" e "altura em mm", com a nota "só para tamanho
personalizado".

Na BARRA SUPERIOR de 56px, como a foto é o objeto selecionado, aparecem só três botões à
esquerda: "girar foto", "centralizar foto", "centralizar em cima". À direita, sem mudança: a
frase "cabe em A4 · tamanho real" e o botão sólido #FFE566 "baixar molde pdf".

No CENTRO, a mesa #DCE9F6 com a folha branca, réguas em centímetros, e o retângulo da foto
agora selecionado — borda contínua azul e alças nos quatro cantos — com a palavra "amor" em
quadradinhos por cima, sem seleção.

RODAPÉ de 40px igual: "salvo neste navegador" à esquerda, zoom "100%" à direita.
```

### D3 — Painel "molde", com o aviso de que não cabe

```
Mesmo editor de design para desktop no estilo Canva, agora mostrando o estado de erro de
escala.

TRILHO de 72px com o sexto ícone ativo, "molde", fundo #FFE566.

PAINEL de 300px, título "molde", com três blocos separados por linha fina:
— "espaçamento entre furos", um controle deslizante com o valor "2,5 mm" e, abaixo, a nota
"vale para o molde inteiro".
— duas linhas de número, rótulo à esquerda e valor à direita em mono pixelada: "pontos 612" e
"furos 1.284".
— um botão de contorno escrito "recalcular" e, embaixo, a nota "refaz as peças a partir dos
controles e descarta os ajustes ponto a ponto".

BARRA SUPERIOR de 56px: à esquerda, só o texto "A4 · retrato", porque nada está selecionado. À
direita, no lugar da frase verde-azulada normal, uma faixa de alerta #BE5103 com texto branco:
"não cabe em A4 — o PDF sairia a 78%". Ao lado dela, o botão "baixar molde pdf", agora
esmaecido e com aparência de desativado.

CENTRO: mesa #DCE9F6, folha branca em pé com réguas em centímetros, e dentro dela a palavra
"amor" em quadradinhos transbordando visivelmente a área da folha, com um contorno tracejado
#BE5103 marcando o quanto passou.

RODAPÉ de 40px: "salvo neste navegador" à esquerda, zoom "100%" à direita.
```

### D4 — Ajuste ponto a ponto

```
Mesmo editor de design para desktop no estilo Canva, em modo de edição detalhada.

O TRILHO de 72px e o PAINEL de 300px continuam onde estavam, porém esmaecidos e sem destaque,
para mostrar que estão inativos.

A BARRA SUPERIOR de 56px fica inteira em #FFE566: à esquerda, em mono pixelada caixa baixa,
"ajustando ponto a ponto"; em seguida, três botões de ferramenta, o primeiro selecionado —
acender, apagar, mover a vista; depois os botões desfazer e refazer. À direita da barra, um
único botão de contorno escuro: "terminar ajuste".

O CENTRO ganha o resto da tela e mostra a grade bem ampliada sobre a mesa #DCE9F6:
quadradinhos grandes separados por linhas finas claras, parte deles preenchidos em azul-escuro
formando a palavra "amor", e uma foto muito apagada atrás. Sem réguas neste modo.

RODAPÉ de 40px: à esquerda, o texto "47 quadradinhos alterados à mão"; à direita, o controle
de zoom mostrando "400%".
```

---

## 3. Mobile (modo Mobile)

No celular o Canva inverte: a tela de trabalho ocupa quase tudo e as ferramentas viram uma
fileira rolável no rodapé, que muda conforme a seleção. É o mesmo princípio da barra contextual
do desktop.

### M1 — Editor, com uma palavra selecionada

```
Tela de celular de um editor de design, arrumada como o Canva no celular.

Barra de topo fina, 48px, fundo branco: à esquerda a marca "ponto & letra" em mono pixelada
caixa baixa com um traço #FFE566 embaixo; à direita um ícone de baixar.

Abaixo dela, ocupando cerca de 60% da altura da tela, a mesa de fundo #DCE9F6 com uma folha de
papel branca em pé, centralizada, sombra suave. Dentro da folha, um retângulo tracejado de foto
e, por cima, a palavra "amor" desenhada como grade de quadradinhos azul-escuros, selecionada,
com alças nos quatro cantos.

Logo abaixo da mesa, uma linha de texto centralizada, pequena: "cabe em A4 · tamanho real".

No rodapé, fixa, uma fileira horizontal rolável de botões — são os controles da palavra
selecionada, cada um como ícone com rótulo de 11px embaixo em mono pixelada caixa baixa:
fonte, altura, espessura, sensibilidade, inclinação, ajustar, duplicar, excluir. O primeiro,
"fonte", está destacado com fundo #FFE566. O último botão da fileira está cortado pela borda da
tela, mostrando que a fileira rola.

Abaixo da fileira, uma barra final de 56px com um botão sólido #FFE566 de largura total:
"baixar molde pdf".

Sem menu lateral. Sem abas fixas. Sem barra de progresso.
```

### M2 — Painel da fonte, aberto de baixo

```
Mesma tela de celular do editor, agora com um painel aberto subindo do rodapé e cobrindo a
metade de baixo — o toque foi no botão "fonte" da fileira de ferramentas.

A metade de cima continua visível e não muda: mesa #DCE9F6, folha branca em pé, o retângulo
tracejado da foto e a palavra "amor" em quadradinhos.

O painel de baixo, fundo branco, cantos arredondados no topo, com uma barra curta cinza no meio
indicando arraste. Dentro dele, no topo, uma fileira rolável de botões arredondados pequenos, o
primeiro selecionado em azul-escuro: todas · caligrafia fina · cursiva encorpada · letra de mão
· gótica · pixel.

Abaixo, uma lista vertical de cartões brancos, um por fonte, altura de 80px. Cada cartão traz,
lado a lado: a palavra "amor" escrita grande naquela fonte, e a mesma palavra "amor" desenhada
como grade de quadradinhos. O nome da fonte em texto pequeno embaixo. Mostre quatro cartões; o
segundo está selecionado, com borda escura e traço #FFE566 na lateral esquerda.

Sem botão de confirmar: a escolha vale no toque. Sem campo de busca nesta tela.
```

### M3 — Ajuste ponto a ponto

```
Tela de celular de um editor de design em modo de edição detalhada.

No topo, uma faixa #FFE566 de 48px atravessando a tela: à esquerda, em mono pixelada caixa
baixa, "ajustando ponto a ponto"; à direita, um botão de contorno escuro escrito "terminar".

O resto da tela é a grade ampliada sobre fundo #DCE9F6: quadradinhos grandes, de no mínimo
44px, separados por linhas finas claras, parte deles preenchidos em azul-escuro formando o
começo da palavra "amor", com uma foto muito apagada atrás.

No rodapé, fixa, uma fileira de cinco botões redondos grandes, espaçados: acender (selecionado,
fundo #FFE566), apagar, mover a vista, desfazer, refazer.

Acima da fileira, centralizada, uma linha de texto pequena e discreta: "47 quadradinhos
alterados à mão".

Sem painel de controles. Sem fileira de ferramentas de peça. Sem barra de zoom.
```

### M4 — Baixar o molde

```
Painel subindo de baixo e cobrindo 90% de uma tela de celular, fundo #EDF4FB.

No topo, centralizada, a miniatura de uma folha A4 em pé, branca com sombra, mostrando por
dentro uma moldura tracejada e pontinhos pretos dispostos formando uma palavra.

Abaixo da miniatura, três linhas de informação, cada uma numa faixa branca de cantos
arredondados, rótulo pequeno em cinza à esquerda e valor em mono pixelada à direita:
"tamanho de impressão — 100%, tamanho real" · "cole a foto a 5,5 cm da borda esquerda e 6,0 cm
do topo" · "1.284 furos".

Abaixo delas, quatro passos numerados em texto corrido, sem ícone e sem cartão:
1. Imprima sem ajustar a escala.
2. Recorte pela moldura tracejada.
3. Prenda sobre a foto com fita crepe nos quatro cantos.
4. Fure com agulha grossa, apoiado em EVA ou cortiça.

No pé, fixos, dois botões de largura total empilhados: "baixar molde pdf", sólido #FFE566 com
texto azul-escuro; e "baixar prévia png", de contorno.

Sem barra de progresso. Sem botão de compartilhar.
```

---

## 4. Como avaliar o que voltar

Rejeite e peça de novo se aparecer:

- Painel do lado direito, ou duas barras superiores, ou duas colunas de navegação.
- Todos os controles visíveis ao mesmo tempo, em vez de só os do objeto selecionado.
- A mesa de trabalho ocupando menos da metade da largura (desktop) ou da altura (mobile).
- Espaçamento entre furos aparecendo como controle da peça, e não do molde.
- Qualquer dado que você não escreveu: gramatura, número de agulha, código DMC, horário
  inventado, contagem que não pediu.
- A mesma informação em dois lugares.
- Verde, âmbar ou cor fora da lista. Texto abaixo de 12px. Selo ou pílula colorida em volta de
  um número.

Correção sem recomeçar: responda com uma instrução só e direta — "remova o painel da direita e
alargue a mesa até a borda", ou "na barra de cima deixe só os controles da palavra, tire o
resto".

## 5. Telas para pedir depois

Uma de cada vez, sempre com o bloco de REGRAS:

- Painel "linha": as 8 paletas e as 4 amostras de cor de cada uma.
- Painel "símbolos": coração cheio, coração vazado, estrela, seta.
- Painel "foto" com imagem já carregada.
- Diálogo de confirmação do Recalcular.
- Barra superior com um símbolo selecionado, em vez de uma palavra.
