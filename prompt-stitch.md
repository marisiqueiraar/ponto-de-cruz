# Prompt de contexto — ponto & letra (para Google Stitch)

> Como usar: cole o **BLOCO 1** como primeira mensagem no Stitch (ele define o produto e o
> sistema visual). Depois peça uma tela por vez com os blocos 3 e 4, um por mensagem.
> Escolha o modo **Mobile** para os prompts do bloco 3 e **Web** para os do bloco 4.

---

## BLOCO 1 — Contexto do produto (cole primeiro)

Estou redesenhando a interface de um app chamado **ponto & letra**. Preciso da sua ajuda com
layout e melhoria de UI/UX de navegação, em duas versões: **web (desktop)** e **app (mobile)**.
Toda a interface é em **português do Brasil**.

**O que o produto faz (em uma frase):** gera um *molde de furos em tamanho real* para bordar
ponto-cruz por cima de uma foto revelada colada num papel.

**O fluxo físico real da pessoa usuária** (isso explica cada decisão de UI):
1. Ela escolhe um papel de fundo (A4, A5, A3, 20×30, 15×20, quadrado ou medida própria).
2. Escolhe o tamanho em que a foto será revelada (10×15, 9×13, 13×18, 15×21, quadrado,
   polaroid ou medida própria) e posiciona esse retângulo sobre o papel.
3. Escreve uma ou mais palavras e/ou adiciona símbolos (coração cheio, coração vazado,
   estrela, seta) e posiciona essas peças por cima da foto/papel, podendo inclinar e
   redimensionar.
4. Baixa um **PDF em tamanho real** com os furinhos do molde, imprime, recorta pela moldura
   tracejada, prende com fita sobre a foto já colada no papel, e fura ponto a ponto com agulha.
5. Borda com linha de meada por cima dos furos.

**Por que a escala é sagrada:** o PDF precisa sair a 100%. Se a área do molde não couber numa
A4 em tamanho real, o PDF sairia reduzido e **os furos não batem com a foto** — o trabalho é
perdido. Hoje esse aviso crítico é um parágrafo de texto cinza no meio da página, fácil de
não ver. Ele precisa virar um elemento de status impossível de ignorar.

**Características técnicas que limitam o design:**
- É um site estático de **um único arquivo HTML**, sem build, sem backend, sem contas e sem
  login. Funciona offline. Não invente telas de cadastro, nuvem, colaboração ou notificações.
- Todo o trabalho é salvo automaticamente no `localStorage` do próprio navegador (um único
  projeto por vez, hoje). Não existe "meus projetos" — mas essa é uma melhoria que quero
  avaliar.
- O centro da tela é um **canvas** que desenha o papel, o retângulo da foto (a imagem aparece
  a 22% de opacidade, é só guia) e os pontos do bordado como quadradinhos.
- Interação hoje: arrastar a peça ou a foto com o dedo/mouse, pinça de dois dedos para
  redimensionar a peça selecionada, e um "modo de ajuste ponto a ponto" onde cada toque
  acende ou apaga um quadradinho.
- Saídas: **PDF do molde** (a entrega principal), **PNG da prévia** e um botão **Recalcular**
  que refaz as peças a partir dos controles (e por isso descarta os ajustes manuais).

**Quem usa:** pessoas que bordam sobre foto, majoritariamente no celular, muitas vezes com a
tela suja de fio e a mão ocupada, e depois vão para o computador só na hora de imprimir.
Não são pessoas de software: os termos são de artesanato (papel, foto, peça, furo, ponto,
linha, meada), nunca de design gráfico (nada de "layer", "canvas", "asset", "export").

### Sistema visual atual (manter a identidade, pode refinar)

- Fundo/papel: `#EDF4FB` · Tinta principal: `#384959` · Tinta suave: `#6A89A7`
- Acento azul: `#88BDF2` · Linhas e bordas: `#C9DCEF` · Fundo do quadro do canvas: `#DCE9F6`
- Destaque/estado ativo: amarelo limão `#FFE566` (com `#B3B347` para a borda) — é a assinatura
  da marca, aparece como um traço sólido embaixo do título.
- Perigo/atenção: `#BE5103`
- Tipografia de títulos e botões: uma **mono pixelada** (CS Norman Mono / Silkscreen), em caixa
  baixa, tamanho pequeno, com leve espaçamento entre letras. Texto corrido: sans-serif do
  sistema.
- Cantos arredondados discretos (6–8 px), botões de 46 px de altura, campos de 44 px.
- Tom geral: papelaria, sóbrio, azul-acinzentado com um amarelo ácido. Não é "app de design
  profissional" nem infantil.

### Os 8 problemas de navegação que quero que você resolva

1. **Tudo é uma coluna só.** Hoje são cerca de 20 controles empilhados numa coluna de 660 px,
   com o canvas no meio. Mexer num controle que está fora da tela não mostra o resultado.
2. **Não existe noção de etapa.** Papel → foto → peças → linha → imprimir é um fluxo real,
   mas está apresentado como um formulário plano.
3. **A prévia some.** Ao rolar até os controles de baixo (inclinação, espaçamento entre furos,
   paleta), o canvas sai da tela — justamente os controles cujo efeito só se entende olhando.
4. **O aviso de escala é invisível.** "Não cabe numa A4, o PDF sairia a 78%" é a informação
   mais importante do app e está num parágrafo cinza.
5. **Ações destrutivas sem rede de proteção.** "Excluir peça" e "Recalcular" (que apaga todos
   os ajustes manuais feitos ponto a ponto) são botões comuns, sem confirmação e sem desfazer.
6. **O modo de ajuste ponto a ponto é desconfortável.** Cada quadradinho tem ~2,5 mm na escala
   real; no celular o alvo de toque é minúsculo, não há zoom, não há pincel e o único aviso de
   que o modo está ligado é o texto de uma dica mudar.
7. **Escolher a fonte é às cegas.** São 40 famílias num `<select>` agrupado por caráter
   (caligrafia fina, cursiva encorpada, letra de mão, serifada itálica, gótica, pixel e bloco).
   A pessoa não vê o traço antes de escolher — e o traço é o que vira o molde.
8. **O desktop desperdiça a tela.** A mesma coluna estreita de celular, centralizada, com muito
   espaço vazio dos dois lados.

### O que eu quero de você

Layouts de alta fidelidade, em português, que resolvam esses oito pontos: uma versão **mobile**
pensada para uma mão só, com a prévia sempre visível, e uma versão **desktop** de editor com
painéis. Mantenha a paleta e a tipografia acima. Não adicione funcionalidades que exijam
servidor.

---

## BLOCO 2 — Inventário de controles (cole junto do bloco 1 se couber, ou logo depois)

Estes são todos os controles existentes. Redistribua-os como fizer sentido, mas não invente
outros nem remova nenhum sem me avisar:

**Papel de fundo:** Tamanho (lista de 7 opções) · Orientação (retrato/paisagem) · Largura em mm
e Altura em mm (só quando "Personalizado").

**Foto:** Tamanho impresso (lista de 7 opções) · Orientação · Largura/Altura em mm (só quando
"Personalizado") · Imagem (upload opcional, só para visualizar) · botões "Girar foto",
"Centralizar foto", "Centralizar em cima".

**Peças bordadas:** lista das peças criadas em forma de chips selecionáveis · "Nova palavra" ·
"Novo símbolo" · "Excluir peça".

**Quando a peça é palavra:** Texto (campo livre) · Fonte (40 opções em 7 grupos) · Altura em
pontos (8 a 60) · Espessura do traço (0 a 12) · Sensibilidade em % (10 a 80).

**Quando a peça é símbolo:** Desenho (coração cheio, coração vazado, estrela, seta) ·
Tamanho (1× a 6×).

**Para qualquer peça:** Inclinação (-45° a 45°) · Espaçamento entre furos (1 a 6 mm, padrão
2,5 mm — vale para o molde inteiro, não só para a peça).

**Linha:** Paleta (8 paletas nomeadas: Zesty lemon, Golden taupe, Retro sunset, Stormy morning,
Mossy hollow, Blue eclipse, Chili spice, Chocolate truffle) · Cor da linha (4 amostras
circulares por paleta, com nome em português: Limão escuro, Terracota, Azul noite, Musgo...).

**Números mostrados o tempo todo:** Pontos · Furos · Tamanho da peça selecionada em cm ·
Área do molde em cm e se cabe numa A4 em tamanho real.

**Ações finais:** "Ajustar ponto a ponto" (liga/desliga um modo) · "Baixar molde PDF" ·
"Baixar prévia PNG" · "Recalcular".

**Instruções do arquivo ao material:** cinco parágrafos curtos explicando como colar a foto na
medida do cabeçalho do PDF, recortar pela moldura tracejada, furar com agulha grossa apoiado
em EVA, bordar com 2 ou 3 fios, e por que não se deve usar espaçamento abaixo de 2 mm.

---

## BLOCO 3 — Telas mobile (uma mensagem por tela, modo Mobile)

### 3.1 Tela principal do editor (a mais importante)

Crie a tela principal do editor do ponto & letra para celular. A prévia do molde precisa
ocupar a metade de cima da tela e **nunca sair de vista**: ela fica fixa no topo, como um
quadro de papel azul-claro (`#DCE9F6`) com a folha branca e sombra suave dentro. Abaixo dela,
uma faixa fina com três números lado a lado — Pontos, Furos e o tamanho da peça selecionada em
centímetros.

Logo abaixo da faixa, um **indicador de escala** que é o elemento de status mais forte da tela:
quando está tudo certo, é discreto e diz "Área do molde 12,4 × 9,1 cm · cabe em A4 em tamanho
real" com um ponto verde; quando não cabe, vira um bloco de atenção em `#BE5103` dizendo
"não cabe em A4 — o PDF sairia a 78% e os furos não vão bater", com um botão de ação ao lado
sugerindo aproximar as peças da foto.

A metade de baixo é uma **gaveta de controles** que sobe e desce por arraste, com quatro abas
fixas no rodapé, na mono pixelada e em caixa baixa: **papel · foto · peças · linha**. Só os
controles da aba ativa aparecem. Acima das abas, uma barra de ação persistente com o botão
amarelo-limão **baixar molde PDF** à direita e um botão fantasma de menu à esquerda (que abre
prévia PNG, recalcular e as instruções).

Mostre a aba **peças** ativa: a lista horizontal de peças criadas como chips (um selecionado,
em azul-escuro sólido), com um chip "+" no fim; e abaixo os controles da peça de texto — o
campo Texto, o seletor de Fonte, e os controles deslizantes de Altura em pontos, Espessura do
traço e Sensibilidade.

Paleta: fundo `#EDF4FB`, tinta `#384959`, bordas `#C9DCEF`, destaque `#FFE566`, títulos e
botões numa mono pixelada em caixa baixa.

### 3.2 Seletor de fonte

Crie a tela de escolha de fonte do ponto & letra para celular, que se abre como uma folha
subindo de baixo, cobrindo cerca de 85% da altura. No topo, o campo de busca e, abaixo dele,
uma fileira de filtros roláveis em forma de chip com os grupos: todas · caligrafia fina ·
cursiva encorpada · letra de mão · serifada itálica · gótica · pixel e bloco.

A lista é de **cartões grandes de amostra**: cada cartão mostra a palavra que a pessoa está
bordando de verdade (por exemplo "amor") desenhada naquela fonte, em tamanho grande, com o
nome da família em letra pequena embaixo, e — o detalhe importante — a mesma palavra
pixelada ao lado, do jeito que ela vira furos no molde, para a pessoa ver o resultado real
antes de escolher. A fonte atualmente selecionada tem borda azul-escura e um traço amarelo
limão. Rodapé com um botão único "usar esta fonte".

### 3.3 Modo de ajuste ponto a ponto

Crie a tela do modo de ajuste ponto a ponto do ponto & letra para celular. Ao entrar nesse
modo a interface inteira muda de estado, de forma inequívoca: uma barra de contexto amarelo
limão no topo com o texto "ajustando ponto a ponto" e um botão "terminar" à direita, e a
gaveta de controles some, dando quase a tela inteira para a grade ampliada.

A grade aparece com zoom, os quadradinhos com no mínimo 44 px de alvo de toque, com uma
retícula clara entre eles e a foto ao fundo bem apagada. Um controle flutuante no canto
inferior direito alterna entre três ferramentas em ícones: **acender**, **apagar** e **mover
a vista**. No rodapé, um controle deslizante de zoom e, do lado esquerdo, dois botões
circulares de **desfazer** e **refazer** — ambos com o contador de quantos passos restam.

Acima do rodapé, um aviso discreto e permanente: "o botão Recalcular refaz as peças a partir
dos controles e descarta estes ajustes".

### 3.4 Primeiro acesso / criar molde

Crie a tela de primeiro acesso do ponto & letra para celular: um assistente curto de três
passos que aparece só na primeira vez, com indicador de progresso em três traços no topo.
Mostre o passo 1, **papel**: título "que papel você vai usar?", um grid de cartões grandes
com miniaturas proporcionais de cada formato (A4, A5, A3, quadrado 20×20, 20×30, 15×20,
personalizado), cada cartão com o nome e a medida em centímetros embaixo, e o alternador
retrato/paisagem como um par de botões segmentados. Rodapé com "pular" à esquerda e
"continuar" em amarelo limão à direita. Abaixo do título, uma linha de apoio explicando em
uma frase por que isso importa: "é o papel onde a foto vai ser colada e onde o molde vai
encostar".

### 3.5 Exportar / imprimir

Crie a tela de exportação do ponto & letra para celular, aberta como folha de baixo. No topo,
uma prévia da folha do PDF em miniatura, mostrando o cabeçalho com as medidas de colagem, a
moldura tracejada de recorte e os furos. Abaixo, três blocos de informação em linhas
destacadas: **tamanho real confirmado (100%)**, **cole a foto a 5,5 cm da borda esquerda e
6,0 cm do topo**, e **1.284 furos**. Depois, um bloco de instrução em passos numerados curtos:
imprimir sem ajustar a escala, recortar pela moldura tracejada, prender com fita crepe nos
quatro cantos alinhando o retângulo da foto, furar com agulha grossa sobre EVA. Rodapé com
dois botões: **baixar molde PDF** em amarelo limão, e **baixar prévia PNG** como botão
fantasma.

---

## BLOCO 4 — Telas desktop (uma mensagem por tela, modo Web)

### 4.1 Editor em três painéis

Crie a versão web para desktop do editor do ponto & letra, em três colunas, aproveitando toda
a largura da tela. Fundo geral `#EDF4FB`.

**Coluna da esquerda, 300 px:** os ajustes do molde, em seções recolhíveis com títulos na mono
pixelada em caixa baixa — **papel** (tamanho, orientação, medidas próprias), **foto** (tamanho
impresso, orientação, arquivo de imagem, e os três botões de girar, centralizar e centralizar
em cima), e **linha** (seletor de paleta e as quatro amostras circulares com o nome da cor).

**Centro, elástico:** a área de trabalho, um quadro `#DCE9F6` com a folha branca centralizada,
o retângulo da foto pontilhado e os pontos do bordado. Sobre ela, no canto superior esquerdo,
uma barra de ferramentas flutuante horizontal: selecionar, mover a foto, ajustar ponto a ponto,
desfazer, refazer. No canto inferior direito, controle de zoom com percentual e um botão de
"encaixar na tela". Ao longo da borda de cima e da esquerda do quadro, **réguas em
centímetros** — o app inteiro é sobre medida real, então a régua não é enfeite.

**Coluna da direita, 320 px:** em cima, a **lista de peças** em linhas verticais (não chips),
cada linha com o texto ou o nome do símbolo, a medida em cm, e ações de duplicar e excluir; a
selecionada em destaque com barra amarelo limão à esquerda. Abaixo, os controles da peça
selecionada: texto, fonte (um botão largo que mostra a palavra desenhada na própria fonte, não
um menu suspenso), altura em pontos, espessura do traço, sensibilidade, inclinação e
espaçamento entre furos.

**Barra superior de 56 px** atravessando tudo: à esquerda a marca "ponto & letra" com o traço
amarelo limão; no centro, o indicador de escala — "12,4 × 9,1 cm · cabe em A4 em tamanho real"
com ponto verde, ou o alerta laranja quando não cabe; à direita os números Pontos e Furos e o
botão sólido **baixar molde PDF**.

**Rodapé de 32 px:** à esquerda, "salvo automaticamente neste navegador" com o horário do
último salvamento; à direita, "recalcular" e "prévia PNG" como links discretos.

### 4.2 Desktop — modo de ajuste ponto a ponto

Crie a variação da tela anterior com o modo de ajuste ponto a ponto ativo. A coluna da
esquerda recolhe, a área de trabalho se expande e entra em zoom alto sobre a peça selecionada.
A barra superior ganha uma faixa amarelo limão de contexto com "ajustando ponto a ponto" e o
botão "terminar ajuste". A coluna da direita troca de conteúdo: ferramentas (acender, apagar,
pincel de tamanho 1 a 3 quadradinhos), um histórico de passos com desfazer por item, e o aviso
de que Recalcular descarta os ajustes. Mostre a grade ampliada com a retícula visível, alguns
quadradinhos acesos em azul-escuro e a foto de fundo bem apagada.

### 4.3 Desktop — diálogo de confirmação de Recalcular

Crie o diálogo modal de confirmação do botão Recalcular do ponto & letra, na versão web.
Modal centralizado e estreito, sobre um véu escuro. Título na mono pixelada: "recalcular as
peças?". Corpo explicando que as peças serão refeitas a partir dos controles e que os ajustes
feitos ponto a ponto serão perdidos, com a contagem — "você ajustou 47 quadradinhos à mão".
Dois botões no rodapé: "cancelar" como botão fantasma e "recalcular" em laranja `#BE5103`.
Abaixo dos botões, uma opção secundária discreta: "recalcular só a peça selecionada".

### 4.4 Desktop — instruções "do arquivo ao material"

Crie a página de instruções do ponto & letra na versão web, acessível pela barra superior,
apresentada como um painel lateral largo que desliza da direita sobre o editor. Título "do
arquivo ao material". Cinco passos numerados, cada um com um desenho esquemático simples à
esquerda e o texto à direita: colar a foto usando a medida do cabeçalho do PDF, recortar pela
moldura tracejada e prender com fita crepe nos quatro cantos, furar ponto a ponto com agulha
grossa apoiada em EVA ou cortiça, bordar com 2 ou 3 fios de meada puxando devagar onde o furo
atravessa a foto, e a nota sobre espaçamento — entre 2,5 e 3 mm é o mais seguro, abaixo de
2 mm a tira de papel entre dois furos vira pó. Esta última em bloco de atenção.

---

## BLOCO 5 — Perguntas para fazer ao Stitch depois dos layouts

Cole estas depois de ter as telas, uma por vez:

1. "A prévia fixa no topo do mobile come metade da tela. Me mostre uma alternativa em que a
   gaveta de controles é translúcida e a prévia ocupa a tela inteira por baixo — e me diga
   qual das duas você acha melhor para quem mexe em controle deslizante e precisa ver o efeito."
2. "Proponha como as quatro abas do mobile (papel · foto · peças · linha) poderiam virar três,
   sem esconder controle nenhum."
3. "O indicador de escala precisa funcionar em três estados: cabe, não cabe, e cabe mas por
   pouco. Me mostre os três lado a lado."
4. "Redesenhe a barra de ferramentas flutuante do desktop considerando que só existem cinco
   ferramentas e que a pessoa não é usuária de software de design."
5. "Hoje só existe um molde salvo por vez no navegador. Me mostre como seria uma tela de
   'meus moldes' com cartões de miniatura, sabendo que não há conta nem nuvem — é tudo local
   e pode ser apagado se a pessoa limpar os dados do site."
