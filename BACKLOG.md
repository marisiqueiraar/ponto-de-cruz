# Backlog

Pendências e pontos de atenção conhecidos, em 02/09/2026.

---

## 1. Pedidos originais ainda não construídos

Coisas pedidas no começo do projeto que ficaram de fora do escopo entregue até agora.

### 1.1 Hall / galeria de artes salvas
**Não existe.** Hoje o app guarda **um** projeto de cada tipo (uma moldura + um padrão) e restaura o último ao abrir. Não há lista, miniaturas, nome, data nem forma de voltar a um projeto antigo.

O banco já está preparado: as tabelas `patterns` e `mats` têm índice por `name` e `updatedAt`, e cada registro guarda `createdAt`/`updatedAt`. Falta a UI e trocar o ponteiro único (`lastOpenPatternId` / `lastOpenMatId`) por seleção.

### 1.2 Sugestão de cores de fundo
**Não existe.** Recomendar a cor de tecido/cartão que combina com a paleta gerada.

Há base pronta para isso: `labDistance` (CIEDE2000) em `src/lib/color/colorSpace.ts` e o dataset completo em `src/data/dmcColors.ts`.

---

## 2. Pendências funcionais

### 2.1 Arabescos são gerados por algoritmo
Os motivos de `arabesco` em `src/data/motifs.ts` são construídos com espirais de Arquimedes e curvas de Bézier (`src/lib/motifs/gridDraw.ts`), não desenhados à mão. Foram validados como traço contínuo (sem falhas na linha), mas **não** foram validados como "parecidos com as referências". É o ponto mais provável de precisar refazer.

Se precisarem virar desenho manual, `fromAscii()` já aceita arte em texto.

### 2.2 Texto só gira em 90°
`MatItem.rotation` aceita `0 | 90 | 180 | 270`. As referências têm frases na diagonal (ex.: "where love grows"). Suportar ângulo livre exige rotacionar a forma em grade com reamostragem, não só transpor células.

### 2.3 Motivos podem invadir a janela da foto
`itemOverflows()` só valida a borda do cartão. Nada impede posicionar um arabesco por cima da área onde a foto será colada — acontece com facilidade e não há aviso.

### 2.4 Sem desfazer
Nenhum dos dois editores tem undo/redo. Remover um elemento ou trocar de projeto é irreversível.

### 2.5 Só ponto cheio
O guia explica meio ponto, ¼, ¾, pesponto e nó francês, mas o editor e os PDFs só produzem ponto cheio. O pesponto (contorno) é o que mais faria falta no estilo das referências.

### 2.6 Referências não buscam de verdade
A aba Referências monta a query e abre no Pinterest / Google Imagens / Etsy / Instagram. Não mostra resultado dentro do app.

Motivo: o navegador não consegue raspar buscas (CORS). Resultados embutidos exigiriam uma serverless function na Vercel + chave de API paga (Google Custom Search, SerpAPI ou similar), e o app deixaria de ser 100% offline e sem conta. **Decisão consciente, não esquecimento.**

---

## 3. Pontos de atenção técnicos

### 3.1 Fonte Recoleta: arquivo DEMO
Dois problemas no arquivo atual (`public/fonts/recoleta-regular.woff2`):

1. **Não tem nenhum caractere acentuado.** Verificado glifo a glifo: `ã ç é õ ê á Ç` renderizam como `.notdef` (caixa vazia). Contornado limitando o `@font-face` a `unicode-range: U+0020-007E` e deixando a **Fraunces** cobrir os acentos — mas palavras como "Padrões" ficam com duas fontes misturadas, o que dá para notar de perto.
2. **Licença de avaliação.** Arquivo DEMO não é licenciado para produção/web.

**Correção:** obter a Recoleta licenciada (Latin completo), substituir o `.woff2` e ampliar o range para `U+0000-00FF` em `src/index.css`. Nenhuma outra mudança é necessária.

### 3.2 DMC é marca de terceiros
As cores em `src/data/dmcColors.ts` foram compiladas de dados abertos da comunidade e são **aproximações não-oficiais**. Já há aviso na interface. Manter esse aviso se a paleta aparecer em material impresso ou comercial.

### 3.3 Peso do bundle
`jspdf` puxa `html2canvas` e `dompurify` (~600 KB somados). Já está em code-splitting — só carrega ao clicar em exportar — mas se houver mais um consumidor de PDF, vale avaliar um gerador mais leve (ex.: `pdf-lib`).

### 3.4 Dois canvas com comportamentos diferentes
- `PatternCanvas` (gerador): zoom por scroll + pan por arraste.
- `MatCanvas` (moldura): escala fixa, quadro rola.

Foi intencional (a moldura precisa de escala real), mas é uma inconsistência que o usuário sente ao alternar entre os dois.

### 3.5 Estimativas são estimativas
- **Meadas:** `stitchesPerSkein` está ancorado na faixa citada de ~1.500–1.800 pontos por meada em Aida 14 com 2 fios, com folga de 15%. Consumo real varia com tensão do ponto e desperdício.
- **Cores DMC:** o match por CIEDE2000 acerta o tom mais próximo do catálogo, que nem sempre é o tom que a pessoa escolheria.

### 3.6 Mobile não foi testado de verdade
O layout usa grid responsivo e não estoura horizontalmente, mas nunca foi validado em aparelho real. O cabeçalho fica alto em tela estreita, e arrastar motivos no canvas usa eventos de mouse (`onMouseDown/Move/Up`) — **não** de ponteiro/toque. Provavelmente não funciona no celular.

> A `ApplicationPreview` já usa Pointer Events e deve funcionar no toque. O `MatCanvas` não.

### 3.7 Cuidado ao verificar no preview
O painel de preview nem sempre compõe frames, e nesse estado o `ResizeObserver` **não dispara** e screenshots dão timeout. Isso já causou um falso positivo de bug. Para inspecionar visualmente, o caminho que funciona é extrair o canvas com `toDataURL()`, decodificar em arquivo e abrir a imagem.

---

## 4. Para testar

### 4.1 Trocar a tipografia por uma sans geométrica
A Mariana mandou uma referência ("Join the stitch club") com uma sans geométrica de que gostou e quer testar no site.

**Identificação (não confirmada — veio de um print):** sans geométrica, `a` de andar único, `o`/`c`/`e` bem circulares, `g` com descendente reta sem laço, espaçamento generoso. Família Futura.

| Candidata | Licença | Nota |
|---|---|---|
| Futura PT | paga | o desenho clássico |
| Century Gothic | paga / vem com Office | mais larga e arredondada |
| **Poppins** | livre (OFL) | equivalente livre mais próximo |
| **Jost\*** | livre (OFL) | feita como alternativa livre à Futura |

**Decisão em aberto:** hoje é Recoleta (títulos) + Manrope (corpo). A geométrica substituiria só a Manrope, ou as duas? A segunda opção muda bastante o tom — a serifada é o que dá o ar artesanal hoje.

**Como testar:** baixar Poppins e Jost em `public/fonts/` (mesmo processo das outras) e alternar `--font-sans` / `--font-display` em `src/index.css`. Vale montar as duas hipóteses lado a lado antes de decidir.

---

## 5. Ideias que surgiram mas não entraram

- Importar/exportar OXS (formato de intercâmbio, compatível com MacStitch/WinStitch) — o FlossCross tem.
- Editar ponto a ponto no gráfico gerado (corrigir a paleta na mão).
- Modo de acompanhamento: marcar o que já foi bordado.
- Símbolos personalizáveis por cor.
- PWA instalável de fato (o service worker já existe, falta o manifesto com ícones).
