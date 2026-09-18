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

## 2. Ajustes finos de posição

Era o item 4 da lista que combinamos. Nada disso existe hoje.

- **Setas do teclado** movem a peça selecionada, 0,5 mm; com Shift, 5 mm. Hoje
  o `keydown` só trata Ctrl+Z e Escape, e acertar 0,1 mm arrastando com o mouse
  é sorte.
- **Centralizar a peça na foto**, e alinhar uma peça com a outra. A foto tem
  três botões desses na barra (`girar`, `centralizar`, `centralizar em cima`);
  as peças não têm nenhum.
- **Aviso de peça fora do papel.** A peça não é presa às bordas como a foto é
  (`clampPhoto()` só cuida da foto), e o `cropArea()` corta na borda do papel —
  então **uma peça arrastada para fora é silenciosamente cortada do PDF**. O
  rodapé avisa em quantas folhas o molde sai, mas não avisa que metade de uma
  palavra ficou de fora.
  O CSS `.fit.over` (o aviso vermelho) está reservado para isso: ele ficou sem
  uso quando "não cabe em A4" deixou de ser erro, e não apaguei por causa deste
  item. Se este item morrer, o CSS morre junto.

---

## 3. O que o ofício pede

Era o item 5 da lista.

- **Texto em arco.** Nome curvado por cima da foto é o arranjo mais comum desse
  tipo de bordado, e hoje só existe inclinação de −45° a 45°. É o mais caro da
  lista: exige reamostrar a forma na grade seguindo uma curva, não só girar a
  caixa.
- **Espelhar a peça** e **espaçamento entre letras**. Dois controles baratos, e
  o espaçamento é o que resolve cursiva que se fecha em letra pequena.
- **Estimativa de consumo de linha** em metros ou meadas, a partir da contagem
  de pontos que já existe. Útil na hora de comprar. Atenção: é estimativa, e
  varia com a tensão do ponto — se entrar, entra dizendo isso.
- **Mais símbolos.** Hoje são quatro: coração cheio, coração vazado, estrela e
  seta.

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
por peça, a estante e a montagem da tela no Chromium. O que **não** existe:

- Nada que exercite o desenho no canvas — `textMatrix()`, que transforma o
  traço da fonte em quadradinhos, é o coração do app e não tem teste nenhum.
- Nada que exercite arrastar, a pinça de dois dedos, o modo ponto a ponto ou o
  desfazer. `tela.js` abre a página e confere que ela monta; não mexe nela.
- Nada compara o PDF com uma imagem de referência. Os testes leem coordenadas
  de dentro do arquivo, o que pega o molde no lugar errado, mas não pega feio.
