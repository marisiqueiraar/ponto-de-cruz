// A prova que importa: o retângulo da foto tem posição conhecida em mm de
// papel. Se ele cair no lugar certo em TODAS as folhas, a emenda fecha e o
// furo bate. Se escorregar um milímetro numa delas, o molde está errado.
global.window = global; global.navigator = { userAgent: "node" };
const fs = require("fs");
const streams = require("./streams.js");
const { jsPDF } = require(__dirname + "/../vendor/jspdf.umd.min.js");
window.jspdf = { jsPDF };
const noop = new Proxy({}, { get: () => () => {}, set: () => true });
global.document = { createElement: () => ({ width:0, height:0, getContext: () => noop,
  toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" }) };
let saida = null;   // o ouvinte do botão só adia; quem constrói é montaPDF()
global.$ = () => ({ addEventListener: () => {} });
function deliver(b){ saida = b; }
function saveName(){ return "m.pdf"; }
function fmt(v){ return (Math.round(v*10)/10).toFixed(1).replace(".", ","); }
function drawPhoto(){}
function itemAtual(){ return null; }   // sem estante: o titulo vem da peca
let paper = { w: 400, h: 500 };
function paperMM(){ return paper; }
let photo = { x: 55, y: 70, w: 100, h: 150 };
function P(){ return 2.5; }
let thread = "#384959";
function threadLabel(hex){ return ({"#BE5103":"Terracota","#384959":"Azul noite"})[hex] || ""; }
let els = [], sel = 0, totalCount = 10, totalHoles = 20;
eval(fs.readFileSync(__dirname + "/pdfcode.js", "utf8"));

const PT = 72 / 25.4;
function paginas(buf){
  const t = buf.toString("latin1");
  // cada página é um stream com os operadores; pegamos na ordem em que saem
  return streams(buf).filter(s => s.includes(" re") || s.includes(" l\n"));
}
function rects(stream, alturaPt){
  return [...stream.matchAll(/([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) re/g)].map(m => ({
    x: +m[1] / PT, y: (alturaPt - +m[2]) / PT, w: +m[3] / PT, h: -+m[4] / PT
  }));
}

let falhas = 0;
function ok(c, m){ if (!c){ console.log("  FALHOU: " + m); falhas++; } }

els = [{ kind:"text", text:"amor", rot:0, x: 60, y: 330,
         cells: Array.from({length: 24}, () => Array(60).fill(1)) }];
montaPDF();
saida.arrayBuffer().then(ab => {
  const buf = Buffer.from(ab);
  const R = cropArea(), plano = pdfPlan(R);
  const n = plano.cols * plano.rows;
  const alturaPt = (plano.land ? 210 : 297) * PT;
  const ps = paginas(buf);
  console.log("molde " + R.w.toFixed(1) + " x " + R.h.toFixed(1) + " mm em " + n +
              " folhas (" + plano.rows + " x " + plano.cols + "), streams achados: " + ps.length);
  ok(ps.length === n, "um stream de desenho por folha");

  for (let i = 0; i < n; i++){
    const vw = { x: R.x + plano.xs[i % plano.cols], y: R.y + plano.ys[Math.floor(i / plano.cols)],
                 w: plano.tw, h: plano.th };
    const ox = (plano.pageW - plano.tw) / 2, oy = plano.top;
    const rs = rects(ps[i], alturaPt);
    // o retângulo da foto: o único com exatamente o tamanho da foto
    const f = rs.find(r => Math.abs(r.w - photo.w) < 0.05 && Math.abs(r.h - photo.h) < 0.05);
    ok(!!f, "folha " + (i+1) + ": retângulo da foto presente");
    if (f){
      const esperadoX = ox + (photo.x - vw.x), esperadoY = oy + (photo.y - vw.y);
      const dx = Math.abs(f.x - esperadoX), dy = Math.abs(f.y - esperadoY);
      ok(dx < 0.02 && dy < 0.02, "folha " + (i+1) + ": foto em " + f.x.toFixed(2) + "," +
        f.y.toFixed(2) + " e não em " + esperadoX.toFixed(2) + "," + esperadoY.toFixed(2));
      // a mesma coordenada de papel vista de duas folhas: é isso que faz a emenda fechar
      const voltaX = f.x - ox + vw.x, voltaY = f.y - oy + vw.y;
      ok(Math.abs(voltaX - photo.x) < 0.02 && Math.abs(voltaY - photo.y) < 0.02,
         "folha " + (i+1) + ": a volta para mm de papel dá " + voltaX.toFixed(2) + "," + voltaY.toFixed(2));
    }
    // a moldura de recorte é o tamanho da folha
    const moldura = rs.find(r => Math.abs(r.w - plano.tw) < 0.05 && Math.abs(r.h - plano.th) < 0.05);
    ok(!!moldura, "folha " + (i+1) + ": moldura de recorte do tamanho da folha");
    // o desenho do molde é só o que vem depois do recorte (operador "W n"):
    // antes dele está o cabeçalho, régua inclusive.
    const corte = ps[i].indexOf("\nW\nn\n");
    ok(corte > 0, "folha " + (i+1) + ": recorte aplicado");
    const dentro = ps[i].slice(corte);
    const linhas = [...dentro.matchAll(/([-\d.]+) ([-\d.]+) l/g)].map(m => ({ x:+m[1]/PT, y:(alturaPt - +m[2])/PT }));
    const vazou = linhas.filter(p => p.x < ox - 0.6 || p.x > ox + plano.tw + 0.6 ||
                                     p.y < oy - 0.6 || p.y > oy + plano.th + 0.6);
    ok(vazou.length === 0, "folha " + (i+1) + ": " + vazou.length + " traços fora da moldura");
    console.log("  folha " + (i+1) + ": " + linhas.length + " traços, foto ok, moldura ok");
  }
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
});
