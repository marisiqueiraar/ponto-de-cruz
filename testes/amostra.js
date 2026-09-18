// Amostra para conferir a olho: molde grande, repartido em folhas.
global.window = global; global.navigator = { userAgent: "node" };
const fs = require("fs");
const { jsPDF } = require(__dirname + "/../vendor/jspdf.umd.min.js");
window.jspdf = { jsPDF };
const noop = new Proxy({}, { get: () => () => {}, set: () => true });
global.document = { createElement: () => ({ width:0, height:0, getContext: () => noop,
  toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" }) };
let handler = null, saida = null;
global.$ = () => ({ addEventListener: (_, f) => { handler = f; } });
function deliver(b){ saida = b; }
function saveName(){ return "amostra.pdf"; }
function fmt(v){ return (Math.round(v*10)/10).toFixed(1).replace(".", ","); }
function drawPhoto(){}
function itemAtual(){ return null; }   // sem estante: o titulo vem da peca
const paper = { w: 300, h: 400 };
function paperMM(){ return paper; }
const photo = { x: 45, y: 40, w: 150, h: 210 };
function P(){ return 2.5; }
let thread = "#BE5103";
function threadLabel(hex){ return ({"#BE5103":"Terracota","#384959":"Azul noite","#069494":"Verde agua"})[hex] || ""; }
let sel = 0, totalCount = 0, totalHoles = 0;

const SYMS = {
  heart: [".XX...XX.","XXXX.XXXX","XXXXXXXXX","XXXXXXXXX",".XXXXXXX.","..XXXXX..","...XXX...","....X...."],
  star: ["....X....","...XXX...","...XXX...","XXXXXXXXX",".XXXXXXX.","..XXXXX..","..XX.XX..",".XX...XX.","XX.....XX"]
};
function matrixFromStrings(rows, scale){
  const out = [];
  rows.forEach(r => { for (let i = 0; i < scale; i++){
    const linha = []; for (const ch of r) for (let j = 0; j < scale; j++) linha.push(ch === "X" ? 1 : 0);
    out.push(linha);
  }});
  return out;
}
const els = [
  { kind:"sym", sym:"heart", scale:4, rot:0,  x: 60,  y: 275, cells: matrixFromStrings(SYMS.heart, 4),
    color: "#BE5103", colorName: "Terracota" },
  { kind:"sym", sym:"star",  scale:3, rot:-12,x: 190, y: 285, cells: matrixFromStrings(SYMS.star, 3),
    color: "#069494", colorName: "Anchor 188" },
  { kind:"sym", sym:"heart", scale:5, rot:20, x: 110, y: 320, cells: matrixFromStrings(SYMS.heart, 5),
    color: "#384959", colorName: "DMC 930 Antique Blue" },
  { kind:"sym", sym:"star",  scale:4, rot:0,  x: 55,  y: 10,  cells: matrixFromStrings(SYMS.star, 4),
    color: "#FFCE1B", colorName: "Mostarda" }
];
els[0].text = "amostra";
eval(fs.readFileSync(__dirname + "/pdfcode.js", "utf8"));
totalCount = els.reduce((n,e) => n + e.cells.flat().filter(Boolean).length, 0);
totalHoles = els.reduce((n,e) => n + holesOf(e).length, 0);
els[sel] = els[0]; els[0].kind = "text";   // para o título sair como texto
handler();
saida.arrayBuffer().then(ab => {
  fs.writeFileSync(__dirname + "/molde-amostra.pdf", Buffer.from(ab));
  const R = cropArea(), p = pdfPlan(R);
  console.log("molde " + R.w.toFixed(0) + " x " + R.h.toFixed(0) + " mm -> " +
    p.rows + " x " + p.cols + " = " + p.rows*p.cols + " folhas " + (p.land ? "deitadas" : "em pé") +
    ", " + (Buffer.from(ab).length/1024).toFixed(0) + " KB");
});
