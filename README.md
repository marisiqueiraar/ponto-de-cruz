# Ponto de Cruz

**ponto & letra** — gerador de gráfico de ponto cruz para letras cursivas.

Você digita a palavra, escolhe uma cursiva, e o app converte o traço da fonte em uma grade
quadriculada de pontos, pronta para furar o papel ou bordar na aida.

A aplicação é o arquivo `index.html`: HTML, CSS e JavaScript em um único arquivo, sem build,
sem dependências e sem backend. A única coisa que vem de fora são as fontes (Google Fonts via CDN).

## O que ele faz

- Converte o texto digitado em grade de pontos, renderizando a fonte num canvas e amostrando
  a cobertura de cada célula 6×6 px.
- Sete cursivas: Great Vibes, Pinyon Script, Dancing Script, Sacramento, Parisienne, Caveat e
  uma serif itálica (Cormorant Garamond).
- Controles de altura (10–50 pontos), espessura do traço, sensibilidade da amostragem e
  espaçamento entre furos (1–6 mm).
- Mostra dimensões da grade, contagem de pontos e o tamanho real em centímetros.
- Grade com linhas de referência de 10 em 10 e pontos desenhados como cruzinhas.
- Clique em qualquer célula para acender ou apagar o ponto à mão.
- Exporta o gráfico em PNG e tem layout de impressão (só o gráfico sai no papel).

## Rodando

Abra `index.html` no navegador. Não há passo de build.

Para servir localmente, qualquer servidor estático resolve — por exemplo:

```bash
python3 -m http.server
```

## Deploy

Site estático: é só publicar a raiz do repositório em qualquer host estático
(GitHub Pages, Vercel, Netlify), sem comando de build e sem variáveis de ambiente.

## Histórico

Até o commit `6ce5a7a` este repositório continha um app React + Vite + TypeScript diferente
(gerador de padrão a partir de foto, matching DMC, export PDF, IndexedDB). Ele foi substituído
por esta aplicação, mas continua inteiro no histórico do git e pode ser recuperado a
qualquer momento:

```bash
git checkout 6ce5a7a
```
