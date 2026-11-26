// O modo de acompanhamento, num Chromium.
//
// As promessas:
//   1. com o tique ligado, tocar num quadradinho aceso marca que ele foi
//      bordado, e o rodapé conta; tocar de novo desmarca;
//   2. arrastar marca o traço inteiro;
//   3. no ponto reto, tocar no meio de um ponto marca aquele ponto;
//   4. a marcação fica gravada com o molde e volta ao recarregar;
//   5. o desfazer devolve um traço por vez; com o tique ligado, a peça não anda.
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
  // ponto do papel (mm) para ponto da janela (px)
  const naTela = async (x, y) => pg.evaluate(([x, y]) => {
    const b = cv.getBoundingClientRect(), k = cv._k || 1;
    return { x: b.left + x * k, y: b.top + y * k };
  }, [x, y]);
  // o centro do quadradinho (r, q) da peça i, em mm de papel
  const celula = (i, r, q) => pg.evaluate(([i, r, q]) => {
    const p = P(); return localToPaper(els[i], (q + 0.5) * p, (r + 0.5) * p);
  }, [i, r, q]);
  const progresso = () => pg.evaluate(() => progressoTotal());

  await pg.click("#addText");
  await pg.waitForTimeout(500);
  await pg.click("#addReto");
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { els[1].y = els[0].y + 45; draw(); scheduleSave(); });
  // uma fileira de quadradinhos acesos seguidos na palavra
  const fila = await pg.evaluate(() => {
    const c = els[0].cells;
    for (let r = 0; r < c.length; r++)
      for (let q = 0; q + 2 < c[r].length; q++)
        if (c[r][q] && c[r][q + 1] && c[r][q + 2]) return { r, q };
    return null;
  });
  const antes = await pg.evaluate(() => [els[0].x, els[0].y]);

  // ---- 1. um toque -------------------------------------------------------------------
  await pg.click("#zFeito");
  const c0 = await celula(0, fila.r, fila.q), t0 = await naTela(c0.x, c0.y);
  await pg.mouse.click(t0.x, t0.y);
  await pg.waitForTimeout(200);
  let pr = await progresso();
  ok(pr.feitos === 1 && /Bordado: 1 de/.test(await pg.textContent("#modeHint")),
     "um toque marca um ponto, e o rodapé conta: " + (await pg.textContent("#modeHint")).split(".")[0]);
  ok(await pg.evaluate(() => [els[0].x, els[0].y]).then(p => p[0] === antes[0] && p[1] === antes[1]),
     "com o tique ligado, a peça não anda");
  await pg.mouse.click(t0.x, t0.y);
  pr = await progresso();
  ok(pr.feitos === 0, "tocar de novo desmarca");

  // ---- 2. arrastar -----------------------------------------------------------------------
  const c2 = await celula(0, fila.r, fila.q + 2), t2 = await naTela(c2.x, c2.y);
  await pg.mouse.move(t0.x, t0.y);
  await pg.mouse.down();
  await pg.mouse.move(t2.x, t2.y, { steps: 6 });
  await pg.mouse.up();
  pr = await progresso();
  ok(pr.feitos === 3, "arrastar marca os três quadradinhos do traço (" + pr.feitos + ")");

  // ---- 3. ponto reto ---------------------------------------------------------------------
  const meio = await pg.evaluate(() => {
    const el = els[1], f = el.pontos[0].furos;
    return localToPaper(el, (f[0][0] + f[1][0]) / 2, (f[0][1] + f[1][1]) / 2);
  });
  const t3 = await naTela(meio.x, meio.y);
  await pg.mouse.click(t3.x, t3.y);
  const reto = await pg.evaluate(() => progressoDe(els[1]));
  ok(reto.feitos === 1, "no ponto reto, o toque no meio de um ponto marca aquele ponto");

  // ---- 5. desfazer -------------------------------------------------------------------------
  await pg.click("#undo");
  await pg.waitForTimeout(300);
  pr = await progresso();
  ok(pr.feitos === 3, "desfazer tira só o último toque (" + pr.feitos + ")");
  await pg.click("#redo");
  await pg.waitForTimeout(300);

  // ---- 4. gravado -----------------------------------------------------------------------------
  await pg.waitForTimeout(700);
  await pg.reload();
  await pg.waitForTimeout(2300);
  pr = await progresso();
  ok(pr.feitos === 4, "recarregado, o molde volta com os 4 pontos marcados (" + pr.feitos + ")");
  await pg.click("#zFeito");
  await pg.click("#feitoLimpa");
  await pg.click("#feitoLimpa");
  ok((await progresso()).feitos === 0, "desmarcar tudo pede confirmação e limpa");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
