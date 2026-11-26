# Backlog

O que falta, em 18/09/2026. O que precisa de decisão sua está em
[REVISAR.md](REVISAR.md).

**Em 26/11/2026, todos os itens abertos foram feitos ou decididos** (riscados,
com a data). As escolhas que fiz sozinho estão no [REVISAR.md](REVISAR.md),
item 7. Ficaram abertos só dois limites dos testes, explicados na seção 7:
comparar o PDF por imagem e rodar num celular de verdade.

Ordem: quanto mais alto, mais muda a vida de quem borda.

---

## 1. ~~O canvas do arco pode passar do que um celular aceita~~ — feito

Era o único item da lista que faria o app entregar um molde errado em
silêncio, que é o modo de falhar contra o qual o README inteiro foi escrito —
por isso subiu ao topo assim que apareceu.

O arco desenha a palavra num canvas intermediário e depois o dobra. Esse canvas
tem seis pixels por quadradinho, então a largura dele cresce com o tamanho da
palavra. Medido no Chromium, nos extremos que a interface permite (altura 60,
arco 120°):

| texto | grade | canvas |
|---|---|---|
| "amorosa" | 326 × 133 | ~1 956 px |
| "amorosa para sempre" | 443 × 148 | ~2 658 px |
| "amorosa para sempre e um dia" | 493 × 158 | ~2 958 px |
| frase de 46 caracteres | 763 × 243 | **~4 578 px, 25 MB** |

Passa de 4 096 px em uma dimensão a partir de umas 45 letras na altura máxima.
Alguns navegadores de celular recusam canvas acima disso, e o que sai de um
canvas recusado é vazio — ou seja, a peça sairia em branco sem nada avisar.
**Não consegui reproduzir num celular de verdade**: no Chromium de mesa os 25 MB
passam sem erro. É risco medido de um lado e não confirmado do outro.

**Consertado.** O tamanho do rascunho passou a ser calculado em quadradinhos
antes de o canvas existir, e acima de 4 000 px ele é desenhado com menos pixels
por quadradinho. A grade não muda: o pior caso dava 763 × 243 quadradinhos antes
do teto e dá 764 × 243 depois. `testes/teto.js` mede o degrau na fronteira do
teto (1,5%) contra a variação natural entre dois casos vizinhos (6,3%), que é
como se prova que o teto não deforma o molde.

Continua valendo a ressalva: não há celular de verdade nesta bancada. O teto
protege contra o limite conhecido, mas quem confirma é um aparelho.

Os números da tabela são da época em que a altura era a caixa de tinta da
palavra. Desde que ela passou a ser a altura da maiúscula da fonte, a mesma
altura 60 desenha letra maior: o pior caso dá 867 × 276 quadradinhos com o teto
e 867 × 276 sem ele — medido de novo no Chromium, com o teto desligado, e é esse
o número que `testes/teto.js` cobra.

---

## 2. ~~Avisar quando a memória do navegador encher~~ — feito

Gravar falha em silêncio quando o `localStorage` estoura — o `saveState()`
engole o erro. Com vários moldes e uma foto em cada, isso deixou de ser
hipótese: cabem oito ou dez moldes nos 5 MB típicos.

**Consertado.** O rodapé, que dizia "salvo neste navegador", passa a dizer
**"não coube na memória"** em vermelho, e a aba moldes escreve o caminho: salvar
o arquivo agora e apagar um molde da lista logo acima. Quando volta a caber, os
dois somem sozinhos.

Duas decisões dentro disso. O rodapé inteiro fica escondido no celular — e o
celular é onde a cota estoura primeiro —, então este aviso é a única exceção
à regra. E a foto, que é o único item capaz de estourar a cota sozinho, mora
numa chave separada de propósito: quando é ela que não cabe, o molde continua
gravado e o aviso diz "ao gravar a foto".

`testes/cota.js` faz o `localStorage` recusar a escrita, que é o que ele faz de
verdade quando a cota estoura, e confere os dois estados — inclusive numa
janela de 360 px, para provar que o aviso aparece onde o resto do rodapé não
aparece.

---

## 3. ~~Ajustes finos de posição~~ — feito

Era o item 4 da lista que combinamos, e saiu inteiro:

- **Setas do teclado** movem a peça selecionada de 0,5 mm, ou 5 mm com Shift.
  Com a foto selecionada, movem a foto. Uma rajada de setas vira um passo só no
  desfazer, e seta dentro de um campo continua andando no texto.
- **Três botões de alinhar** na aba peças: centralizar na foto, centralizar no
  papel, alinhar pela base da foto. Eles movem a caixa **já girada** — alinhar
  uma palavra inclinada pelo canto de cima dela a deixaria visivelmente torta.
- **Aviso de peça fora do papel**, em vermelho, colado no botão de baixar. Era
  o buraco mais feio: o molde é recortado no papel, então peça arrastada para
  fora sumia do PDF sem dizer nada. O CSS `.fit.over`, que tinha ficado sem uso,
  voltou a ter dono.

Faltava deste conjunto o **alinhar uma peça com a outra**, que entrou depois e
está no item 4.

---

## 4. ~~O que o ofício pede~~ — feito

Era o item 5 da lista, e saiu inteiro:

- ~~**Texto em arco**~~ — de −120° a 120°. Dobra a imagem da palavra fatia por
  fatia em vez de escrever letra por letra sobre a curva, para as ligaduras da
  cursiva acompanharem a curva junto com o resto do traço.
- ~~**Espelhar a peça**~~ — botão na barra. Inverte as células como elas estão,
  então ajuste feito à mão vira junto em vez de sumir, e a marca fica gravada
  para o próximo Recalcular espelhar também.
- ~~**Espaçamento entre letras**~~ — contado em quadradinhos, não em pixels nem
  em por cento, porque quadradinho é como quem borda conta.
- ~~**Mais símbolos**~~ — de quatro para dez: entraram folha, coroa, lua, sol,
  infinito e casa.
- ~~**Estimativa de consumo de linha**~~ — metros por cor, na aba molde e na
  legenda do PDF, com a conta escrita ao lado e com os números do espaçamento
  escolhido. Frente exata, avesso e perda declarados como suposição. Sem
  conversão para meadas, que depende da marca.

- ~~**Uma flor**~~ — entrou, em 11 × 13. Em 9 × 9 eu tinha desenhado quatro e
  nenhuma lia como flor; numa grade maior a cabeça redonda com miolo em cruz,
  haste e duas folhas lê. Desenhei mais oito candidatas e olhei todas em
  quadradinhos antes de escolher. É o único símbolo que não é 9 × 9, e nada no
  código obrigava isso — só os desenhos antigos.
- ~~**Alinhar uma peça com a outra**~~ — "alinhar com a peça de cima", na aba
  peças, que aparece quando há uma peça acima na lista. É o que resolve nome em
  duas linhas.

Nada falta deste item.

---

## 5. Coisas que apareceram no caminho

- ~~**Importar o mesmo arquivo duas vezes cria dois moldes.**~~ — feito em 26/11/2026: se um molde da estante tem exatamente o mesmo desenho, ele é que abre; para ter cópia, há o duplicar. Não há detecção de
  repetido nem opção de substituir. Pode ser o certo (é uma cópia mesmo), mas
  ninguém decidiu.
- ~~**Não dá para duplicar um molde**~~ — feito em 26/11/2026. dentro do app. Dá para salvar o arquivo e
  abrir de volta, que é o caminho torto para a mesma coisa.
- ~~**Não dá para reordenar a estante.**~~ — feito em 26/11/2026: agora é por ordem de uso, e a hora mostrada é a da última mudança de verdade. A lista é por ordem de criação, com o
  mais novo no topo, e não por uso.
- ~~**A legenda do PDF corta em três linhas.**~~ — já resolvido: a legenda que não cabe no rodapé vira folha à parte. Passando disso, ela escreve
  "+ N linhas". Precisaria de uns vinte tons distintos para acontecer, então é
  rede de segurança, não limitação sentida.
- ~~**O nome do molde grava a cada tecla digitada.**~~ — feito em 26/11/2026. Sem espera. É uma escrita
  pequena no índice, mas é uma escrita por tecla.
- ~~**Arrastar num molde grande anda a 20 quadros por segundo.**~~ — feito em 26/11/2026: o desenho de cada peça fica guardado numa imagem e só se refaz quando ela muda; com 13 mil pontos, desenhar caiu de 12 ms para 2 ms. Medido: 50 ms por
  movimento com 16 375 pontos em cinco peças, contra 17 ms num molde leve. Fui
  conferir se tinha sido eu — as contas de fio e do rodapé do PDF passaram a
  varrer as células a cada desenho — e **não foi**: a mesma medida na versão
  anterior à sessão dá 50,4 ms. O custo é o canvas desenhando dezesseis mil
  cruzinhas, e quem quiser atacar isso ataca o desenho, não as varreduras.
- ~~**O espaçamento entre letras não avisa quando o navegador não o suporta.**~~ — feito em 26/11/2026. O
  código confere `"letterSpacing" in ctx` e, se não houver, simplesmente não
  espaça — o controle fica na barra sem fazer nada. Em 2026 isso é raro, mas
  controle que não faz nada e não diz por quê é pior que controle ausente.
- ~~**A faixa de pegar a guia rouba o toque da peça que está debaixo dela.**~~ — feito em 26/11/2026. São
  9 px em volta do risco, com o risco no meio: pegar 1 px com o dedo seria
  sorte, mas a peça que cai exatamente sobre a guia precisa ser pega um pouco
  ao lado. Vale o mesmo para a mãozinha: arrastar a vista começando em cima de
  uma guia arrasta a guia.
- ~~**As guias ficam de fora do desfazer.**~~ — decidido em 26/11/2026: continuam de fora (o porquê está no [REVISAR.md](REVISAR.md), item 7). Elas são móvel de tela, como o zoom,
  e não entram na pilha — tirar uma guia sem querer se resolve puxando outra.
  Ficam gravadas com o molde, isso sim.
- ~~**`testes/amostra.js` tem uma cópia dos desenhos dos símbolos.**~~ — feito em 26/11/2026. Ele desenha
  sem abrir o app, então repete a tabela de `js/base.js`. Se os símbolos mudarem,
  a amostra fica mentindo sem ninguém notar.
- ~~**O laço move e apaga, e só.**~~ — feito em 26/11/2026: agora também duplica o bloco, o leva para o meio do papel, gira e espelha. Girar, espelhar, duplicar e os botões de
  alinhar continuam valendo para a peça selecionada, uma de cada vez — com um
  bloco laçado a barra esconde esses campos em vez de mexer em uma só das
  laçadas. É decisão de escopo, não limitação: está em
  [REVISAR.md](REVISAR.md), item 6.
- ~~**`sw.js` continua na raiz.**~~ — decidido em 26/11/2026: fica, e o app instalável usa outro arquivo (`app-sw.js`). Ele existe só para desregistrar o service
  worker que o app React deixou para trás. Em algum momento todo mundo que
  abriu aquela versão já passou por aqui e ele pode sair — mas não há como
  saber quando, e o custo de mantê-lo é um arquivo de 1,5 KB.

---

## 5½. Ponto reto — feito, com o que ficou

Feito em 25–26/11/2026 (branch `claude/ponto-reto`): a peça de ponto reto,
nove desenhos prontos, palavra em ponto atrás, imagem em contorno e em traço,
faixa e moldura, a troca de ponto peça por peça, o PDF com o risco cinza.
Ficou para depois:

- ~~**Mais desenhos prontos**~~ (feito em 26/11/2026): seigaiha (ondas em escama), asanoha (folha de
  cânhamo), espiral, ramo de folhinhas, estrela de 8 pontas.
- ~~**A ordem dos pontos numerada no PDF**~~ (feito em 26/11/2026), para quem quer seguir um caminho.
- ~~**Mexer à mão nos furos**~~ (feito em 26/11/2026) da peça de ponto reto: tocar num furo e noutro
  liga os dois; tocar num risco o apaga.
- ~~**Palavra em arco**~~ (feito em 26/11/2026) em ponto reto: o arco é do ponto cruz e ainda não vale
  na palavra de ponto reto.
- ~~**Espaço entre letras**~~ (feito em 26/11/2026) em ponto reto: idem.
- ~~**Moldura de ponto reto em volta de outra coisa que não a foto**~~ (feito em 26/11/2026) — de um
  nome, de uma imagem.

---

## 5¾. O que ficou de fora da moldura e do marca-página

Feitos em 25/11/2026 (moldura de blocos, faixa, papéis de marca-página). Ficou
para depois:

- ~~**Vários marca-páginas numa folha só.**~~ — feito em 26/11/2026. Hoje o PDF de um papel de 5 × 18 cm
  sai numa A4 com um marca-página só. Falta montar 3 ou 4 lado a lado na mesma
  folha, cada um com a sua moldura de recorte — o mesmo molde repetido ou
  moldes diferentes da estante.
- ~~**A moldura passa da borda num A4 com foto grande.**~~ — feito em 26/11/2026. Com foto de 13 × 18 cm
  e blocos de 2,5 cm, a moldura fica mais larga que a folha. O aviso vermelho
  aparece, mas o app não sugere a saída (margem menor, menos espaço entre
  blocos, ou blocos menores). Falta um "caber no papel" que acerte isso sozinho.
- ~~**Cor bloco por bloco.**~~ — feito em 26/11/2026. A paleta da moldura se distribui sozinha pelos
  blocos; não dá para escolher à mão as cores de um bloco só sem passar pelo
  ajuste ponto a ponto.
- ~~**Contorno do marca-página no PDF.**~~ — feito em 26/11/2026. A borda do papel sai como moldura de
  recorte reta; marca-página de canto arredondado e o furo da fita não estão
  desenhados.
- ~~**A aba ajuda não fala da moldura nem da faixa.**~~ — feito em 26/11/2026. A explicação está só na
  aba peças e no README.
- ~~**O ajuste ponto a ponto com a linha escolhida não tem teste.**~~ — feito em 26/11/2026. A mudança
  (acender com a linha selecionada na aba linha, e não sempre com a primeira)
  foi conferida lendo o código, não dirigindo o navegador: o teste precisaria
  converter um quadradinho da peça em pixel de tela.
- ~~**O nome do molde não acompanha as peças.**~~ — feito em 26/11/2026. O molde nasce com o nome da
  primeira palavra ("champ") e continua com ele no cabeçalho do PDF mesmo
  depois de a palavra ser apagada e só sobrar a moldura.

---

## 5⅞. O que a revisão deixou para depois

Da [REVISAO.md](REVISAO.md), o que não entrou na reforma de 25/11/2026:

- ~~**Ponto reto**~~ (feito em 25–26/11/2026) (H1–H6, B5, G2): a próxima fase — tipo de ponto por peça,
  padrões prontos de linha (colmeia, folha com nervuras, sashiko), palavra em
  ponto atrás seguindo o traço da fonte, imagem virando contorno, furos livres,
  moldura e marca-página em ponto reto. Plano na seção 5½.
- ~~**"Tenho pouco" e "acabou" na caixa de linhas**~~ — feito em 26/11/2026. (C5): hoje é só tenho / não
  tenho.
- ~~**Tamanho real na tela**~~ — feito em 26/11/2026. (D5): a tela não sabe quantos pixels tem um
  milímetro. Dá para calibrar encostando um cartão de crédito (85,6 mm) na tela
  e ajustando até bater; depois disso, um botão "1:1".
- ~~**Menos texto na tela**~~ — feito em 26/11/2026. (D6): a aba peças tem cinco parágrafos antes dos
  botões de alinhar; a aba ajuda tem 25 parágrafos corridos.
- ~~**Mais de uma foto por molde**~~ — feito em 26/11/2026, como peça de foto ("pôr mais uma foto", na aba foto). (E3): cartão com duas fotos, marca-página com
  foto embaixo e bordado em cima.
- ~~**No celular, a barra de cima ocupa um terço da tela**~~ — feito em 26/11/2026. (F1).
- ~~**Os botões de alinhar ficam no fim da aba peças**~~ — feito em 26/11/2026. (F2), depois dos textos.
- ~~**Ímã entre peças**~~ — feito em 26/11/2026. (F3): hoje a peça só encosta em guia ligada.
- ~~**A janela da imagem no Instax**~~ — feito em 26/11/2026, com a borda de cima num campo (6 mm de partida) para medir na foto de verdade.: a foto Instax entra pelo tamanho do cartão;
  o retângulo da imagem dentro dele (4,6 × 6,2 no mini) não é desenhado, porque
  a borda de cima não tem medida oficial.

---

## 6. Ideias do app anterior que ainda valem

Vieram do `BACKLOG.md` da versão React (preservado em `6ce5a7a`) e sobrevivem à
mudança de aplicativo:

- ~~**Modo de acompanhamento:**~~ — feito em 26/11/2026: o tique na mesa marca o que já foi bordado, e o rodapé conta.
- ~~**Sugestão de cor de fundo**~~ — feito em 26/11/2026: a cor do papel 300g, na aba papel, com os papéis que dão mais contraste para as linhas do molde.
- ~~**PWA instalável de verdade.**~~ — feito em 26/11/2026, com um service worker novo
  (`app-sw.js`) que vai sempre à rede primeiro e só usa o cache sem internet — o
  oposto do que causou o problema que o `sw.js` conserta.
- ~~**Importar e exportar OXS**~~ — feito em 26/11/2026, na aba moldes: o formato de
  intercâmbio de gráficos de ponto cruz (MacStitch, WinStitch, KG-Chart).

---

## 7. Sobre os testes

`testes/roda.sh` roda 43 conjuntos: o repartir em folhas, a posição em cada
folha, a emenda, a cor por peça, a estante, a tela no Chromium, alinhar, as
guias e o ímã, as letras, a conta de fio, o ajuste à mão, o laço, o ponto reto,
a impressão, as peças, a caixa de linhas, o acompanhamento, a cor do papel, o
app instalável, o OXS e as fotos. A lista de cada um está em
[testes/LEIAME.md](testes/LEIAME.md).

Em 26/11/2026 entraram os que faltavam:

- ~~**`textMatrix()` sem teste.**~~ — feito em 26/11/2026: `gestos.js` confere
  as promessas dos controles (altura da maiúscula, largura, espaço, arco,
  traço, grade sem borda vazia) em vez de uma grade fixa, que mudaria com o
  navegador.
- ~~**Quase nada que exercite arrastar.**~~ — feito em 26/11/2026: `gestos.js`
  arrasta a palavra com o mouse e faz a pinça com dois dedos de verdade (pelo
  protocolo do Chromium), e `acompanha.js` arrasta marcando pontos.

O que continua sem teste, e por quê:

- Nada compara o PDF com uma imagem de referência. Os testes leem coordenadas
  de dentro do arquivo, o que pega o molde no lugar errado, mas não pega feio.
  Uma comparação por imagem quebraria a cada versão do jsPDF ou do Chromium.
- Nada roda num navegador de celular de verdade. Os testes usam um Chromium de
  mesa com tela de celular e toque emulado, que confere o layout e os gestos,
  mas não os limites do aparelho. Isso só dá para ver no seu celular.
