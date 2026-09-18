# Backlog

O que falta, em 18/09/2026. O que precisa de decisão sua está em
[REVISAR.md](REVISAR.md).

Ordem: quanto mais alto, mais muda a vida de quem borda.

---

## 1. ~~O canvas do arco pode passar do que um celular aceita~~ — feito

**É o único item desta lista que faria o app entregar um molde errado em
silêncio, que é o modo de falhar contra o qual o README inteiro foi escrito.**

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

Falta deste conjunto: **alinhar uma peça com a outra**, que serve para nome em
duas linhas. Não entrou porque pede escolher com qual, e aí é mais interface.

---

## 4. O que o ofício pede — parcialmente feito

Era o item 5 da lista. Saiu inteiro, menos uma flor:

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

- **Importar o mesmo arquivo duas vezes cria dois moldes.** Não há detecção de
  repetido nem opção de substituir. Pode ser o certo (é uma cópia mesmo), mas
  ninguém decidiu.
- **Não dá para duplicar um molde** dentro do app. Dá para salvar o arquivo e
  abrir de volta, que é o caminho torto para a mesma coisa.
- **Não dá para reordenar a estante.** A lista é por ordem de criação, com o
  mais novo no topo, e não por uso.
- **A legenda do PDF corta em três linhas.** Passando disso, ela escreve
  "+ N linhas". Precisaria de uns vinte tons distintos para acontecer, então é
  rede de segurança, não limitação sentida.
- **O nome do molde grava a cada tecla digitada.** Sem espera. É uma escrita
  pequena no índice, mas é uma escrita por tecla.
- **Arrastar num molde grande anda a 20 quadros por segundo.** Medido: 50 ms por
  movimento com 16 375 pontos em cinco peças, contra 17 ms num molde leve. Fui
  conferir se tinha sido eu — as contas de fio e do rodapé do PDF passaram a
  varrer as células a cada desenho — e **não foi**: a mesma medida na versão
  anterior à sessão dá 50,4 ms. O custo é o canvas desenhando dezesseis mil
  cruzinhas, e quem quiser atacar isso ataca o desenho, não as varreduras.
- **O espaçamento entre letras não avisa quando o navegador não o suporta.** O
  código confere `"letterSpacing" in ctx` e, se não houver, simplesmente não
  espaça — o controle fica na barra sem fazer nada. Em 2026 isso é raro, mas
  controle que não faz nada e não diz por quê é pior que controle ausente.
- **`testes/amostra.js` tem uma cópia dos desenhos dos símbolos.** Ele desenha
  sem abrir o app, então repete a tabela do `index.html`. Se os símbolos mudarem,
  a amostra fica mentindo sem ninguém notar.
- **`sw.js` continua na raiz.** Ele existe só para desregistrar o service
  worker que o app React deixou para trás. Em algum momento todo mundo que
  abriu aquela versão já passou por aqui e ele pode sair — mas não há como
  saber quando, e o custo de mantê-lo é um arquivo de 1,5 KB.

---

## 6. Ideias do app anterior que ainda valem

Vieram do `BACKLOG.md` da versão React (preservado em `6ce5a7a`) e sobrevivem à
mudança de aplicativo:

- **Modo de acompanhamento:** marcar no molde o que já foi bordado.
- **Sugestão de cor de fundo** que combine com as linhas escolhidas.
- **PWA instalável de verdade.** O `sw.js` de hoje é o oposto disso: ele existe
  para *desfazer* um service worker. Instalar de verdade exigiria um manifesto
  com ícones e um service worker novo — e pensar duas vezes, porque cache de
  service worker foi exatamente o que causou o problema que o `sw.js` conserta.
- **Importar e exportar OXS**, o formato de intercâmbio de gráficos de ponto
  cruz (MacStitch, WinStitch). O arquivo `.json` de hoje só o próprio app lê.

---

## 7. Sobre os testes

`testes/` cobre o repartir em folhas, a posição em cada folha, a emenda, a cor
por peça, a estante, a montagem da tela no Chromium, as setas e botões de
alinhar, o arco e o espaçamento das letras, e a conta de fio. São dez
conjuntos; `testes/roda.sh` roda todos. O que **não** existe:

- Nada que exercite o desenho no canvas — `textMatrix()`, que transforma o
  traço da fonte em quadradinhos, é o coração do app e não tem teste nenhum.
  Um teste dele não é óbvio: o resultado depende de como o navegador rasteriza
  a fonte, então comparar com uma matriz fixa quebraria sozinho.
- Nada que exercite arrastar com o dedo ou o mouse, a pinça de dois dedos, nem
  o modo ponto a ponto. `posicao.js` mexe na página, mas pelo teclado e pelos
  botões.
- Nada compara o PDF com uma imagem de referência. Os testes leem coordenadas
  de dentro do arquivo, o que pega o molde no lugar errado, mas não pega feio.
- Nada roda num navegador de celular de verdade. `tela.js` usa um Chromium de
  mesa numa janela de 360 px, que confere o layout mas não os limites do
  aparelho — e é exatamente um desses limites que o item 1 desta lista teme.
