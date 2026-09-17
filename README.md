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
- **Peças bordadas**: quantas quiser, cada uma sendo uma palavra ou um símbolo (coração cheio,
  coração vazado, estrela, seta). Arraste para posicionar, incline de -45° a 45°, redimensione
  com dois dedos, e ajuste ponto a ponto no modo de edição. Duplicar copia a peça com as
  células como estão, então a cópia nasce com os ajustes manuais da original e segue a vida
  dela própria a partir dali.
- **Fontes**: 40 famílias do Google Fonts agrupadas por caráter — caligrafia fina, cursiva
  encorpada, letra de mão, serifada itálica, gótica, pixel e bloco. A escolha é por amostra,
  não por nome: cada linha mostra a sua palavra escrita naquela fonte e, ao lado, a mesma
  palavra já em quadradinhos, que é o que vira furo. Com busca e filtro por grupo. Os cartões
  pedem a fonte só quando chegam à vista, então abrir a lista não baixa as 40 famílias.
- **Linhas**: oito paletas de quatro cores cada, mais os catálogos das marcas — 391 cores da
  Anchor e 455 da DMC. Na aba **catálogo** você toca nas cores que tem na caixa; elas viram a
  paleta **minhas linhas**, e marcar uma já pinta o molde com ela, que é o jeito de ver a cor
  real no arranjo antes de gastar meada. A busca aceita código ou nome. O que você marcou fica
  guardado no navegador à parte do molde, e não some quando você recomeça um desenho. Para a
  meada que não está em cartela nenhuma, o cadastro de **linha avulsa** na mesma aba: marca,
  código e cor. Ela nasce marcada, entra em minhas linhas junto com as outras e aparece na
  marca **avulsas** — onde desmarcar apaga de vez, porque ela só existe por você ter
  cadastrado.
- **Contagem**: pontos e furos, com o tamanho da peça selecionada em centímetros.
- **PDF do molde**: em tamanho real, recortado na área do bordado, com a moldura de recorte, o
  retângulo da foto para alinhar, as bordas do papel quando encostam na área, e no cabeçalho a
  distância exata para colar a foto no papel.
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
- **Memória local**: papel, foto, peças, posições, inclinações, paleta e os ajustes feitos ponto
  a ponto ficam guardados no navegador e voltam ao reabrir. As células são gravadas como estão,
  e não recalculadas na volta — é isso que preserva o que você acendeu ou apagou à mão. Para
  refazer tudo a partir dos controles, o botão **Recalcular** — que pergunta antes quando há
  ajustes manuais a perder, dizendo quantos são, e oferece refazer só a peça selecionada. O
  rodapé mostra a conta o tempo todo.

## Rodando

Abra `index.html` no navegador. Não há passo de build. Para servir localmente:

```bash
python3 -m http.server
```

## `cartela.html`

A ferramenta que transforma a cartela de uma marca em entrada do `catalogos.js`. Abra a
página, arraste as imagens da cartela, e ela devolve a cor de cada amostra — a mediana dos
pixels do miolo, que é como as cores da Anchor foram tiradas. A saída é uma linha por
imagem: nome do arquivo, contagem e as cores em ordem de leitura.

Ela acha as amostras pela projeção dos pixels que não são fundo: primeiro as colunas, depois
as linhas dentro de cada coluna. O rótulo embaixo da amostra é fino e estreito demais para
passar pelo corte, e barra escura no topo de um recorte de tela não atrapalha. A prévia
contorna o que foi achado e mostra a contagem, então dá para conferir antes de copiar.

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

Tudo no `localStorage` do próprio navegador, em três chaves: `ponto-e-letra/molde/v1` para o
arranjo, `ponto-e-letra/molde/foto/v1` para a imagem e `ponto-e-letra/linhas/v1` para as linhas
que você marcou como suas — inclusive as avulsas, que moram só aí, já que não vêm de
catálogo nenhum. Não há servidor nem conta — o trabalho
não acompanha você para outro aparelho ou outro navegador, e some se você limpar os dados do
site. A foto é guardada reduzida (1600 px no maior lado, JPEG), porque é só guia de
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
