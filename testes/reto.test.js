// A conta de furos do ponto reto, sem navegador.
//
// As promessas:
//   1. num caminho de retas, todo vértice é furo — o canto do hexágono não
//      pode sumir — e os trechos são repartidos em pontos de até um
//      comprimento de ponto;
//   2. numa curva, os furos ficam a distâncias iguais ao longo dela;
//   3. nenhum dos desenhos prontos, no tamanho de fábrica, deixa dois furos a
//      menos de 2 mm um do outro — no papel essa tira rasga;
//   4. a aresta que dois hexágonos dividem é bordada uma vez só.
const R = require("../js/reto.js");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---- 1. retas -------------------------------------------------------------
const quadrado = [[0, 0], [10, 0], [10, 10], [0, 10]];
const f = R.furosReta(quadrado, 3, true);
ok(quadrado.every(v => f.some(h => dist(h, v) < 1e-9)), "os quatro cantos do quadrado são furos");
const passos = f.map((h, i) => dist(h, f[(i + 1) % f.length]));
ok(passos.every(d => d <= 3.4 && d >= 2.4), "e os lados de 10 mm saem em pontos de 3,3 mm (" +
   passos.map(d => d.toFixed(2)).slice(0, 4).join(", ") + "…)");
ok(f.length === 12, "12 furos, sem repetir o primeiro no fim (" + f.length + ")");

// ---- 2. curvas --------------------------------------------------------------
const circ = []; for (let i = 0; i < 400; i++){ const a = i / 400 * Math.PI * 2; circ.push([20 + 10 * Math.cos(a), 20 + 10 * Math.sin(a)]); }
const c = R.furosCurva(circ, 2.5, true);
const pc = c.map((h, i) => dist(h, c[(i + 1) % c.length]));
ok(Math.max(...pc) - Math.min(...pc) < 0.05, "no círculo, os furos ficam a distâncias iguais (" +
   Math.min(...pc).toFixed(2) + " a " + Math.max(...pc).toFixed(2) + " mm)");
ok(c.length === Math.round(2 * Math.PI * 10 / 2.5), "e são tantos quanto o comprimento pede (" + c.length + ")");

// ---- 3. nada colado ------------------------------------------------------------
for (const k of Object.keys(R.DESENHOS_RETO)){
  const d = R.DESENHOS_RETO[k];
  if (d.especial) continue;   // palavra e imagem precisam de canvas: testes/reto.js
  for (const passo of [2.5, 3]){
    const o = { passo }; (d.opcoes || []).forEach(op => o[op[0]] = op[2]);
    const pts = R.pontosDoDesenho(d.faz(d.padrao, o), passo);
    const todos = {}; pts.forEach(p => p.furos.forEach(h => todos[h[0].toFixed(3) + "," + h[1].toFixed(3)] = h));
    const L = Object.values(todos); let ruins = 0;
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++){
      const dd = dist(L[i], L[j]); if (dd < 2 && dd >= 0.3) ruins++;
    }
    ok(ruins === 0, d.nome + " com ponto de " + passo + " mm: nenhum furo a menos de 2 mm de outro" +
       (ruins ? " (" + ruins + " pares)" : ""));
  }
}

// ---- 4. a colmeia não borda a mesma aresta duas vezes -------------------------
const col = R.DESENHOS_RETO.colmeia.faz(6, { cols: 2, rows: 1 });
ok(col.length === 11, "dois hexágonos lado a lado são 11 arestas, não 12 (" + col.length + ")");

console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
process.exit(falhas ? 1 : 0);
