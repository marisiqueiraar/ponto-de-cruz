// A cor do papel 300g, num Chromium.
//
// As promessas:
//   1. a aba papel oferece as cores de papel, e a escolhida pinta o papel da
//      mesa e fica gravada no molde;
//   2. com uma linha branca, o papel branco avisa que ela quase some, e os
//      papéis sugeridos são escuros;
//   3. o PDF continua sem fundo colorido (vai para a folha da impressora).
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1280, height: 860 } });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  await pg.click("#addText");
  await pg.waitForTimeout(400);
  await pg.evaluate(() => abreAba("papel"));

  const cores = await pg.evaluate(() => document.querySelectorAll("#papelCores .papel").length);
  ok(cores >= 9, "a aba papel oferece " + cores + " cores de papel (com a livre)");

  // ---- 2. linha branca ----------------------------------------------------------
  await pg.evaluate(() => usaCor("#FFFFFF", "Branca"));
  await pg.waitForTimeout(300);
  const aviso = await pg.textContent("#papelSugere");
  ok(/a linha Branca quase some/.test(aviso), "no papel branco, a linha branca quase some: avisado");
  const boas = await pg.evaluate(() => [...document.querySelectorAll("#papelCores .papel.boa")].map(b => b.title.split(" —")[0]));
  ok(boas.length === 3 && boas.indexOf("preto") >= 0 && boas.indexOf("marinho") >= 0,
     "os papéis sugeridos são escuros: " + boas.join(", "));

  // ---- 1. escolher ------------------------------------------------------------------
  await pg.click('#papelCores .papel[title^="preto"]');
  await pg.waitForTimeout(700);
  const meio = await pg.evaluate(() => {
    const pa = paperMM(), k = cv._k, d = cv.getContext("2d").getImageData(Math.round(4 * k * (window.devicePixelRatio || 1)), Math.round(4 * k * (window.devicePixelRatio || 1)), 1, 1).data;
    return [d[0], d[1], d[2]];
  });
  ok(meio[0] < 60 && meio[1] < 60 && meio[2] < 60, "o papel da mesa fica preto (" + meio.join(",") + ")");
  const gravado = await pg.evaluate(() => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(x => x.id === idx.atual);
    return JSON.parse(localStorage.getItem(it.dados)).paper.cor;
  });
  ok(gravado === "#2B2B2E", "a cor fica gravada no molde (" + gravado + ")");
  ok(!/quase some/.test(await pg.textContent("#papelSugere")), "e no papel preto a linha branca não some");

  // ---- 3. a miniatura do PDF -----------------------------------------------------------
  const mini = await pg.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 50; c.height = 50;
    const ctx = c.getContext("2d");
    paint(ctx, 0.1, { x: 0, y: 0, w: 500, h: 500 }, { photoAlpha: 1, outline: false, papel: "#FFFFFF" });
    return [...ctx.getImageData(1, 1, 1, 1).data].slice(0, 3);
  });
  ok(mini.every(v => v > 240), "a miniatura do PDF continua em papel branco");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
