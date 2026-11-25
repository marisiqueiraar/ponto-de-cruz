// As fontes.
//
// As promessas:
//   1. são 35: as cinco que não ficavam legíveis em altura nenhuma saíram, e
//      nenhum arquivo delas é pedido;
//   2. a palavra nova nasce na Dancing Script;
//   3. o campo de altura avisa quando a fonte pede mais quadradinhos do que a
//      peça tem, e o aviso some quando a altura chega lá;
//   4. a lista mostra a altura mínima de cada fonte, e a amostra em
//      quadradinhos é feita na altura da peça;
//   5. molde gravado com uma fonte que saiu abre como estava e, refeito,
//      passa para a parecida.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };
const FORA = ["League Script", "Mrs Saint Delafield", "Herr Von Muellerhoff",
              "Monsieur La Doulaise", "Rouge Script"];

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1280, height: 860 } });
  const erros = [], pedidos = [];
  pg.on("pageerror", e => erros.push(e.message));
  pg.on("request", r => pedidos.push(r.url()));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);

  const peca = async () => {
    await pg.waitForTimeout(600);
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      const e = JSON.parse(localStorage.getItem(it.dados)).els[0];
      return { font: e.font, rows: e.rowsTarget, cells: e.cells.join("|") };
    });
  };
  const fonte = async (f) => {
    await pg.evaluate((f) => {
      const s = document.getElementById("font");
      s.value = f;
      s.dispatchEvent(new Event("input", { bubbles: true }));
    }, f);
    await pg.waitForTimeout(500);
  };
  const alerta = () => pg.evaluate(() => document.getElementById("rows").parentNode.classList.contains("alerta"));

  // ---- 1. trinta e cinco ----------------------------------------------------
  const lista = await pg.evaluate(() => [...document.querySelectorAll("#font option")].map(o => o.value));
  ok(lista.length === 35, "35 fontes na lista (tem " + lista.length + ")");
  ok(FORA.every(f => lista.indexOf(f) < 0), "nenhuma das cinco que saíram");
  ok(!pedidos.some(u => /league-script|mrs-saint|herr-von|monsieur-la|rouge-script/.test(u)),
     "e nenhum arquivo delas é pedido");

  // ---- 2. a de fábrica --------------------------------------------------------
  await pg.click("#addText");
  let p = await peca();
  ok(p.font === "Dancing Script", "a palavra nova nasce na Dancing Script (" + p.font + ")");
  ok(!(await alerta()), "e na altura de fábrica ela não avisa nada");

  // ---- 3. o aviso de altura ----------------------------------------------------
  await fonte("Great Vibes");
  ok(await alerta(), "Great Vibes em 16 quadradinhos: o campo de altura avisa");
  const titulo = await pg.evaluate(() => document.getElementById("rows").parentNode.title);
  ok(/24 quadradinhos/.test(titulo), "e diz a partir de quanto ela fica legível");
  await pg.fill("#rows", "24");
  await pg.dispatchEvent("#rows", "input");
  await pg.waitForTimeout(400);
  ok(!(await alerta()), "em 24 o aviso some");

  // ---- 4. a lista --------------------------------------------------------------
  await pg.click("#fontBtn");
  await pg.waitForTimeout(2000);
  const cartao = await pg.evaluate(() => {
    const b = document.querySelector('.fcard[data-fam="Tangerine"]');
    const c = b && b.querySelector("canvas");
    return b ? { min: b.querySelector(".min").textContent, alto: c ? c.height : 0 } : null;
  });
  ok(cartao && /24 quadradinhos/.test(cartao.min), "o cartão diz a altura mínima da fonte");
  ok(cartao && cartao.alto >= 24 * 1.5, "e a amostra tem a altura da peça, não 7 quadradinhos (" +
     (cartao && cartao.alto) + " px)");
  await pg.keyboard.press("Escape");

  // ---- 5. fonte que saiu, num molde gravado -------------------------------------
  await pg.evaluate(() => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(x => x.id === idx.atual);
    const d = JSON.parse(localStorage.getItem(it.dados));
    d.els[0].font = "Rouge Script";
    localStorage.setItem(it.dados, JSON.stringify(d));
  });
  const antes = (await peca()).cells;
  await pg.reload();
  await pg.waitForTimeout(2300);
  p = await peca();
  ok(p.cells === antes, "o molde com Rouge Script abre com o desenho que tinha");
  ok(p.font === "Allura", "e a peça passa para a Allura, a parecida (" + p.font + ")");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
