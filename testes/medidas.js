// O que cada número vale, e a barra que não esconde campo.
//
// As promessas:
//   1. ao lado da altura aparece o que ela vale em centímetros, com o
//      espaçamento de agora — e muda junto quando ele muda;
//   2. traço e sensibilidade dizem o efeito numa palavra;
//   3. os atalhos de espaçamento põem o número certo, e o rodapé diz qual está
//      valendo;
//   4. no computador, nenhum campo da barra de cima fica escondido nem
//      embaixo dos botões da direita.
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
  const erros = [];
  for (const largura of [1280, 1440]){
    const pg = await nav.newPage({ viewport: { width: largura, height: 820 } });
    pg.on("pageerror", e => erros.push(e.message));
    await pg.goto(alvo);
    await pg.waitForTimeout(2300);
    await pg.click("#addText");
    await pg.waitForTimeout(500);

    // ---- 4. nenhum campo escondido -----------------------------------------
    // os campos da peça moram no painel da direita: todos dentro dele, sem
    // sair da tela pela direita
    const r = await pg.evaluate(() => {
      const caixa = e => e.getBoundingClientRect();
      const painel = caixa(document.getElementById("sel"));
      const campos = [...document.querySelectorAll("#ctlText .t, #ctlPiece .t")].map(caixa);
      return {
        n: campos.length,
        dentro: campos.every(c => c.left >= painel.left - 0.5 && c.right <= painel.right + 0.5 && c.right <= innerWidth),
        alto: document.querySelector(".top").getBoundingClientRect().height
      };
    });
    ok(r.n === 8 && r.dentro, largura + " px: os 8 campos da palavra estão dentro do painel da peça");
    ok(r.alto <= 60, largura + " px: a barra de cima tem uma linha só (" + Math.round(r.alto) + " px)");

    if (largura !== 1280){ await pg.close(); continue; }

    // ---- 1. altura em centímetros --------------------------------------------
    ok((await pg.textContent("#rowsCm")).trim() === "4,0 cm", "16 quadradinhos a 2,5 mm: 4,0 cm ao lado da altura");
    await pg.fill("#rows", "20");
    await pg.dispatchEvent("#rows", "input");
    await pg.waitForTimeout(500);
    ok((await pg.textContent("#rowsCm")).trim() === "5,0 cm", "20 quadradinhos: 5,0 cm");

    // ---- 2. palavras ----------------------------------------------------------
    ok((await pg.textContent("#thickRef")).trim() === "médio", "traço 2 é médio");
    await pg.fill("#thick", "0");
    await pg.dispatchEvent("#thick", "input");
    await pg.waitForTimeout(400);
    ok((await pg.textContent("#thickRef")).trim() === "como a fonte", "traço 0 é como a fonte");
    ok((await pg.textContent("#thrRef")).trim() === "equilibrado", "sensibilidade 35 é equilibrada");

    // ---- 3. atalhos de espaçamento --------------------------------------------
    await pg.evaluate(() => abreAba("molde"));
    await pg.click('#mmAtalhos button[data-mm="3"]');
    await pg.waitForTimeout(500);
    ok(await pg.inputValue("#mm") === "3", "o atalho firme põe 3 mm");
    ok((await pg.textContent("#rowsCm")).trim() === "6,0 cm", "e a altura em cm acompanha: 20 × 3 mm = 6,0 cm");
    ok((await pg.textContent("#mmFoot")).trim() === "furos a 3,0 mm", "o rodapé diz o espaçamento");
    ok(/6,0 cm/.test(await pg.textContent("#mmEfeito")), "e a aba molde mostra o efeito com os números de agora");
    await pg.close();
  }
  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
