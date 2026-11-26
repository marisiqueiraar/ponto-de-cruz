// OXS, o formato aberto de gráfico de ponto cruz, num Chromium.
//
// As promessas:
//   1. exportar dá um XML de OXS com a paleta, um ponto cheio por quadradinho
//      aceso e o ponto reto como ponto atrás;
//   2. trazer esse mesmo arquivo de volta dá um gráfico com o mesmo número de
//      pontos e as mesmas linhas, e uma peça de ponto reto com os mesmos pontos;
//   3. um OXS de outro programa (feito à mão aqui) entra com a cor de catálogo
//      certa e avisa do meio ponto que ficou de fora;
//   4. arquivo que não é OXS é recusado com aviso.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const fs = require("fs"), path = require("path"), os = require("os");
const alvo = "file://" + path.resolve(__dirname, "..", "index.html");
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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "oxs-"));

  await pg.click("#addText");
  await pg.waitForTimeout(500);
  await pg.click("#addReto");
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { els[1].y = els[0].y + 45; draw(); });
  const orig = await pg.evaluate(() => ({ cheios: countOf(els[0]), segs: progressoDe(els[1]).total,
                                          cor: corDe(els[0]).nome, corReto: corDe(els[1]).nome }));

  // ---- 1. exportar -------------------------------------------------------------------
  await pg.evaluate(() => abreAba("moldes"));
  const [d] = await Promise.all([pg.waitForEvent("download"), pg.click("#oxsSalvar")]);
  const arq = path.join(tmp, "molde.oxs");
  fs.copyFileSync(await d.path(), arq);
  const xml = fs.readFileSync(arq, "utf8");
  const n = re => (xml.match(re) || []).length;
  ok(/^<\?xml/.test(xml) && /<chart>/.test(xml) && /oxsversion="1.0"/.test(xml), "sai um XML de OXS");
  ok(n(/<stitch /g) === orig.cheios, "com um ponto cheio por quadradinho aceso (" + n(/<stitch /g) + " de " + orig.cheios + ")");
  ok(n(/<backstitch /g) >= orig.segs * 0.95, "e o ponto reto como ponto atrás (" + n(/<backstitch /g) + " de " + orig.segs + ")");
  ok(xml.indexOf('number="' + orig.cor + '"') > 0, "a paleta leva o nome da linha (" + orig.cor + ")");

  // ---- 2. de volta ----------------------------------------------------------------------
  await pg.click("#moldeNovo");
  await pg.waitForTimeout(400);
  await pg.setInputFiles("#oxsArq", arq);
  await pg.waitForTimeout(800);
  const volta = await pg.evaluate(() => els.map(e => ({ kind: e.kind, n: e.kind === "reto" ? progressoDe(e).total : countOf(e),
    pal: (e.paleta || []).map(s => s.rotulo), cor: corDe(e).nome })));
  ok(volta.length === 2 && volta[0].kind === "img" && volta[0].n === orig.cheios,
     "de volta, o gráfico tem os mesmos " + orig.cheios + " pontos");
  ok(volta[0].pal.length === 1 && volta[0].pal[0] === orig.cor, "e a mesma linha: " + volta[0].pal.join(", "));
  ok(volta[1].kind === "reto" && volta[1].n === n(/<backstitch /g) && volta[1].cor === orig.corReto,
     "o ponto atrás volta como ponto reto, com os mesmos pontos e a mesma linha");

  // ---- 3. de outro programa ----------------------------------------------------------------
  const outro = path.join(tmp, "coracao.oxs");
  fs.writeFileSync(outro, `<?xml version="1.0" encoding="UTF-8"?>
<chart><properties oxsversion="1.0" chartwidth="3" chartheight="2" charttitle="coração" palettecount="2"/>
<palette>
<palette_item index="0" number="cloth" name="cloth" color="FFFFFF"/>
<palette_item index="1" number="DMC 321" name="Red" color="C72B3B"/>
<palette_item index="2" number="DMC 310" name="Black" color="000000"/>
</palette>
<fullstitches>
<stitch x="0" y="0" palindex="1"/><stitch x="2" y="0" palindex="1"/><stitch x="1" y="1" palindex="2"/>
</fullstitches>
<partstitches><partstitch x="1" y="0" palindex1="1" palindex2="0" direction="1"/></partstitches>
</chart>`);
  await pg.click("#moldeNovo");
  await pg.waitForTimeout(400);
  await pg.setInputFiles("#oxsArq", outro);
  await pg.waitForTimeout(800);
  const cor = await pg.evaluate(() => ({ cells: els[0].cells.map(r => r.join("")), pal: els[0].paleta.map(s => s.chave + "=" + s.rotulo) }));
  ok(cor.cells.join("/") === "101/020", "o coração de outro programa entra na grade certa (" + cor.cells.join("/") + ")");
  ok(cor.pal.join(",") === "dmc:321=DMC 321,dmc:310=DMC 310", "com as linhas da DMC achadas no catálogo: " + cor.pal.join(", "));
  ok(/1 ponto .*ficou de fora/.test(await pg.textContent("#moldeAviso")), "e avisa do meio ponto que ficou de fora");

  // ---- 4. não é OXS ----------------------------------------------------------------------
  const ruim = path.join(tmp, "ruim.oxs");
  fs.writeFileSync(ruim, "isso não é xml");
  await pg.setInputFiles("#oxsArq", ruim);
  await pg.waitForTimeout(500);
  ok(/não é um OXS/.test(await pg.textContent("#moldeAviso")), "arquivo que não é OXS é recusado com aviso");

  fs.rmSync(tmp, { recursive: true, force: true });
  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
