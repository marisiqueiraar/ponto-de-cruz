// Os itens de peças do backlog.
//
// As promessas:
//   1. os cinco desenhos novos de ponto reto estão na lista e viram peça;
//   2. a palavra em ponto reto tem arco e espaço entre letras, e o arco muda
//      a forma dela;
//   3. na moldura de retalhos, com "cores por bloco" ligado, o toque num bloco
//      troca o esquema de cores só daquele bloco, e isso fica gravado;
//   4. a moldura pode ir em volta de uma peça em vez da foto, e acompanha a
//      peça quando ela anda — também depois de recarregar.
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
  const campo = async (id, v) => { await pg.fill("#" + id, String(v)); await pg.dispatchEvent("#" + id, "input"); await pg.waitForTimeout(600); };
  const gravado = async () => {
    await pg.waitForTimeout(600);
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      return JSON.parse(localStorage.getItem(it.dados)).els;
    });
  };

  // ---- 1. desenhos novos -------------------------------------------------------
  const lista = await pg.evaluate(() => [...document.querySelectorAll("#retoDes option")].map(o => o.value));
  ok(["estrela8", "espiral", "ramo", "seigaiha", "asanoha"].every(k => lista.indexOf(k) >= 0),
     "estrela de 8, espiral, ramo, seigaiha e asanoha estão na lista");
  await pg.click("#addReto");
  for (const k of ["estrela8", "espiral", "ramo", "seigaiha", "asanoha"]){
    await pg.selectOption("#retoDes", k);
    await pg.waitForTimeout(400);
  }
  let els = await gravado();
  ok(els[0].desenho === "asanoha" && els[0].pontos.length > 50, "o asanoha virou peça (" + els[0].pontos.length + " linhas)");
  ok(!/colados/.test(await pg.textContent("#fitTxt")), "sem furo colado");
  await pg.click("#delEl");

  // ---- 2. arco e espaço na palavra de ponto reto ------------------------------------
  await pg.click("#addText");
  await campo("txt", "amor");
  await pg.click("#trocaPonto");
  await pg.waitForTimeout(800);
  ok(await pg.textContent("#retoANome") === "arco" && await pg.textContent("#retoBNome") === "espaço",
     "a palavra em ponto reto tem arco e espaço na barra");
  els = await gravado();
  const reta = { w: els[0].w, h: els[0].h };
  await campo("retoA", 80);
  els = await gravado();
  ok(els[0].opts.arco === 80 && els[0].h > reta.h * 1.15, "com 80° de arco a palavra fica mais alta, curvada (" +
     reta.h.toFixed(1) + " → " + els[0].h.toFixed(1) + " mm)");
  await campo("retoA", 0);
  await campo("retoB", 3);
  els = await gravado();
  ok(els[0].w > reta.w + 6, "3 mm de espaço entre letras alargam a palavra (" + reta.w.toFixed(1) + " → " + els[0].w.toFixed(1) + " mm)");
  await campo("retoB", 0);

  // ---- 4. moldura em volta da palavra -------------------------------------------------
  await pg.click("#addReto");
  await pg.selectOption("#retoDes", "estrela");
  await pg.waitForTimeout(300);
  await campo("retoMed", 12);
  await pg.selectOption("#retoArr", "moldura");
  await pg.waitForTimeout(500);
  await pg.selectOption("#retoAlvo", { index: 1 });
  await pg.waitForTimeout(700);
  els = await gravado();
  const centro = e => [e.x + e.w / 2, e.y + e.h / 2];
  ok(els[1].alvo === els[0].uid && Math.abs(centro(els[1])[0] - centro(els[0])[0]) < 0.3,
     "a moldura de estrelas vai em volta da palavra, centrada nela");
  await pg.click("#chips .chip:nth-child(1)");
  await pg.evaluate(() => document.activeElement.blur());
  for (let i = 0; i < 4; i++) await pg.locator("body").press("Shift+ArrowDown");
  els = await gravado();
  ok(Math.abs(centro(els[1])[1] - centro(els[0])[1]) < 0.3, "a palavra desce 2 cm e a moldura vai junto");
  await pg.reload();
  await pg.waitForTimeout(2300);
  els = await gravado();
  ok(els[1].alvo === els[0].uid, "recarregada, a moldura continua presa à palavra");

  // ---- 3. cores por bloco --------------------------------------------------------------
  await pg.click("#addMoldura");
  await pg.waitForTimeout(600);
  ok(await pg.isVisible("#patBlocos"), "a moldura de retalhos de 6 cores tem o botão cores por bloco");
  await pg.click("#patBlocos");
  const antes = (await gravado())[2].cells.join("|");
  // o toque no primeiro bloco, o do canto de cima à esquerda
  await pg.evaluate(() => {
    const el = els[2], b = el._blocos[0], p = P();
    const pt = localToPaper(el, (b.q + b.w / 2) * p, (b.r + b.h / 2) * p);
    trocaEsquemaEm(el, pt);
  });
  els = await gravado();
  ok(els[2].esquemas && els[2].esquemas[0] === 1, "o toque no bloco 0 passa ele para o esquema seguinte");
  ok(els[2].cells.join("|") !== antes, "e as cores do desenho mudam");
  await pg.click("#patBlocos");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
