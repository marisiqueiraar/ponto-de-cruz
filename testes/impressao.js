// Impressão: várias na mesma folha, recorte do marca-página, caber no papel,
// e a ordem dos pontos numerada.
//
// As promessas:
//   1. num papel de marca-página, a aba papel oferece cópias até onde cabem
//      na folha, e os outros moldes do mesmo tamanho;
//   2. o PDF sai com todas lado a lado na mesma folha, uma moldura de
//      recorte para cada;
//   3. cantos arredondados e furo da fita ficam gravados e saem no PDF;
//   4. a moldura que passou do papel encolhe até caber;
//   5. com a ordem pedida, os números dos furos saem no PDF.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
const streams = require("./streams.js");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  await pg.addInitScript(() => { delete window.showSaveFilePicker; });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  const aba = n => pg.click('#rail button[data-pane="' + n + '"]');
  const baixa = async () => {
    const [d] = await Promise.all([pg.waitForEvent("download", { timeout: 20000 }), pg.click("#pdf")]);
    const buf = require("fs").readFileSync(await d.path());
    return { buf, st: streams(buf).join("\n") };
  };
  // a moldura tracejada: o tracejado de 2 mm (5,67 pt) é ligado uma vez por moldura
  const TRACO = /\[5\.67 5\.67\] 0\.? d/g;
  const molduras = st => (st.match(TRACO) || []).length;

  // ---- 1. o painel ----------------------------------------------------------------
  await aba("papel");
  await pg.selectOption("#paperSize", "50x180");
  await aba("foto");
  await pg.selectOption("#photoSize", "none");
  await aba("pecas");
  await pg.click("#addReto");
  await pg.waitForTimeout(500);
  await aba("moldes");
  await pg.click("#moldeNovo");
  await pg.waitForTimeout(500);
  await aba("pecas");
  await pg.click("#addFaixa");
  await pg.waitForTimeout(500);
  await aba("papel");
  await pg.waitForTimeout(300);
  const opcoes = await pg.evaluate(() => [...document.querySelectorAll("#copias option")].map(o => o.value));
  ok(await pg.isVisible("#variosCampo") && opcoes.length === 3, "num marca-página de 5 × 18, a A4 aceita até 3 (" + opcoes.join(",") + ")");
  ok(await pg.evaluate(() => document.querySelectorAll("#juntoLista input").length) === 1,
     "e o outro molde do mesmo tamanho aparece para ir junto");

  // ---- 2. três na folha ---------------------------------------------------------
  await pg.selectOption("#copias", "2");
  await pg.check("#juntoLista input");
  await pg.waitForTimeout(500);
  let pdf = await baixa();
  const paginas = (pdf.buf.toString("latin1").match(/\/Type \/Page\b/g) || []).length;
  ok(paginas === 1, "o PDF sai numa folha só (" + paginas + ")");
  ok(molduras(pdf.st) === 3, "com três molduras de recorte (" + molduras(pdf.st) + ")");

  // ---- 3. cantos e fita -------------------------------------------------------------
  await pg.fill("#cantos", "5");
  await pg.dispatchEvent("#cantos", "input");
  await pg.check("#fita");
  await pg.waitForTimeout(600);
  const gravado = await pg.evaluate(() => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(x => x.id === idx.atual);
    return JSON.parse(localStorage.getItem(it.dados)).paper;
  });
  ok(gravado.cantos === 5 && gravado.fita === 1, "cantos de 5 mm e furo da fita ficam gravados no molde");
  pdf = await baixa();
  // o canto redondo é curva (c) dentro da moldura tracejada
  const tracejado = pdf.st.split(TRACO).slice(1).map(t => t.split(/\[\] 0\.? d/)[0]);
  ok(tracejado.length === 3 && tracejado.every(t => (t.match(/ c\b/g) || []).length >= 8),
     "cada moldura sai com os quatro cantos redondos e o furo da fita");

  // ---- 4. caber no papel ----------------------------------------------------------------
  await aba("moldes");
  await pg.click("#moldeNovo");
  await pg.waitForTimeout(500);
  await aba("papel");
  await pg.selectOption("#paperSize", "148x210");
  await aba("foto");
  await pg.selectOption("#photoSize", "100x150");
  await aba("pecas");
  await pg.click("#addReto");
  await pg.selectOption("#retoDes", "folha");
  await pg.waitForTimeout(300);
  await pg.fill("#retoMed", "30");
  await pg.dispatchEvent("#retoMed", "input");
  await pg.selectOption("#retoArr", "moldura");
  await pg.waitForTimeout(700);
  ok(/fora do papel/.test(await pg.textContent("#fitTxt")) && await pg.isVisible("#retoCabe"),
     "a moldura de folhas passa do A5, e o botão caber no papel aparece");
  await pg.click("#retoCabe");
  await pg.waitForTimeout(700);
  ok(!/fora do papel/.test(await pg.textContent("#fitTxt")), "depois dele, a moldura cabe: " + (await pg.textContent("#modeHint")).trim());

  // ---- 5. a ordem numerada -----------------------------------------------------------------
  await aba("molde");
  pdf = await baixa();
  const semNum = (pdf.st.match(/\(\d+\) Tj/g) || []).length;
  await pg.check("#numerar");
  await pg.waitForTimeout(400);
  pdf = await baixa();
  const comNum = (pdf.st.match(/\(\d+\) Tj/g) || []).length;
  ok(comNum > semNum + 50, "com a ordem pedida, os furos ganham número no PDF (" + semNum + " → " + comNum + " números)");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
