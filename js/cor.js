/* ponto & letra — cor.js
   Cor: Lab, k-médias e o casamento de cor com meada de cartela.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

function hexRGB(hex){
  var h = hex.replace("#", "");
  return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
}

/* Letra na cor da própria linha, escurecida até dar para ler. Amarelo claro
   sobre papel branco não se lê, e o molde impresso tem de ser legível antes
   de ser bonito — a cor ali serve de conferência, a letra é o que manda. */
function corLegivel(hex){
  var c = hexRGB(hex);
  var lum = (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) / 255;
  if (lum <= 0.45 || lum <= 0) return c;
  var f = 0.45 / lum;
  return [Math.round(c[0] * f), Math.round(c[1] * f), Math.round(c[2] * f)];
}

/* ---- a imagem em várias linhas -------------------------------------

   Uma linha por peça é silhueta, e silhueta é o que uma foto não é. Para a
   imagem sair como ela é, a peça carrega a sua própria paleta: `el.paleta` é
   a lista das linhas dela, e cada quadradinho guarda o índice da linha em
   vez de um liga-desliga.

   Zero continua sendo vazio. É essa escolha que deixa o resto do app
   ignorar que existe cor: a conta de furos, o corte das bordas, o espelhar,
   o contorno do laço e o modo ponto a ponto só perguntam "tem ponto aqui?",
   e um índice de paleta responde que sim do mesmo jeito que o 1 respondia.

   A letra de cada linha é o que faz o molde funcionar impresso em preto e
   branco — e é assim que ele sai da impressora de casa quase sempre. Cor no
   papel é conferência; a letra é o que se lê. As confundíveis ficam de fora:
   I parece 1, O parece 0, Q parece O. */
var LETRAS = "ABCDEFGHKLMNPRSTUVWXYZ".split("");
var CORES_MAX = 20;

function srgbLin(v){
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/* Lab de D65. A distância tinha de ser a que o olho enxerga: em RGB, dois
   verdes vizinhos ficam tão longe um do outro quanto um azul de um roxo, e
   a linha casada sairia pela cor errada — sempre para o lado do verde, que
   é onde o RGB mais mente. */
function labDe(r, g, b){
  var R = srgbLin(r), G = srgbLin(g), B = srgbLin(b);
  var x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  var y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
  var z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  var f = function(t){ return t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116; };
  var fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

var labCache = {};
function labHex(hex){
  if (!labCache[hex]){
    var c = hexRGB(hex);
    labCache[hex] = labDe(c[0], c[1], c[2]);
  }
  return labCache[hex];
}

function dLab(a, b){
  var d0 = a[0] - b[0], d1 = a[1] - b[1], d2 = a[2] - b[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}

/* k-médias em Lab, com as sementes escolhidas pelo ponto mais distante do
   que já foi semeado. Semente sorteada é o normal, e aqui seria errado duas
   vezes: ela deixa duas cores caírem no mesmo tom, e faz a mesma imagem com
   o mesmo número de cores dar paletas diferentes a cada volta — mexer na
   largura e voltar traria outras linhas, sem nada ter mudado. Determinístico
   é requisito, não capricho. */
function kmedias(pts, n){
  if (pts.length <= n) return pts.map(function(p){ return p.lab.slice(); });
  var cent = [], i, j;
  var maior = pts[0];
  for (i = 1; i < pts.length; i++) if (pts[i].peso > maior.peso) maior = pts[i];
  cent.push(maior.lab.slice());
  var perto = pts.map(function(p){ return dLab(p.lab, cent[0]); });
  while (cent.length < n){
    var alvo = 0, melhor = -1;
    for (i = 0; i < pts.length; i++){
      // o peso entra na escolha da semente: um pixel perdido de cor exótica
      // não merece uma linha inteira da paleta só por estar longe de tudo
      var v = perto[i] * Math.sqrt(pts[i].peso);
      if (v > melhor){ melhor = v; alvo = i; }
    }
    if (melhor <= 0) break;
    cent.push(pts[alvo].lab.slice());
    for (i = 0; i < pts.length; i++){
      var d = dLab(pts[i].lab, cent[cent.length - 1]);
      if (d < perto[i]) perto[i] = d;
    }
  }
  // vinte voltas: daí em diante os grupos param de trocar de dono, e o que
  // sobra é decimal que nenhuma linha de bordado distingue
  for (var volta = 0; volta < 20; volta++){
    var soma = [], peso = [];
    for (j = 0; j < cent.length; j++){ soma.push([0, 0, 0]); peso.push(0); }
    for (i = 0; i < pts.length; i++){
      var dono = 0, dd = 1e18;
      for (j = 0; j < cent.length; j++){
        var e = dLab(pts[i].lab, cent[j]);
        if (e < dd){ dd = e; dono = j; }
      }
      soma[dono][0] += pts[i].lab[0] * pts[i].peso;
      soma[dono][1] += pts[i].lab[1] * pts[i].peso;
      soma[dono][2] += pts[i].lab[2] * pts[i].peso;
      peso[dono] += pts[i].peso;
    }
    var mexeu = false;
    for (j = 0; j < cent.length; j++){
      if (!peso[j]) continue;
      var novo = [soma[j][0] / peso[j], soma[j][1] / peso[j], soma[j][2] / peso[j]];
      if (dLab(novo, cent[j]) > 0.01) mexeu = true;
      cent[j] = novo;
    }
    if (!mexeu) break;
  }
  // grupo que ficou sem ninguém não vira linha: paleta com cor que não
  // aparece no desenho manda comprar meada para nada
  return cent;
}

// as linhas entre as quais a paleta escolhe: uma marca inteira, ou só o que
// você já tem na caixa
function linhasFonte(fonte){
  var lista = [];
  if (fonte === "minhas"){
    minhas.forEach(function(k){ if (catIdx[k]) lista.push({ chave: k, reg: catIdx[k] }); });
    return lista;
  }
  CAT.forEach(function(m){
    if (m.id !== fonte) return;
    m.cores.forEach(function(c){
      var k = m.id + ":" + c[0];
      if (catIdx[k]) lista.push({ chave: k, reg: catIdx[k] });
    });
  });
  return lista;
}

/* Cada cor do desenho vira a linha mais próxima que ainda não foi usada. O
   "ainda não usada" é o que importa: duas cores vizinhas caindo na mesma
   meada deixariam a legenda repetida e o gráfico com um tom a menos do que
   diz ter. Quem escolhe primeiro é o grupo com mais quadradinhos, que é o
   que mais se vê no bordado pronto. */
function casaPaleta(cent, pesos, fonte){
  var linhas = linhasFonte(fonte);
  if (!linhas.length) linhas = linhasFonte("anchor");
  var ordem = cent.map(function(c, i){ return i; })
                  .sort(function(a, b){ return (pesos[b] || 0) - (pesos[a] || 0); });
  var usadas = {}, saida = [];
  ordem.forEach(function(i){
    var melhor = null, dd = 1e18, repescagem = null, dr = 1e18;
    for (var j = 0; j < linhas.length; j++){
      var d = dLab(cent[i], labHex(linhas[j].reg.hex));
      if (d < dr){ dr = d; repescagem = linhas[j]; }
      if (usadas[linhas[j].chave]) continue;
      if (d < dd){ dd = d; melhor = linhas[j]; }
    }
    // acabaram as linhas livres — cartela pequena, ou "minhas" com menos
    // cores do que o gráfico pede. Repete, e a junção logo abaixo funde as
    // duas num tom só em vez de mentir duas linhas iguais na legenda
    var esc = melhor || repescagem;
    usadas[esc.chave] = 1;
    saida[i] = { lab: cent[i].slice(), chave: esc.chave, hex: esc.reg.hex,
                 rotulo: rotulo(esc.reg), off: 0 };
  });
  return saida;
}


/* A cor mora na peça, não no molde inteiro. É vendo duas peças com as duas
   linhas de verdade, lado a lado no arranjo, que a escolha se decide — e o
   catálogo das marcas só serve para isso se der para usar mais de uma.

   `thread` continua existindo como a cor corrente: a que a próxima peça
   nasce usando, e a que vale para as peças gravadas antes desta mudança,
   que não têm cor nenhuma dentro delas. */
function corDe(el){
  if (el && el.color)
    return { hex: el.color, nome: el.colorName || threadLabel(el.color) || el.color };
  return { hex: thread, nome: threadLabel(thread) || thread };
}
