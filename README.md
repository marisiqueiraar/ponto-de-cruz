# Ponto de Cruz

**ponto & letra** — molde de furos em tamanho real para bordar sobre foto.

Você define o papel de fundo, encaixa a foto no tamanho em que ela será impressa, escreve e
posiciona as peças bordadas por cima, e baixa um PDF com o molde de furos na escala exata do
material.

A aplicação é o arquivo `index.html`: HTML, CSS e JavaScript em um único arquivo, sem build e
sem backend. A tela é um editor: trilho de ícones à esquerda que abre um painel, barra de cima
que muda conforme o que está selecionado, e o papel no centro sobre uma mesa com réguas em
centímetros. O `layout.html` na raiz é a maquete dessa arrumação, com os controles inertes —
serve para experimentar mudanças de layout sem tocar no desenho nem no PDF.

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
- **Linhas**: oito paletas de quatro cores cada.
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
- **Os três ícones** dos botões de ação são SVG embutidos no `index.html`, vindos do projeto
  [material-design-icons](https://github.com/google/material-design-icons) do Google, sob
  Apache License 2.0. São três caminhos de ~300 bytes: não há fonte de ícones nem biblioteca.

## Deploy

Site estático: publique a raiz do repositório em qualquer host. Na Vercel, o `vercel.json` da
raiz declara que não há build — sem ele, um projeto criado com o preset Vite tenta rodar
`vite build` e falha com `vite: command not found`.

## Onde ficam os dados

Tudo no `localStorage` do próprio navegador, em duas chaves: `ponto-e-letra/molde/v1` para o
arranjo e `ponto-e-letra/molde/foto/v1` para a imagem. Não há servidor nem conta — o trabalho
não acompanha você para outro aparelho ou outro navegador, e some se você limpar os dados do
site. A foto é guardada reduzida (1600 px no maior lado, JPEG), porque é só guia de
posicionamento: na tela e no PDF ela aparece a 22% de opacidade. As duas chaves são separadas
de propósito — a foto é o único item capaz de estourar a cota do navegador, e assim ela nunca
leva o arranjo junto na queda.

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
