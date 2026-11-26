/* ponto & letra — geometria.js
   Caixas, furos, contagem, e o molde repartido em folhas.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

function bboxMM(el){
  if (el.kind === "reto" || el.kind === "foto") return { x: el.x, y: el.y, w: el.w || 1, h: el.h || 1 };
  var p = P();
  return { x: el.x, y: el.y, w: el.cells[0].length * p, h: el.cells.length * p };
}

function localToPaper(el, lx, ly){
  var b = bboxMM(el);
  var a = el.rot * Math.PI / 180;
  var dx = lx - b.w / 2, dy = ly - b.h / 2;
  return {
    x: b.x + b.w / 2 + dx * Math.cos(a) - dy * Math.sin(a),
    y: b.y + b.h / 2 + dx * Math.sin(a) + dy * Math.cos(a)
  };
}

function paperToLocal(el, px, py){
  var b = bboxMM(el);
  var a = -el.rot * Math.PI / 180;
  var dx = px - (b.x + b.w / 2), dy = py - (b.y + b.h / 2);
  return {
    x: b.w / 2 + dx * Math.cos(a) - dy * Math.sin(a),
    y: b.h / 2 + dx * Math.sin(a) + dy * Math.cos(a)
  };
}

// os furos da peça de ponto reto, cada um uma vez — dois caminhos que se
// encontram dividem o furo
function furosReto(el){
  var seen = {}, list = [];
  (el.pontos || []).forEach(function(pt){ pt.furos.forEach(function(f){
    var k = f[0] + "," + f[1];
    if (seen[k]) return;
    seen[k] = 1;
    list.push(localToPaper(el, f[0], f[1]));
  }); });
  return list;
}

// quantos pontos, e quanto fio eles somam na frente, em mm
function pontosReto(el){
  var n = 0, mm = 0;
  (el.pontos || []).forEach(function(pt){
    var f = pt.furos, k = pt.fechada ? f.length : f.length - 1;
    for (var i = 0; i < k; i++){
      var a = f[i], b = f[(i + 1) % f.length];
      mm += Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
      n++;
    }
  });
  return { n: n, mm: mm };
}

function holesOf(el){
  if (el.kind === "reto") return furosReto(el);
  if (el.kind === "foto") return [];
  var p = P(), seen = {}, list = [];
  for (var r = 0; r < el.cells.length; r++){
    for (var q = 0; q < el.cells[r].length; q++){
      if (!el.cells[r][q]) continue;
      for (var dy = 0; dy < 2; dy++){
        for (var dx = 0; dx < 2; dx++){
          var key = (q + dx) + "," + (r + dy);
          if (seen[key]) continue;
          seen[key] = 1;
          list.push(localToPaper(el, (q + dx) * p, (r + dy) * p));
        }
      }
    }
  }
  return list;
}

// quantos quadradinhos de cada linha, dentro de uma peça de paleta. O
// índice é o valor da célula, então `n[0]` é o vazio e não se usa
function contaPorCor(el){
  var n = [];
  for (var r = 0; r < el.cells.length; r++)
    for (var q = 0; q < el.cells[r].length; q++){
      var v = el.cells[r][q];
      if (v) n[v] = (n[v] || 0) + 1;
    }
  return n;
}

function temGrafico(){
  for (var i = 0; i < els.length; i++)
    if (els[i].paleta && els[i].paleta.length) return true;
  return false;
}

function countOf(el){
  if (el.kind === "reto") return pontosReto(el).n;
  if (el.kind === "foto") return 0;
  var n = 0;
  for (var r = 0; r < el.cells.length; r++)
    for (var q = 0; q < el.cells[r].length; q++) if (el.cells[r][q]) n++;
  return n;
}

// a caixa da peça já girada, em mm de papel
/* ---- furos colados ------------------------------------------------------

   Dentro de uma peça os furos guardam o espaçamento, sempre. Entre duas peças
   não há quem garanta nada: um nome encostado na moldura, um símbolo em cima
   de uma palavra, e dois furos caem a um milímetro um do outro. No papel a
   tira entre eles rasga na primeira passada da agulha — e o molde impresso
   não tem como avisar, porque cada furo, sozinho, está certo.

   Furo exatamente no mesmo lugar não é problema: é um furo só, usado pelas
   duas peças. O perigo é o quase — mais perto que 2 mm (ou que 80% do
   espaçamento, num molde mais fino que isso) e mais longe que 0,3 mm.

   A busca é por uma grade do tamanho da distância mínima: cada furo só é
   comparado com os da sua casa e das oito vizinhas, então o custo cresce com
   o número de furos, e não com o quadrado dele. */
var FURO_MIN = 2;          // mm entre furos de peças diferentes
var MESMO_FURO = 0.3;      // mm: mais perto que isso é o mesmo furo

function distMinFuros(){ return Math.min(FURO_MIN, P() * 0.8); }

function furosColados(){
  var D = distMinFuros(), grade = {}, pares = {}, n = 0;
  els.forEach(function(el, i){
    holesOf(el).forEach(function(h){
      var gx = Math.floor(h.x / D), gy = Math.floor(h.y / D);
      for (var dx = -1; dx <= 1; dx++)
        for (var dy = -1; dy <= 1; dy++){
          var casa = grade[(gx + dx) + "," + (gy + dy)];
          if (!casa) continue;
          for (var j = 0; j < casa.length; j++){
            var o = casa[j];
            // dentro de uma peça de ponto cruz os furos guardam o espaçamento;
            // na de ponto reto, não — a palavra pequena aperta a volta do "a"
            if (o.i === i && els[i].kind !== "reto") continue;
            var d = Math.sqrt((h.x - o.x) * (h.x - o.x) + (h.y - o.y) * (h.y - o.y));
            if (d >= D || d < MESMO_FURO) continue;
            n++;
            // cada par de peças guarda a caixa de onde os furos se encostam:
            // é ela que a tela marca, e não furo por furo — centenas de
            // marcas juntas viram uma mancha que esconde os próprios pontos
            var ch = Math.min(i, o.i) + "-" + Math.max(i, o.i);
            var c = pares[ch] || (pares[ch] = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
            c.x0 = Math.min(c.x0, h.x, o.x); c.y0 = Math.min(c.y0, h.y, o.y);
            c.x1 = Math.max(c.x1, h.x, o.x); c.y1 = Math.max(c.y1, h.y, o.y);
          }
        }
      var k = gx + "," + gy;
      (grade[k] = grade[k] || []).push({ x: h.x, y: h.y, i: i });
    });
  });
  return { n: n, d: D,
           pares: Object.keys(pares).map(function(k){
             var c = pares[k], ij = k.split("-").map(Number);
             return { i: ij[0], j: ij[1], x: c.x0, y: c.y0, w: c.x1 - c.x0, h: c.y1 - c.y0 };
           }) };
}

function elPaperBox(el){
  var b = bboxMM(el);
  var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  [[0,0],[b.w,0],[0,b.h],[b.w,b.h]].forEach(function(c){
    var p = localToPaper(el, c[0], c[1]);
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function stitchArea(){
  var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  els.forEach(function(el){
    var b = elPaperBox(el);
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  });
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/* Peça arrastada para fora do papel some do PDF sem dizer nada: o
   `cropArea()` recorta nas bordas do papel e o que ficou de fora não
   aparece. Contar quantas são é o que permite avisar antes de imprimir. */
function pecasForaDoPapel(){
  var pa = paperMM(), n = 0;
  els.forEach(function(el){
    var b = elPaperBox(el);
    if (b.x < -0.01 || b.y < -0.01 || b.x + b.w > pa.w + 0.01 || b.y + b.h > pa.h + 0.01) n++;
  });
  return n;
}

/* A caixa do que vai ser furado: a foto e as peças, sem a folga em volta.
   É ela que não pode encostar na borda que a impressora não alcança. A
   folga pode: não tem furo nenhum ali, e perder um pedaço dela na margem
   não custa um ponto sequer. */
function contentArea(){
  var pa = paperMM();
  var sa = stitchArea();
  var minX = photo.x, minY = photo.y, maxX = photo.x + photo.w, maxY = photo.y + photo.h;
  // sem foto, só as peças contam; sem peça também, sobra um ponto no meio
  // do papel, que é caixa vazia e não pede moldura em lugar nenhum
  if (photo.off){
    minX = maxX = pa.w / 2; minY = maxY = pa.h / 2;
    if (sa){ minX = sa.x; minY = sa.y; maxX = sa.x + sa.w; maxY = sa.y + sa.h; }
  } else if (sa){
    minX = Math.min(minX, sa.x); minY = Math.min(minY, sa.y);
    maxX = Math.max(maxX, sa.x + sa.w); maxY = Math.max(maxY, sa.y + sa.h);
  }
  // o que passou da borda do papel é recortado fora de qualquer jeito
  minX = Math.max(0, minX); minY = Math.max(0, minY);
  maxX = Math.min(pa.w, maxX); maxY = Math.min(pa.h, maxY);
  return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) };
}

/* ---- o que a moldura tracejada cerca ---------------------------------

   A folha inteira, e não a caixa do desenho. Molde recortado rente ao
   desenho só se prende mirando o retângulo da foto; molde do tamanho do
   papel se prende borda com borda, que é a mira que a mão acerta.

   O preço é o cabeçalho: ele come 46 mm da página, e uma moldura do tamanho
   da folha nunca cabe embaixo dele. Então o texto passa a sair numa página
   só dele e o molde fica sozinho na seguinte — duas páginas, uma folha de
   molde só, a mesma troca que o molde grande já fazia.

   O que não se paga é folha de molde a mais. Furo colado na borda do papel
   não cabe nem na folha nua, e aí o papel inteiro sairia repartido onde o
   desenho sozinho saía inteiro: emendar duas folhas com a mão é pior do que
   recortar mirando a foto. Só nesse caso a moldura volta a ser a caixa do
   desenho com 8 mm de folga, que é como sempre foi. */
function cropJusto(){
  var pa = paperMM(), c = contentArea(), pad = 8;
  var minX = Math.max(0, c.x - pad), minY = Math.max(0, c.y - pad);
  var maxX = Math.min(pa.w, c.x + c.w + pad), maxY = Math.min(pa.h, c.y + c.h + pad);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function cropFolha(){
  var pa = paperMM();
  return { x: 0, y: 0, w: pa.w, h: pa.h };
}

function folhasDe(R){
  var pl = pdfPlan(R, contentArea());
  return pl.cols * pl.rows;
}

function cropArea(){
  var justo = cropJusto();
  if (justo.w <= 0 || justo.h <= 0) return justo;   // nada para imprimir
  var folha = cropFolha();
  return folhasDe(folha) <= folhasDe(justo) ? folha : justo;
}

// a moldura pegou o papel todo: quem recorta está cortando na borda da folha
function folhaCheia(R){
  var pa = paperMM();
  return R.w >= pa.w - 0.01 && R.h >= pa.h - 0.01;
}

// a folha do PDF: 10 mm de margem lateral, 46 mm de cabeçalho e 8 mm embaixo.
// a tela e o PDF decidem por aqui se cabe, para nunca discordarem.
var PDF_SIDE = 10, PDF_TOP = 46, PDF_FOOT = 8, FOOT_LINHA = 4.2;

/* A folha da impressora não é o papel da peça. O papel é onde se borda — o
   300g, o cartão, o marca-página; a folha é onde o PDF sai, na impressora
   do escritório. Antes a folha era sempre A4, escrita como 210 e 297 em
   doze lugares; agora ela é escolhida na aba papel, e toda conta de caber
   passa por aqui. `land` deita a folha. */
var FOLHAS = {
  a4:    { id: "a4",    nome: "A4",    w: 210,   h: 297,   jspdf: "a4" },
  a3:    { id: "a3",    nome: "A3",    w: 297,   h: 420,   jspdf: "a3" },
  carta: { id: "carta", nome: "Carta", w: 215.9, h: 279.4, jspdf: "letter" }
};
var folhaAtual = FOLHAS.a4;
function folhaW(land){ return land ? folhaAtual.h : folhaAtual.w; }
function folhaH(land){ return land ? folhaAtual.w : folhaAtual.h; }

/* Quanto rodapé a legenda das linhas pede. A conta é feita sem o jsPDF,
   porque quem pergunta se o molde cabe é a tela, a cada desenho, e ela não
   tem documento nenhum na mão. Helvetica de 7 pt não passa de 1,45 mm por
   caractere; superestimar sobra rodapé, subestimar comeria o molde. A folha
   estreita decide, para a conta valer nas duas orientações. */
function legendaLinhas(){
  var usadas = linhasUsadas();
  if (!usadas.length) return 1;
  var util = folhaW(false) - PDF_SIDE * 2;
  var n = 1, x = 0;
  usadas.forEach(function(c){
    var w = 9 + c.rotulo.length * 1.45;
    if (x > 0 && x + w > util){ n++; x = 0; }
    x += w;
  });
  return Math.min(n, 3);   // passou de três linhas, o rodapé come o molde
}
function footMM(){ return PDF_FOOT + (legendaLinhas() - 1) * FOOT_LINHA; }

/* Se o rodapé deu conta de escrever a legenda inteira. Mede com a mesma
   régua que `legenda()` usa para escrever — a do próprio PDF —, porque
   `legendaLinhas()` estima a largura por número de caracteres e essa
   estimativa erra para mais e para menos. */
function legendaCoube(pdf, plano, usadas){
  var comLetra = temGrafico();
  var util = plano.pageW - PDF_SIDE * 2;
  var x = 12, linha = 1, max = legendaLinhas();
  pdf.setFontSize(7);
  for (var i = 0; i < usadas.length; i++){
    var w = 9.5 + pdf.getTextWidth((comLetra ? usadas[i].letra + "  " : "") + usadas[i].rotulo);
    if (x > 12 && x - 12 + w > util){
      if (linha >= max) return false;
      linha++; x = 12;
    }
    x += w;
  }
  return true;
}

/* ---- várias na mesma folha --------------------------------------------

   Um marca-página de 5 × 18 cm sai numa A4 sozinho, e sobra folha para mais
   três. Quantos cabem é uma grade simples: a área útil da folha (embaixo do
   cabeçalho, em cima do rodapé) dividida pelo papel da peça mais 6 mm de
   folga para a tesoura. A folha deita quando deitada couberem mais. */
var COPIA_GAP = 6;

/* O que o papel da peça pede além da medida: quantas cópias saem na mesma
   folha e que outros moldes vão junto, o raio dos cantos e se leva o furo da
   fita — o recorte de um marca-página. Moram com o molde, como o papel. */
var papelCopias = 1, papelJunto = [], papelCantos = 0, papelFita = 0;
// a cor do papel 300g em que a peça vai ser bordada: só a mesa e o PNG a
// mostram — o molde do PDF sai na folha comum da impressora, que é branca
var papelCor = "#FFFFFF";

/* A janela da imagem no Instax. A Fujifilm publica o tamanho do cartão e o
   da imagem, mas não como a sobra se divide em cima e embaixo — a borda de
   baixo, a grossa, é onde se segura. Os lados são iguais (a conta fecha), e a
   borda de cima é um campo da aba foto, com 6 mm de partida, para medir uma
   vez com a régua na foto de verdade. Deitada, a borda de cima fica à esquerda. */
var INSTAX = { "54x86": [46, 62], "72x86": [62, 62], "108x86": [99, 62] };
var instaxTopo = 6;

function janelaInstax(){
  if (photo.off) return null;
  var v = ($("photoSize") || {}).value, j = INSTAX[v];
  if (!j) return null;
  var q = v.split("x"), W0 = +q[0], H0 = +q[1];
  var lado = (W0 - j[0]) / 2, topo = Math.max(0, Math.min(H0 - j[1], instaxTopo));
  if ($("photoOr").value === "l") return { x: photo.x + topo, y: photo.y + lado, w: j[1], h: j[0] };
  return { x: photo.x + lado, y: photo.y + topo, w: j[0], h: j[1] };
}

var numerarPontos = 0;   // a ordem dos pontos de ponto reto, numerada no PDF
var FITA_DIAM = 5, FITA_DIST = 12;   // mm: o furo da fita e a distância dele à borda

// o furo da fita, no meio do lado curto de cima (ou da esquerda, deitado)
function furoFita(){
  var pa = paperMM();
  return pa.w <= pa.h ? { x: pa.w / 2, y: FITA_DIST, r: FITA_DIAM / 2 }
                      : { x: FITA_DIST, y: pa.h / 2, r: FITA_DIAM / 2 };
}

function gradeCopias(R, land){
  var W = folhaW(land), H = folhaH(land), g = COPIA_GAP;
  var uw = W - PDF_SIDE * 2, uh = H - PDF_TOP - footMM();
  var cols = Math.max(0, Math.floor((uw + g) / (R.w + g))), rows = Math.max(0, Math.floor((uh + g) / (R.h + g)));
  return { land: land, cols: cols, rows: rows, n: cols * rows, pageW: W, pageH: H };
}
function copiasCabem(R){
  var a = gradeCopias(R, false), b = gradeCopias(R, true);
  return b.n > a.n ? b : a;
}

function pdfFit(R){
  var land = R.w > R.h;
  var pageW = folhaW(land), pageH = folhaH(land);
  var maxW = pageW - PDF_SIDE * 2, maxH = pageH - PDF_TOP - footMM();
  return { land: land, pageW: pageW, scale: Math.min(1, maxW / R.w, maxH / R.h) };
}

/* ---- o molde repartido em folhas ------------------------------------

   Molde reduzido para caber numa folha é molde errado: o furo sai fora do
   lugar e isso só se descobre com a agulha na mão, depois de colar a foto.
   Então o que não cabe numa folha sai em várias, sempre em tamanho real.

   Folhas vizinhas repetem pelo menos SOBRA mm do desenho. É essa faixa
   repetida que deixa sobrepor uma na outra até os furos coincidirem —
   emendar topo a topo pede uma precisão de tesoura que ninguém tem. */
var TILE_TOP = 49, SOBRA = 10;

/* ---- quando o texto é que não cabe ----------------------------------

   O cabeçalho come 46 mm de altura e o rodapé mais 8. Um molde que ocupa
   quase toda a folha na tela cabe no papel e não cabe embaixo do texto —
   e saía repartido em duas folhas por causa das instruções, não do
   desenho. Repartir aí é o pior dos mundos: obriga a emendar um molde que
   era inteiro.

   Então o texto muda de folha. A primeira leva o cabeçalho, a régua e a
   legenda; a segunda leva o molde sozinho, inteiro e em tamanho real,
   centrado na página. São duas páginas, mas uma folha de molde só.

   PDF_BLEED é a borda que a impressora doméstica não alcança — 5 mm cobre
   o que as comuns comem. Molde que não cabe nem nela continua repartido:
   aí é o desenho que é maior que a folha, e não tem texto que resolva. */
var PDF_BLEED = 5;

/* `C` é a caixa do que vai ser furado, dentro de `R`. A região inteira
   precisa caber na folha, e o furo mais de fora precisa ficar a PDF_BLEED
   da borda — a folga em volta dele pode ser comida pela impressora à
   vontade. Sem `C`, a conta é a conservadora: a região inteira é tratada
   como se fosse toda furo.

   Em pé primeiro; empatou, a folha acompanha a direção do molde. */
function cabeSolta(R, C){
  if (!C) C = R;
  var op = R.w > R.h ? [true, false] : [false, true];
  for (var i = 0; i < op.length; i++){
    var w = folhaW(op[i]), h = folhaH(op[i]);
    if (R.w > w + 1e-9 || R.h > h + 1e-9) continue;
    var cx = (w - R.w) / 2 + (C.x - R.x), cy = (h - R.h) / 2 + (C.y - R.y);
    // a menor das quatro bordas até o furo, descontada a que a impressora come:
    // é o que ainda sobra, e o número que a tela mostra
    var folga = Math.min(cx, cy, w - cx - C.w, h - cy - C.h) - PDF_BLEED;
    if (folga >= -1e-9)
      return { land: op[i], pageW: w, pageH: h, folga: folga };
  }
  return null;
}

function nFolhas(medida, util){
  if (medida <= util) return 1;
  return Math.ceil((medida - SOBRA) / (util - SOBRA));
}

// as folhas ficam distribuídas por igual, e não empilhadas num canto com a
// última sobrando: assim a faixa repetida é a mesma em todas as emendas.
function inicios(medida, util, n){
  if (n <= 1) return [0];
  var passo = (medida - util) / (n - 1), a = [];
  for (var i = 0; i < n; i++) a.push(i * passo);
  return a;
}

function pdfPlan(R, C){
  var um = pdfFit(R);
  if (um.scale >= 1)
    return { tiled: false, capa: false, land: um.land, pageW: um.pageW, top: PDF_TOP,
             cols: 1, rows: 1, tw: R.w, th: R.h, xs: [0], ys: [0] };

  // não coube embaixo do cabeçalho, mas cabe na folha nua: o texto sai de cima
  var solta = cabeSolta(R, C);
  if (solta)
    return { tiled: false, capa: true, land: solta.land, pageW: solta.pageW,
             top: (solta.pageH - R.h) / 2, folga: solta.folga,
             cols: 1, rows: 1, tw: R.w, th: R.h, xs: [0], ys: [0] };

  function grade(land){
    var uw = folhaW(land) - PDF_SIDE * 2;
    var uh = folhaH(land) - TILE_TOP - footMM();
    var cols = nFolhas(R.w, uw), rows = nFolhas(R.h, uh);
    return { land: land, uw: uw, uh: uh, cols: cols, rows: rows, n: cols * rows };
  }
  // menos folhas ganha; empatou, a folha fica na direção do molde
  var ret = grade(false), dei = grade(true);
  var g = (dei.n < ret.n || (dei.n === ret.n && R.w > R.h)) ? dei : ret;
  return {
    tiled: true, capa: false, land: g.land, pageW: folhaW(g.land), top: TILE_TOP,
    cols: g.cols, rows: g.rows,
    tw: Math.min(g.uw, R.w), th: Math.min(g.uh, R.h),
    xs: inicios(R.w, g.uw, g.cols), ys: inicios(R.h, g.uh, g.rows)
  };
}
