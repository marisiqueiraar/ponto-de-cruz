// O aviso de memória cheia.
//
// O jeito de testar é encher a memória de verdade — ou melhor, fazer o
// localStorage recusar a escrita, que é exatamente o que ele faz quando a cota
// estoura. Sem isso o teste conferiria só que o texto existe no HTML.
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

  const rodape = () => pg.evaluate(() => {
    const g = document.getElementById("gravado");
    return { texto: g.textContent, cheia: g.classList.contains("cheia"),
             titulo: g.title, visivel: getComputedStyle(g).display !== "none" };
  });
  const aviso = () => pg.locator("#moldeAviso").textContent();
  const mexe = async () => {                       // qualquer gesto dispara gravação
    await pg.click('.rail button[data-pane="pecas"]');
    await pg.waitForTimeout(200);
    await pg.click(".chip");
    await pg.locator("body").press("ArrowRight");
    await pg.waitForTimeout(900);
  };

  let r = await rodape();
  ok(/salvo neste navegador/.test(r.texto), "no começo o rodapé diz que está salvo");
  ok(!r.cheia, "e sem o vermelho");

  // ---- a memória recusa a escrita, como faz quando a cota estoura ---------
  await pg.evaluate(() => {
    window.__real = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(k, v){
      if (/molde/.test(k)) { const e = new Error("QuotaExceededError"); e.name = "QuotaExceededError"; throw e; }
      return window.__real(k, v);
    };
  });
  await mexe();
  r = await rodape();
  ok(r.cheia, "com a memória recusando, o rodapé fica vermelho");
  ok(/não coube/.test(r.texto), "e diz o que houve: \"" + r.texto + "\"");
  ok(/arquivo do molde/.test(r.titulo), "o título explica o que fazer");
  await pg.click('.rail button[data-pane="moldes"]');
  await pg.waitForTimeout(300);
  const a = await aviso();
  ok(/encheu/.test(a) && /apague um molde/.test(a),
     "e a aba moldes diz o caminho: \"" + a.slice(0, 80) + "…\"");

  // ---- e some quando volta a caber --------------------------------------
  await pg.evaluate(() => { localStorage.setItem = window.__real; });
  await mexe();
  r = await rodape();
  ok(!r.cheia, "voltando a caber, o vermelho sai");
  ok(/salvo neste navegador/.test(r.texto), "e o rodapé volta ao normal");
  await pg.click('.rail button[data-pane="moldes"]');
  await pg.waitForTimeout(300);
  ok(!/encheu/.test(await aviso()), "o recado da aba moldes também sai");

  // ---- no celular o rodapé some, mas este aviso não pode sumir -----------
  const cel = await nav.newPage({ viewport: { width: 360, height: 740 } });
  await cel.goto(alvo);
  await cel.waitForTimeout(2300);
  const antes = await cel.evaluate(() => getComputedStyle(document.getElementById("gravado")).display);
  ok(antes === "none", "no celular o \"salvo neste navegador\" fica escondido, como sempre foi");
  await cel.evaluate(() => {
    const real = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(k, v){
      if (/molde/.test(k)) throw new Error("QuotaExceededError");
      return real(k, v);
    };
  });
  await cel.click('.rail button[data-pane="pecas"]');
  await cel.waitForTimeout(200);
  await cel.click(".chip");
  await cel.locator("body").press("ArrowRight");
  await cel.waitForTimeout(900);
  const depois = await cel.evaluate(() => {
    const g = document.getElementById("gravado");
    return { display: getComputedStyle(g).display, cheia: g.classList.contains("cheia") };
  });
  ok(depois.cheia && depois.display !== "none",
     "mas o aviso de memória cheia aparece mesmo assim (display: " + depois.display + ")");

  ok(erros.length === 0, "sem erro de JavaScript" + (erros.length ? " — " + erros.join(" | ") : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
