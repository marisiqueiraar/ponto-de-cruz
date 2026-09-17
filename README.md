# Ponto de Cruz

**ponto & letra** — molde de furos em tamanho real para bordar sobre foto.

Você define o papel de fundo, encaixa a foto no tamanho em que ela será impressa, escreve e
posiciona as peças bordadas por cima, e baixa um PDF com o molde de furos na escala exata do
material.

A aplicação é o arquivo `index.html`: HTML, CSS e JavaScript em um único arquivo, sem build e
sem backend.

## O que ele faz

- **Papel**: A4, A5, A3, quadrado, 20×30, 15×20 ou medidas próprias, em retrato ou paisagem.
- **Foto**: tamanhos de revelação comuns (10×15, 9×13, 13×18, 15×21, quadrado, polaroid) ou
  medida própria, arrastável sobre o papel, com imagem opcional só para visualizar.
- **Peças bordadas**: quantas quiser, cada uma sendo uma palavra ou um símbolo (coração cheio,
  coração vazado, estrela, seta). Arraste para posicionar, incline de -45° a 45°, redimensione
  com dois dedos, e ajuste ponto a ponto no modo de edição.
- **Fontes**: 40 famílias do Google Fonts agrupadas por caráter — caligrafia fina, cursiva
  encorpada, letra de mão, serifada itálica, gótica, pixel e bloco.
- **Linhas**: oito paletas de quatro cores cada.
- **Contagem**: pontos e furos, com o tamanho da peça selecionada em centímetros.
- **PDF do molde**: em tamanho real, recortado na área do bordado, com a moldura de recorte, o
  retângulo da foto para alinhar, as bordas do papel quando encostam na área, e no cabeçalho a
  distância exata para colar a foto no papel.
- **PNG** da prévia, para conferir o arranjo.
- **Histórico**: cada PDF gerado fica guardado no navegador (IndexedDB), com miniatura, data,
  tamanho e as medidas usadas. Dá para abrir, baixar de novo ou apagar. Guarda os 20 mais
  recentes — o 21º empurra o mais antigo para fora. É armazenamento local: não sincroniza entre
  aparelhos e some se o usuário limpar os dados do site; em janela anônima o painel avisa que
  não há histórico.

## Layout

Uma estrutura, dois arranjos, decididos por `@media (min-width:900px), (min-width:680px) and
(orientation:landscape)` no CSS e pela mesma condição no JavaScript, que dimensiona a tela.

- **Celular e tablet em pé**: coluna única. Os números e a prévia formam o *palco*, preso no topo
  (`position:sticky`) enquanto se rola pelos controles — dá para ver o efeito de cada ajuste sem
  subir a página. A prévia ocupa cerca de 35% da altura da janela. A seção `.preview` é
  `display:contents` aqui de propósito: `sticky` só anda dentro da caixa do pai, e o pai precisa
  ser o `.layout` inteiro.
- **Computador e tablet deitado**: duas colunas. Prévia à esquerda, fixa; controles à direita,
  rolando. A prévia vem antes no HTML, então a ordem de foco do teclado é a mesma ordem visual.
- **Janela baixa** (até 620 px, celular deitado): nada fica preso e o cabeçalho encolhe — prender
  qualquer coisa numa dobra de 390 px só atrapalha.

Outras decisões que valem para os dois arranjos: margens respeitam `env(safe-area-inset-*)`,
`redrawSoon` espera 120 ms antes de redesenhar (a barra do navegador do celular dispara `resize`
o tempo todo), o botão do PDF mostra "Gerando…" enquanto a thread trava, e a prévia tem
`aria-label` com a contagem, as estatísticas são `aria-live` e as peças e cores respondem
`aria-pressed`.

## Rodando

Abra `index.html` no navegador. Não há passo de build. Para servir localmente:

```bash
python3 -m http.server
```

## Dependências externas

Duas, ambas em tempo de execução:

- **Google Fonts** — as 40 famílias vêm do CDN. Sem rede, o texto cai numa cursiva genérica
  do sistema e o gráfico gerado não corresponde à fonte escolhida.
- **jsPDF 2.5.1** (cdnjs) — o botão de PDF avisa e não gera nada se o script não carregar.

## Deploy

Site estático: publique a raiz do repositório em qualquer host. Na Vercel, o `vercel.json` da
raiz declara que não há build — sem ele, um projeto criado com o preset Vite tenta rodar
`vite build` e falha com `vite: command not found`.

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
