# Ponto de Cruz

**ponto & letra** — molde de furos em tamanho real para bordar sobre foto.

Você define o papel de fundo, encaixa a foto no tamanho em que ela será impressa, escreve e
posiciona as peças bordadas por cima, e baixa um PDF com o molde de furos na escala exata do
material.

A aplicação é o arquivo `index.html`: HTML, CSS e JavaScript em um único arquivo, sem build e
sem backend. Ao lado dele há um único arquivo de dados, `catalogos.js`, com os catálogos de cor
das marcas de linha — dado puro, sem lógica nenhuma. A tela é um editor: trilho de ícones à esquerda que abre um painel, barra de cima
que muda conforme o que está selecionado, e o papel no centro sobre uma mesa com réguas em
centímetros. O `layout.html` na raiz é a maquete dessa arrumação, com os controles inertes —
serve para experimentar mudanças de layout sem tocar no desenho nem no PDF.

## O que ele faz

- **Papel**: A4, A5, A3, quadrado, 20×30, 15×20 ou medidas próprias, em retrato ou paisagem.
- **Foto**: tamanhos de revelação comuns (10×15, 9×13, 13×18, 15×21, quadrado, polaroid) ou
  medida própria, arrastável sobre o papel, com imagem opcional só para visualizar.
- **Peças bordadas**: quantas quiser, cada uma sendo uma palavra ou um símbolo — dez desenhos:
  coração cheio, coração vazado, estrela, seta, folha, coroa, lua, sol, infinito e casa. Arraste
  para posicionar, incline de -45° a 45°, redimensione com dois dedos, espelhe, e ajuste ponto a
  ponto no modo de edição. Duplicar copia a peça com as
  células como estão, então a cópia nasce com os ajustes manuais da original e segue a vida
  dela própria a partir dali.
- **Palavra em arco**: de -120° a 120°, que é o nome curvado por cima da foto. O arco dobra a
  **imagem** da palavra, fatia por fatia, em vez de escrever letra por letra sobre a curva —
  letra por letra é o jeito comum e rompe as ligaduras da cursiva, e ligadura é o que faz a
  palavra parecer escrita à mão. Há também **espaçamento entre letras**, contado em
  quadradinhos, que é o que resolve cursiva fechando em letra pequena.
- **Fontes**: 40 famílias do Google Fonts agrupadas por caráter — caligrafia fina, cursiva
  encorpada, letra de mão, serifada itálica, gótica, pixel e bloco. A escolha é por amostra,
  não por nome: cada linha mostra a sua palavra escrita naquela fonte e, ao lado, a mesma
  palavra já em quadradinhos, que é o que vira furo. Com busca e filtro por grupo. Os cartões
  pedem a fonte só quando chegam à vista, então abrir a lista não baixa as 40 famílias.
- **Linhas**: oito paletas de quatro cores cada, mais os catálogos das marcas — 391 cores da
  Anchor e 455 da DMC. **Cada peça tem a sua linha**: escolher uma cor pinta a peça selecionada,
  e a lista de peças mostra um ponto da cor de cada uma, para ver o arranjo inteiro de uma vez.
  Sem isso o catálogo só servia para uma cor de cada vez, e é comparando duas linhas lado a lado
  no arranjo que a escolha se decide. Na aba **catálogo** você toca nas cores que tem na caixa;
  elas viram a paleta **minhas linhas**, e marcar uma já pinta a peça com ela, que é o jeito de
  ver a cor real antes de gastar meada. A busca aceita código ou nome. O que você marcou fica
  guardado no navegador à parte do molde, e não some quando você recomeça um desenho.
- **Posicionar com precisão**: as setas do teclado movem a peça selecionada de meio milímetro, ou
  de cinco com Shift — com a foto selecionada, movem a foto. Na aba peças, três botões alinham a
  peça: centralizar na foto, centralizar no papel, alinhar pela base da foto. Eles movem a caixa
  já girada, porque alinhar uma palavra inclinada pelo canto de cima dela a deixaria torta.
- **Contagem**: pontos e furos, com o tamanho da peça selecionada em centímetros. O rodapé diz o
  tempo todo se o molde sai numa folha ou em quantas, e avisa em vermelho quando alguma peça
  passou da borda do papel — o molde é recortado no papel, então o que está fora não sai no PDF.
- **PDF do molde**: em tamanho real, recortado na área do bordado, com a moldura de recorte, o
  retângulo da foto para alinhar, as bordas do papel quando encostam na área, e no cabeçalho a
  distância exata para colar a foto no papel e uma **régua de aferição de 50 mm** — se ela não
  medir 50 mm na régua de verdade, a impressora reduziu a página e nenhum furo vai bater. No
  rodapé de cada folha vai a legenda das linhas usadas, com o código da marca — cor de tela não
  é código de meada, e sem a legenda o molde impresso não diz o que comprar de novo.
- **Molde em várias folhas**: o que não cabe numa A4 é repartido, nunca reduzido. Molde reduzido
  é molde errado, e o erro só aparece com a agulha na mão. Cada folha traz o seu número, um
  mapinha de onde ela fica no conjunto e, nas margens, qual folha continua de cada lado. As
  vizinhas repetem pelo menos 10 mm do desenho: é sobrepondo essa faixa até os furos coincidirem
  que se emenda, porque encostar folha com folha exige uma precisão de tesoura que ninguém tem.
  O app escolhe entre folha em pé e deitada pela que gastar menos papel.
- **PNG** da prévia, para conferir o arranjo.
- **Zoom e deslocamento**: o papel cresce dentro da mesa, que rola. Botões no canto, Ctrl (ou ⌘)
  com a roda do mouse aproximando no ponto sob o cursor, e uma mãozinha que troca o arraste de
  "posicionar a peça" para "mover a vista" — no toque, com ela ligada, a pinça muda o zoom. A
  porcentagem é relativa ao encaixe do papel na tela: **100% é o papel inteiro visível**, não
  tamanho físico. Tamanho real é promessa do PDF, que a tela não tem como garantir.
- **Modo ponto a ponto**: enquanto se acende e apaga quadradinho, a barra fica amarela e os
  campos da peça saem dela — no celular eles roubam a altura de que a grade precisa, e em
  qualquer tela mexer na altura ou na sensibilidade refaz a peça e joga fora justamente o que
  se está ajustando à mão. No celular o painel e as abas recolhem: a grade passa de 164 × 232
  para 328 × 464 px.
- **Desfazer e refazer**: cada passo guarda o arranjo inteiro, células incluídas, então voltar
  atrás devolve também o que foi aceso ou apagado à mão. Botões na barra de cima, Ctrl+Z e
  Ctrl+Shift+Z. Um arraste de controle deslizante vira um passo só, não dezenas.
- **Vários moldes**: a aba **moldes** guarda quantos você quiser, cada um com nome e data, e
  troca entre eles. Antes havia um molde só: começar um desenho novo apagava o anterior sem
  volta. O molde que já estava gravado entra na lista como está, sem nada ser copiado.
- **Arquivo do molde**: salvar e abrir um `.json` com tudo dentro — papel, foto, peças, linhas e
  os ajustes feitos ponto a ponto. É o único jeito de o trabalho ir para outro aparelho ou voltar
  depois de você limpar os dados do site; o navegador, sozinho, não leva nada para lugar nenhum.
- **Memória local**: papel, foto, peças, posições, inclinações, linha de cada peça e os ajustes
  feitos ponto a ponto ficam guardados no navegador e voltam ao reabrir. As células são gravadas como estão,
  e não recalculadas na volta — é isso que preserva o que você acendeu ou apagou à mão. Para
  refazer tudo a partir dos controles, o botão **Recalcular** — que pergunta antes quando há
  ajustes manuais a perder, dizendo quantos são, e oferece refazer só a peça selecionada. O
  rodapé mostra a conta o tempo todo.

## Rodando

Abra `index.html` no navegador. Não há passo de build. Para servir localmente:

```bash
python3 -m http.server
```

Os testes rodam em `node`, sem instalar nada: `testes/roda.sh`. O que eles
cobrem, e o que não cobrem, está em [`testes/LEIAME.md`](testes/LEIAME.md).

## O que está em aberto

[`REVISAR.md`](REVISAR.md) — o que precisa de decisão sua.
[`BACKLOG.md`](BACKLOG.md) — o que falta construir.

## Dependências externas

Nenhuma. Tudo que o app precisa está no repositório, e ele funciona sem rede:

- **As 40 fontes** ficam em `fonts/`, uma por família, no subconjunto latino e no peso que o
  app usa (0,94 MB somadas). O navegador só baixa a fonte que for realmente usada. Isso não é
  só conforto offline: a grade é amostrada a partir do traço da fonte, então uma fonte que não
  chega faz o canvas desenhar numa cursiva genérica e o molde sair errado **sem avisar**.
  Créditos e licenças em [`fonts/LICENCAS.txt`](fonts/LICENCAS.txt) — 37 sob SIL Open Font
  License 1.1 e 3 sob Apache 2.0.
- **jsPDF 2.5.1** está em `vendor/jspdf.umd.min.js` (MIT, cabeçalho de licença no próprio
  arquivo). Antes vinha do cdnjs, o que deixava a entrega final do app — o molde em PDF —
  dependente de internet.
- **Os catálogos de cor** estão em `catalogos.js`, no repositório. As 391 cores da Anchor foram
  amostradas da cartela de cores da própria marca: cada uma é a mediana dos pixels do miolo da
  amostra impressa, e o código é o da cartela sem os zeros à esquerda (`00268` vira `268`). A
  cartela traz `00268` duas vezes, na mesma cor, e aqui ela entra uma vez só. A Anchor não dá
  nome às cores, só número. As 455 da DMC vêm da tabela pública de
  [nathantspencer/DMC-ColorCodes](https://github.com/nathantspencer/DMC-ColorCodes), que não é
  da DMC: são mais aproximadas que as da Anchor. O rótulo repetido `White` saiu de lá, porque é
  a mesma cor do `Blanc`. Mandando a cartela da DMC em PDF, essas cores podem ser refeitas do
  mesmo jeito que as da Anchor. Em qualquer caso é referência de tela: monitor, luz e lote
  mudam a cor do fio na mão.
- **Os três ícones** dos botões de ação são SVG embutidos no `index.html`, vindos do projeto
  [material-design-icons](https://github.com/google/material-design-icons) do Google, sob
  Apache License 2.0. São três caminhos de ~300 bytes: não há fonte de ícones nem biblioteca.

## Deploy

Site estático: publique a raiz do repositório em qualquer host. Na Vercel, o `vercel.json` da
raiz declara que não há build — sem ele, um projeto criado com o preset Vite tenta rodar
`vite build` e falha com `vite: command not found`.

## Onde ficam os dados

Tudo no `localStorage` do próprio navegador. `ponto-e-letra/moldes/v1` é o índice da estante:
diz quais moldes existem, qual está aberto, e o **nome das chaves** de cada um — nunca o
conteúdo, porque gravar acontece a cada gesto e reescrever a estante inteira porque uma peça
andou um milímetro seria desperdício. Cada molde tem as suas duas chaves, `…/molde/v1/<id>` para
o arranjo e `…/molde/foto/v1/<id>` para a imagem. O molde gravado antes de existir estante
continua nas chaves sem `<id>`, e entra no índice apontando para elas: numa cota quase cheia,
copiar a foto para migrar é a diferença entre migrar e perdê-la. `ponto-e-letra/linhas/v1` guarda
as linhas que você marcou como suas. Não há servidor nem conta — o trabalho não acompanha você
para outro aparelho ou outro navegador, e some se você limpar os dados do site, a menos que você
salve o arquivo do molde. A foto é guardada reduzida (1600 px no maior lado, JPEG), porque é só guia de
posicionamento: na tela e no PDF ela aparece a 22% de opacidade. As chaves são separadas de
propósito. A foto é o único item capaz de estourar a cota do navegador, e assim ela nunca leva o
arranjo junto na queda. As linhas ficam à parte porque são inventário, não desenho: a caixa de
linhas continua a mesma quando você começa um molde do zero, e o molde não carrega a caixa
junto.

## `sw.js`

Este domínio já hospedou o app React, que usava `vite-plugin-pwa` e registrava um
service worker guardando o HTML em cache. Service worker é por origem e sobrevive a
deploy: navegadores que abriram aquela versão continuavam vendo ela, por mais correto
que estivesse o deploy. O `sw.js` na raiz existe só para desfazer isso — ocupa o mesmo
caminho do antigo, apaga os caches, se desregistra e recarrega a aba. Não é um service
worker de verdade e o app não depende dele.

## Histórico

Este repositório já teve duas aplicações diferentes antes desta, ambas preservadas no histórico
do git:

- `6ce5a7a` — app React + Vite + TypeScript (padrão a partir de foto, matching DMC, export PDF).
- `2b7f050` — versão anterior do artefato: gerador de gráfico só de letras cursivas.
- `98af2b9` — essa mesma versão com três levas de melhorias por cima (impressão em escala real,
  ajustes manuais com desfazer, fontes hospedadas localmente, acesso por teclado, memória local
  e busca no catálogo do Google Fonts). Chegou a ser o conteúdo da `master` e continua inteira
  aqui e nas branches `claude/affectionate-pasteur-xia1o8`, `claude/segunda-leva` e
  `claude/terceira-leva`. É de lá que saem `app.js`, `style.css`, `catalog.js` e as sete fontes
  em `fonts/`, removidos da árvore nesta versão por pertencerem àquele outro aplicativo.
