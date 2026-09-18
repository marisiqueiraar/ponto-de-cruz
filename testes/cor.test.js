// Cada peça sai no PDF com a sua linha, e o rodapé diz quais linhas são.
global.window = global; global.navigator = { userAgent: "node" };
const fs = require("fs");
const streams = require("./streams.js");
const { jsPDF } = require(__dirname + "/../vendor/jspdf.umd.min.js");
window.jspdf = { jsPDF };
const noop = new Proxy({}, { get: () => () => {}, set: () => true });
global.document = { createElement: () => ({ width:0, height:0, getContext: () => noop,
  toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" }) };
let handler = null, saida = null;
global.$ = () => ({ addEventListener: (_, f) => { handler = f; } });
function deliver(b){ saida = b; }
function saveName(){ return "m.pdf"; }
function fmt(v){ return (Math.round(v*10)/10).toFixed(1).replace(".", ","); }
function drawPhoto(){}
function itemAtual(){ return null; }   // sem estante: o titulo vem da peca
const paper = { w: 210, h: 297 };
function paperMM(){ return paper; }
const photo = { x: 30, y: 30, w: 100, h: 140 };
function P(){ return 2.5; }
const NOMES = { "#BE5103":"Terracota", "#384959":"Azul noite", "#069494":"Verde agua",
                "#CD1C18":"Pimenta", "#636B2F":"Musgo", "#713600":"Cacau", "#272757":"Meia-noite" };
let thread = "#BE5103";
function threadLabel(hex){ return NOMES[hex] || ""; }
let els = [], sel = 0, totalCount = 10, totalHoles = 20;
eval(fs.readFileSync(__dirname + "/pdfcode.js", "utf8"));

let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };
const bloco = (x, y, cor) => ({ kind:"sym", sym:"heart", scale:1, rot:0, x, y, text:"peça",
  cells: Array.from({length: 8}, () => Array(8).fill(1)),
  color: cor, colorName: NOMES[cor] });

// os operadores "R G B RG" de cada traço. As duas casas decimais do PDF
// arredondam o canal (190/255 volta 191), então a comparação tem folga.
function corDoTraco(stream){
  return [...stream.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) RG/g)].map(m => [+m[1], +m[2], +m[3]]);
}
function temCor(cores, rgb){
  return cores.some(c => c.every((v, i) => Math.abs(v * 255 - rgb[i]) <= 2));
}

(async () => {
  // três peças, três linhas
  els = [bloco(40, 190, "#BE5103"), bloco(80, 190, "#384959"), bloco(120, 190, "#069494")];
  handler();
  let buf = Buffer.from(await saida.arrayBuffer());
  let st = streams(buf).filter(s => s.includes(" re"))[0];
  const cores = corDoTraco(st);
  [[190,81,3], [56,73,89], [6,148,148]].forEach(c =>
    ok(temCor(cores, c), "traço na cor " + c.join(",") + " presente no molde"));
  const texto = streams(buf).join("\n");
  ["Terracota", "Azul noite", "Verde agua"].forEach(n =>
    ok(texto.includes(n), "legenda traz \"" + n + "\""));
  // a legenda leva os metros junto: é com ela na mão que se compra a linha
  const comMetros = (texto.match(/\d+,\d+ m/g) || []);
  ok(comMetros.length >= 3, "e os metros de cada linha (" + comMetros.join(", ") + ")");
  const esperado = linhasUsadas()[0];
  ok(texto.includes(esperado.rotulo),
     "com nome e metros na mesma entrada: \"" + esperado.rotulo + "\"");

  // peça sem cor gravada (molde antigo) cai na cor corrente
  els = [{ kind:"sym", sym:"heart", scale:1, rot:0, x:40, y:190,
           cells: Array.from({length:8}, () => Array(8).fill(1)) }];
  handler();
  buf = Buffer.from(await saida.arrayBuffer());
  st = streams(buf).filter(s => s.includes(" re"))[0];
  ok(temCor(corDoTraco(st), [190,81,3]), "peça sem cor usa a linha corrente");
  ok(streams(buf).join("\n").includes("Terracota"), "e aparece na legenda com o nome dela");

  // duas peças da mesma linha entram uma vez só na legenda
  els = [bloco(40, 190, "#BE5103"), bloco(80, 190, "#BE5103"), bloco(120, 190, "#384959")];
  ok(linhasUsadas().length === 2, "cor repetida não se repete na legenda (deu " + linhasUsadas().length + ")");

  // muitas linhas: o rodapé cresce, mas para de crescer em três alturas.
  // Nomes de catálogo ("DMC 3822 — Straw Light") é que enchem a linha.
  const longos = Object.keys(NOMES).map((c, i) => ({ hex: c, nome: "DMC 38" + (20+i) + " Straw Light" }));
  const alturas = [];
  for (let n = 1; n <= 7; n++){
    els = longos.slice(0, n).map((c, i) => {
      const b = bloco(20 + i * 12, 190, c.hex); b.colorName = c.nome; return b;
    });
    alturas.push(footMM());
  }
  console.log("      rodapé por nº de linhas: " + alturas.map(a => a.toFixed(1)).join(" "));
  ok(alturas[0] === 8, "uma linha só: rodapé de 8 mm, como era");
  ok(alturas.every((a, i) => i === 0 || a >= alturas[i-1]), "o rodapé só cresce");
  ok(Math.max(...alturas) <= 8 + 2 * 4.2 + 1e-9, "e para em três alturas");
  ok(alturas[6] > alturas[0], "com sete linhas de nome longo o rodapé cresceu");

  // o molde ainda cabe: o rodapé maior não pode engolir o desenho
  els = Object.keys(NOMES).map((c, i) => bloco(20 + i * 12, 190, c));
  handler();
  buf = Buffer.from(await saida.arrayBuffer());
  const n = pdfPlan(cropArea()).cols * pdfPlan(cropArea()).rows;
  const pgs = (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  ok(pgs === n, "com " + Object.keys(NOMES).length + " linhas o PDF sai com " + n + " folha(s), e saiu com " + pgs);

  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
