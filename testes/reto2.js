// Palavra e imagem em ponto reto, e a troca de ponto peça por peça.
//
// As promessas:
//   1. a palavra passa de ponto cruz para ponto reto guardando texto, fonte,
//      cor, lugar e o tamanho de verdade (16 quadradinhos de 2,5 mm viram
//      40 mm de maiúscula), e volta;
//   2. em 40 mm ela não deixa furo colado, e em 12 mm o campo de tamanho avisa
//      que está abaixo do mínimo de 18;
//   3. a imagem passa para ponto reto em contorno — um laço fechado em volta
//      da mancha — e em traço; e volta a se refazer depois de recarregar,
//      porque a imagem fica guardada.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
const { png } = require("./png.js");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

// um coração preto cheio
const CORACAO = png(200, 180, (x, y) => { const X = (x - 100) / 60, Y = -(y - 95) / 60;
  return Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y <= 0 ? 0 : 255; });

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1280, height: 860 } });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  const peca = async (i) => {
    await pg.waitForTimeout(700);
    return pg.evaluate((i) => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      return JSON.parse(localStorage.getItem(it.dados)).els[i];
    }, i);
  };
  const campo = async (id, v) => { await pg.fill("#" + id, String(v)); await pg.dispatchEvent("#" + id, "input"); await pg.waitForTimeout(700); };
  const centro = e => e.kind === "reto" ? [e.x + e.w / 2, e.y + e.h / 2]
                                         : [e.x + e.cells[0].length * 1.25, e.y + e.cells.length * 1.25];

  // ---- 1. ida e volta ----------------------------------------------------------
  await pg.click("#addText");
  await campo("txt", "Mariana");
  let a = await peca(0);
  await pg.click("#trocaPonto");
  let b = await peca(0);
  ok(b.kind === "reto" && b.desenho === "palavra", "a palavra virou ponto reto");
  ok(b.texto === "Mariana" && b.font === a.font && b.color === a.color, "com o mesmo texto, fonte e linha");
  ok(b.medida === 40, "16 quadradinhos de 2,5 mm viraram 40 mm de maiúscula (" + b.medida + ")");
  ok(Math.abs(centro(b)[0] - centro(a)[0]) < 0.3, "no mesmo lugar");
  ok(!/colados/.test(await pg.textContent("#fitTxt")), "em 40 mm, nenhum furo colado");
  await pg.click("#trocaPonto");
  let c = await peca(0);
  ok(c.kind === "text" && c.text === "Mariana" && c.rowsTarget === 16, "e volta para ponto cruz com 16 quadradinhos");

  // ---- 2. o mínimo de 18 mm ---------------------------------------------------------
  await pg.click("#trocaPonto");
  await campo("retoMed", 12);
  ok(await pg.evaluate(() => document.getElementById("tRetoMed").classList.contains("alerta")),
     "em 12 mm o campo de tamanho avisa");
  await campo("retoMed", 18);
  ok(!(await pg.evaluate(() => document.getElementById("tRetoMed").classList.contains("alerta"))),
     "em 18 mm, não");
  await campo("retoTxt", "lua");
  b = await peca(0);
  ok(b.texto === "lua", "o texto se troca na própria barra do ponto reto");

  // ---- 3. a imagem ------------------------------------------------------------------
  const [j] = await Promise.all([pg.waitForEvent("filechooser"), pg.click("#addImg")]);
  await j.setFiles({ name: "coracao.png", mimeType: "image/png", buffer: CORACAO });
  await pg.waitForTimeout(900);
  await pg.click("#trocaPonto");
  let im = await peca(1);
  ok(im.kind === "reto" && im.desenho === "imagem" && im.modo === "contorno", "a imagem virou ponto reto, em contorno");
  ok(im.pontos.length >= 1 && im.pontos.some(p => p.f === 1), "o contorno do coração é um laço fechado");
  const nContorno = im.pontos.reduce((s, p) => s + p.p.length / 2, 0);
  await pg.selectOption("#retoModo", "traco");
  await pg.waitForTimeout(800);
  im = await peca(1);
  ok(im.modo === "traco" && im.pontos.length >= 1, "em traço também sai linha (" + im.pontos.length + " caminhos)");
  await pg.selectOption("#retoModo", "contorno");
  await pg.waitForTimeout(800);
  await pg.reload();
  await pg.waitForTimeout(2500);
  await pg.click("#chips .chip:nth-child(2)");
  await campo("retoMed", 80);
  im = await peca(1);
  const nDepois = im.pontos.reduce((s, p) => s + p.p.length / 2, 0);
  ok(im.medida === 80 && nDepois < nContorno, "depois de recarregar, a imagem ainda se refaz: 80 mm tem menos furos (" +
     nContorno + " → " + nDepois + ")");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
