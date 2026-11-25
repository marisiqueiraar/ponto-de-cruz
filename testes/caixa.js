// Minha caixa de linhas, separada de pôr a cor na peça.
//
// As promessas:
//   1. em "aplicar na peça", tocar numa cor pinta a peça e não mexe na caixa;
//   2. em "minha caixa", tocar numa cor põe na caixa (ou tira) e não mexe na
//      peça;
//   3. de volta à aplicação, as cores da caixa têm o ponto no canto;
//   4. várias de uma vez: os códigos colados entram, o que já estava é contado
//      e o que não existe é dito pelo nome;
//   5. a linha de fábrica é uma meada de verdade, com código.
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

  const estado = async () => {
    await pg.waitForTimeout(600);
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      const d = JSON.parse(localStorage.getItem(it.dados));
      const l = JSON.parse(localStorage.getItem("ponto-e-letra/linhas/v1") || '{"tenho":[]}');
      return { cor: d.els[0].color, nome: d.els[0].colorName, tenho: l.tenho };
    });
  };
  const toca = (k) => pg.click('#catGrade .cat[data-k="' + k + '"]');

  await pg.click("#addText");
  let s = await estado();
  ok(/^Anchor \d+$/.test(s.nome), "a palavra nasce com uma meada de verdade (" + s.nome + ")");

  // ---- 1. aplicar só pinta -------------------------------------------------
  await pg.click('.rail button[data-pane="linha"]');
  await toca("anchor:403");
  s = await estado();
  ok(s.nome === "Anchor 403", "em aplicar na peça, o toque pinta a peça (" + s.nome + ")");
  ok(s.tenho.length === 0, "e a caixa continua vazia");

  // ---- 2. a caixa só marca -------------------------------------------------
  await pg.click('#linhaModo button[data-modo="caixa"]');
  await toca("anchor:9046");
  s = await estado();
  ok(s.tenho.join() === "anchor:9046", "em minha caixa, o toque põe na caixa");
  ok(s.nome === "Anchor 403", "e a peça continua com a cor que tinha");
  await toca("anchor:9046");
  s = await estado();
  ok(s.tenho.length === 0, "tocar de novo tira da caixa");
  await toca("anchor:9046");

  // ---- 4. várias de uma vez ------------------------------------------------
  await pg.fill("#loteCodigos", "00268, 9046 2;99999");
  await pg.click("#loteAdd");
  s = await estado();
  ok(["anchor:268", "anchor:2", "anchor:9046"].every(k => s.tenho.indexOf(k) >= 0) && s.tenho.length === 3,
     "os códigos colados entram, 00268 como 268 (" + s.tenho.join(", ") + ")");
  const aviso = await pg.textContent("#loteAviso");
  ok(/2 entraram/.test(aviso) && /1 já estava/.test(aviso) && /99999/.test(aviso),
     "o aviso conta as novas, a que já estava e diz o código que não existe: \"" + aviso + "\"");

  // ---- 3. o ponto no canto -------------------------------------------------
  await pg.click('#linhaModo button[data-modo="peca"]');
  await pg.waitForTimeout(200);
  const classes = await pg.evaluate(() => ({
    tem: document.querySelector('#catGrade .cat[data-k="anchor:9046"]').className,
    nao: document.querySelector('#catGrade .cat[data-k="anchor:403"]').className
  }));
  ok(/\btem\b/.test(classes.tem) && !/\bon\b/.test(classes.tem), "na aplicação, a cor da caixa tem o ponto no canto");
  ok(!/\btem\b/.test(classes.nao), "e a que não é sua, não");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
