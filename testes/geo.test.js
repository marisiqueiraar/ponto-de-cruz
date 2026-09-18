const g = require("./geo.js");
let falhas = 0;
function ok(c, m){ if (!c){ console.log("FALHOU: " + m); falhas++; } }

// toda a área do molde precisa aparecer em alguma folha, e as vizinhas
// precisam repetir pelo menos SOBRA mm — senão a emenda não fecha.
function confere(R, nome){
  const p = g.pdfPlan(R);
  const n = p.cols * p.rows;
  ok(p.xs.length === p.cols && p.ys.length === p.rows, nome + ": contagem de inícios");
  ok(p.xs[0] === 0 && p.ys[0] === 0, nome + ": primeira folha no canto");
  ok(Math.abs(p.xs[p.cols-1] + p.tw - R.w) < 1e-6, nome + ": última coluna fecha em R.w");
  ok(Math.abs(p.ys[p.rows-1] + p.th - R.h) < 1e-6, nome + ": última linha fecha em R.h");
  for (let i = 1; i < p.cols; i++)
    ok(p.xs[i-1] + p.tw - p.xs[i] >= g.SOBRA - 1e-9, nome + ": sobra horizontal na emenda " + i);
  for (let i = 1; i < p.rows; i++)
    ok(p.ys[i-1] + p.th - p.ys[i] >= g.SOBRA - 1e-9, nome + ": sobra vertical na emenda " + i);
  const uw = (p.land ? 297 : 210) - g.PDF_SIDE * 2;
  const uh = (p.land ? 210 : 297) - p.top - g.PDF_FOOT;
  ok(p.tw <= uw + 1e-9 && p.th <= uh + 1e-9, nome + ": a folha cabe na A4 (" + p.tw.toFixed(1) + "x" + p.th.toFixed(1) + " em " + uw + "x" + uh + ")");
  // cobertura: nenhum ponto do molde fica de fora
  for (let x = 0; x <= R.w; x += R.w / 97)
    ok(p.xs.some(s => x >= s - 1e-9 && x <= s + p.tw + 1e-9), nome + ": x=" + x.toFixed(1) + " coberto");
  for (let y = 0; y <= R.h; y += R.h / 97)
    ok(p.ys.some(s => y >= s - 1e-9 && y <= s + p.th + 1e-9), nome + ": y=" + y.toFixed(1) + " coberto");
  return p;
}

// cabe numa folha só: continua saindo em uma folha, sem repartir
let p = g.pdfPlan({x:0,y:0,w:150,h:200});
ok(!p.tiled, "150x200 devia caber numa folha");
ok(p.cols === 1 && p.rows === 1, "folha única tem 1x1");

// o limite exato da folha retrato: 190 x 243
p = g.pdfPlan({x:0,y:0,w:190,h:243});
ok(!p.tiled, "190x243 cabe justo");
p = confere({x:0,y:0,w:190,h:244}, "190x244");
ok(p.tiled && p.cols * p.rows === 2, "190x244 devia dar 2 folhas, deu " + p.cols * p.rows);

// casos de verdade
[["A4 cheia", 210, 297], ["A3", 297, 420], ["quadrado 40", 400, 400],
 ["faixa larga", 560, 120], ["faixa alta", 120, 560], ["papel máximo", 600, 600],
 ["quase justo", 191, 244], ["1 mm a mais", 190.5, 243.5]].forEach(c => {
  const pl = confere({x:0,y:0,w:c[1],h:c[2]}, c[0]);
  console.log(c[0].padEnd(14) + c[1] + " x " + c[2] + " mm -> " +
    (pl.tiled ? pl.rows + " x " + pl.cols + " = " + pl.rows*pl.cols + " folhas " + (pl.land ? "deitadas" : "em pé") : "1 folha"));
});

console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
process.exit(falhas ? 1 : 0);
