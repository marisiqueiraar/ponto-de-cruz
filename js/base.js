/* ponto & letra — base.js
   Utilidades, os desenhos prontos, o estado do molde e as linhas que você tem.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

var $ = function(id){ return document.getElementById(id); };
var SUPER = 6;   // pixels por quadradinho no rascunho, quando cabe

/* Teto do canvas de rascunho, em pixels.

   O arco desenha a palavra inteira num canvas e depois o dobra, e esse canvas
   cresce com o tamanho da palavra: nos extremos que a interface permite —
   altura 60, arco 120°, uma frase de 46 letras — ele passava de 4 500 px de
   largura e 25 MB. Alguns navegadores de celular recusam canvas acima de
   4 096 px numa dimensão, e o que sai de um canvas recusado é vazio: a peça
   sairia em branco sem nada avisar, que é justamente o modo de falhar que
   este app não pode ter.

   Passando do teto, o rascunho é desenhado com menos pixels por quadradinho.
   A grade de quadradinhos não muda com isso — ela vem da altura escolhida, e
   não da resolução do rascunho —, só o traço fica um pouco mais grosseiro
   antes de virar furo. Melhor um traço mais grosseiro do que uma peça vazia. */
var TETO_CANVAS = 4000;
var ITALIC = { "Cormorant Garamond":1, "EB Garamond":1, "Playfair Display":1 };
function fontStr(size, fam){ return (ITALIC[fam] ? "italic " : "") + size + 'px "' + fam + '", cursive'; }
// milímetro com uma casa: é a precisão com que o molde guarda posição
function dec1(v){ return Math.round(v * 10) / 10; }
function fmt(v){ return (Math.round(v * 10) / 10).toFixed(1).replace(".", ","); }

var SYMS = {
  heart: [".XX...XX.","XXXX.XXXX","XXXXXXXXX","XXXXXXXXX",".XXXXXXX.","..XXXXX..","...XXX...","....X...."],
  heartOutline: [".XX...XX.","X..X.X..X","X...X...X","X.......X",".X.....X.","..X...X..","...X.X...","....X...."],
  star: ["....X....","...XXX...","...XXX...","XXXXXXXXX",".XXXXXXX.","..XXXXX..","..XX.XX..",".XX...XX.","XX.....XX"],
  arrow: ["....X....","...XX....","..X.X....",".X..X....","XXXXXXXXX",".X..X....","..X.X....","...XX....","....X...."],
  folha: [".....XXXX","...XXXXXX","..XXXXXXX",".XXXXXXX.",".XXXXXX..","XXXXXX...","XXXXX....",".XXX.....","X........"],
  coroa: ["X...X...X","X...X...X","XX.XXX.XX","XXXXXXXXX",".XXXXXXX.",".XXXXXXX."],
  lua: ["...XXX...","..XXXXX..",".XXXX....",".XXX.....",".XXX.....",".XXX.....",".XXXX....","..XXXXX..","...XXX..."],
  sol: ["X...X...X",".X..X..X.","..XXXXX..","..XXXXX..","XXXXXXXXX","..XXXXX..","..XXXXX..",".X..X..X.","X...X...X"],
  infinito: [".XX...XX.","X..X.X..X","X...X...X","X..X.X..X",".XX...XX."],
  casa: ["....X....","...XXX...","..XXXXX..",".XXXXXXX.","XXXXXXXXX",".XX...XX.",".XX.X.XX.",".XX.X.XX.",".XXXXXXX."],
  neve: ["....X....","..X.X.X..","X..XXX..X",".X..X..X.","XXXXXXXXX",".X..X..X.","X..XXX..X","..X.X.X..","....X...."],
  boneco: ["...XXX...","..XXXXX..","..XXXXX..","...XXX...","X.XXXXX.X",".XXXXXXX.","XXXXXXXXX","XXXXXXXXX",".XXXXXXX.","..XXXXX.."],
  palmeira: [".XXX.XXX.","XX..X..XX","X..XXX..X","..X.X.X..","....X....","....X....","...X.....","...X.....","...X.....",".XXXXXX..","XXXXXXXXX"],
  guardasol: ["....X....","..XXXXX..",".XXXXXXX.","XXXXXXXXX","X.X.X.X.X","....X....","....X....","....X....","XXXXXXXXX"],
  aviao: ["....X....","....X....","...XXX...","..XXXXX..","XXXXXXXXX","XX.XXX.XX","....X....","...XXX...","..XX.XX.."],
  mala: ["...XXX...","...X.X...","XXXXXXXXX","X.......X","XXXXXXXXX","X.......X","X.......X","XXXXXXXXX",".X.....X."],
  // a flor é a única de 11 × 13: em 9 × 9 desenhei quatro e nenhuma lia como
  // flor — saíram laço, balão, máscara e rosquinha. Nada no código obriga os
  // 9 × 9; só os desenhos antigos é que eram assim.
  flor: ["...XXXXX...","..XXXXXXX..",".XX.XXX.XX.","XX...X...XX","XX..XXX..XX","XX...X...XX",".XX.XXX.XX.","..XXXXXXX..","...XXXXX...",".....X.....","..XX.X.XX..",".XX..X..XX.",".....X....."]
};

// o nome de cada desenho mora aqui, e não espalhado entre o seletor e a
// lista de peças: são os dois lugares que precisam dele, e desencontrado
// deixa a peça na lista chamada "undefined"
var NOMES_SYM = {
  heart: "coração", heartOutline: "coração vazado", star: "estrela", arrow: "seta",
  flor: "flor", folha: "folha", coroa: "coroa", lua: "lua", sol: "sol",
  infinito: "infinito", casa: "casa",
  neve: "floco de neve", boneco: "boneco de neve", palmeira: "palmeira",
  guardasol: "guarda-sol", aviao: "avião", mala: "mala de viagem"
};

/* ---- blocos e motivos: a moldura e a faixa ----------------------------

   Os blocos são os de colcha de retalhos — estrela, cata-vento, losango —,
   que são o que se borda em volta de uma foto. Cada um é desenhado em três
   papéis, e não em três cores: 1 é o fundo do bloco, 2 as pontas, 3 o miolo.
   Quem decide a meada de cada papel é a paleta da peça, e é isso que deixa
   a mesma moldura sair em tons de outono ou em azul e branco sem desenhar
   nada de novo.

   Só se desenha um quarto. O bloco de espelho repete o quarto virado para os
   quatro cantos; o de giro repete o quarto girado, que é o que faz o
   cata-vento rodar em vez de refletir. Um quarto de 5 × 5 dá bloco de
   10 × 10 — a 2,5 mm, 2,5 cm de lado, o tamanho dos blocos de moldura.

   Os motivos de faixa são de uma linha só (X), em quarto de número ímpar: o
   meio não se repete, para o motivo ter um quadradinho de centro e a fileira
   de motivos ficar alinhada pelo eixo do marca-página. */
function quartoEspelho(q, impar){
  var cima = q.map(function(l){
    var v = l.split(""), volta = v.slice().reverse();
    return v.concat(impar ? volta.slice(1) : volta).join("");
  });
  var baixo = cima.slice().reverse();
  return cima.concat(impar ? baixo.slice(1) : baixo);
}
function quartoGiro(q){
  var gira = function(m){   // 90° no sentido do relógio
    var n = m.length, out = [];
    for (var r = 0; r < n; r++){
      var l = "";
      for (var c = 0; c < n; c++) l += m[n - 1 - c].charAt(r);
      out.push(l);
    }
    return out;
  };
  var a = q, b = gira(a), c = gira(b), d = gira(c);
  return a.map(function(l, i){ return l + b[i]; })
          .concat(d.map(function(l, i){ return l + c[i]; }));
}

var BLOCOS = {
  estrela:   { nome: "estrela",           m: quartoEspelho(["11112","11122","11122","12233","22233"]) },
  estrela8:  { nome: "estrela de 8 pontas", m: quartoEspelho(["21112","12122","11223","12233","22333"]) },
  losango:   { nome: "losango",           m: quartoEspelho(["22222","21113","21133","21332","23322"]) },
  cruz:      { nome: "cruz",              m: quartoEspelho(["11122","13122","11122","22233","22233"]) },
  catavento: { nome: "cata-vento",        m: quartoGiro(["21111","22111","22211","22221","22222"]) },
  trilha:    { nome: "trilha",            m: quartoEspelho(["21111","12111","11213","11123","11332"]) },
  moinho:    { nome: "moinho",            m: quartoGiro(["22222","12222","11223","11133","11113"]) },
  flor:      { nome: "flor",              m: quartoEspelho(["11111","12212","12222","11233","12233"]) },
  alianca:   { nome: "aliança",           m: quartoGiro(["11122","11222","12233","22333","22331"]) }
};
var ORDEM_BLOCOS = ["estrela", "catavento", "losango", "estrela8", "moinho",
                    "cruz", "trilha", "flor", "alianca"];

var MOTIVOS = {
  medalhao:   { nome: "medalhão",   m: quartoEspelho([".....X","....XX","...X.X","..X.XX",".X.X.X","XXXXXX"], true) },
  cruzes:     { nome: "cruzes",     m: quartoEspelho(["..X..","..XX.",".X...","XXX.X","...XX"], true) },
  losangos:   { nome: "losangos",   m: quartoEspelho(["...X","..X.",".X.X","X.X."], true) },
  flocos:     { nome: "flocos",     m: quartoEspelho(["X...X","...XX","..X.X",".XXX.","XXX.X"], true) },
  // o ziguezague é o único sem simetria: ele só fecha repetido sem espaço,
  // cada motivo continuando o risco do anterior
  ziguezague: { nome: "ziguezague", m: ["X....",".X...","..X..","...X.","....X","...X.","..X..",".X..."] }
};

// o nome que a lista de peças e o seletor mostram, para qualquer chave
function nomeMotivo(ch){
  if (ch === "sortido") return "blocos sortidos";
  var t = ch.slice(0, 2), k = ch.slice(2);
  if (t === "b:" && BLOCOS[k]) return BLOCOS[k].nome;
  if (t === "m:" && MOTIVOS[k]) return MOTIVOS[k].nome;
  if (t === "s:" && NOMES_SYM[k]) return NOMES_SYM[k];
  return "";
}

var els = [];
var sel = 0;
var photoImg = null, photoURL = null;
/* `off` é o molde sem foto: bordado em tecido, ou em papel que não leva
   foto nenhuma. A foto continua existindo por baixo, com lugar e medida,
   para voltar de onde estava se a pessoa escolher um tamanho de novo; o que
   some é ela na tela, no toque, no PDF e nas contas de caixa. */
var photo = { x: 55, y: 60, w: 100, h: 150, off: false };
var editing = false;
var MODO_MOVER = "Arraste a palavra ou a foto para posicionar, ou arraste no vazio para laçar várias e mover juntas. Dois dedos sobre a peça selecionada aumentam ou diminuem a letra.";
var zoom = 1, fitK = 1, mao = false;   /* vista: escala relativa ao encaixe */
/* As guias: linhas pontilhadas que atravessam a mesa de ponta a ponta, para
   posicionar no olho sem sair torto. Os valores são milímetros de papel — e
   não pixels de tela — porque é isso que as mantém no mesmo centímetro
   depois de um zoom, de um rolar ou de uma janela redimensionada.
   "v" são as que descem, medidas na régua de cima; "h" as que atravessam,
   medidas na régua da esquerda. */
var guias = { on: false, v: [], h: [] };
/* A folga do ímã, em pixels de tela. Em pixels ela é sempre a mesma distância
   para o dedo; em milímetros ficaria larga no zoom pequeno e sumiria no
   grande. Vira milímetros dividindo pela escala da vista, onde é usada. */
var FOLGA_PX = 6;
var foco = "el";   /* "el" | "photo" | "none" — decide a barra de cima */

/* ---- o laço ---------------------------------------------------------
   `marca` diz quais peças estão laçadas e `marcaFoto` diz se a foto veio
   junto. Com um item só é a seleção de sempre, e `sel` continua sendo a
   peça que a barra de cima edita — tudo o que já existia segue igual. Com
   mais de um, o arraste e as setas movem o bloco inteiro.

   O laço não é gravado nem entra no desfazer: ele é para onde se está
   olhando, não o que está no molde. */
var marca = [0];
var marcaFoto = false;
var laco = null;    // o retângulo enquanto o botão está apertado
var totalCount = 0, totalHoles = 0;
var lastPaper = null;

var thread = "#B3B347";

/* ---- catálogos das marcas e as linhas que você tem -------------------
   O catálogo vem de catalogos.js, que é dado puro: marca, código e cor.
   Daqui para baixo fica só o que é seu — a lista do que já está na caixa,
   por chave "marca:codigo". Ela vira a marca "minhas", a primeira da fileira,
   e é assim que a cor de uma linha de verdade entra no molde para ser testada. */
var CAT = [];
var catIdx = {};
var minhas = [];                                   /* chaves, na ordem em que foram marcadas */
var avulsas = {};        /* "avulsa:3" -> {marca, code, hex} — linha que você cadastrou */
var proxAvulsa = 1;
var marcaAtiva = "";

/* O índice é refeito toda vez que as avulsas mudam, e elas entram nele como
   qualquer cor de marca. É por isso que o resto do painel não precisa saber
   que existem: a paleta, a busca e as amostras leem daqui. A marca "avulsas"
   é montada na hora só para elas aparecerem na grade e poderem sair de lá. */
function montaIndice(){
  CAT = (window.CATALOGOS || []).slice();
  catIdx = {};
  var chaves = Object.keys(avulsas);
  if (chaves.length){
    CAT.push({ id: "avulsa", marca: "avulsas", cores: chaves.map(function(k){
      return [k.split(":")[1], avulsas[k].hex];
    })});
  }
  CAT.forEach(function(m){
    m.cores.forEach(function(c){
      catIdx[m.id + ":" + c[0]] = { marca: m.marca, code: c[0], hex: c[1], nome: c[2] || "" };
    });
  });
  chaves.forEach(function(k){          // a avulsa mostra a marca e o código que você escreveu
    catIdx[k] = { marca: avulsas[k].marca, code: avulsas[k].code, hex: avulsas[k].hex, nome: "" };
  });
  // "minhas" é a caixa, não uma marca do catálogo: ela não está no CAT e
  // mesmo assim é uma vista válida da grade
  if (marcaAtiva !== "minhas" &&
      !CAT.filter(function(m){ return m.id === marcaAtiva; }).length)
    marcaAtiva = CAT.length ? CAT[0].id : "";
}
montaIndice();

/* Chave à parte da do molde de propósito, como a da foto: o que você tem na
   caixa é inventário, não desenho. Começar um molde do zero não pode apagar
   a caixa de linhas, e a caixa não deve viajar junto com o arranjo. */
var LINHAS_STORE = "ponto-e-letra/linhas/v1";

// marca e código, sem sobrar espaço quando um dos dois vier vazio numa avulsa
function rotulo(reg){
  return reg ? (reg.marca + " " + reg.code).trim() : "";
}

function nomeLinha(k){ return rotulo(catIdx[k]); }

function salvaLinhas(){
  try {
    localStorage.setItem(LINHAS_STORE,
      JSON.stringify({ v: 1, tenho: minhas, avulsas: avulsas }));
  } catch (e){ /* janela anônima ou cota cheia: seguir sem memória */ }
}

function carregaLinhas(){
  var raw;
  try { raw = localStorage.getItem(LINHAS_STORE); } catch (e){ return; }
  if (!raw) return;
  var s;
  try { s = JSON.parse(raw); } catch (e){ return; }
  if (!s || s.v !== 1) return;
  if (s.avulsas) Object.keys(s.avulsas).forEach(function(k){
    var a = s.avulsas[k];
    if (!a || !/^#[0-9A-Fa-f]{6}$/.test(a.hex || "")) return;
    avulsas[k] = { marca: String(a.marca || "").slice(0, 24),
                   code: String(a.code || "").slice(0, 12),
                   hex: a.hex.toUpperCase() };
    var n = parseInt(String(k).split(":")[1], 10);
    if (n >= proxAvulsa) proxAvulsa = n + 1;
  });
  montaIndice();
  // um código que saiu do catálogo entre uma versão e outra é descartado na
  // volta: sem cor no índice não há o que mostrar nem o que pintar
  if (s.tenho) minhas = s.tenho.filter(function(k){ return !!catIdx[k]; });
}
