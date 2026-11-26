// Os testes que faltavam, num Chromium: o ajuste ponto a ponto com a linha
// escolhida, o textMatrix e os gestos (arrastar a peça e a pinça de dois dedos).
//
// As promessas:
//   1. num gráfico colorido, com a segunda linha escolhida na aba linha, o
//      toque do ajustar acende o quadradinho com ESSA linha, e não a primeira;
//   2. o textMatrix, que transforma a fonte em quadradinhos, obedece ao que
//      os controles prometem — sem comparar com uma grade fixa, que mudaria
//      com o navegador: a maiúscula tem a altura pedida, palavra mais longa é
//      mais larga, espaço entre letras alarga, arco faz subir, traço mais
//      grosso acende mais, e a grade sai sem borda vazia;
//   3. arrastar a peça com o mouse a leva junto, na medida do arraste;
//   4. dois dedos abrindo sobre a palavra selecionada aumentam a letra, e
//      fechando diminuem.
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
  const pg = await nav.newPage({ viewport: { width: 1280, height: 860 }, hasTouch: true });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  const naTela = async (x, y) => pg.evaluate(([x, y]) => {
    const b = cv.getBoundingClientRect(), k = cv._k || 1;
    return { x: b.left + x * k, y: b.top + y * k };
  }, [x, y]);

  // ---- 1. ajuste com a linha escolhida ---------------------------------------------
  // um gráfico de duas linhas, 4 × 3, com um buraco no meio (pelo leitor de OXS)
  await pg.evaluate(() => {
    const r = lerOXS(`<?xml version="1.0"?><chart><properties chartwidth="4" chartheight="3"/><palette>
      <palette_item index="0" number="cloth" color="FFFFFF"/>
      <palette_item index="1" number="DMC 321" color="C72B3B"/><palette_item index="2" number="DMC 310" color="000000"/></palette>
      <fullstitches>${[[0,0,1],[1,0,1],[2,0,1],[3,0,2],[0,1,1],[3,1,2],[0,2,1],[1,2,2],[2,2,2],[3,2,2]]
        .map(s => '<stitch x="' + s[0] + '" y="' + s[1] + '" palindex="' + s[2] + '"/>').join("")}</fullstitches></chart>`, "t.oxs");
    r.pecas.forEach(el => { el.x = 60; el.y = 30; els.push(el); });
    sel = els.length - 1; soUm(sel); foco = "el";
    renderChips(); syncControls(); renderPaleta(); draw();
  });
  await pg.evaluate(() => abreAba("linha"));
  await pg.click("#paletaLista .sl:nth-child(2)");
  ok(await pg.evaluate(() => slotAtivo(els[sel])) === 2, "a segunda linha do gráfico fica escolhida na aba linha");
  await pg.click("#edit");
  await pg.waitForTimeout(300);
  const buraco = await pg.evaluate(() => { const p = P(); return localToPaper(els[sel], 1.5 * p, 1.5 * p); });
  const t = await naTela(buraco.x, buraco.y);
  await pg.mouse.click(t.x, t.y);
  await pg.waitForTimeout(200);
  const v = await pg.evaluate(() => els[sel].cells[1][1]);
  ok(v === 2, "o toque do ajustar acende o buraco com a linha escolhida (" + v + "), e não com a primeira");
  await pg.click("#edit");

  // ---- 2. textMatrix ------------------------------------------------------------------
  const tm = await pg.evaluate(() => {
    const F = FONTE_PADRAO, conta = m => m.reduce((n, r) => n + r.filter(Boolean).length, 0);
    const borda = m => m[0].some(Boolean) && m[m.length - 1].some(Boolean) &&
                       m.some(r => r[0]) && m.some(r => r[r.length - 1]);
    const H = textMatrix("H", F, 20, 2, 0.35, 0, 0);
    const a16 = textMatrix("amor", F, 16, 2, 0.35, 0, 0), a24 = textMatrix("amor", F, 24, 2, 0.35, 0, 0);
    const longa = textMatrix("amorzinho", F, 16, 2, 0.35, 0, 0);
    const esp = textMatrix("amor", F, 16, 2, 0.35, 3, 0);
    const arco = textMatrix("amorzinho", F, 16, 2, 0.35, 0, 60);
    const fino = textMatrix("amor", F, 16, 1, 0.35, 0, 0), grosso = textMatrix("amor", F, 16, 4, 0.35, 0, 0);
    return { H: H.length, a16: [a16.length, a16[0].length], a24: [a24.length, a24[0].length],
             longa: longa[0].length, esp: esp[0].length, arco: arco.length, longaRows: longa.length,
             fino: conta(fino), grosso: conta(grosso), bordas: [H, a16, longa, esp, arco].every(borda) };
  });
  ok(Math.abs(tm.H - 20) <= 1, "um H de 20 quadradinhos de maiúscula tem " + tm.H + " de altura");
  ok(tm.a24[0] > tm.a16[0] && tm.a24[1] > tm.a16[1], "pedir 24 em vez de 16 cresce a palavra nos dois sentidos");
  ok(tm.longa > tm.a16[1] * 1.6, "amorzinho é bem mais larga que amor (" + tm.longa + " × " + tm.a16[1] + ")");
  ok(tm.esp > tm.a16[1] + 6, "3 de espaço entre letras alargam amor (" + tm.a16[1] + " → " + tm.esp + ")");
  ok(tm.arco > tm.longaRows + 2, "60° de arco fazem a palavra subir (" + tm.longaRows + " → " + tm.arco + " fileiras)");
  ok(tm.grosso > tm.fino * 1.08, "traço 4 acende mais que traço 1 (" + tm.fino + " → " + tm.grosso + ")");
  ok(tm.bordas, "a grade sai sem fileira nem coluna vazia na borda");

  // ---- 3. arrastar a peça -----------------------------------------------------------------
  await pg.evaluate(() => abreAba("pecas"));
  await pg.click("#addText");
  await pg.waitForTimeout(500);
  await pg.evaluate(() => document.activeElement.blur());
  const antes = await pg.evaluate(() => { const b = elPaperBox(els[sel]); return { x: els[sel].x, y: els[sel].y, cx: b.x + b.w / 2, cy: b.y + b.h / 2, i: sel }; });
  // começa num quadradinho aceso, para pegar a palavra e não o vazio
  const pega = await pg.evaluate(() => {
    const el = els[sel], p = P();
    for (let r = 0; r < el.cells.length; r++) for (let q = 0; q < el.cells[r].length; q++)
      if (el.cells[r][q]) return localToPaper(el, (q + 0.5) * p, (r + 0.5) * p);
  });
  const k = await pg.evaluate(() => cv._k);
  const de = await naTela(pega.x, pega.y);
  await pg.mouse.move(de.x, de.y);
  await pg.mouse.down();
  await pg.mouse.move(de.x + 17.3 * k, de.y + 23.7 * k, { steps: 8 });
  await pg.mouse.up();
  const depois = await pg.evaluate(i => ({ x: els[i].x, y: els[i].y }), antes.i);
  const dx = depois.x - antes.x, dy = depois.y - antes.y;
  // o ímã pode puxar até uns milímetros para encostar em algo
  ok(Math.abs(dx - 17.3) < 3 && Math.abs(dy - 23.7) < 3, "arrastar a palavra a leva junto (" + dx.toFixed(1) + ", " + dy.toFixed(1) + " mm)");

  // ---- 4. a pinça -------------------------------------------------------------------------
  // dedos de verdade, pelo protocolo do Chromium: evento sintético de ponteiro
  // não abre captura, e o app captura cada dedo
  const cdp = await pg.context().newCDPSession(pg);
  const pinca = async (de, ate) => {
    const c = await pg.evaluate(i => { const b = elPaperBox(els[i]); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; }, antes.i);
    const m = await naTela(c.x, c.y);
    const dedos = d => [{ x: m.x - d, y: m.y, id: 1 }, { x: m.x + d, y: m.y, id: 2 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: dedos(de) });
    for (let i = 1; i <= 6; i++)
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: dedos(de + (ate - de) * i / 6) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await pg.waitForTimeout(200);
    return pg.evaluate(i => els[i].rowsTarget, antes.i);
  };
  const r0 = await pg.evaluate(i => els[i].rowsTarget, antes.i);
  const r1 = await pinca(20, 40);
  ok(r1 > r0, "dois dedos abrindo aumentam a letra (" + r0 + " → " + r1 + " quadradinhos)");
  const r2 = await pinca(40, 20);
  ok(r2 < r1, "e fechando diminuem (" + r1 + " → " + r2 + ")");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
