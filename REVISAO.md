# Revisão do projeto — 25/11/2026

Pedido: revisar o app inteiro, código incluído, e **listar tudo antes de
consertar qualquer coisa**. O objetivo do app daqui em diante é escolher, peça
por peça, entre **ponto cruz** e **ponto reto** (pontos e retas) para gerar o
molde impresso que vai por cima do papel 300g.

Como foi feita:
- usei o app no Chrome, no tamanho de computador e de celular, aba por aba;
- escrevi a mesma palavra ("Amor jardim") nas 40 fontes, em 10, 16 e 24
  quadradinhos, com o próprio código do app, e comparei lado a lado;
- medi o que acontece com a posição das peças ao mexer em altura, texto, foto
  e papel;
- li o código das partes ligadas ao que você relatou.

Nada foi consertado nesta revisão. Cada item tem uma letra e um número para
você poder responder "pode fazer o A1, o B3 não".

## Situação em 25/11/2026, depois da reforma (branch `claude/reforma`)

| item | situação |
|---|---|
| A1 crescer pelo canto | feito — cresce pelo centro; embaixo da foto, para baixo |
| A2 foto que muda | feito — as peças vão junto |
| A3 papel que muda | feito — o arranjo entra no papel novo quando cabe |
| A4 peça nova em cima da foto | feito — nasce num lugar livre |
| A5 inclinação de -4° | feito — nasce reta |
| A6 furos colados | feito — aviso na barra e região marcada na tela |
| A7 "champ" e o nome do molde | feito — molde nasce vazio, o nome acompanha a palavra |
| A8 campos escondidos na barra | feito — no computador a barra quebra em duas linhas |
| A9 lista de fontes | feito — amostra na altura da peça, lista mais larga |
| A10 ajuste com a linha escolhida | feito |
| B fontes | feito — 5 saíram, altura mínima de cada uma, Dancing Script de fábrica, leitura em nove encaixes (6% menos traço partido) |
| B5 palavra em ponto reto | falta — é a fase do ponto reto |
| C1 um toque, duas coisas | feito — "aplicar na peça" e "minha caixa" separados |
| C2 várias de uma vez | feito — colar os códigos |
| C3 Anchor sem nome | não dá: a marca não nomeia as cores |
| C4 linha de fábrica sem código | feito — vira a meada mais próxima |
| C5 "tenho pouco" / "acabou" | falta — BACKLOG |
| C6 cores da DMC aproximadas | falta — precisa da cartela da DMC |
| D1–D4 medidas | feito — centímetros ao lado de cada número, palavras para traço e sensibilidade, atalhos de espaçamento |
| D5 tamanho real na tela | falta — BACKLOG (precisa calibrar a tela) |
| D6 texto demais | falta — BACKLOG |
| E1 Instax | feito — mini, square e wide |
| E2 papel x folha | feito — folha da impressora A4, A3 ou Carta |
| E3 uma foto só | falta — BACKLOG |
| F1–F3 uso da tela | falta — BACKLOG |
| G1 arquivo único | feito — 15 arquivos em `js/`, `css/app.css` |
| G2 só quadradinho | falta — é a base do ponto reto |
| G3 teste das letras | parcial — `testes/fontes.js` cobre a lista; a qualidade do desenho foi medida à mão |
| G4 layout.html | feito — saiu |
| G5 fontes | feito — 0,89 MB |
| G6 commits no GitHub | feito |
| H ponto reto | falta — próxima fase |

---

## Resumo: o que mais pesa

1. **As peças mudam de lugar sozinhas.** Mexer na altura, na fonte ou no texto
   faz a palavra crescer a partir do canto, e trocar a foto não leva as peças
   junto. É a causa mais provável de você "ficar ajustando muito à mão" (A1, A2).
2. **A fonte que vem de fábrica é das que pior funcionam** em ponto cruz, e
   15 das 40 só ficam legíveis grandes ou não ficam nunca (B).
3. **Escolher linha mistura duas coisas num toque só**: dizer "tenho essa" e
   pintar a peça (C1).
4. **Os números não dizem quanto medem.** Altura em quadradinhos, espaçamento
   escondido em outra aba, traço e sensibilidade sem referência (D).
5. **Papel e foto não cobrem o que você usa**: faltam os tamanhos Instax, e o
   papel da peça (300g) e a folha da impressora (A4) estão misturados no mesmo
   seletor (E).
6. **O ponto reto não existe ainda**, e o código só sabe trabalhar com
   quadradinho: ele vai pedir uma mudança de base, não um botão a mais (G, H).

---

## A. Bugs: o app faz algo errado

**A1. A palavra cresce a partir do canto de cima à esquerda.** Medido: subir a
altura de 16 para 24 desloca o centro da palavra 21 mm para a direita e 10 mm
para baixo; trocar "champ" por "champagne" desloca mais 52 mm. Ou seja: depois
de alinhar, qualquer ajuste desalinha. Só a pinça de dois dedos mantém o
centro; os campos da barra de cima não. (No código: `updateSelected()` refaz a
peça sem recentrar.)

**A2. Trocar o tamanho da foto não leva as peças junto.** A foto cresce para a
direita e para baixo a partir do canto dela, e as peças ficam paradas. Medido:
foto de 10×15 para 15×21, e o nome que estava embaixo da foto passa a ficar em
cima dela.

**A3. Trocar o papel não confere se o resto cabe.** De A4 para A5 com foto de
15×21: a foto fica maior que o papel e a palavra começa 6 mm fora da borda. O
app avisa em vermelho, mas não oferece arrumar.

**A4. Peça nova nasce em cima da borda da foto.** A palavra nasce no canto de
baixo à esquerda, 14 mm acima da base, ou seja, sobre a foto; o símbolo nasce
dentro da foto, no canto de baixo à direita.

**A5. A primeira palavra nasce inclinada -4°**, sem ninguém ter pedido.

**A6. Furo de uma peça pode cair colado no furo de outra, sem aviso.** O app
avisa furo perto da borda do papel, mas não confere a distância entre furos de
peças diferentes. Duas peças encostadas (ou uma moldura e um nome) podem ter
furos a menos de 1 mm, e no papel isso rasga.

**A7. "champ".** Todo molde novo começa com a palavra "champ", e o molde fica
com esse nome mesmo depois de a palavra ser apagada — ele aparece no cabeçalho
do PDF.

**A8. A barra de cima esconde campos.** No computador (1440 px de largura), com
uma palavra selecionada, aparecem texto, fonte, altura, traço e sensibilidade;
espaço, arco e inclinação ficam escondidos para a direita, sem nada dizendo que
a barra rola.

**A9. A lista de fontes não deixa julgar a fonte.** Ela abre estreita, e a
amostra em quadradinhos ao lado de cada fonte é pequena demais para ver se a
letra vai sair boa.

**A10. O ajuste ponto a ponto num gráfico colorido sempre acendia a primeira
linha**, e não a escolhida na aba linha. Já corrigido na branch da moldura
(`claude/moldura-marca-pagina`), que ainda não chegou ao GitHub.

---

## B. Fontes em ponto cruz

As folhas de comparação estão no chat da sessão (mesma palavra, mesmas três
alturas, as 40 fontes).

**Funcionam bem a partir de 12–16 quadradinhos (25):**
Dancing Script, Satisfy, Courgette, Kaushan Script, Pacifico, Yellowtail,
Lobster, Grand Hotel, Norican, Berkshire Swash, Caveat, Marck Script,
Bad Script, Indie Flower, Shadows Into Light, Homemade Apple,
Cedarville Cursive, Cormorant Garamond, EB Garamond, Playfair Display,
Pirata One, Silkscreen, Press Start 2P, Pixelify Sans, VT323.

**Só ficam legíveis grandes, 24 quadradinhos ou mais (10):**
Great Vibes (a de fábrica), Pinyon Script, Allura, Alex Brush, Tangerine,
Italianno, Petit Formal Script, Parisienne, Sacramento, UnifrakturMaguntia.
A 2,5 mm por quadradinho, 24 quadradinhos dão uma maiúscula de 6 cm.

**Não funcionam (5):** League Script (o traço some e vira pontilhado),
Mrs Saint Delafield e Herr Von Muellerhoff (letras se fundem),
Monsieur La Doulaise (o enfeite da maiúscula sai solto, flutuando acima da
palavra), Rouge Script (o laço do "A" vira borrão).

**Por que as letras saem esquisitas**, no código:

- **B1. A altura conta a maiúscula.** Nas caligrafias a minúscula tem um terço
  da maiúscula, então com altura 16 o "a" tem 5 ou 6 quadradinhos — pouco
  demais para uma curva.
- **B2. O quadradinho acende por porcentagem de tinta.** Traço mais fino que um
  quadradinho cai abaixo do limite em alguns lugares e acima em outros, e vira
  pontilhado ou degrau irregular.
- **B3. Não há limpeza depois.** Ponto solto, sem vizinho, continua lá; buraco
  de um quadradinho no meio do traço também.
- **B4. A grade cai onde cair.** Meio quadradinho para o lado muda o desenho
  inteiro, e o app não procura o encaixe que deixa a letra mais limpa.
- **B5. Para palavra cursiva pequena, ponto reto seguindo o traço da letra sai
  muito melhor que ponto cruz.** É o jeito natural de escrever em bordado no
  papel, e é um forte argumento para o item H3.

---

## C. Linhas: o que eu tenho

**C1. Um toque faz duas coisas.** Tocar numa cor do catálogo marca ela como
sua **e** pinta a peça. Para testar uma cor na peça você é obrigada a colocá-la
na sua caixa; tocar de novo tira da caixa, mas a peça continua pintada.

**C2. Não dá para cadastrar várias de uma vez** — por exemplo, colar
"310, 321, 666, 3865" e marcar todas.

**C3. A Anchor não tem nome de cor**, só número, então a busca por nome só
encontra DMC.

**C4. A linha de fábrica (#B3B347) não é de cartela nenhuma**: a primeira
palavra nasce com uma cor que não existe na loja.

**C5. Não há como dizer "tenho pouco" ou "acabou"**: a linha é só tenho / não
tenho.

**C6. As cores da DMC são aproximadas** (tabela pública, não da marca). As da
Anchor foram tiradas da cartela. Em qualquer caso é cor de tela.

---

## D. Tamanhos e referências

**D1. Altura em quadradinhos.** O tamanho em milímetros só aparece na aba
molde. Não dá para dizer "quero a palavra com 3 cm de altura".

**D2. O espaçamento entre furos fica escondido.** Ele está na aba molde, num
controle deslizante, e vale para o molde inteiro. O de fábrica — o que você
usa — é **2,5 mm**. O app não diz que mudar isso muda o tamanho de tudo.

**D3. Traço e sensibilidade são números sem efeito previsível** (2 e 35).
Fariam mais sentido como três escolhas com nome: fino, médio, grosso.

**D4. O tamanho do símbolo é um multiplicador de 1 a 6**, sem medida.

**D5. Não há como ver o tamanho de verdade antes de imprimir.** A tela diz
"100%" para o papel inteiro na tela, não para o tamanho real.

**D6. Texto demais na tela.** A aba peças tem cinco parágrafos antes dos
botões de alinhar; a aba ajuda tem 25 parágrafos corridos.

---

## E. Papel e foto

**E1. Faltam os tamanhos que você usa.** Instax mini (cartão 5,4 × 8,6 cm,
imagem 4,6 × 6,2), Instax square (7,2 × 8,6, imagem 6,2 × 6,2), Instax wide
(10,8 × 8,6, imagem 9,9 × 6,2). Os marca-páginas 5×15, 5×18 e 6×20 entraram
na branch da moldura.

**E2. Papel da peça e folha da impressora estão misturados.** O "papel" do app
é o papel 300g onde se borda. A folha onde o molde é impresso (A4 do escritório)
é outra coisa, e o app deduz uma da outra. Separar as duas deixaria claro, por
exemplo, que um marca-página de 5×18 sai numa A4 com espaço para outros três.

**E3. Uma foto só por molde.** Marca-página com foto embaixo e bordado em cima,
ou cartão com duas fotos, dependem de medida personalizada e de contas à mão.

---

## F. Uso da tela

**F1. No celular a barra de cima ocupa três linhas**, cerca de um terço da
tela, e sobra pouco para o papel.

**F2. Os botões de alinhar ficam no fim da aba peças**, depois dos textos.

**F3. Não há ímã entre peças.** A peça só encosta em guia, e só com as guias
ligadas; não encosta no centro de outra peça nem na borda da foto.

---

## G. Código

**G1. Um arquivo só de 6.500 linhas** (300 KB, 250 funções num bloco único).
Está bem comentado e com cuidado, mas qualquer mudança grande mexe em muitos
lugares ao mesmo tempo.

**G2. O app só conhece quadradinho.** Furos, contagem, desenho na tela, PDF,
conta de fio e ajuste ponto a ponto partem todos das células da peça (34
lugares no código). O ponto reto precisa que cada peça diga o seu tipo de ponto
e que essas partes saibam lidar com os dois.

**G3. Os testes cobrem bem o PDF e a gravação**, mas nenhum confere a
qualidade do desenho das letras, que é justamente onde estão as suas queixas.

**G4. Arquivos que podem sair:** `layout.html` (maquete de arrumação, não é
usada pelo app). O `sw.js` também, mais adiante. A `cartela.html` fica, como
você pediu.

**G5. As 40 fontes somam 1 MB.** Cortar as que não funcionam reduz isso e
encurta a lista.

**G6. Dois commits ainda não chegaram ao GitHub** (moldura, marca-página e
anotações), por falta de acesso desta sessão.

---

## H. O que falta construir

**H1. Tipo de ponto por peça**: cruz ou reto, podendo misturar no mesmo molde.

**H2. Padrões prontos de ponto reto**, para combinar e posicionar: colmeia,
folha com nervuras, sashiko (asanoha, seigaiha), ziguezague, ondas, estrela,
flor de linhas.

**H3. Palavra em ponto reto** seguindo o traço da fonte, com o comprimento do
ponto escolhido.

**H4. Imagem virando contorno em ponto reto.**

**H5. Furos livres**, fora de qualquer grade.

**H6. Moldura e marca-página também com ponto reto** — borda de colmeia,
borda de ondas.

**H7. Vários marca-páginas numa folha A4.**

O que ficou de fora da moldura e do marca-página está no
[BACKLOG.md](BACKLOG.md), seção 5¾.

---

## Decisões que preciso de você

1. **Fontes:** fico com as 25 que funcionam, mais quais das 10 "só grandes"?
   Ou corto as 15 de vez?
2. **Linhas:** separar "tenho essa" de "pintar a peça" em dois gestos — pode
   ser?
3. **Medidas:** centímetros passam a ser a medida principal (altura da letra,
   tamanho do símbolo), com os quadradinhos ao lado?
4. **Papel:** separar "papel da peça" (o 300g) de "folha da impressora" (A4)?
5. **Ordem:**
   - (a) consertar primeiro posição, fontes e referências (A, B, D), depois
     linhas (C), depois ponto reto (H);
   - (b) ponto reto primeiro.
6. **Código:** posso dividir o arquivo único em partes antes do ponto reto, sem
   mudar nada do que você vê? Isso deixa o ponto reto mais seguro de construir.
