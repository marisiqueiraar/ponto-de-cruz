// O que ficou de fora do backlog e entrou depois, num Chromium.
//
// As promessas:
//   1. o laço gira o bloco 15° em volta do meio dele, com cada peça inclinando
//      junto, e não passa dos 45°; com a foto no laço, não gira e diz por quê;
//   2. espelhar o bloco troca a esquerda pela direita e espelha cada peça;
//   3. o molde fixado fica no topo da estante, mesmo abrindo outro;
//   4. o ímã entre peças desliga pela aba peças (e fica gravado) e pelo Alt;
//   5. a foto a mais em tamanho Instax tem a janela da imagem, e o PDF diz
//      onde colar cada foto a mais.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const fs = require("fs"), path = require("path");
const alvo = "file://" + path.resolve(__dirname, "..", "index.html");
const streams = require("./streams.js");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };
const perto = (a, b, t) => Math.abs(a - b) <= (t || 0.15);

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

  // duas peças, uma à esquerda e outra à direita
  await pg.click("#addText");
  await pg.waitForTimeout(400);
  await pg.click("#addReto");
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { els[0].x = 30; els[0].y = 200; els[1].x = 120; els[1].y = 200; els[1].flip = 0; draw(); });
  const centros = () => pg.evaluate(() => els.map(e => { const b = elPaperBox(e); return [b.x + b.w / 2, b.y + b.h / 2, e.rot, e.flip || 0]; }));

  // ---- 1. girar -----------------------------------------------------------------------
  await pg.evaluate(() => { marca = [0, 1]; marcaFoto = false; syncControls(); draw(); });
  const c0 = await centros();
  const caixa0 = await pg.evaluate(() => { const c = caixaDoLaco(); return [c.x + c.w / 2, c.y + c.h / 2]; });
  await pg.click("#giraLacoD");
  const c1 = await centros();
  const ang = Math.atan2(c1[1][1] - c1[0][1], c1[1][0] - c1[0][0]) - Math.atan2(c0[1][1] - c0[0][1], c0[1][0] - c0[0][0]);
  const d0 = Math.hypot(c0[1][0] - c0[0][0], c0[1][1] - c0[0][1]), d1 = Math.hypot(c1[1][0] - c1[0][0], c1[1][1] - c1[0][1]);
  ok(perto(ang * 180 / Math.PI, 15, 0.3) && perto(d0, d1, 0.2), "girar leva as peças 15° em volta do meio, sem mudar a distância entre elas");
  ok(c1[0][2] === 15 && c1[1][2] === 15, "e cada peça inclina 15° junto");
  for (let i = 0; i < 3; i++) await pg.click("#giraLacoD");
  ok((await centros())[0][2] === 45, "até 45°");
  await pg.click("#giraLacoD");
  ok((await centros())[0][2] === 45 && /45°/.test(await pg.textContent("#modeHint")), "e não passa disso: o rodapé diz por quê");
  for (let i = 0; i < 3; i++) await pg.click("#giraLacoE");
  ok((await centros()).every(c => c[2] === 0), "girar para o outro lado volta ao reto");
  await pg.evaluate(() => { marcaFoto = true; syncControls(); });
  await pg.click("#giraLacoD");
  ok((await centros()).every(c => c[2] === 0) && /a foto não inclina/.test(await pg.textContent("#modeHint")),
     "com a foto no laço, o bloco não gira e o rodapé diz por quê");
  await pg.evaluate(() => { marcaFoto = false; syncControls(); });

  // ---- 2. espelhar ----------------------------------------------------------------------
  const a = await centros();
  const m = await pg.evaluate(() => { const c = caixaDoLaco(); return c.x + c.w / 2; });
  await pg.click("#espLaco");
  await pg.waitForTimeout(300);
  const b = await centros();
  ok(perto(b[0][0], 2 * m - a[0][0], 0.3) && perto(b[1][0], 2 * m - a[1][0], 0.3) && perto(b[0][1], a[0][1]),
     "espelhar troca a esquerda pela direita, na mesma altura");
  ok(b[0][3] === 1 && b[1][3] === 1, "e cada peça se espelha");

  // ---- 3. fixar --------------------------------------------------------------------------
  await aba("moldes");
  await pg.click("#moldeLista .mold:nth-child(1) .fixa");
  const fixo = await pg.evaluate(() => estante.atual);
  await pg.click("#moldeNovo");
  await pg.waitForTimeout(300);
  await pg.click("#moldeNovo");
  await pg.waitForTimeout(300);
  let ids = await pg.evaluate(() => estante.itens.map(i => i.id));
  ok(ids[0] === fixo, "o molde fixado fica no topo, acima dos novos");
  await pg.click("#moldeLista .mold:nth-child(3) .abre");
  await pg.waitForTimeout(500);
  ids = await pg.evaluate(() => estante.itens.map(i => i.id));
  const aberto = await pg.evaluate(() => estante.atual);
  ok(ids[0] === fixo && ids[1] === aberto, "abrir outro o põe logo abaixo do fixado");
  await pg.click("#moldeLista .mold:nth-child(1) .fixa");
  ok(await pg.evaluate(() => !estante.itens.some(i => i.fixo)), "o alfinete solta de novo");
  await pg.click("#moldeLista .mold:nth-child(" + (ids.indexOf(fixo) + 1) + ") .abre");
  await pg.waitForTimeout(500);

  // ---- 4. ímã desligável -------------------------------------------------------------------
  const ima = await pg.evaluate(() => {
    const o = elPaperBox(els[0]), b = elPaperBox(els[1]);
    const t = { x: o.x + o.w + 0.4, y: b.y, w: b.w, h: b.h };
    const liga = imanta(t, els[1]).x;
    imaSolto = true; const alt = imanta(t, els[1]).x; imaSolto = false;
    return { liga, alt };
  });
  ok(perto(ima.liga, -0.4, 0.01) && ima.alt === 0, "segurar Alt solta o ímã durante o arraste");
  await aba("pecas");
  await pg.uncheck("#imaPecas");
  const desl = await pg.evaluate(() => {
    const o = elPaperBox(els[0]), b = elPaperBox(els[1]);
    return { x: imanta({ x: o.x + o.w + 0.4, y: b.y, w: b.w, h: b.h }, els[1]).x,
             gravado: JSON.parse(localStorage.getItem("ponto-e-letra/tela/v1")).ima };
  });
  ok(desl.x === 0 && desl.gravado === 0, "desmarcar o ímã entre peças desliga o encostar, e fica gravado no aparelho");
  await pg.reload();
  await pg.waitForTimeout(2300);
  ok(!(await pg.isChecked("#imaPecas")) && await pg.evaluate(() => imaPecas === false), "recarregada, a página lembra");
  await pg.check("#imaPecas");

  // ---- 5. foto a mais em Instax ---------------------------------------------------------------
  await aba("foto");
  await pg.selectOption("#photoSize", "54x86");
  await pg.click("#addFoto");
  await pg.waitForTimeout(300);
  await pg.evaluate(() => { const el = els[els.length - 1]; el.x = 20; el.y = 20; draw(); });
  const jan = await pg.evaluate(() => janelaDaFoto(els[els.length - 1]));
  ok(jan && jan.w === 46 && jan.h === 62 && jan.x === 4 && jan.y === 6, "a foto a mais em Instax mini tem a janela de 46 × 62 mm");
  await pg.click("#fotoGira");
  await pg.evaluate(() => { const el = els[els.length - 1]; el.x = 20; el.y = 20; draw(); });
  const jd = await pg.evaluate(() => janelaDaFoto(els[els.length - 1]));
  ok(jd && jd.w === 62 && jd.h === 46 && jd.x === 6, "deitada, a janela deita junto, com a borda de cima à esquerda");
  const [d] = await Promise.all([pg.waitForEvent("download", { timeout: 20000 }), pg.click("#pdf")]);
  const st = streams(fs.readFileSync(await d.path())).join("\n");
  ok(/Outra foto: 86,0 x 54,0 mm a 20,0 da esquerda e 20,0 de cima/.test(st), "o PDF diz onde colar a foto a mais");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
