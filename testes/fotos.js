// Fotos: mais de uma por molde, e a janela da imagem no Instax. Num Chromium.
//
// As promessas:
//   1. "pôr mais uma foto" cria uma peça de foto do tamanho escolhido, sem
//      furo nenhum, que muda de tamanho, deita e recebe imagem;
//   2. uma moldura de ponto reto vai em volta da foto a mais e a acompanha;
//   3. a foto a mais fica gravada, com a imagem, e sai no PDF como retângulo;
//   4. no Instax mini, a janela da imagem tem 46 × 62 mm, com lados iguais e
//      a borda de cima do campo, que fica gravada.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const path = require("path"), fs = require("fs"), os = require("os");
const alvo = "file://" + path.resolve(__dirname, "..", "index.html");
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
  const aba = n => pg.evaluate(x => abreAba(x), n);
  const gravado = async () => {
    await pg.waitForTimeout(600);
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      return { d: JSON.parse(localStorage.getItem(it.dados)), img: localStorage.getItem("ponto-e-letra/molde/imagens/v1/" + it.id) };
    });
  };

  // ---- 1. a foto a mais --------------------------------------------------------------
  await aba("papel");
  await pg.selectOption("#paperSize", "148x210");
  await aba("foto");
  await pg.selectOption("#photoSize", "54x86");
  await pg.click("#addFoto");
  await pg.waitForTimeout(400);
  let el = await pg.evaluate(() => ({ kind: els[0].kind, w: els[0].w, h: els[0].h, n: countOf(els[0]), furos: holesOf(els[0]).length }));
  ok(el.kind === "foto" && el.w === 54 && el.h === 86 && el.n === 0 && el.furos === 0,
     "pôr mais uma foto cria uma peça de foto de 54 × 86 mm, sem furo");
  ok(await pg.isVisible("#ctlFoto") && !(await pg.isVisible("#edit")), "a barra mostra tamanho, deitar e imagem, e não o ajustar");
  await pg.selectOption("#fotoTam", "100x150");
  await pg.click("#fotoGira");
  el = await pg.evaluate(() => ({ w: els[0].w, h: els[0].h }));
  ok(el.w === 150 && el.h === 100, "trocar para 10 × 15 e deitar dá 150 × 100 mm");
  await pg.selectOption("#fotoTam", "89x127");
  el = await pg.evaluate(() => ({ w: els[0].w, h: els[0].h }));
  ok(el.w === 127 && el.h === 89, "deitada, ela continua deitada ao trocar de tamanho");
  // uma imagem de verdade
  const png = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "foto-")), "praia.png");
  fs.writeFileSync(png, Buffer.from(await pg.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 300; c.height = 200;
    const x = c.getContext("2d"); x.fillStyle = "#3A7BD5"; x.fillRect(0, 0, 300, 200);
    return c.toDataURL("image/png").split(",")[1];
  }), "base64"));
  await pg.setInputFiles("#fotoArq", png);
  await pg.waitForTimeout(600);
  el = await pg.evaluate(() => ({ img: els[0].img, nome: els[0].nome, pronta: !!origemPronta(els[0]), chip: nomePeca(els[0]) }));
  ok(el.img && el.pronta && el.chip === "foto praia", "a imagem entra na foto a mais (" + el.chip + ")");

  // ---- 2. moldura em volta -------------------------------------------------------------
  await pg.evaluate(() => { els[0].x = 10; els[0].y = 110; draw(); });
  await aba("pecas");
  await pg.click("#addReto");
  await pg.selectOption("#retoDes", "estrela");
  await pg.waitForTimeout(300);
  await pg.fill("#retoMed", "8"); await pg.dispatchEvent("#retoMed", "input");
  await pg.selectOption("#retoArr", "moldura");
  await pg.waitForTimeout(400);
  const opcao = await pg.evaluate(() => [...document.querySelectorAll("#retoAlvo option")].map(o => o.textContent));
  ok(opcao.indexOf("foto praia") >= 0, "a foto a mais aparece em “em volta de”");
  await pg.selectOption("#retoAlvo", { label: "foto praia" });
  await pg.waitForTimeout(500);
  const centro = await pg.evaluate(() => { const a = elPaperBox(els[0]), b = elPaperBox(els[1]);
    return [a.x + a.w / 2 - b.x - b.w / 2, a.y + a.h / 2 - b.y - b.h / 2, b.w > a.w, b.h > a.h]; });
  ok(Math.abs(centro[0]) < 0.3 && Math.abs(centro[1]) < 0.3 && centro[2] && centro[3], "a moldura de estrelas fica em volta dela");

  // ---- 3. gravado e no PDF -----------------------------------------------------------------
  let g = await gravado();
  ok(g.d.els[0].kind === "foto" && g.d.els[0].w === 127 && g.img && g.img.indexOf(g.d.els[0].img) > 0,
     "a foto a mais fica gravada, com a imagem");
  await pg.reload();
  await pg.waitForTimeout(2300);
  el = await pg.evaluate(() => ({ kind: els[0].kind, pronta: !!origemPronta(els[0]), alvo: els[1].alvo === els[0].uid }));
  ok(el.kind === "foto" && el.pronta && el.alvo, "recarregada, volta com a imagem e a moldura presa nela");
  // o PDF com a foto a mais e sem ela (a moldura, solta dela, fica igual nos
  // dois): a diferença é o retângulo da foto
  const baixa = async () => {
    const [d] = await Promise.all([pg.waitForEvent("download", { timeout: 20000 }), pg.click("#pdf")]);
    return (streams(fs.readFileSync(await d.path())).join("\n").match(/ l\n/g) || []).length;
  };
  const guarda = await pg.evaluate(() => JSON.stringify(els.map(packEl)));
  await pg.evaluate(() => { els[1].alvo = ""; refazReto(els[1]); draw(); });
  const com = await baixa();
  await pg.evaluate(() => { els = [els[1]]; sel = 0; draw(); });
  const sem = await baixa();
  ok(com - sem === 3, "o PDF desenha o retângulo da foto a mais (" + (com - sem) + " lados além do primeiro)");
  await pg.evaluate(g => { els = JSON.parse(g).map(unpackEl); draw(); }, guarda);

  // ---- 4. Instax ------------------------------------------------------------------------
  const jan = await pg.evaluate(() => { const j = janelaInstax(); return { j, p: { x: photo.x, y: photo.y, w: photo.w } }; });
  ok(jan.j && jan.j.w === 46 && jan.j.h === 62 && Math.abs(jan.j.x - jan.p.x - 4) < 1e-6 && Math.abs(jan.j.y - jan.p.y - 6) < 1e-6,
     "no Instax mini, a janela tem 46 × 62 mm, a 4 mm dos lados e 6 mm da borda de cima");
  await aba("foto");
  ok(await pg.isVisible("#instaxTopo"), "o campo da borda de cima aparece no Instax");
  await pg.fill("#instaxTopo", "7"); await pg.dispatchEvent("#instaxTopo", "input");
  g = await gravado();
  ok(g.d.photoBox.topo === 7 && (await pg.evaluate(() => janelaInstax().y - photo.y)) === 7, "7 mm de borda de cima ficam gravados");
  await pg.selectOption("#photoSize", "100x150");
  ok(!(await pg.isVisible("#instaxTopo")) && await pg.evaluate(() => janelaInstax() === null), "fora do Instax, não há janela nem campo");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
