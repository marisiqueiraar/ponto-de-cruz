// Moldura e faixa em ponto reto.
//
// As promessas:
//   1. a faixa repete o desenho o número de vezes pedido, em pé ou deitada;
//   2. a moldura dá a volta na foto, centrada nela, com a margem pedida, e se
//      refaz quando a foto muda de tamanho;
//   3. a moldura de ziguezague é uma linha só, fechada, em volta da foto;
//   4. nenhuma delas, no tamanho de fábrica, deixa furo colado;
//   5. o arranjo volta igual depois de recarregar.
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
    await pg.waitForTimeout(700);
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      const d = JSON.parse(localStorage.getItem(it.dados));
      const t = d.photoBox.size.split("x").map(Number);
      return { e: d.els[0], foto: { x: d.photoBox.x, y: d.photoBox.y, w: t[0], h: t[1] } };
    });
  };
  const campo = async (id, v) => { await pg.fill("#" + id, String(v)); await pg.dispatchEvent("#" + id, "input"); await pg.waitForTimeout(500); };
  const colados = () => pg.textContent("#fitTxt").then(t => /colados/.test(t));

  await pg.click("#addReto");
  await pg.selectOption("#retoDes", "coracao");
  await pg.waitForTimeout(400);
  let s = await estado();
  const caminhos1 = s.e.pontos.length, alt1 = s.e.h;

  // ---- 1. faixa ----------------------------------------------------------------
  await pg.selectOption("#retoArr", "faixa");
  await campo("retoRep", 5);
  await campo("retoGap", 4);
  s = await estado();
  ok(s.e.arranjo === "faixa" && s.e.pontos.length === caminhos1 * 5, "a faixa repete o coração 5 vezes");
  ok(Math.abs(s.e.h - (alt1 * 5 + 4 * 4)) < 0.6, "em pé, com 4 mm entre um e outro (" + s.e.h.toFixed(1) + " mm)");
  await pg.click("#retoDeit");
  s = await estado();
  ok(s.e.deitada === 1 && s.e.w > s.e.h * 3, "deitada, a fileira vira na horizontal");
  ok(!(await colados()), "sem furo colado");

  // ---- 2. moldura --------------------------------------------------------------
  await pg.selectOption("#retoDes", "folha");
  await pg.waitForTimeout(400);
  await campo("retoMed", 22);
  await pg.selectOption("#retoArr", "moldura");
  await pg.waitForTimeout(700);
  s = await estado();
  const cx = s.e.x + s.e.w / 2, cy = s.e.y + s.e.h / 2;
  ok(Math.abs(cx - (s.foto.x + s.foto.w / 2)) < 0.2 && Math.abs(cy - (s.foto.y + s.foto.h / 2)) < 0.2,
     "a moldura de folhas fica centrada na foto");
  ok(s.e.w > s.foto.w + 2 * 6 && s.e.h > s.foto.h + 2 * 6, "e dá a volta nela, com a margem por fora");
  ok(!(await colados()), "sem furo colado");
  const largAntes = s.e.w;
  await pg.evaluate(() => abreAba("foto"));
  await pg.selectOption("#photoSize", "127x178");
  await pg.evaluate(() => abreAba("pecas"));
  s = await estado();
  ok(s.e.w > largAntes + 20, "foto maior, moldura maior (" + largAntes.toFixed(0) + " → " + s.e.w.toFixed(0) + " mm)");

  // ---- 3. ziguezague contínuo --------------------------------------------------
  await pg.click("#chips .chip");
  await pg.selectOption("#retoDes", "ziguezague");
  await pg.waitForTimeout(400);
  await pg.selectOption("#retoArr", "moldura");
  await pg.waitForTimeout(700);
  s = await estado();
  ok(s.e.pontos.length === 1 && s.e.pontos[0].f === 1, "a moldura de ziguezague é uma linha só, fechada");
  ok(!(await colados()), "sem furo colado");

  // ---- 5. recarregar -----------------------------------------------------------
  const antes = JSON.stringify(s.e.pontos);
  await pg.reload();
  await pg.waitForTimeout(2300);
  s = await estado();
  ok(s.e.arranjo === "moldura" && JSON.stringify(s.e.pontos) === antes, "recarregada, a moldura volta igual");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
