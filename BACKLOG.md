# Backlog

O que falta, em 18/09/2026. O que precisa de decisão sua está em
[REVISAR.md](REVISAR.md).

Ordem: quanto mais alto, mais muda a vida de quem borda.

---

## 1. Avisar quando a memória do navegador encher

Gravar falha em silêncio quando o `localStorage` estoura — o `saveState()`
engole o erro. Com vários moldes e uma foto em cada, isso deixou de ser
hipótese: cabem oito ou dez moldes nos 5 MB típicos.

O código já sabe a hora exata em que falha. Falta decidir o que dizer e o que
oferecer: apagar um molde antigo, salvar o arquivo primeiro, largar a foto e
ficar com o desenho. Enquanto não existe, o trabalho pode parar de ser gravado
sem ninguém perceber — que é a pior forma de perder trabalho.

Detalhe: a foto é o único item capaz de estourar a cota, e ela já mora numa
chave separada justamente para nunca levar o arranjo junto na queda. O aviso
pode aproveitar isso e oferecer "manter o molde, largar a foto".

---

## 2. ~~Ajustes finos de posição~~ — feito

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

## 3. O que o ofício pede — parcialmente feito

Era o item 5 da lista. Saíram quatro dos cinco:

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

Falta:

- **Estimativa de consumo de linha**, em metros ou meadas, a partir da contagem
  de pontos que já existe. Não entrou porque a conta honesta depende de coisas
  que o app não sabe — quantos fios da meada, como o avesso é percorrido — e
  número inventado aqui faz alguém comprar linha errada. O caminho: calcular a
  frente pela geometria (duas diagonais de p√2 por ponto), assumir o avesso e a
  perda com margem declarada, mostrar em metros para 2 fios, e dizer na tela de
  que conta veio.
- **Uma flor.** Desenhei quatro e nenhuma lia como flor em 9 × 9 — saíram laço,
  balão, máscara e rosquinha. Símbolo que parece outra coisa é pior que símbolo
  nenhum, então não entrou. Uma flor legível pede grade maior (11 × 11 ou mais);
  nada no código obriga os 9 × 9, só os desenhos de hoje é que são assim.
- **Alinhar uma peça com a outra**, para nome em duas linhas.

---

## 4. Coisas que apareceram construindo as três levas

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
- **`sw.js` continua na raiz.** Ele existe só para desregistrar o service
  worker que o app React deixou para trás. Em algum momento todo mundo que
  abriu aquela versão já passou por aqui e ele pode sair — mas não há como
  saber quando, e o custo de mantê-lo é um arquivo de 1,5 KB.

---

## 5. Ideias do app anterior que ainda valem

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

## 6. Sobre os testes

`testes/` cobre o repartir em folhas, a posição em cada folha, a emenda, a cor
por peça, a estante, a montagem da tela no Chromium e as setas e botões de
alinhar. O que **não** existe:

- Nada que exercite o desenho no canvas — `textMatrix()`, que transforma o
  traço da fonte em quadradinhos, é o coração do app e não tem teste nenhum.
  Um teste dele não é óbvio: o resultado depende de como o navegador rasteriza
  a fonte, então comparar com uma matriz fixa quebraria sozinho.
- Nada que exercite arrastar com o dedo ou o mouse, a pinça de dois dedos, nem
  o modo ponto a ponto. `posicao.js` mexe na página, mas pelo teclado e pelos
  botões.
- Nada compara o PDF com uma imagem de referência. Os testes leem coordenadas
  de dentro do arquivo, o que pega o molde no lugar errado, mas não pega feio.
