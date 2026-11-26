// A folha da impressora, separada do papel da peça; e os tamanhos Instax.
//
// As promessas:
//   1. um molde que pede várias folhas A4 cabe numa A3 só, e o aviso da barra
//      diz o nome da folha escolhida;
//   2. o PDF sai no tamanho da folha escolhida — Carta é 612 × 792 pt;
//   3. a folha é do molde: volta ao reabrir;
//   4. mudar a folha não mexe em nada do papel da peça;
//   5. os três tamanhos Instax estão na lista da foto, com as medidas da
//      Fujifilm.
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
  const ctx = await nav.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 860 } });
  const pg = await ctx.newPage();
  // o diálogo de salvar do Chrome não existe sem ninguém na frente: o
  // download vai pelo caminho de reserva, o link
  await pg.addInitScript(() => { delete window.showSaveFilePicker; });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  const aba = n => pg.evaluate(x => abreAba(x), n);
  const estado = () => pg.evaluate(() => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(x => x.id === idx.atual);
    return JSON.parse(localStorage.getItem(it.dados));
  });

  // um papel A3 com uma moldura em volta de uma foto grande: não cabe num A4
  await aba("papel");
  await pg.selectOption("#paperSize", "297x420");
  await aba("foto");
  await pg.selectOption("#photoSize", "150x210");
  await aba("pecas");
  await pg.click("#addMoldura");
  await pg.waitForTimeout(800);

  // ---- 1. A4 reparte, A3 não ---------------------------------------------
  let t = (await pg.textContent("#fitTxt")).trim();
  ok(/folhas/.test(t), "em A4 o molde sai repartido: \"" + t + "\"");
  const antes = await estado();
  await aba("imprimir");
  await pg.selectOption("#folha", "a3");
  await pg.waitForTimeout(800);
  t = (await pg.textContent("#fitTxt")).trim();
  ok(/cabe em A3/.test(t), "numa A3 ele cabe inteiro: \"" + t + "\"");

  // ---- 4. nada do papel mudou ------------------------------------------------
  const depois = await estado();
  ok(JSON.stringify(depois.els.map(e => [e.x, e.y])) === JSON.stringify(antes.els.map(e => [e.x, e.y])) &&
     depois.photoBox.x === antes.photoBox.x && depois.paper.size === antes.paper.size,
     "trocar a folha não mexe no papel, na foto nem nas peças");

  // ---- 3. a folha volta ao reabrir -----------------------------------------------
  ok(depois.paper.folha === "a3", "a folha fica gravada com o molde");
  await pg.reload();
  await pg.waitForTimeout(2300);
  ok(await pg.inputValue("#folha") === "a3", "e volta ao reabrir");

  // ---- 2. o PDF no tamanho da folha ----------------------------------------------
  await aba("papel");
  await pg.selectOption("#paperSize", "148x210");
  await aba("imprimir");
  await pg.selectOption("#folha", "carta");
  await aba("foto");
  await pg.selectOption("#photoSize", "100x150");
  await pg.waitForTimeout(600);
  const [d] = await Promise.all([pg.waitForEvent("download", { timeout: 20000 }), pg.click("#pdf")]);
  const caminho = await d.path();
  const pdf = require("fs").readFileSync(caminho, "latin1");
  const caixa = (pdf.match(/\/MediaBox \[([^\]]+)\]/) || [])[1] || "";
  const nums = caixa.trim().split(/\s+/).map(Number);
  ok(Math.abs(nums[2] - 612) < 1 && Math.abs(nums[3] - 792) < 1,
     "o PDF sai em folha Carta, 612 × 792 pt (saiu " + caixa.trim() + ")");

  // ---- 5. Instax ---------------------------------------------------------------
  const instax = await pg.evaluate(() => [...document.querySelectorAll("#photoSize option")]
    .filter(o => /Instax/.test(o.textContent)).map(o => o.value));
  ok(instax.join(" ") === "54x86 72x86 108x86", "Instax mini, square e wide na lista da foto (" + instax.join(", ") + ")");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
