// O molde sem foto: bordado em tecido, ou em papel que não leva foto. A foto
// continua com lugar e medida por baixo, para voltar de onde estava, mas não
// pode aparecer em lugar nenhum do PDF — nem o retângulo, nem o "cole a foto"
// —, nem esticar a caixa do desenho até onde ela estaria.
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
let paper = { w: 210, h: 297 };
function paperMM(){ return paper; }
// a foto guardada fica longe da peça de propósito: se ela ainda contasse, a
// caixa do desenho iria até lá
let photo = { x: 20, y: 20, w: 100, h: 150, off: true };
function P(){ return 2.5; }
let thread = "#384959";
function threadLabel(hex){ return ({"#384959":"Azul noite"})[hex] || ""; }
let els = [], sel = 0, totalCount = 10, totalHoles = 20;
eval(fs.readFileSync(__dirname + "/pdfcode.js", "utf8"));

const PT = 72 / 25.4;
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

els = [{ kind:"text", text:"amor", rot:0, x: 120, y: 200,
         cells: Array.from({length: 10}, () => Array(20).fill(1)) }];

const c = contentArea(), sa = stitchArea();
ok(Math.abs(c.x - sa.x) < 0.01 && Math.abs(c.y - sa.y) < 0.01 &&
   Math.abs(c.w - sa.w) < 0.01 && Math.abs(c.h - sa.h) < 0.01,
   "a caixa do desenho é só a da peça (" + c.x.toFixed(1) + "," + c.y.toFixed(1) + " " +
   c.w.toFixed(1) + " × " + c.h.toFixed(1) + " mm)");

montaPDF();
saida.arrayBuffer().then(ab => {
  const buf = Buffer.from(ab);
  const tudo = streams(buf).join("\n");
  const rs = [...tudo.matchAll(/([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) re/g)]
    .map(m => ({ w: +m[3] / PT, h: -+m[4] / PT }));
  ok(!rs.some(r => Math.abs(r.w - photo.w) < 0.05 && Math.abs(r.h - photo.h) < 0.05),
     "nenhum retângulo do tamanho da foto no PDF");
  ok(tudo.includes("sem foto"), "o cabeçalho diz que o molde é sem foto");
  ok(!tudo.includes("Cole a foto"), "e não manda colar foto nenhuma");
  ok(!tudo.includes("Sobra:"), "nem mede a sobra em volta dela");

  // a foto de volta: o mesmo molde desenha o retângulo de novo
  photo.off = false;
  montaPDF();
  return saida.arrayBuffer();
}).then(ab => {
  const tudo = streams(Buffer.from(ab)).join("\n");
  const rs = [...tudo.matchAll(/([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) re/g)]
    .map(m => ({ w: +m[3] / PT, h: -+m[4] / PT }));
  ok(rs.some(r => Math.abs(r.w - photo.w) < 0.05 && Math.abs(r.h - photo.h) < 0.05),
     "com a foto de volta, o retângulo dela volta ao PDF");
  ok(tudo.includes("Cole a foto"), "e o cabeçalho volta a dizer onde colar");
  process.exit(falhas ? 1 : 0);
});
