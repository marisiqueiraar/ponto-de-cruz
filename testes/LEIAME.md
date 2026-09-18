# Testes

O app é um arquivo só, sem build. Estes testes rodam em `node`, sem instalar
nada além do que já está no repositório — a não ser `tela.js`, que precisa de
um Chromium e se pula sozinho quando não acha um.

```sh
testes/roda.sh        # todos, com a extração refeita antes
```

Quatro deles (`tela.js`, `posicao.js`, `traco.js` e `laco.js`) dirigem um Chromium e se pulam
sozinhos quando não acham um. O `posicao.js` mede as posições lendo o que o app
grava no `localStorage`, em vez de olhar a tela: assim dá para afirmar "andou
0,5 mm" em vez de "alguma coisa mudou".

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
| `letra.js` | o espaçamento alarga a palavra sem mudar a altura, o arco levanta o meio acima das pontas (e o arco negativo inverte), e espelhar inverte as colunas sem mudar a grade e sobrevive ao Recalcular |
| `fio.js` | os metros na tela batem com a conta que a própria tela diz fazer, a conta responde ao espaçamento entre furos, e a soma por cor fecha com o total de pontos |
| `teto.js` | o teto do rascunho não deforma o molde: o degrau na fronteira é menor que a variação natural, e o pior caso mantém a grade que tinha sem o teto |
| `cota.js` | com o `localStorage` recusando a escrita, o rodapé avisa em vermelho, a aba moldes diz o que fazer, os dois somem quando volta a caber, e o aviso aparece mesmo numa janela de 360 px, onde o resto do rodapé fica escondido |
| `laco.js` | o laço pega o que couber inteiro dentro dele, a barra diz o que está laçado, as setas e o arraste movem foto e peças sem mudar as distâncias entre elas, a foto segura o bloco na borda do papel, e o arraste do bloco é um passo só no desfazer |
| `traco.js` | o arraste no modo ponto a ponto acende a fileira inteira sem furo mesmo quando o ponteiro pula de uma vez, o primeiro quadradinho decide se o traço acende ou apaga, e o traço todo é um passo só no desfazer |
| `posicao.js` | as setas andam 0,5 mm (5 com Shift), a rajada vira um passo só no desfazer, a seta dentro de um campo não empurra a peça, e os três botões de alinhar acertam o centro da caixa já girada |

`amostra.js` não testa nada: gera um PDF de várias folhas, com quatro linhas
diferentes, para olhar.

## O que não tem teste

Está anotado no [BACKLOG.md](../BACKLOG.md), seção 6. Em resumo: o canvas —
incluindo `textMatrix()`, que transforma o traço da fonte em quadradinhos e é o
coração do app —, a pinça e o arraste de posicionar, e qualquer comparação do
PDF com uma imagem de referência. O arraste que acende quadradinho deixou essa
lista: está em `traco.js`.

`tela.js` não tem exceção: qualquer arquivo que falte derruba o teste. Arquivo
faltando ali quer dizer fonte que não chega, e fonte que não chega faz o canvas
desenhar numa cursiva genérica, com o molde saindo errado sem avisar.
