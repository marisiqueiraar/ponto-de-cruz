# Testes

O app é um arquivo só, sem build. Estes testes rodam em `node`, sem instalar
nada além do que já está no repositório — a não ser os que dirigem um
navegador, que precisam de um Chromium e se pulam sozinhos quando não acham
um.

```sh
testes/roda.sh        # todos, com a extração refeita antes
```

Os que rodam só em `node` são os de PDF (`geo`, `pos`, `emenda`, `pdf`, `cor`, `semfoto`,
`grafico.test`) e o `estante.test.js`; todos os outros dirigem um Chromium. O
`posicao.js` mede as posições lendo o que o app grava no `localStorage`, em vez
de olhar a tela: assim dá para afirmar "andou 0,5 mm" em vez de "alguma coisa
mudou". O `guias.js` confere as duas medidas ao
mesmo tempo — os milímetros gravados e os pixels do risco na tela —, porque
guia no lugar certo com o número errado engana mais do que guia nenhuma.

`extrai.py` emenda os arquivos de `js/` na ordem em que o `index.html` os carrega, puxa dali os trechos que cada teste exercita e grava
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
| `semfoto.test.js` | o molde sem foto não desenha o retângulo dela nem manda colá-la, a caixa do desenho é só a das peças, e a foto de volta volta ao PDF |
| `cor.test.js` | cada peça sai na sua linha, a legenda não repete cor, e o rodapé mais alto não empurra o molde para fora da folha |
| `estante.test.js` | o molde antigo migra sem nada ser copiado, apagar tira só as chaves daquele molde, trocar grava antes, e o arquivo sobrevive à volta num navegador zerado |
| `tela.js` | o app monta num Chromium de verdade, sem erro de JavaScript, e o trilho de sete botões cabe numa tela de 360 px |
| `letra.js` | o espaçamento alarga a palavra sem mudar a altura, o arco levanta o meio acima das pontas (e o arco negativo inverte), e espelhar inverte as colunas sem mudar a grade e sobrevive ao Recalcular |
| `ajuste.js` | o quadradinho aceso à mão sobrevive a mexer na altura, no traço e na fonte (e só o Recalcular o descarta), a mesma altura dá a mesma letra com e sem descendente, palavra nova nasce com o que está na barra de cima, e molde gravado antes tem o número da altura convertido sem mudar de tamanho |
| `imagem.js` | a imagem vira quadradinho com a largura pedida e a proporção dela, o limiar corta na meia tinta, o inverter troca o claro pelo escuro, o desenho e a imagem sobrevivem a reabrir o navegador, trocar a imagem de uma peça guarda o lugar e a linha dela, e foto entra em várias cores enquanto logo entra em uma |
| `lugar.js` | o molde novo nasce vazio; a peça nova nasce reta, num lugar livre embaixo da foto, sem encostar em nada; altura e texto mudam em volta do centro; a foto que muda leva as peças junto; o papel que muda leva o arranjo e o põe para dentro; o nome do molde acompanha a palavra até ser escrito à mão |
| `colados.js` | furos de peças diferentes a 1 mm acendem o aviso e marcam a região na tela; furos no mesmo lugar e peças afastadas não avisam; o aviso some quando a peça se afasta |
| `fontes.js` | são 35 fontes e nenhum arquivo das cinco que saíram é pedido; a palavra nasce na Dancing Script; o campo de altura avisa abaixo da altura mínima da fonte e para de avisar ao chegar nela; o cartão da lista diz a altura mínima e a amostra sai na altura da peça; molde com fonte que saiu abre igual e passa para a parecida |
| `medidas.js` | a altura mostra o que vale em centímetros e acompanha o espaçamento; traço e sensibilidade dizem o efeito numa palavra; os atalhos de espaçamento e o rodapé; no computador, a 1280 e a 1440 px, nenhum campo da barra fica escondido nem embaixo dos botões |
| `caixa.js` | em aplicar na peça o toque só pinta; em minha caixa o toque só marca e desmarca; várias de uma vez entram pelos códigos colados, com aviso do que já estava e do que não existe; a cor da caixa tem o ponto no canto na aplicação; a linha de fábrica é uma meada com código |
| `reto.test.js` | (node) no caminho de retas todo vértice é furo e os trechos são repartidos por igual; na curva os furos ficam a distâncias iguais; nenhum dos nove desenhos, com ponto de 2,5 ou 3 mm, deixa furos a menos de 2 mm; a aresta dividida por dois hexágonos é bordada uma vez |
| `reto.js` | a peça de ponto reto nasce colmeia com ponto de 2,5 mm e mistura com o ponto cruz; desenho, tamanho, ponto e opções refazem a peça no lugar; o ajustar some; o fio é o triplo do desenho; espelhada e recarregada, continua igual; no PDF o risco sai em cinza claro |
| `reto2.js` | a palavra passa para ponto reto com texto, fonte, linha, lugar e 40 mm de maiúscula, e volta com 16 quadradinhos; em 40 mm não deixa furo colado e abaixo de 18 mm o campo avisa; a imagem vira contorno fechado e traço, e continua se refazendo depois de recarregar |
| `reto3.js` | a faixa de ponto reto repete o desenho as vezes pedidas, em pé e deitada; a moldura de folhas fica centrada na foto, por fora da margem, e cresce com ela; a de ziguezague é uma linha só, fechada; nenhuma deixa furo colado; o arranjo volta igual ao recarregar |
| `impressao.js` | num marca-página a aba papel oferece até 3 na A4 e o outro molde do mesmo tamanho; o PDF sai numa folha só com três molduras de recorte; cantos e furo da fita ficam gravados e saem curvos no PDF; a moldura que passa do A5 cabe depois do botão; com a ordem pedida, os furos ganham número |
| `pecas2.js` | os cinco desenhos novos de ponto reto viram peça sem furo colado; a palavra em ponto reto tem arco (fica mais alta) e espaço (fica mais larga); a moldura vai em volta da palavra, anda com ela e continua presa depois de recarregar; cores por bloco troca o esquema de um bloco só |
| `tela2.js` | a peça encosta na borda de outra sem guia e a linha do ímã aparece; o 1:1 calibra com o cartão, grava a medida da tela e põe o zoom no tamanho real; o laço duplica (cópias com identidade nova, laçadas, 5 mm ao lado) e centraliza no papel; o desenho da peça fica guardado e se refaz quando ela muda; o espaço entre letras fica ligado no Chromium; no celular a barra de cima tem menos de 110 px |
| `moldes2.js` | a caixa marca tenho pouco e acabou, a que acabou sai das minhas e as duas vão para a lista de compras, e a lista de fio avisa; o nome do molde só grava quando a digitação para; a estante fica por ordem de uso e abrir sem mexer não muda a hora; duplicar abre uma cópia com as mesmas peças; o mesmo arquivo aberto de novo não cria outro molde, a menos que o molde tenha mudado |
| `acompanha.js` | com o tique ligado, um toque marca o ponto e o rodapé conta, outro desmarca, arrastar marca o traço, o ponto reto se marca pelo meio do ponto, a peça não anda, o desfazer tira um traço, a marcação volta ao recarregar e desmarcar tudo pede confirmação |
| `papelcor.js` | a aba papel oferece as cores; com linha branca, o papel branco avisa e os sugeridos são escuros; o papel escolhido pinta a mesa e fica gravado; a miniatura do PDF continua branca |
| `instala.js` | servido por http: o manifesto é válido e os ícones de 192 e 512 px existem; o service worker se registra e controla a página; com internet a página vem da rede; sem internet abre do cache e funciona |
| `oxs.js` | exportar dá OXS com um ponto cheio por quadradinho e o ponto reto como ponto atrás; de volta, o mesmo número de pontos e as mesmas linhas; um OXS de outro programa entra na grade certa, com as linhas da DMC do catálogo, avisando do meio ponto; arquivo que não é OXS é recusado |
| `fotos.js` | pôr mais uma foto cria uma peça sem furo que muda de tamanho, deita e recebe imagem; a moldura de ponto reto vai em volta dela; ela fica gravada com a imagem e a moldura presa, e sai no PDF como retângulo; no Instax mini a janela tem 46 × 62 mm com a borda de cima do campo, gravada |
| `gestos.js` | num gráfico colorido, o ajustar acende com a linha escolhida na aba linha; o textMatrix dá a maiúscula na altura pedida, cresce com a altura, alarga com palavra longa e com espaço, sobe com arco, acende mais com traço grosso e sai sem borda vazia; arrastar a palavra com o mouse a leva junto; dois dedos abrindo e fechando aumentam e diminuem a letra |
| `laco2.js` | o laço gira o bloco 15° em volta do meio, com as peças inclinando junto, até 45° e não além, e não gira com a foto laçada; espelhar troca os lados e espelha as peças; o molde fixado fica no topo da estante; Alt solta o ímã e a opção da aba peças o desliga e fica gravada; a foto a mais em Instax tem a janela, deitada também, e o PDF diz onde colá-la |
| `layout.js` | as quatro etapas trocam o painel e os nomes antigos (foto, molde) caem na etapa certa; o menu do logo abre, fecha com Esc e leva aos moldes, à caixa e à ajuda, e o voltar devolve à etapa; as explicações ficam atrás do ? do título e do ? de cada campo; o painel da direita convida sem seleção e mostra nome, tipo e linha da peça; escolher uma linha do molde troca ela em todas as peças; a etapa imprimir avisa dos furos colados; no celular as etapas ficam no pé e a gaveta alterna entre etapa e peça |
| `previa.js` | na etapa imprimir a mesa mostra a folha; a prévia tem tantas folhas quanto o PDF de verdade, num papel A5 (uma) e num A4 com moldura (duas); montar a prévia não baixa nada nem guarda PDF; ver o molde e ver a folha alternam, e fora da etapa a mesa é o molde |
| `padrao.js` | a moldura dá a volta na foto com a margem pedida e centrada nela, refaz-se quando a foto muda de tamanho, usa as linhas da paleta e reabre como foi deixada; a faixa nasce do comprimento do marca-página sem passar da borda, e repetir, espaço, deitada e cores mudam a fileira do jeito que dizem |
| `grafico.js` | a imagem vira paleta de meadas de verdade da cartela pedida, o corte tira o fundo e o olho tira uma linha, mexer na largura NÃO sorteia meadas novas, tocar no catálogo troca só a linha escolhida, e o gráfico sobrevive a reabrir o navegador |
| `grafico.test.js` | cada quadradinho do gráfico sai na cor da sua linha e com a letra dela dentro do quadradinho, molde sem gráfico não ganha letra nenhuma, e a legenda que não cabe no rodapé vira folha inteira |
| `fio.js` | os metros na tela batem com a conta que a própria tela diz fazer, a conta responde ao espaçamento entre furos, e a soma por cor fecha com o total de pontos |
| `teto.js` | o teto do rascunho não deforma o molde: o degrau na fronteira é menor que a variação natural, e o pior caso mantém a grade que tinha sem o teto |
| `cota.js` | com o `localStorage` recusando a escrita, o rodapé avisa em vermelho, a aba moldes diz o que fazer, os dois somem quando volta a caber, e o aviso aparece mesmo numa janela de 360 px, onde o resto do rodapé fica escondido |
| `laco.js` | o laço pega o que couber inteiro dentro dele, a barra diz o que está laçado, as setas e o arraste movem foto e peças sem mudar as distâncias entre elas, a foto segura o bloco na borda do papel, o arraste do bloco é um passo só no desfazer, o botão apaga as peças laçadas de uma vez sem levar a moldura da foto, e o ímã das guias encosta o bloco pela caixa de todos juntos sem desmanchar o arranjo de dentro |
| `traco.js` | o arraste no modo ponto a ponto acende a fileira inteira sem furo mesmo quando o ponteiro pula de uma vez, o primeiro quadradinho decide se o traço acende ou apaga, o traço todo é um passo só no desfazer, e cada quadradinho entra um a um na lista de ajustes que o `ajuste.js` guarda |
| `posicao.js` | as setas andam 0,5 mm (5 com Shift), a rajada vira um passo só no desfazer, a seta dentro de um campo não empurra a peça, e os três botões de alinhar acertam o centro da caixa já girada |
| `papel.js` | digitar uma medida própria não passa por um papel de 1 mm: a guia e a foto ficam onde estavam, a medida fora do limite avisa em vermelho e é acertada ao sair do campo, e o molde volta com o que foi digitado; no Personalizado a orientação não troca largura por altura; foto maior que a folha não encolhe nada e avisa em vermelho nas duas abas e na barra de cima, com as duas medidas, enquanto não couber |
| `guias.js` | a opção abre a cruz no meio do papel, a guia puxada da régua para em milímetro inteiro e some quando volta para a régua, o ímã encosta a peça na guia (e não encosta com a opção desligada), e papel menor não deixa guia medindo mentira |

`amostra.js` não testa nada (e lê os símbolos de `js/base.js`, para não mentir quando eles mudarem): gera um PDF de várias folhas, com quatro linhas
diferentes, para olhar.

## O que não tem teste

Está anotado no [BACKLOG.md](../BACKLOG.md), seção 6. Em resumo: o canvas —
incluindo `textMatrix()`, que transforma o traço da fonte em quadradinhos e é o
coração do app —, a pinça de dois dedos e o arraste de uma peça sozinha, e
qualquer comparação do PDF com uma imagem de referência. Os outros dois
arrastes deixaram essa lista: estão em `traco.js` e `laco.js`.

`tela.js` não tem exceção: qualquer arquivo que falte derruba o teste. Arquivo
faltando ali quer dizer fonte que não chega, e fonte que não chega faz o canvas
desenhar numa cursiva genérica, com o molde saindo errado sem avisar.
