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

// o limite exato da folha retrato: 190 x 243 cabe embaixo do cabeçalho
p = g.pdfPlan({x:0,y:0,w:190,h:243});
ok(!p.tiled && !p.capa, "190x243 cabe justo, com cabeçalho na mesma folha");

/* ---- a folha de instrução -------------------------------------------

   1 mm a mais não cabe embaixo do cabeçalho, mas cabe de sobra na folha
   nua: repartir aí seria emendar um molde que era inteiro. O texto é que
   muda de folha. */
p = g.pdfPlan({x:0,y:0,w:190,h:244});
ok(!p.tiled, "190x244 não devia repartir");
ok(p.capa, "190x244 devia ganhar folha de instrução");
ok(p.cols === 1 && p.rows === 1 && p.tw === 190 && p.th === 244, "a capa leva o molde inteiro");

// o caso que trouxe isto à tona: molde de 250 x 195 numa A4 deitada
p = g.pdfPlan({x:0,y:0,w:250,h:195});
ok(!p.tiled && p.capa, "250x195 devia sair numa folha só (era 2 antes)");
ok(p.land, "250x195 devia escolher a folha deitada");

// o molde fica centrado na folha nua, e a borda sobrando nunca é menor que o
// que a impressora come
[[190,244],[250,195],[200,287],[287,200]].forEach(c => {
  const pl = g.pdfPlan({x:0,y:0,w:c[0],h:c[1]});
  const pw = pl.pageW, ph = pl.land ? 210 : 297;
  ok(pl.capa, c[0] + "x" + c[1] + ": devia ser capa");
  ok(Math.abs(pl.top - (ph - c[1]) / 2) < 1e-9, c[0] + "x" + c[1] + ": centrado na vertical");
  ok(pl.top >= g.PDF_BLEED - 1e-9, c[0] + "x" + c[1] + ": margem de cima >= " + g.PDF_BLEED + " mm");
  ok((pw - c[0]) / 2 >= g.PDF_BLEED - 1e-9, c[0] + "x" + c[1] + ": margem lateral >= " + g.PDF_BLEED + " mm");
});

/* A folga de 8 mm em volta do molde não tem furo nenhum: ela pode ser comida
   pela borda da impressora, o furo não. Então a conta é feita até o furo mais
   de fora, e uma região que sozinha não passaria ainda cabe. */
const R = {x:0, y:0, w:248, h:205};              // a região, com a folga
ok(g.cabeSolta(R) === null, "205 mm de região não cabe se tudo for tratado como furo");
const so = g.cabeSolta(R, {x:8, y:8, w:232, h:189});
ok(so !== null, "cabe quando a folga de 8 mm é só folga");
// borda ate o furo: 2,5 (centragem) + 8 (folga) = 10,5; menos os 5 da impressora
ok(so && Math.abs(so.folga - 5.5) < 1e-9, "a folga anunciada desconta a borda da impressora, deu " + (so && so.folga));
p = g.pdfPlan(R, {x:8, y:8, w:232, h:189});
ok(p.capa && !p.tiled, "248x205 com folga sai numa folha de molde só");
// mas a folga só vale onde ela existe: molde colado na borda de cima reparte
ok(g.cabeSolta(R, {x:8, y:0, w:232, h:197}) === null, "furo colado na borda de cima não cabe");
// e a região em si nunca pode passar da folha, por mais folga que tenha
ok(g.cabeSolta({x:0,y:0,w:298,h:100}, {x:20,y:20,w:258,h:60}) === null, "298 mm passa da folha");

// nem na folha nua cabe: aí é o desenho que é maior que a folha, e reparte
ok(g.cabeSolta({x:0,y:0,w:288,h:200}) === null, "288 mm passa da folha nua deitada");
ok(g.cabeSolta({x:0,y:0,w:210,h:297}) === null, "A4 cheia não cabe nem na folha nua");
p = confere({x:0,y:0,w:210,h:297}, "A4 cheia");
ok(p.tiled && !p.capa, "A4 cheia continua repartida");

// casos de verdade que passam da folha nua
[["A3", 297, 420], ["quadrado 40", 400, 400],
 ["faixa larga", 560, 120], ["faixa alta", 120, 560], ["papel máximo", 600, 600]].forEach(c => {
  const pl = confere({x:0,y:0,w:c[1],h:c[2]}, c[0]);
  ok(pl.tiled, c[0] + ": devia repartir");
  console.log(c[0].padEnd(14) + c[1] + " x " + c[2] + " mm -> " +
    (pl.tiled ? pl.rows + " x " + pl.cols + " = " + pl.rows*pl.cols + " folhas " + (pl.land ? "deitadas" : "em pé") : "1 folha"));
});

console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
process.exit(falhas ? 1 : 0);
