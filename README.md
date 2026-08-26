# Ponto de Cruz

Gerador de padrões de ponto de cruz: envie uma foto e gere um gráfico de pontos com paleta
mapeada para cores de linha de bordado (estilo DMC), tamanho ajustável por contagem de tecido,
e uma ferramenta de texto com fontes em grade para adicionar letras ao padrão.

Roda inteiramente no navegador — sem conta, sem backend. Tudo é salvo localmente
(IndexedDB) e restaurado automaticamente ao reabrir.

## Rodando localmente

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (`dist/`), pronta para deploy estático (ex.: Vercel)
- `npm run preview` — serve o build de produção localmente
- `npm test` — testes unitários (Vitest)
- `npm run lint` — lint (oxlint)

## Estrutura

- `src/lib/pattern/buildPattern.ts` — pipeline foto → padrão (reamostragem, quantização de cor, matching DMC)
- `src/lib/color/` — conversão de cor (Lab/CIEDE2000), k-means, matching DMC
- `src/lib/fonts/`, `src/data/fonts/` — sistema de fontes de ponto de cruz e composição de texto
- `src/lib/persistence/` — Dexie/IndexedDB (padrões, imagem original, configurações)
- `src/components/` — UI (upload, controles, visualizador do padrão)
- `src/state/useEditorStore.ts` — estado do editor (Zustand)

## Fontes

Além de dois alfabetos em blocos desenhados à mão, o app inclui uma galeria de tipografias
convertidas automaticamente em pontos (`public/fonts/`): Press Start 2P, VT323, Silkscreen e
Pixelify Sans, todas Google Fonts sob licença SIL Open Font License. É possível também enviar
uma fonte própria (.ttf/.otf) pela aba Gerador — a conversão é feita localmente no navegador.

## Deploy

Build estático sem variáveis de ambiente — funciona em qualquer host estático (Vercel, Netlify, etc.):

```bash
npm run build
```
