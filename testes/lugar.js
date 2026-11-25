// Onde as peças ficam.
//
// As promessas:
//   1. molde novo nasce vazio — sem palavra de exemplo;
//   2. peça nova nasce reta, num lugar livre: embaixo da foto, sem encostar
//      nela nem nas outras peças, e dentro do papel;
//   3. mexer na altura ou no texto não tira a palavra do lugar: ela cresce em
//      volta do próprio centro — e, embaixo da foto, para baixo;
//   4. foto que muda de tamanho leva as peças junto — o nome que estava
//      embaixo continua embaixo, à mesma distância;
//   5. papel que muda leva o arranjo inteiro, e ele entra no papel novo
//      quando cabe;
//   6. o nome do molde acompanha as peças até a pessoa escrever um.
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
      const mm = parseFloat(d.mm);
      const t = d.photoBox.size.split("x").map(Number), deitada = d.photoBox.or === "l";
      return {
        nome: it.nome,
        foto: { x: d.photoBox.x, y: d.photoBox.y, w: deitada ? t[1] : t[0], h: deitada ? t[0] : t[1] },
        papel: d.paper.size,
        els: d.els.map(e => ({ kind: e.kind, x: e.x, y: e.y, rot: e.rot, text: e.text,
                                w: e.cells[0].length * mm, h: e.cells.length * mm }))
      };
    });
  };
  const centro = e => ({ x: e.x + e.w / 2, y: e.y + e.h / 2 });
  const perto = (a, b, t) => Math.abs(a - b) <= (t || 0.11);
  const encosta = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const campo = async (id, v) => {
    await pg.fill("#" + id, String(v));
    await pg.dispatchEvent("#" + id, "input");
    await pg.waitForTimeout(300);
  };
  const aba = n => pg.click('#rail button[data-pane="' + n + '"]');

  // ---- 1. molde novo, vazio ------------------------------------------------
  let s = await pg.evaluate(() => document.querySelectorAll("#chips .chip").length);
  ok(s === 0, "o molde novo nasce sem peça nenhuma (tem " + s + ")");

  // ---- 2. a palavra nasce reta, embaixo da foto ------------------------------
  await pg.click("#addText");
  let st = await estado();
  let w = st.els[0], f = st.foto;
  ok(st.els.length === 1 && w.kind === "text", "nova palavra cria uma palavra");
  ok(w.rot === 0, "reta (" + w.rot + "°)");
  ok(w.y >= f.y + f.h, "embaixo da foto, sem encostar nela (topo em " + w.y.toFixed(1) +
     ", foto termina em " + (f.y + f.h).toFixed(1) + ")");
  ok(perto(centro(w).x, f.x + f.w / 2), "centrada na foto");
  ok(w.x >= 0 && w.y + w.h <= 297, "dentro do papel");
  ok(await pg.evaluate(() => document.activeElement && document.activeElement.id === "txt"),
     "com o campo de texto pronto para escrever");

  // ---- 3. altura e texto mudam em volta do centro ----------------------------
  await pg.fill("#txt", "amor");
  await pg.dispatchEvent("#txt", "input");
  st = await estado();
  const c0 = centro(st.els[0]), topo0 = st.els[0].y;
  await campo("rows", 24);
  st = await estado();
  let c1 = centro(st.els[0]);
  ok(perto(c1.x, c0.x, 1.3), "altura 16 → 24: cresce para os dois lados (andou " + (c1.x - c0.x).toFixed(1) + " mm)");
  // embaixo da foto, a palavra cresce para baixo: o que foi acertado é a
  // distância até a foto, e subir a deixaria por cima dela
  ok(perto(st.els[0].y, topo0, 0.11), "e, embaixo da foto, para baixo: o topo fica (" +
     topo0.toFixed(1) + " → " + st.els[0].y.toFixed(1) + ")");
  await campo("txt", "amor eterno");
  st = await estado();
  c1 = centro(st.els[0]);
  ok(perto(c1.x, c0.x, 1.3), "texto maior: cresce para os dois lados (andou " + (c1.x - c0.x).toFixed(1) + " mm)");
  await campo("rows", 12);
  await campo("txt", "amor");

  // ---- 2b. o símbolo nasce sem encostar em nada ------------------------------
  await pg.click("#addSym");
  st = await estado();
  const sym = st.els[1], pal = st.els[0];
  ok(!encosta(sym, st.foto), "o símbolo não nasce em cima da foto");
  ok(!encosta(sym, pal), "nem em cima da palavra");

  // ---- 4. a foto muda e as peças vão junto -----------------------------------
  st = await estado();
  const folga = st.els[0].y - (st.foto.y + st.foto.h);
  const cf0 = { x: st.foto.x + st.foto.w / 2, y: st.foto.y + st.foto.h / 2 };
  await aba("foto");
  await pg.selectOption("#photoSize", "127x178");
  await aba("pecas");
  st = await estado();
  const folga2 = st.els[0].y - (st.foto.y + st.foto.h);
  ok(perto(folga2, folga, 0.2), "foto 13×18: o nome continua embaixo, à mesma distância (" +
     folga.toFixed(1) + " → " + folga2.toFixed(1) + " mm)");
  ok(perto(st.foto.x + st.foto.w / 2, cf0.x, 0.2), "e a foto cresceu em volta do próprio centro");
  ok(perto(centro(st.els[0]).x, st.foto.x + st.foto.w / 2, 0.2), "o nome segue centrado nela");

  // ---- 5. o papel muda e o arranjo entra nele --------------------------------
  // o símbolo nasceu ao lado da foto, e foto + símbolo não cabem nos 14,8 cm
  // de um A5: ele sai antes, para o teste ser sobre o arranjo que cabe
  await pg.click("#chips .chip:nth-child(2)");
  await pg.click("#delEl");
  await aba("foto");
  await pg.selectOption("#photoSize", "100x150");
  await aba("papel");
  await pg.selectOption("#paperSize", "148x210");
  await aba("pecas");
  st = await estado();
  const dentro = b => b.x >= -0.05 && b.y >= -0.05 && b.x + b.w <= 148.05 && b.y + b.h <= 210.05;
  ok(dentro(st.foto) && st.els.every(dentro), "A4 → A5: foto e peças inteiras no papel novo");
  ok(perto(st.els[0].y - (st.foto.y + st.foto.h), folga, 0.2), "sem desmanchar o arranjo");

  // ---- 6. o nome do molde -----------------------------------------------------
  st = await estado();
  ok(st.nome === "amor", "o molde se chama como a primeira palavra (\"" + st.nome + "\")");
  await pg.click("#chips .chip");
  await campo("txt", "lua");
  st = await estado();
  ok(st.nome === "lua", "e muda junto com ela (\"" + st.nome + "\")");
  await aba("moldes");
  await pg.fill("#moldeNome", "presente da vó");
  await pg.dispatchEvent("#moldeNome", "input");
  await aba("pecas");
  await pg.click("#chips .chip");
  await campo("txt", "sol");
  st = await estado();
  ok(st.nome === "presente da vó", "nome escrito à mão não é trocado (\"" + st.nome + "\")");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
