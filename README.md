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
serve para experimentar mudanças de layout sem tocar no desenho nem no PDF. O `cartela.html`
é a outra página irmã: a ferramenta que lê as cores de uma cartela de linha e alimenta o
`catalogos.js`.

## O que ele faz

- **Papel**: A4, A5, A3, quadrado, 20×30, 15×20 ou medidas próprias, em retrato ou paisagem.
- **Foto**: tamanhos de revelação comuns (10×15, 9×13, 13×18, 15×21, quadrado, polaroid) ou
  medida própria, arrastável sobre o papel, com imagem opcional só para visualizar.
- **Peças bordadas**: quantas quiser, cada uma sendo uma palavra ou um símbolo — dez desenhos:
  coração cheio, coração vazado, estrela, seta, flor, folha, coroa, lua, sol, infinito e casa. Arraste
  para posicionar, incline de -45° a 45°, redimensione com dois dedos, espelhe, e ajuste ponto a
  ponto no modo de edição. Palavra nova nasce com o que está na barra de cima — fonte, altura,
  traço, sensibilidade, espaço, arco e inclinação —, para a segunda linha de um nome sair do
  tamanho da primeira. Duplicar copia a peça com as
  células como estão, então a cópia nasce com os ajustes manuais da original e segue a vida
  dela própria a partir dali.
- **Altura**: é a altura da **letra maiúscula**, contada em quadradinhos e medida na fonte, não
  na palavra escrita. Era a caixa de tinta da palavra — e essa caixa sobe com o "l" e desce com
  o "g", então "amor" e "alegria" na mesma altura saíam com letras de tamanhos bem diferentes,
  o que não tem como não parecer erro. Pela maiúscula, a mesma altura dá sempre a mesma letra, e
  o que ascende e desce passa disso. A aba **molde** mostra a altura em quadradinhos e em
  milímetros, ao lado do tamanho da peça inteira. Molde gravado antes da mudança tem o número
  convertido uma vez, na volta: o número muda, o tamanho da peça não.
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
- **Linhas**: o painel é o catálogo das marcas — 391 cores da Anchor e 455 da DMC — numa
  fileira de marcas e uma grade. Cada quadradinho traz o **código impresso dentro**, que é o
  que se pede na loja. **Cada peça tem a sua linha**: tocar num quadradinho diz que você tem
  aquela linha e já pinta a peça selecionada com ela, e a lista de peças mostra um ponto da cor
  de cada uma, para ver o arranjo inteiro de uma vez. É comparando duas linhas lado a lado no
  arranjo que a escolha se decide. Tocar de novo desmarca. A busca aceita código ou nome.

  As cores saem **por tom**, não por número: a família vem do matiz, em faixas de 15°, e
  dentro dela a escala vai do claro ao escuro, com os neutros no fim — é o que faz a grade
  ler como cartela e deixa os tons vizinhos lado a lado. O botão **por código** troca para a
  ordem numérica quando você já sabe o número que procura.

  O que você marcou vira a marca **minhas**, a primeira da fileira; ali tocar numa cor só a
  põe na peça, sem tirar da caixa — tirar se faz na marca de onde ela veio. Fica guardado no
  navegador à parte do molde, e não some quando você recomeça um desenho. Para a meada que não
  está em cartela nenhuma, o cadastro de **linha avulsa** no pé do painel: marca, código e cor.
  Ela nasce marcada, entra em **minhas** junto com as outras e aparece também na marca
  **avulsas** — onde desmarcar apaga de vez, porque ela só existe por você ter cadastrado.
- **Posicionar com precisão**: as setas do teclado movem a peça selecionada de meio milímetro, ou
  de cinco com Shift — com a foto selecionada, movem a foto. Na aba peças, três botões alinham a
  peça: centralizar na foto, centralizar no papel, alinhar pela base da foto — e, quando há uma
  peça acima na lista, alinhar com ela, que é o que resolve nome em duas linhas. Eles movem a
  caixa já girada, porque alinhar uma palavra inclinada pelo canto de cima dela a deixaria torta.
- **Fio por linha**: quantos metros cada cor pede, somados por cor e repetidos na legenda do
  PDF. A conta fica escrita ao lado, com os números do espaçamento escolhido, porque quem vai à
  loja com um número merece saber de onde ele veio: a **frente** é geometria (duas diagonais de
  p√2 por ponto cheio, exato), o **avesso** supõe que você borda um ponto de cada vez (dois
  lados, 2p) e os **15%** são começos, remates e sobras. O comprimento é do fio como ele passa
  no furo — bordando com 2 fios, são metros de fio de 2 fios. Não há conversão para meadas
  porque isso depende da marca, mas uma meada de 6 fios desfiada em pares rende três vezes o
  comprimento dela.
- **Contagem**: pontos e furos, com o tamanho da peça selecionada em centímetros. O rodapé diz o
  tempo todo se o molde sai numa folha ou em quantas, e avisa em vermelho quando alguma peça
  passou da borda do papel — o molde é recortado no papel, então o que está fora não sai no PDF.
- **PDF já gerados**: cada molde que você baixa fica guardado no navegador, com miniatura,
  data, tamanho e as medidas que usou. Dá para abrir, baixar de novo ou apagar um a um, na aba
  **moldes**. São os 20 mais recentes, e o 21º derruba o mais antigo. Eles moram no IndexedDB,
  não no `localStorage`: um molde grande em PDF tem megabytes, e a cota do `localStorage` já é
  disputada pela estante e pela foto. Em janela anônima, ou com os dados do site bloqueados, a
  lista diz isso em vez de sumir sem explicação.
- **PDF do molde**: em tamanho real, com a moldura de recorte, o
  retângulo da foto para alinhar, as bordas do papel quando encostam na área, e no cabeçalho a
  distância exata para colar a foto no papel e uma **régua de aferição de 50 mm** — se ela não
  medir 50 mm na régua de verdade, a impressora reduziu a página e nenhum furo vai bater. No
  rodapé de cada folha vai a legenda das linhas usadas, com o código da marca — cor de tela não
  é código de meada, e sem a legenda o molde impresso não diz o que comprar de novo.
- **A moldura de recorte é a folha inteira**: e não a caixa do desenho. Molde recortado rente
  ao bordado só se prende mirando o retângulo da foto; molde do tamanho do papel se prende
  borda com borda, que é a mira que a mão acerta. Numa A4 isso nunca cabe embaixo do
  cabeçalho, então o texto sai na página 1 e o papel inteiro na 2 — a folha impressa **é** o
  molde, sem tesoura. O que não se paga é folha de molde a mais: se houver furo perto demais
  da borda do papel, a folha inteira sairia repartida onde o desenho sozinho sai inteiro, e aí
  a moldura volta a cercar o bordado com 8 mm de folga. O aviso ao lado do botão de baixar diz
  quando isso acontece.
- **Folha de instrução**: o cabeçalho ocupa 46 mm de altura e o rodapé mais 8. Um molde que
  usa quase toda a folha cabe no papel e não cabe embaixo desse texto — e era repartido em duas
  folhas por causa das instruções, não do desenho. Quando isso acontece o texto é que muda de
  folha: a página 1 leva o cabeçalho, a régua e a legenda, e a página 2 leva o molde sozinho,
  inteiro e em tamanho real, centrado. São duas páginas e **uma folha de molde só** — imprimir
  e recortar é só a segunda. A conta guarda 5 mm de borda até o furo mais de fora, que é o que
  a impressora doméstica não alcança; a folga em volta do desenho pode encostar na borda, porque
  não tem furo nenhum ali.
- **Molde em várias folhas**: o que não cabe nem na folha nua é repartido, nunca reduzido. Molde reduzido
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
- **Laço**: arrastar no vazio desenha um retângulo, e o que couber **inteiro** dentro dele —
  peças e a foto — passa a andar junto, no arraste e nas setas. É "couber inteiro" e não
  "encostar" por causa da foto: ela costuma estar embaixo de tudo, e pelo encostar um laço em
  volta de duas palavras a levaria junto sem ninguém pedir. Shift (ou Ctrl) no clique soma ou
  tira uma peça do laço, na mesa ou nas fichas da aba peças. Quem segura o bloco é a foto: ela
  não sai do papel, e o bloco inteiro para com ela em vez de se desmanchar na borda. Com um
  bloco laçado, a barra de cima troca os campos da peça por quem está no laço e um botão que
  **apaga as peças laçadas de uma vez** — a moldura da foto não é peça e fica onde está, e um
  desfazer devolve o bloco inteiro.
- **Modo ponto a ponto**: um toque acende ou apaga um quadradinho, e arrastar sem soltar
  acende ou apaga a fileira inteira por onde o dedo (ou o botão) passa — quem decide se o
  traço acende ou apaga é o primeiro quadradinho dele, então voltar por cima do próprio
  traço não desfaz o que acabou de sair, e o traço inteiro é um passo só no desfazer.
  Enquanto se acende e apaga quadradinho, a barra fica amarela e os
  campos da peça saem dela — no celular eles roubam a altura de que a grade precisa, e em
  qualquer tela mudar a grade embaixo do dedo que a está acertando é o caminho mais curto para
  se perder. No celular o painel e as abas recolhem: a grade passa de 164 × 232 para 328 × 464 px.
- **O ajuste à mão sobrevive aos controles**: o que você acende ou apaga não mora nas células,
  mora numa lista de quadradinhos por cima do que a fonte desenhou. Mexer na altura, no traço, na
  sensibilidade ou na fonte refaz o desenho **com a lista junto**: quando a grade muda de tamanho,
  cada ajuste vai na mesma proporção e preenche o bloco que passou a ocupar, para um traço aceso à
  mão continuar traço em vez de virar pontilhado. Antes, cada correção durava até o toque seguinte
  num controle — trabalho perdido justamente no momento de acertar a palavra. Quem descarta é só o
  botão **Recalcular**, e ele pergunta antes.
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
  refazer tudo a partir dos controles **e limpar** os ajustes, o botão **Recalcular** — que
  pergunta antes quando há ajustes manuais a perder, dizendo quantos são, e oferece refazer só a
  peça selecionada. A lista de ajustes vai gravada junto com as células, então ela também volta
  ao reabrir e viaja no arquivo do molde. O
  rodapé mostra a conta o tempo todo.

## Rodando

Abra `index.html` no navegador. Não há passo de build. Para servir localmente:

```bash
python3 -m http.server
```

Os testes rodam em `node`, sem instalar nada: `testes/roda.sh`. O que eles
cobrem, e o que não cobrem, está em [`testes/LEIAME.md`](testes/LEIAME.md).

## `cartela.html`

A ferramenta que lê a cartela de papel de uma marca. Abra a página, arraste as imagens da
cartela, e ela devolve a cor de cada amostra — a mediana dos pixels do miolo, que é como as
cores da Anchor foram tiradas. Cada amostra é um botão: guardar grava a cor direto na caixa de
linhas do app, sem passar por catálogo nenhum, porque as duas páginas moram no mesmo endereço
e dividem o mesmo `localStorage`. A saída em texto continua ali para quem quiser colar em
`catalogos.js`.

Ela acha as amostras pela projeção dos pixels que não são fundo: primeiro as colunas, depois
as linhas dentro de cada coluna. O rótulo embaixo da amostra é fino e estreito demais para
passar pelo corte, e barra escura no topo de um recorte de tela não atrapalha. A prévia
contorna o que foi achado e mostra a contagem, então dá para conferir antes de guardar.

Os códigos você escreve na ordem de leitura — ou, para a cartela da Círculo, escolhe a tela
num atalho embutido, que é a única lista que vem pronta. Eles aparecem embaixo de cada
amostra, e só quando a quantidade bate com a contagem: lista torta pareia errado, e pareado
errado é pior do que sem código nenhum.

**Das amostras direto para a caixa de linhas.** Clicar numa amostra e em *guardar na caixa*
grava a cor em `ponto-e-letra/linhas/v1`, como linha avulsa, com a cor tirada do pixel em vez
de escolhida no olho. É o caminho curto para quem tem trinta meadas de uma marca e não quer
subir a cartela inteira. Como `localStorage` é por origem, isso só funciona com as duas
páginas no mesmo endereço; a página avisa quando não encontra a memória do app, e aí o
caminho é o `copiar tudo` e o `catalogos.js`.

Nada sai do navegador: as imagens são lidas em `canvas`, ali mesmo. A página não faz parte
do app e o app não depende dela.

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

- **Quando a memória do navegador enche**, o rodapé diz **não coube na memória** em vermelho e a
  aba moldes escreve o caminho: salve o arquivo e apague um molde. Antes disso, gravar falhava em
  silêncio e o trabalho simplesmente parava de ser guardado. O aviso aparece também no celular,
  onde o resto do rodapé fica escondido — é lá que a cota estoura primeiro.

## Onde ficam os dados

Tudo no `localStorage` do próprio navegador. `ponto-e-letra/moldes/v1` é o índice da estante:
diz quais moldes existem, qual está aberto, e o **nome das chaves** de cada um — nunca o
conteúdo, porque gravar acontece a cada gesto e reescrever a estante inteira porque uma peça
andou um milímetro seria desperdício. Cada molde tem as suas duas chaves, `…/molde/v1/<id>` para
o arranjo e `…/molde/foto/v1/<id>` para a imagem. O molde gravado antes de existir estante
continua nas chaves sem `<id>`, e entra no índice apontando para elas: numa cota quase cheia,
copiar a foto para migrar é a diferença entre migrar e perdê-la. `ponto-e-letra/linhas/v1` guarda
as linhas que você marcou como suas — inclusive as avulsas, que moram só aí, já que não vêm de
catálogo nenhum. Não há servidor nem conta — o trabalho não acompanha você
para outro aparelho ou outro navegador, e some se você limpar os dados do site, a menos que você
salve o arquivo do molde. A foto é guardada reduzida (1600 px no maior lado, JPEG), porque é só guia de
posicionamento: na tela e no PDF ela aparece a 22% de opacidade. As chaves são separadas de
propósito. A foto é o único item capaz de estourar a cota do navegador, e assim ela nunca leva o
arranjo junto na queda. As linhas ficam à parte porque são inventário, não desenho: a caixa de
linhas continua a mesma quando você começa um molde do zero, e o molde não carrega a caixa
junto.

Os PDF já gerados são a exceção: eles ficam no **IndexedDB**, na base `ponto-letra`, store
`moldes`. Um molde grande em PDF tem megabytes, e pôr isso no `localStorage` derrubaria o
arranjo e a foto junto. Vinte registros no máximo, cada um com o arquivo, uma miniatura JPEG,
o nome, a data, o tamanho e as medidas que ele usou.

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
