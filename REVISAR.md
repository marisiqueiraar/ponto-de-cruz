# Revisar

O que precisa do seu olho antes de virar coisa fechada, em 18/09/2026, depois
das dez levas desta sessão:

| | |
|---|---|
| `8841ad9` | molde em várias folhas + régua de aferição |
| `2d6b7f8` | cor por peça + legenda no PDF |
| `f515c68` | estante de moldes + arquivo `.json` |
| `70413d7` | este documento e o `BACKLOG.md` |
| `a88fa84` | fonte fantasma removida |
| `d036d8a` | setas, alinhar, aviso de peça fora do papel |
| `3d09ea8` | arco, espaçamento, espelhar, seis símbolos |
| `621b11f` | fio por linha, com a conta à mostra |
| `3edfdc9` | a revisão do backlog, com o que ela mediu |
| `94eb73e` | teto do rascunho, aviso de memória, flor, alinhar com a de cima |
| `41217c9` | esses quatro descritos no README e na ajuda |

Nada aqui é bug conhecido — bug conhecido está no [BACKLOG.md](BACKLOG.md).
Aqui é o que eu decidi sozinho e você pode querer diferente, e o que nenhum
teste meu consegue responder.

---

## 1. ~~A fonte CS Norman Mono~~ — resolvido

O seletor oferecia `CS Norman Mono (arquivo seu)` no grupo **Pixel e bloco**, e
os três arquivos que o `@font-face` pedia nunca existiram no repositório. Medido
no Chromium, a família não carregava e o canvas caía na cursiva genérica — "AMOR"
media 300 px nas duas, contra 313 da Silkscreen. A opção devolvia uma cursiva
com rótulo de fonte pixelada, e o molde saía desenhado do traço errado.

Você mandou tirar. Saíram a opção, o `@font-face` e a menção no `--display`,
que agora pede a Silkscreen direto — que era o que já acontecia na prática, só
que sem três requisições falhando a cada abertura.

Peça gravada apontando para fonte que não está mais na lista volta como
Great Vibes. As células voltam como foram gravadas, então o desenho na tela não
muda; muda o que o seletor mostra e o que um **Recalcular** usaria.

O `testes/tela.js` não tem mais exceção nenhuma: **qualquer** arquivo que falte
derruba o teste. Arquivo faltando ali quer dizer fonte que não chega, e fonte
que não chega é o modo de falhar que o README inteiro foi escrito para evitar.

Se um dia a CS Norman Mono aparecer, o caminho é o das outras 40: o arquivo em
`fonts/`, um `@font-face` como os vizinhos, a opção no grupo, e a licença em
`fonts/LICENCAS.txt`.

---

## 2. O que nenhum teste meu alcança: imprimir

Verifiquei muita coisa lendo os operadores de dentro do PDF, mas papel de
verdade responde três perguntas que o node não responde:

- **A régua de aferição.** Imprima uma folha em 100% e meça os 50 mm com uma
  régua. Se não der 50 mm, a régua está errada ou a impressora mentiu — e é
  justamente para separar esses dois casos que ela existe.
- **A emenda.** Faça um molde maior que uma A4, recorte duas folhas vizinhas
  pela moldura tracejada e sobreponha até os furos coincidirem. Eu provei que
  as duas folhas desenham os mesmos pontos nas mesmas coordenadas de papel; o
  que não sei é se a faixa repetida é **larga o bastante para a mão**.
- **O furo.** O círculo de 0,3 mm de raio, impresso, é visível o suficiente
  para furar em cima? Era 0,3 mm antes também, mas antes nunca tinha saído em
  tamanho real numa folha grande.

Mandei dois PDFs de amostra no chat da sessão. `testes/amostra.js` gera outros.

---

## 3. Decisões que tomei sozinho

Cada uma tem uma alternativa defensável. Se alguma estiver errada para você, é
barato trocar.

### 3.1 A sobra entre folhas é distribuída por igual

As folhas ficam espalhadas por igual sobre o molde, então toda emenda repete a
mesma faixa. Num molde de 42 cm em duas folhas, isso deu **59 mm repetidos** —
generoso para emendar, gasto de tinta e papel.

A alternativa é empilhar as folhas num canto com o mínimo de 10 mm em cada
emenda, e deixar a última sobrando quase vazia. Menos tinta, emenda mais
apertada. Escolhi a folga porque o erro caro aqui é a emenda que não fecha.

### 3.2 A orientação é escolhida pelo número de folhas

Ganha quem gastar menos folha; empatou, a folha acompanha a direção do molde.
Um molde A4 inteiro, por exemplo, sai em **3 folhas deitadas** em vez de 4 em
pé. Se você preferir sempre em pé, é uma linha.

### 3.3 A legenda das linhas se repete em toda folha

Porque cada folha é recortada e usada sozinha. Se achar poluição, dá para
deixar só na primeira.

### 3.4 Apagar um molde usa o `confirm()` do navegador

O app tem modal próprio (o do Recalcular), mas ele é feito sob medida para três
botões daquele caso. Usei o `confirm()` nativo, como o `alert()` que já existe
no caminho do PDF. Se quiser o modal do app, é mais trabalho e fica bonito.

### 3.5 Molde novo herda papel e foto do anterior

Só as peças e a posição zeram. Começar outro molde no mesmo papel me pareceu o
caso comum. Se preferir tudo em branco, é fácil.

### 3.6 A cor no PDF perde duas casas decimais

As mesmas duas casas que derrubaram o arquivo de 4 MB para 289 KB arredondam a
cor: `190` volta como `191` num canal. É 0,4%, invisível, e a legenda leva o
código da marca de qualquer jeito. Registro porque é perda de informação real,
ainda que sem consequência.

### 3.7 As duas suposições da conta de fio

A frente é geometria: duas diagonais de p√2 por ponto cheio, sem dúvida
possível. As outras duas parcelas eu escolhi:

- **O avesso, 2p por ponto.** Vem da ordem de bordar um ponto cheio de cada vez
  — sobe em A, desce em D, sobe em C, desce em B —, em que o fio anda dois
  lados do quadradinho por trás. Quem borda em fileiras (todas as pernas de um
  lado, depois as do outro) gasta menos; quem pula de um canto a outro do
  desenho gasta mais.
- **A perda, 15%.** Começos, remates e a ponta curta que não dá para usar.

As duas estão escritas na tela, com os números do espaçamento escolhido, para
quem lê poder discordar. Se a sua experiência disser outro número, são duas
constantes no código.

**Não converto para meadas** de propósito: isso depende do comprimento da meada
de cada marca, e eu não tenho essa medida de fonte confiável. A tela diz o que
dá para dizer com certeza — uma meada de 6 fios desfiada em pares rende três
vezes o comprimento dela.

### 3.8 Subi os testes para dentro do repositório

**Esta é a decisão que mais quero que você confirme.** Escrevi os testes numa
pasta temporária da sessão, que some quando o contêiner é recolhido — e os
commits que eu já tinha subido afirmam "verifiquei rodando no node". Afirmação
que ninguém pode conferir não vale nada, então trouxe tudo para `testes/`.

Isso muda o caráter do projeto: era um arquivo só, sem build e sem pasta de
teste. Agora tem uma pasta com quinze arquivos — dez conjuntos de teste, o
extrator, o runner e um leia-me. Se você não quiser esse peso, `rm -rf testes/`
e as linhas dele no `.gitignore` resolvem, e o app continua exatamente o mesmo:
nada em `index.html` depende deles.

---

## 4. ~~Risco conhecido que virou maior~~ — consertado

**Gravar falhava em silêncio, e com vários moldes falhava mais fácil.**

O `saveState()` engolia o erro de cota (`catch (e){ return; }`), o que fazia
sentido quando havia um molde só. Com vários, cada um com a sua foto de
300–500 KB, os 5 MB típicos do `localStorage` dão para oito ou dez moldes — e ao
estourar, o trabalho simplesmente parava de ser gravado sem ninguém avisar.

Você mandou seguir, e está feito: o rodapé fica vermelho dizendo "não coube na
memória" e a aba moldes escreve o caminho. Os detalhes estão no
[BACKLOG.md](BACKLOG.md), item 2.

**O que sobrou para você decidir:** a cota continua sendo a cota. O aviso diz
que encheu, mas ninguém aumenta 5 MB. A saída de verdade é o arquivo do molde,
e vale pensar se o app deveria insistir mais nisso — oferecer o download
sozinho quando a memória encher, por exemplo, em vez de só recomendar.

---

## 5. A altura passou a ser a da maiúscula — e isso é uma escolha

Você disse duas coisas: que a altura não dizia o que significava, e que palavras
pedidas iguais saíam de tamanhos diferentes. As duas tinham a mesma causa. A
altura era a **caixa de tinta da palavra escrita** — a distância do ponto mais
alto ao mais baixo daquela palavra, naquela fonte. Como "amor" não sobe nem
desce e "alegria" faz as duas coisas, pedir 18 nas duas dava letras de tamanhos
bem diferentes: na segunda, os 18 quadradinhos eram repartidos com o "l" e o
"g", e só sobrava o miolo para as letras.

Passei a medir na **fonte**, e não na palavra: a altura é a da letra maiúscula.
A mesma altura passa a dar sempre a mesma letra, e o que ascende e desce passa
do número pedido, em vez de espremer o resto.

**O que você pode querer diferente:**

- **A referência.** Escolhi a maiúscula. As outras candidatas eram a caixa da
  fonte inteira (`fontBoundingBox`), que varia demais entre famílias — medi de
  103 a 175 unidades nas nove que testei, contra 63 a 89 da maiúscula —, e a
  altura do "x", que deixaria as maiúsculas grandes demais em quem escreve nome
  com inicial. Pela maiúscula, trocar de fonte mantém o tamanho parecido, que é
  a outra metade da despadronização que você viu.
- **O número ficou menor para palavra minúscula.** Em cursiva, a minúscula é
  muito mais baixa que a maiúscula: "amo" numa altura 24 de Great Vibes sai com
  11 linhas de tinta. É coerente, mas é uma régua diferente da que você tinha na
  mão. Se preferir que o número continue sendo "o tamanho que a palavra vai
  ter", é uma linha de código — e volta a inconsistência junto.
- **Os moldes antigos.** O número velho é convertido uma vez, na volta, pela
  razão entre a caixa de tinta daquela palavra e a maiúscula da fonte: as peças
  continuam do tamanho em que foram desenhadas e o número na barra é que muda.
  Conferi com um molde no formato antigo (`testes/ajuste.js`): 24 virou 29, e a
  peça refeita saiu com 25 linhas de tinta, contra as 24 de antes — a diferença
  é arredondamento de quadradinho, não de desenho.
- **O padrão de fábrica** virou 16, que é o 18 antigo convertido. O molde em
  branco abre com a mesma grade de sempre: 36 × 18 quadradinhos, medido nas duas
  versões.

E a terceira parte: **palavra nova nasce com o que está na barra de cima**, em
vez de nascer sempre com os valores de fábrica. Era isso que fazia a segunda
linha de um nome sair de outro tamanho mesmo com os controles à vista dizendo o
contrário. Só a primeira palavra de um molde em branco usa os valores de
fábrica, porque aí não há de onde herdar.
