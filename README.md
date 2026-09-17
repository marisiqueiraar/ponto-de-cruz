# Ponto de Cruz

**ponto & letra** — gerador de gráfico de ponto cruz para letras cursivas.

Você digita a palavra, escolhe uma cursiva, e o app converte o traço da fonte em uma grade
quadriculada de pontos, pronta para furar o papel ou bordar na aida.

Site estático, sem build, sem dependências, sem backend e **sem rede**: as fontes estão
hospedadas no próprio repositório, então o app funciona offline depois do primeiro carregamento.

## O que ele faz

- Converte o texto digitado em grade de pontos, renderizando a fonte num canvas e amostrando
  a cobertura de cada célula 6×6 px.
- Sete cursivas hospedadas aqui mesmo: Great Vibes, Pinyon Script, Dancing Script, Sacramento,
  Parisienne, Caveat e Cormorant Garamond em itálico — funcionam sem rede.
- Busca no catálogo do Google Fonts: 1.882 famílias com alfabeto latino (251 manuscritas),
  baixadas sob demanda quando há internet. Se a fonte escolhida não chegar, o app avisa em vez
  de desenhar um gráfico errado com a cursiva genérica do sistema.
- Controles de altura (10–50 pontos), espessura do traço, sensibilidade da amostragem e
  espaçamento entre furos (1–6 mm).
- Mostra dimensões da grade, contagem de pontos e o tamanho real em centímetros.
- Grade com linhas de referência de 10 em 10 e pontos desenhados como cruzinhas.
- Ajuste ponto a ponto: clique, toque ou setas do teclado com barra de espaço. Os ajustes
  sobrevivem a mudanças nos controles e têm desfazer (botão ou Ctrl+Z).
- **Impressão em tamanho real**: a folha é montada em SVG dimensionado em milímetros, então
  a grade sai no papel exatamente com o espaçamento escolhido. Páginas A4 com 2 células de
  sobreposição, emenda tracejada e legenda com as faixas de colunas e linhas.
- Exporta o gráfico em PNG.
- Guarda texto, ajustes e edições manuais no navegador e restaura ao reabrir.

## Rodando

Abra `index.html` no navegador — não há passo de build. Para servir localmente:

```bash
python3 -m http.server
```

## Estrutura

```
index.html    marcação
style.css     estilos, @font-face e folha de impressão
app.js        amostragem, desenho, ajustes, impressão, busca de fontes e memória local
catalog.js    catálogo do Google Fonts (gerado; ver abaixo)
fonts/        as sete cursivas em .woff2 (subconjunto latino)
favicon.svg
```

`app.js` é script clássico, não módulo — é o que mantém o duplo clique em `index.html`
funcionando sem servidor. Se um dia o código for dividido em módulos ES, isso deixa de valer
e passa a ser necessário servir por HTTP.

## Fontes

As sete cursivas locais vêm do catálogo do Google Fonts, sob SIL Open Font License 1.1,
guardadas em `fonts/`. Os créditos e a nota de licença estão em
[`fonts/OFL.txt`](fonts/OFL.txt).

O resto do catálogo é carregado sob demanda pela API de CSS do Google, que não pede chave.
A lista de nomes em `catalog.js` foi extraída dos arquivos `METADATA.pb` do repositório
[google/fonts](https://github.com/google/fonts), mantendo só famílias com subconjunto latino
— sem isso, uma família sem alfabeto latino geraria um gráfico vazio. É um arquivo gerado:
para atualizá-lo, releia os `METADATA.pb` e reescreva os cinco grupos (`h` manuscrita,
`d` display, `s` serifada, `n` sem serifa, `m` monoespaçada).

O catálogo é carregado como script clássico, e não por `fetch` de um `.json`, porque `fetch`
em `file://` é bloqueado por CORS — seria perder o duplo clique.

## Deploy

Estático puro: publique a raiz do repositório em qualquer host (GitHub Pages, Vercel, Netlify),
**sem comando de build**. Na Vercel, o `vercel.json` na raiz já fixa isso — sem ele, um projeto
criado com o preset Vite tenta rodar `vite build` e falha com `vite: command not found`.

## Histórico

Até o commit `6ce5a7a` este repositório continha um app React + Vite + TypeScript diferente
(gerador de padrão a partir de foto, matching DMC, export PDF, IndexedDB). Ele foi substituído
por esta aplicação, mas continua inteiro no histórico do git:

```bash
git checkout 6ce5a7a
```
