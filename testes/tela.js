// Abre o app num Chromium de verdade: é o único jeito de saber se a tela
// monta, se o console fica limpo e se os painéis novos aparecem.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){
    console.log("pulado: precisa do playwright (npm i -g playwright) e de um Chromium.");
    process.exit(0);
  }
}
const path = "file://" + require("path").resolve(__dirname, "..", "index.html");

(async () => {
  const nav = await chromium.launch();
  let falhas = 0;
  const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

  for (const [nome, vp] of [["desktop", {width:1280,height:820}], ["celular", {width:360,height:740}]]){
    const pg = await nav.newPage({ viewport: vp, deviceScaleFactor: 2 });
    const erros = [], faltou = [];
    pg.on("console", m => { if (m.type() === "error") erros.push(m.text()); });
    pg.on("pageerror", e => erros.push("pageerror: " + e.message));
    pg.on("requestfailed", r => faltou.push(r.url().split("/").pop()));
    await pg.goto(path);
    await pg.waitForTimeout(2200);   // depois do redesenho cego das fontes

    // Arquivo faltando aqui quer dizer fonte que não chega, e fonte que não
    // chega faz o canvas desenhar numa cursiva genérica: o molde sai errado
    // sem avisar. É o modo de falhar que o README inteiro foi escrito para
    // evitar, então não há exceção nenhuma nesta linha.
    ok(faltou.length === 0, nome + ": nenhum arquivo faltando" +
       (faltou.length ? " — faltou: " + faltou.join(", ") : ""));
    ok(erros.length === 0, nome + ": console limpo" +
       (erros.length ? " — " + erros.join(" | ") : ""));
    ok(await pg.locator('.rail button[data-pane="moldes"]').isVisible(), nome + ": o botão moldes existe no trilho");

    // o trilho inteiro cabe sem cortar nenhum botão?
    const trilho = await pg.evaluate(() => {
      const r = document.querySelector(".rail");
      return { largura: r.clientWidth, conteudo: r.scrollWidth, botoes: r.querySelectorAll("button").length };
    });
    ok(trilho.botoes === 7, nome + ": sete botões no trilho");
    if (nome === "celular")
      ok(trilho.conteudo <= trilho.largura + 1,
         "celular: os sete botões cabem sem rolar (" + trilho.conteudo + " em " + trilho.largura + " px)");

    await pg.click('.rail button[data-pane="moldes"]');
    await pg.waitForTimeout(400);
    ok(await pg.locator("#moldeNome").isVisible(), nome + ": o painel de moldes abre");
    ok(await pg.locator("#moldeSalvar").isVisible(), nome + ": com o botão de salvar arquivo");
    const nMoldes = await pg.locator(".mold").count();
    ok(nMoldes >= 1, nome + ": a estante já mostra o molde aberto (" + nMoldes + ")");

    await pg.click('.rail button[data-pane="linha"]');
    await pg.waitForTimeout(300);
    ok(/Linha de/.test(await pg.locator("#threadAlvo").textContent()),
       nome + ": o painel de linha diz de que peça é a cor — \"" +
       (await pg.locator("#threadAlvo").textContent()) + "\"");

    await pg.click('.rail button[data-pane="pecas"]');
    await pg.waitForTimeout(300);
    ok(await pg.locator(".chip .pt").first().isVisible(), nome + ": a peça na lista tem o ponto da cor");

    await pg.screenshot({ path: __dirname + "/tela-" + nome + ".png", fullPage: false });
    await pg.close();
  }
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
