global.window = global; global.navigator = { userAgent: "node" };
const fs = require("fs");
const streams = require("./streams.js");
const { jsPDF } = require(__dirname + "/../vendor/jspdf.umd.min.js");
window.jspdf = { jsPDF };

// ---- o que o app põe em volta do código do PDF ----
const noop = new Proxy({}, { get: () => () => {}, set: () => true });
global.document = { createElement: () => ({
  width: 0, height: 0, getContext: () => noop,
  toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
}) };
let handler = null, saida = null;
global.$ = () => ({ addEventListener: (_, f) => { handler = f; } });
function deliver(blob){ saida = blob; }
function saveName(){ return "molde.pdf"; }
function fmt(v){ return (Math.round(v * 10) / 10).toFixed(1).replace(".", ","); }
function drawPhoto(){}
let molde = null;
function itemAtual(){ return molde; }
let paper = { w: 210, h: 297 };
function paperMM(){ return paper; }
let photo = { x: 20, y: 30, w: 100, h: 150 };
let espaco = 2.5;
function P(){ return espaco; }
let thread = "#BE5103";
function threadLabel(hex){ return ({"#BE5103":"Terracota","#384959":"Azul noite","#069494":"Verde agua"})[hex] || ""; }
let els = [], sel = 0, totalCount = 0, totalHoles = 0;

eval(fs.readFileSync(__dirname + "/pdfcode.js", "utf8"));

// ---- uma peça de verdade: retângulo de células acesas ----
function peca(x, y, cols, rows, rot){
  const cells = Array.from({length: rows}, () => Array(cols).fill(1));
  return { kind: "text", text: "amor", cells, x, y, rot: rot || 0 };
}
function conta(){
  totalCount = els.reduce((n, e) => n + e.cells.flat().filter(Boolean).length, 0);
  totalHoles = els.reduce((n, e) => n + holesOf(e).length, 0);
}

function gera(nome, esperado){
  conta();
  saida = null;
  handler();
  return saida.arrayBuffer().then(ab => {
    const b = Buffer.from(ab);
    const txt = b.toString("latin1");
    const paginas = (txt.match(/\/Type\s*\/Page[^s]/g) || []).length;
    const R = cropArea();
    const plano = pdfPlan(R);
    const n = plano.cols * plano.rows;
    const bate = paginas === n && (esperado == null || n === esperado);
    console.log((bate ? "ok   " : "FALHA") + " " + nome.padEnd(30) +
      " molde " + R.w.toFixed(0) + "x" + R.h.toFixed(0) + " mm -> " +
      n + " folha(s) " + (plano.land ? "deitadas" : "em pé") +
      ", " + paginas + " páginas no PDF, " + (b.length / 1024).toFixed(0) + " KB");
    if (!bate) process.exitCode = 1;
    return b;
  });
}

(async () => {
  // 1. molde pequeno: uma folha só, como sempre foi
  els = [peca(30, 40, 20, 10)];
  await gera("peça pequena", 1);

  // 2. papel grande com peça longe da foto: reparte
  paper = { w: 400, h: 500 };
  photo = { x: 20, y: 30, w: 150, h: 200 };
  els = [peca(40, 300, 100, 40)];
  const b = await gera("papel 40x50 cm", null);
  fs.writeFileSync(__dirname + "/amostra.pdf", b);

  // 3. faixa larga e baixa: devia escolher folha deitada
  paper = { w: 600, h: 200 };
  photo = { x: 10, y: 20, w: 120, h: 90 };
  els = [peca(150, 40, 150, 20)];
  await gera("faixa 60x20 cm", null);

  // 4. peça girada, que estica a caixa
  paper = { w: 300, h: 400 };
  photo = { x: 20, y: 20, w: 150, h: 200 };
  els = [peca(60, 250, 60, 30, 45)];
  await gera("peça girada 45°", null);

  // 5. molde de uma folha só continua sem numeração de folha
  paper = { w: 210, h: 297 };
  photo = { x: 20, y: 30, w: 100, h: 150 };
  els = [peca(30, 200, 20, 8)];
  const um = await gera("A4 comum", 1);
  const t = streams(um).join("\n");
  console.log((t.includes("50 mm exatos") ? "ok   " : "FALHA") + " régua de aferição impressa na folha única");
  if (!t.includes("50 mm exatos")) process.exitCode = 1;

  // sem molde na estante o título vem da peça, como sempre foi
  console.log((t.includes("amor") ? "ok   " : "FALHA") + " sem estante, o título do PDF é a palavra da peça");
  if (!t.includes("amor")) process.exitCode = 1;

  // com um molde nomeado, o nome dele manda
  molde = { nome: "presente da vo" };
  const nomeado = await gera("molde nomeado", 1);
  const tn = streams(nomeado).join("\n");
  console.log((tn.includes("presente da vo") ? "ok   " : "FALHA") + " com molde nomeado, o título do PDF é o nome dele");
  if (!tn.includes("presente da vo")) process.exitCode = 1;
  molde = null;
})();
