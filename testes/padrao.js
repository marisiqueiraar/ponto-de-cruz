// A moldura de blocos e a faixa de marca-página.
//
// As promessas:
//   1. a moldura dá a volta na foto e a foto cabe na abertura do meio, com a
//      margem pedida — moldura que encosta na foto não é moldura;
//   2. trocar o tamanho da foto refaz a moldura, que continua centrada nela;
//   3. as células guardam o índice da linha, e a paleta vai gravada junto;
//   4. a faixa nasce do comprimento do papel de marca-página, sem passar dele;
//   5. repetir, espaço e deitada mudam a faixa do jeito que dizem;
//   6. a moldura reabre do jeito que foi deixada.
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

  const molde = async () => {
    await pg.waitForTimeout(600);
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      return JSON.parse(localStorage.getItem(it.dados));
    });
  };
  const ultima = async () => { const m = await molde(); return { m, e: m.els[m.els.length - 1] }; };
  const campo = async (id, v) => {
    await pg.fill("#" + id, String(v));
    await pg.dispatchEvent("#" + id, "input");
    await pg.waitForTimeout(300);
  };
  const aba = (n) => pg.click('#rail button[data-pane="' + n + '"]');
  const P = 2.5;   // o quadradinho de fábrica, em mm
  // a foto como o molde a grava: lugar em mm e tamanho pelo nome da medida
  const fotoDe = (m) => {
    const b = m.photoBox, t = b.size.split("x").map(Number);
    const deitada = b.or === "l";
    return { x: b.x, y: b.y, w: deitada ? t[1] : t[0], h: deitada ? t[0] : t[1] };
  };

  // a abertura da moldura, em mm de papel: a caixa dos quadradinhos vazios
  // que ficam entre os blocos de dentro
  const abertura = (e) => {
    const rows = e.cells.length, cols = e.cells[0].length;
    // pela linha e pela coluna do meio, que só cruzam bloco nas bordas
    const meio = Math.floor(rows / 2);
    const col = Math.floor(cols / 2);
    let r0 = 0; while (r0 < rows && e.cells[r0][col] !== "0") r0++;
    let r1 = rows - 1; while (r1 >= 0 && e.cells[r1][col] !== "0") r1--;
    let c0 = 0; while (c0 < cols && e.cells[meio][c0] !== "0") c0++;
    let c1 = cols - 1; while (c1 >= 0 && e.cells[meio][c1] !== "0") c1--;
    return { x0: e.x + c0 * P, x1: e.x + (c1 + 1) * P, y0: e.y + r0 * P, y1: e.y + (r1 + 1) * P };
  };

  // ---- 1. a moldura em volta da polaroid ---------------------------------
  await aba("foto");
  await pg.selectOption("#photoSize", "88x107");
  await aba("pecas");
  await pg.click("#addMoldura");
  let { m, e } = await ultima();
  ok(e.kind === "pat" && e.arranjo === "moldura", "a moldura entrou como peça de padrão");
  ok(e.paleta.length === 6, "com seis linhas de fábrica (tem " + e.paleta.length + ")");
  ok(e.paleta.every(s => s.chave), "todas casadas com uma meada da cartela");
  let ab = abertura(e), f = fotoDe(m);
  ok(ab.x0 <= f.x - 6 + 0.01 && ab.x1 >= f.x + f.w + 6 - 0.01 &&
     ab.y0 <= f.y - 6 + 0.01 && ab.y1 >= f.y + f.h + 6 - 0.01,
     "a foto cabe na abertura com os 6 mm de margem");
  const cx = e.x + e.cells[0].length * P / 2, cy = e.y + e.cells.length * P / 2;
  ok(Math.abs(cx - (f.x + f.w / 2)) < 0.11 && Math.abs(cy - (f.y + f.h / 2)) < 0.11,
     "e fica centrada nela");
  const usadas = new Set(e.cells.join("").replace(/0/g, ""));
  ok(usadas.size === 6, "os blocos usam as seis linhas (" + [...usadas].join(",") + ")");

  // ---- 2. a foto muda, a moldura acompanha -------------------------------
  const largAntes = e.cells[0].length;
  await aba("foto");
  await pg.selectOption("#photoSize", "127x178");
  await aba("pecas");
  ({ m, e } = await ultima());
  ab = abertura(e); f = fotoDe(m);
  ok(e.cells[0].length > largAntes, "foto maior, moldura com mais blocos (" +
     largAntes + " → " + e.cells[0].length + " colunas)");
  ok(ab.x0 <= f.x - 6 + 0.01 && ab.x1 >= f.x + f.w + 6 - 0.01 &&
     ab.y0 <= f.y - 6 + 0.01 && ab.y1 >= f.y + f.h + 6 - 0.01,
     "e a foto nova continua cabendo com a margem");

  // ---- 3. margem e cores --------------------------------------------------
  await pg.click("#chips .chip:last-child");
  await campo("patMargem", 20);
  ({ m, e } = await ultima());
  ab = abertura(e); f = fotoDe(m);
  ok(ab.x0 <= f.x - 20 + 0.01 && ab.y1 >= f.y + f.h + 20 - 0.01, "a margem de 20 mm é respeitada");
  await campo("patCores", 3);
  ({ e } = await ultima());
  ok(e.paleta.length === 3, "três cores deixam três linhas na paleta");
  ok(new Set(e.cells.join("").replace(/0/g, "")).size === 3, "e os blocos só usam essas três");
  await pg.selectOption("#patMot", "b:catavento");
  ({ e } = await ultima());
  ok(e.motivo === "b:catavento", "o desenho troca para cata-vento");

  // ---- 4. a faixa no marca-página ----------------------------------------
  await aba("papel");
  await pg.selectOption("#paperSize", "50x180");
  await aba("foto");
  await pg.selectOption("#photoSize", "none");
  await aba("pecas");
  await pg.click("#addFaixa");
  ({ m, e } = await ultima());
  ok(e.kind === "pat" && e.arranjo === "faixa", "a faixa entrou como peça de padrão");
  const h = e.cells.length * P, w = e.cells[0].length * P;
  ok(e.rep >= 4, "com " + e.rep + " motivos para o comprimento do papel");
  ok(e.y >= 0 && e.y + h <= 180 && e.x >= 0 && e.x + w <= 50,
     "inteira dentro do marca-página de 5 × 18 cm");
  ok(Math.abs(e.x + w / 2 - 25) < 0.11, "centrada na largura dele");
  ok(e.paleta.length === 1, "numa linha só");

  // ---- 5. repetir, espaço e deitada --------------------------------------
  await campo("patRep", 3);
  ({ e } = await ultima());
  ok(e.rep === 3 && e.cells.length === 3 * 11 + 2 * 1, "3 medalhões de 11 com 1 de espaço: 35 linhas (deu " + e.cells.length + ")");
  await campo("patGap", 0);
  ({ e } = await ultima());
  ok(e.cells.length === 33, "sem espaço, 33");
  await pg.click("#patDeit");
  ({ e } = await ultima());
  ok(e.deitada === 1 && e.cells[0].length === 33 && e.cells.length === 11, "deitada, a fileira vira 33 × 11");
  await campo("patCores", 3);
  ({ e } = await ultima());
  const porMotivo = [0, 11, 22].map(q0 => e.cells.map(l => l.slice(q0, q0 + 11)).join("").replace(/0/g, ""));
  ok(porMotivo.every((t, i) => t.length && new Set(t).size === 1 && t[0] === String(i + 1)),
     "com três cores, cada medalhão leva a sua linha");

  // ---- 6. a moldura volta do arquivo como foi --------------------------------
  await pg.reload();
  await pg.waitForTimeout(2000);
  ({ m } = await ultima());
  const mold = m.els.find(x => x.kind === "pat" && x.arranjo === "moldura");
  ok(mold && mold.motivo === "b:catavento" && mold.margem === 20 && mold.paleta.length === 3,
     "a moldura reabre com desenho, margem e paleta");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" +
     (erros.length ? ": " + erros[0] : ""));

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
