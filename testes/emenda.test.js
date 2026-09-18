// Uma peça em cima da junta tem que sair nas DUAS folhas, no mesmo lugar do
// papel. É essa faixa repetida que a pessoa usa para sobrepor as folhas até
// os furos coincidirem — sem ela, a emenda é chute.
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
let paper = { w: 250, h: 520 };
function paperMM(){ return paper; }
let photo = { x: 40, y: 30, w: 100, h: 150 };
function P(){ return 2.5; }
let thread = "#384959";
function threadLabel(hex){ return ({"#BE5103":"Terracota","#384959":"Azul noite"})[hex] || ""; }
let els = [], sel = 0, totalCount = 10, totalHoles = 20;
eval(fs.readFileSync(__dirname + "/pdfcode.js", "utf8"));

const PT = 72 / 25.4;
let falhas = 0;
const ok = (c, m) => { if (!c){ console.log("  FALHOU: " + m); falhas++; } };

// uma faixa alta, que atravessa a junta entre as folhas
els = [{ kind:"text", text:"junta", rot:0, x: 60, y: 60,
         cells: Array.from({length: 150}, () => Array(30).fill(1)) }];
handler();
saida.arrayBuffer().then(ab => {
  const buf = Buffer.from(ab);
  const R = cropArea(), plano = pdfPlan(R), n = plano.cols * plano.rows;
  const alturaPt = (plano.land ? 210 : 297) * PT;
  const folhas = streams(buf).filter(s => s.includes(" re"));
  console.log("molde " + R.w.toFixed(0) + " x " + R.h.toFixed(0) + " mm em " + n + " folhas");
  ok(folhas.length === n, "um stream por folha");

  const porFolha = folhas.map((st, i) => {
    const vw = { x: R.x + plano.xs[i % plano.cols], y: R.y + plano.ys[Math.floor(i / plano.cols)],
                 w: plano.tw, h: plano.th };
    const ox = (plano.pageW - plano.tw) / 2, oy = plano.top;
    const corte = st.indexOf("\nW\nn\n");
    const pts = [...st.slice(corte).matchAll(/([-\d.]+) ([-\d.]+) l/g)].map(m => ({
      x: +m[1] / PT - ox + vw.x, y: (alturaPt - +m[2]) / PT - oy + vw.y   // volta para mm de papel
    }));
    // nada desenhado pode estar longe do pedaço que esta folha mostra
    const longe = pts.filter(p => p.x < vw.x - 3 || p.x > vw.x + vw.w + 3 ||
                                  p.y < vw.y - 3 || p.y > vw.y + vw.h + 3);
    ok(longe.length === 0, "folha " + (i+1) + ": " + longe.length + " traços longe do pedaço da folha");
    console.log("  folha " + (i+1) + ": mostra o papel de y=" + vw.y.toFixed(1) + " a " +
      (vw.y + vw.h).toFixed(1) + " mm, desenhou " + pts.length + " traços");
    return { vw, pts: new Set(pts.map(p => p.x.toFixed(1) + "," + p.y.toFixed(1))) };
  });

  for (let i = 1; i < n; i++){
    const a = porFolha[i-1], b = porFolha[i];
    const sobra = (a.vw.y + a.vw.h) - b.vw.y;
    const comuns = [...a.pts].filter(k => b.pts.has(k));
    console.log("  emenda " + i + ": faixa repetida de " + sobra.toFixed(1) +
                " mm, " + comuns.length + " traços iguais nas duas folhas");
    ok(sobra >= 10 - 1e-9, "emenda " + i + ": faixa repetida de pelo menos 10 mm");
    ok(comuns.length > 0, "emenda " + i + ": a peça da junta sai nas duas folhas, no mesmo ponto do papel");
  }
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
});
