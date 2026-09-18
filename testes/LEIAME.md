# Testes

O app é um arquivo só, sem build. Estes testes rodam em `node`, sem instalar
nada além do que já está no repositório — a não ser `tela.js`, que precisa de
um Chromium e se pula sozinho quando não acha um.

```sh
testes/roda.sh        # todos, com a extração refeita antes
node testes/tela.js   # a tela de verdade, num Chromium
```

`extrai.py` puxa do `index.html` os trechos que cada teste exercita e grava
`geo.js`, `pdfcode.js`, `estante.js` e `app.js` aqui ao lado (todos ignorados
pelo git). Ela roda **sempre** antes dos testes, e não por capricho: a extração
já ficou defasada uma vez, e os testes de PDF passaram uma rodada inteira
contra a versão anterior do código, sem testar nada.

Os testes do PDF não conferem o desenho por imagem: eles descomprimem os
streams do arquivo gerado e leem os operadores lá dentro. É assim que dá para
afirmar, por exemplo, que o retângulo da foto cai no mesmo milímetro de papel
em todas as folhas.

| arquivo | o que garante |
|---|---|
| `geo.test.js` | o molde repartido cobre o desenho inteiro, toda emenda repete ≥ 10 mm, e nenhuma folha passa do tamanho de uma A4 |
| `pos.test.js` | o retângulo da foto cai no mesmo milímetro de papel em todas as folhas, e nada é desenhado fora da moldura de recorte |
| `emenda.test.js` | uma peça em cima da junta sai nas duas folhas, nas mesmas coordenadas de papel |
| `pdf.test.js` | número de páginas, régua de aferição impressa, e o título vindo do nome do molde |
| `cor.test.js` | cada peça sai na sua linha, a legenda não repete cor, e o rodapé mais alto não empurra o molde para fora da folha |
| `estante.test.js` | o molde antigo migra sem nada ser copiado, apagar tira só as chaves daquele molde, trocar grava antes, e o arquivo sobrevive à volta num navegador zerado |
| `tela.js` | o app monta num Chromium de verdade, sem erro de JavaScript, e o trilho de sete botões cabe numa tela de 360 px |

`amostra.js` não testa nada: gera um PDF de várias folhas, com quatro linhas
diferentes, para olhar.

## O que não tem teste

Está anotado no [BACKLOG.md](../BACKLOG.md), seção 6. Em resumo: o canvas —
incluindo `textMatrix()`, que transforma o traço da fonte em quadradinhos e é o
coração do app —, os gestos, e qualquer comparação do PDF com uma imagem de
referência.

`tela.js` não tem exceção: qualquer arquivo que falte derruba o teste. Arquivo
faltando ali quer dizer fonte que não chega, e fonte que não chega faz o canvas
desenhar numa cursiva genérica, com o molde saindo errado sem avisar.
