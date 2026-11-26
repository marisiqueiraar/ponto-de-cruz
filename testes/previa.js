// A prévia da folha impressa, na etapa imprimir, num Chromium.
//
// As promessas:
//   1. na etapa imprimir a mesa mostra a folha, e o botão volta para o molde;
//   2. a prévia tem tantas folhas quanto o PDF de verdade — num molde que
//      cabe numa folha e num que precisa de duas;
//   3. a prévia se refaz quando o molde muda;
//   4. montar a prévia não baixa nada nem enche a lista de PDF já gerados.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const fs = require("fs");
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  await pg.addInitScript(() => { delete window.showSaveFilePicker; });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  let baixados = 0;
  pg.on("download", () => baixados++);
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  const folhas = async () => { await pg.waitForTimeout(1200); return pg.locator("#previaFolhas canvas").count(); };
  const paginasPDF = async () => {
    const [d] = await Promise.all([pg.waitForEvent("download", { timeout: 20000 }), pg.click("#pdf")]);
    return (fs.readFileSync(await d.path()).toString("latin1").match(/\/Type \/Page\b/g) || []).length;
  };

  // ---- 1 e 2: um molde pequeno, uma folha (papel A5, que cabe numa A4 com o texto) -------
  await pg.click('#rail button[data-pane="papel"]');
  await pg.selectOption("#paperSize", "148x210");
  await pg.click('#rail button[data-pane="pecas"]');
  await pg.click("#addText");
  await pg.waitForTimeout(400);
  await pg.click('#rail button[data-pane="imprimir"]');
  let n = await folhas();
  ok(await pg.isVisible("#previa") && n === 1, "na etapa imprimir a mesa mostra a folha (" + n + ")");
  ok(baixados === 0, "montar a prévia não baixa nada");
  const hist = await pg.evaluate(() => new Promise(r => histAll(l => r(l.length))));
  ok(hist === 0, "nem guarda PDF na lista de já gerados");
  const p1 = await paginasPDF();
  ok(p1 === n, "o PDF de verdade também tem " + p1 + " folha");

  // ---- 3: o papel vira A4 e o molde passa a precisar de duas --------------------------------
  await pg.click('#rail button[data-pane="papel"]');
  await pg.selectOption("#paperSize", "210x297");
  await pg.click('#rail button[data-pane="pecas"]');
  await pg.click("#addMoldura");
  await pg.waitForTimeout(400);
  await pg.click('#rail button[data-pane="imprimir"]');
  n = await folhas();
  const p2 = await paginasPDF();
  ok(n === p2 && n >= 2, "num papel A4 com moldura, a prévia e o PDF têm as mesmas " + n + " folhas (" + p2 + ")");

  // ---- o botão ------------------------------------------------------------------------------
  await pg.click("#previaBtn");
  ok(!(await pg.isVisible("#previa")) && await pg.textContent("#previaBtn") === "ver a folha", "ver o molde tira a prévia da frente");
  await pg.click("#previaBtn");
  ok(await pg.isVisible("#previa"), "e ver a folha a traz de volta");
  await pg.click('#rail button[data-pane="pecas"]');
  ok(!(await pg.isVisible("#previa")) && !(await pg.isVisible("#previaBtn")), "fora da etapa imprimir, a mesa é o molde");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
