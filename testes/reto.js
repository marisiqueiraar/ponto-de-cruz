// A peça de ponto reto dentro do app.
//
// As promessas:
//   1. "novo desenho em ponto reto" cria uma colmeia de linha, num lugar
//      livre, com ponto de 2,5 mm — e ela mistura com o ponto cruz no mesmo
//      molde;
//   2. trocar o desenho, o tamanho, o ponto e as opções refaz a peça sem
//      tirá-la do lugar;
//   3. o ajustar ponto a ponto, que é de quadradinho, some para ela;
//   4. o fio é o triplo do comprimento (ponto atrás), e entra na conta;
//   5. ela volta igual depois de recarregar a página, e espelhada continua
//      do mesmo tamanho;
//   6. no PDF, o risco do ponto sai em cinza claro e os furos em preto.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
const streams = require("./streams.js");
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

  const estado = async () => {
    await pg.waitForTimeout(600);
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      return JSON.parse(localStorage.getItem(it.dados));
    });
  };
  const campo = async (id, v) => {
    await pg.fill("#" + id, String(v));
    await pg.dispatchEvent("#" + id, "input");
    await pg.waitForTimeout(400);
  };
  const furos = e => { const s = new Set(); e.pontos.forEach(p => { for (let i = 0; i < p.p.length; i += 2) s.add(p.p[i] + "," + p.p[i + 1]); }); return s.size; };
  const centro = e => [e.x + e.w / 2, e.y + e.h / 2];

  // ---- 1. a colmeia nasce, ao lado de uma palavra em ponto cruz --------------
  await pg.click("#addText");
  await pg.click("#addReto");
  let st = await estado();
  let r = st.els[1];
  ok(st.els.length === 2 && st.els[0].kind === "text" && r.kind === "reto", "uma palavra em ponto cruz e uma colmeia em ponto reto no mesmo molde");
  ok(r.desenho === "colmeia" && r.passo === 2.5, "a colmeia nasce com ponto de 2,5 mm");
  ok(furos(r) === 87, "4 × 3 hexágonos de 6 mm: 87 furos (" + furos(r) + ")");
  ok(/fora do papel|colados/.test(await pg.textContent("#fitTxt")) === false, "sem peça fora do papel nem furo colado");

  // ---- 3. sem ajustar ponto a ponto --------------------------------------------
  ok(await pg.isHidden("#edit"), "o ajustar ponto a ponto some para a peça de ponto reto");

  // ---- 2. trocar e refazer no lugar -----------------------------------------------
  const c0 = centro(r);
  await campo("retoA", 6);
  st = await estado(); r = st.els[1];
  ok(r.opts.cols === 6 && furos(r) > 87, "seis colunas: mais furos (" + furos(r) + ")");
  ok(Math.abs(centro(r)[0] - c0[0]) < 0.2, "e a peça cresce em volta do centro");
  await pg.selectOption("#retoDes", "folha");
  await pg.waitForTimeout(500);
  st = await estado(); r = st.els[1];
  ok(r.desenho === "folha" && r.medida === 60, "folha com nervuras, no tamanho de fábrica (6 cm)");
  ok(await pg.textContent("#retoANome") === "nervuras", "a barra mostra a opção dela: nervuras");
  const antesPasso = furos(r);
  await campo("retoPasso", 4);
  st = await estado(); r = st.els[1];
  ok(furos(r) < antesPasso, "ponto de 4 mm: menos furos (" + antesPasso + " → " + furos(r) + ")");
  await campo("retoPasso", 2.5);

  // ---- 4. o fio -------------------------------------------------------------------
  const fio = await pg.evaluate(() => {
    const el = els[1], c = pontosReto(el);
    return { mm: c.mm, m: fioReto(el) / 1000, lista: linhasUsadas().map(l => l.metros) };
  });
  ok(Math.abs(fio.m - fio.mm * 3 * 1.15 / 1000) < 1e-9, "o fio é três vezes o desenho mais 15% (" + fio.m.toFixed(2) + " m)");
  ok(/ponto atrás/.test(await pg.textContent("#fiosConta")), "e a aba molde explica a conta do ponto reto");

  // ---- 5. espelhar e recarregar -------------------------------------------------------
  const tam = [r.w, r.h];
  await pg.click("#flipEl");
  st = await estado(); r = st.els[1];
  ok(r.flip === 1 && Math.abs(r.w - tam[0]) < 0.01 && Math.abs(r.h - tam[1]) < 0.01, "espelhada, do mesmo tamanho");
  const gravado = JSON.stringify(r.pontos);
  await pg.reload();
  await pg.waitForTimeout(2300);
  st = await estado(); r = st.els[1];
  ok(r && r.kind === "reto" && JSON.stringify(r.pontos) === gravado, "recarregada, volta com os mesmos furos");

  // ---- 6. o PDF ------------------------------------------------------------------------
  const [d] = await Promise.all([pg.waitForEvent("download", { timeout: 20000 }), pg.click("#pdf")]);
  const buf = require("fs").readFileSync(await d.path());
  const tudo = streams(buf).join("\n");
  // cinza de 190 em 255; com os três canais iguais o jsPDF escreve o
  // operador de cinza (G), e não o de cor (RG)
  const cinza = (tudo.match(/0\.75 G\b[\s\S]*?(?=\d+(\.\d+)? G\b|$)/) || [""])[0];
  ok(/0\.75 G\b/.test(tudo) && (cinza.match(/ l\b/g) || []).length > 50,
     "no PDF o risco do ponto sai em cinza claro, uma linha por ponto");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
