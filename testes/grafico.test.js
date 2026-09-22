// O gráfico colorido dentro do PDF.
//
// Uma peça com paleta tem várias linhas dentro dela, e o molde impresso
// precisa dizer qual vai em que quadradinho. São três promessas:
//   1. cada quadradinho sai traçado na cor da SUA linha, e não na da peça;
//   2. cada quadradinho leva a letra da linha, que é o que sobrevive a uma
//      impressora preto e branco — e ela não aparece num molde sem gráfico;
//   3. a legenda que não cabe no rodapé vira folha, inteira, sem truncar.
global.window = global; global.navigator = { userAgent: "node" };
const fs = require("fs");
const streams = require("./streams.js");
const { jsPDF } = require(__dirname + "/../vendor/jspdf.umd.min.js");
window.jspdf = { jsPDF };
const noop = new Proxy({}, { get: () => () => {}, set: () => true });
global.document = { createElement: () => ({ width:0, height:0, getContext: () => noop,
  toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" }) };
let saida = null;
global.$ = () => ({ addEventListener: () => {} });
function deliver(b){ saida = b; }
function saveName(){ return "m.pdf"; }
function fmt(v){ return (Math.round(v*10)/10).toFixed(1).replace(".", ","); }
function drawPhoto(){}
function itemAtual(){ return null; }
const paper = { w: 210, h: 297 };
function paperMM(){ return paper; }
const photo = { x: 30, y: 30, w: 100, h: 140 };
function P(){ return 2.5; }
let thread = "#BE5103";
function threadLabel(hex){ return hex === "#BE5103" ? "Terracota" : ""; }
let els = [], sel = 0, totalCount = 10, totalHoles = 20;
eval(fs.readFileSync(__dirname + "/pdfcode.js", "utf8"));

let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

function corDoTraco(stream){
  return [...stream.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) RG/g)].map(m => [+m[1], +m[2], +m[3]]);
}
function temCor(cores, rgb){
  return cores.some(c => c.every((v, i) => Math.abs(v * 255 - rgb[i]) <= 2));
}
function folhaDoMolde(buf){
  return streams(buf).filter(st => /\/I\d+ Do/.test(st))[0];
}
// o que o PDF escreve, dentro dos parênteses dos operadores de texto
function textos(stream){
  return [...stream.matchAll(/\((.*?)\)\s*Tj/g)].map(m => m[1]);
}

/* Uma peça de gráfico: três faixas, uma linha em cada. As células guardam o
   índice da linha na paleta, e não um liga-desliga — é essa a diferença
   inteira entre uma peça de uma cor e uma de várias. */
function grafico(nCores){
  var pal = [
    { lab:[50,60,40], hex:"#CD1C18", chave:"anchor:13",  rotulo:"Anchor 13",  off:0 },
    { lab:[60,-10,50], hex:"#636B2F", chave:"anchor:846", rotulo:"Anchor 846", off:0 },
    { lab:[30,10,-40], hex:"#272757", chave:"anchor:152", rotulo:"Anchor 152", off:0 }
  ].slice(0, nCores);
  var cells = [];
  for (var r = 0; r < 12; r++){
    var linha = [];
    for (var q = 0; q < 12; q++) linha.push((Math.floor(r / 4) % pal.length) + 1);
    cells.push(linha);
  }
  return { kind:"img", nome:"boneco", cores: pal.length, larg: 12, rot: 0,
           x: 40, y: 190, cells: cells, paleta: pal, paletaDe: pal.length,
           color: "#BE5103", colorName: "Terracota" };
}

(async () => {
  // ---- 1. cada quadradinho na cor da sua linha --------------------------
  els = [grafico(3)];
  montaPDF();
  let buf = Buffer.from(await saida.arrayBuffer());
  let molde = folhaDoMolde(buf);
  const cores = corDoTraco(molde);
  [[205,28,24], [99,107,47], [39,39,87]].forEach(c =>
    ok(temCor(cores, c), "traço na cor " + c.join(",") + " sai do gráfico"));
  ok(!temCor(cores, [190, 81, 3]),
     "e a cor da peça não aparece: quem manda é a paleta, não o el.color");

  // ---- 2. a letra de cada linha em cada quadradinho ---------------------
  const escritos = textos(molde);
  ["A", "B", "C"].forEach(function(l){
    ok(escritos.indexOf(l) >= 0, "a letra " + l + " está escrita no molde");
  });
  const quantosA = escritos.filter(t => t === "A").length;
  ok(quantosA === 48, "uma letra por quadradinho daquela linha (A: " + quantosA + " de 48)");

  /* E cai DENTRO do quadradinho dela. Letra certa no lugar errado é pior do
     que letra nenhuma: quem borda segue a letra, e uma que escorregou para o
     quadradinho vizinho põe a meada errada ali sem nada avisar.

     A caixa de cada quadradinho sai das duas diagonais que o PDF acabou de
     traçar para ele — o X do ponto —, e a posição da letra sai do `Td` que
     vem logo depois. Sem reimplementar a conta: o que se compara é o que o
     arquivo tem dentro. */
  const dentro = (function(){
    var corpoM = +(molde.match(/\/F\d+ ([\d.]+) Tf/) || [0, 0])[1];
    var largGlifo = corpoM * 0.72, altGlifo = corpoM * 0.72;   // maiúscula de helvetica
    var recuo = 2.5 * 2.8346 * 0.22;   // o mesmo recuo que o X usa dentro do quadradinho
    var re = /([\d.]+) ([\d.]+) m\s+([\d.]+) ([\d.]+) l|([\d.]+) ([\d.]+) Td/g;
    var m, pts = [], fora = 0, total = 0;
    while ((m = re.exec(molde))){
      if (m[1] != null){
        pts.push([+m[1], +m[2]], [+m[3], +m[4]]);
        if (pts.length > 4) pts = pts.slice(-4);
        continue;
      }
      if (pts.length < 4) continue;
      total++;
      var xs = pts.map(function(p){ return p[0]; }), ys = pts.map(function(p){ return p[1]; });
      // as diagonais são traçadas recuadas; o quadradinho inteiro é elas mais
      // o recuo de volta, dos dois lados
      var x0 = Math.min.apply(null, xs) - recuo, x1 = Math.max.apply(null, xs) + recuo;
      var y0 = Math.min.apply(null, ys) - recuo, y1 = Math.max.apply(null, ys) + recuo;
      // o Td é o canto de baixo à esquerda do glifo: dali ele cresce para a
      // direita e para cima
      var tx = +m[5], ty = +m[6];
      if (tx < x0 || tx + largGlifo > x1 || ty < y0 || ty + altGlifo > y1) fora++;
    }
    return { fora: fora, total: total };
  })();
  ok(dentro.total > 100 && dentro.fora === 0,
     "e cada letra cai dentro do quadradinho dela (" + dentro.total +
     " conferidas, " + dentro.fora + " fora)");
  const corpo = (molde.match(/\/F\d+ ([\d.]+) Tf/) || [])[1];
  ok(+corpo >= 3.2, "num corpo que dá para ler no papel (" + corpo + " pt)");

  // a legenda do rodapé traz a mesma letra, senão a letra no molde não
  // significa nada
  const tudo = streams(buf).join("\n");
  ok(/A\s+Anchor 13|Anchor 13/.test(tudo), "a legenda traz a linha da letra A");

  // ---- 3. molde sem gráfico continua sem letra --------------------------
  els = [{ kind:"sym", sym:"heart", scale:1, rot:0, x:40, y:190, text:"peça",
           cells: Array.from({length:8}, () => Array(8).fill(1)),
           color:"#BE5103", colorName:"Terracota" }];
  montaPDF();
  buf = Buffer.from(await saida.arrayBuffer());
  const semGrafico = textos(folhaDoMolde(buf)).filter(t => /^[A-Z]$/.test(t));
  ok(semGrafico.length === 0,
     "molde de uma cor por peça não ganha letra nenhuma (achou: " + semGrafico.join(",") + ")");

  // ---- 4. legenda grande vira folha, inteira ----------------------------
  const muitas = [];
  for (var i = 0; i < 16; i++){
    var h = "#" + ((i * 0x0F1E3D + 0x304060) & 0xFFFFFF).toString(16).padStart(6, "0");
    muitas.push({ lab:[i * 5, i * 3 - 20, 40 - i * 4], hex: h.toUpperCase(),
                  chave: "anchor:" + (100 + i), rotulo: "Anchor " + (100 + i), off: 0 });
  }
  var cells = [];
  for (var r = 0; r < 16; r++){
    var linha = [];
    for (var q = 0; q < 16; q++) linha.push((r % muitas.length) + 1);
    cells.push(linha);
  }
  els = [{ kind:"img", nome:"muitas", cores:16, larg:16, rot:0, x:40, y:120,
           cells: cells, paleta: muitas, paletaDe: 16,
           color:"#BE5103", colorName:"Terracota" }];
  const usadas = linhasUsadas();
  ok(usadas.length === 16, "dezesseis linhas no molde (" + usadas.length + ")");
  montaPDF();
  buf = Buffer.from(await saida.arrayBuffer());
  const inteiro = streams(buf).join("\n");
  ok(/Linhas do molde/.test(inteiro), "a folha de legenda foi impressa");
  const faltando = usadas.filter(l => inteiro.indexOf(l.nome) < 0);
  ok(faltando.length === 0,
     "e traz todas as linhas, sem truncar (faltaram: " + faltando.length + ")");
  ok(/legenda inteira na ultima folha/.test(inteiro),
     "e o rodapé aponta para ela em vez de só cortar a lista");

  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
