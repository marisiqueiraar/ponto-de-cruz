// Os itens de moldes e linhas do backlog, num Chromium.
//
// As promessas:
//   1. a caixa de linhas marca "tenho pouco" e "acabou"; a que acabou sai das
//      minhas (não dá para bordar com ela) mas fica na lista de compras, e a
//      lista de fio do molde avisa da linha que está no fim;
//   2. a estante fica por ordem de uso, e trocar de molde sem mexer não muda
//      a hora dele;
//   3. duplicar faz uma cópia com as mesmas peças, que já abre;
//   4. abrir o mesmo arquivo duas vezes não cria dois moldes;
//   5. o nome do molde só é gravado quando a digitação para.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const fs = require("fs"), path = require("path");
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
  const aba = n => pg.evaluate(x => abreAba(x), n);
  const linhas = () => pg.evaluate(() => JSON.parse(localStorage.getItem("ponto-e-letra/linhas/v1")));
  const prateleira = () => pg.evaluate(() => JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1")));

  // ---- 1. tenho pouco e acabou ---------------------------------------------------
  await aba("pecas");
  await pg.click("#addText");
  await pg.waitForTimeout(500);
  await aba("linha");
  const k = await pg.evaluate(() => [...document.querySelectorAll("#catGrade .cat")].slice(0, 3).map(b => b.dataset.k));
  await pg.click('#catGrade .cat[data-k="' + k[0] + '"]');           // aplicar na peça
  await pg.waitForTimeout(300);
  await pg.evaluate(() => abreAba("caixa"));
  await pg.click('#toqueCaixa button[data-est="pouco"]');
  await pg.click('#catGrade .cat[data-k="' + k[0] + '"]');
  await pg.click('#toqueCaixa button[data-est="acabou"]');
  await pg.click('#catGrade .cat[data-k="' + k[1] + '"]');
  await pg.click('#toqueCaixa button[data-est="tenho"]');
  await pg.click('#catGrade .cat[data-k="' + k[2] + '"]');
  let l = await linhas();
  ok(l.tenho.indexOf(k[0]) >= 0 && l.estoque[k[0]] === "pouco", "a primeira linha fica marcada como tenho pouco");
  ok(l.tenho.indexOf(k[1]) < 0 && l.estoque[k[1]] === "acabou", "a segunda acabou: sai das minhas e fica no estoque");
  ok(l.tenho.indexOf(k[2]) >= 0 && !l.estoque[k[2]], "a terceira é só tenho");
  const compra = await pg.textContent("#catCompra");
  const nomes = await pg.evaluate(ks => ks.map(nomeLinha), k);
  ok(compra.indexOf(nomes[0]) > 0 && compra.indexOf(nomes[1]) > 0 && compra.indexOf(nomes[2]) < 0,
     "a lista de compras tem a que acabou e a que está no fim: " + compra);
  ok(await pg.evaluate(k1 => document.querySelector('#catGrade .cat[data-k="' + k1 + '"]').classList.contains("acabou"), k[1]),
     "na caixa, a que acabou aparece riscada");
  await aba("linha");
  ok(/tenho pouco/.test(await pg.textContent("#fios")), "a lista de fio do molde avisa que a linha da palavra está no fim");
  await aba("caixa");
  await pg.click('#toqueCaixa button[data-est="acabou"]');
  await pg.click('#catGrade .cat[data-k="' + k[1] + '"]');          // tocar de novo tira
  l = await linhas();
  ok(!l.estoque[k[1]] && l.tenho.indexOf(k[1]) < 0, "tocar de novo no mesmo estado tira a linha da caixa");
  await pg.evaluate(() => abreAba("linha"));

  // ---- 5. o nome com espera ------------------------------------------------------
  await aba("moldes");
  await pg.fill("#moldeNome", "");
  await pg.waitForTimeout(800);
  await pg.type("#moldeNome", "cartão", { delay: 20 });
  const cedo = (await prateleira()).itens[0].nome;
  await pg.waitForTimeout(800);
  const depois = (await prateleira()).itens[0].nome;
  ok(cedo !== "cartão" && depois === "cartão", "o nome só é gravado quando a digitação para (" + cedo + " → " + depois + ")");

  // ---- 2. ordem por uso ----------------------------------------------------------
  await pg.click("#moldeNovo");
  await pg.waitForTimeout(500);
  let est = await prateleira();
  const primeiro = est.itens[1];
  await pg.waitForTimeout(300);
  await pg.click("#moldeLista .mold:nth-child(2) .abre");      // volta ao "cartão"
  await pg.waitForTimeout(700);
  est = await prateleira();
  ok(est.itens[0].id === primeiro.id && est.atual === primeiro.id, "o molde aberto sobe para o topo da estante");
  ok(est.itens[0].em === primeiro.em, "abrir sem mexer não muda a hora do molde");

  // ---- 3. duplicar ---------------------------------------------------------------
  await pg.click("#moldeDup");
  await pg.waitForTimeout(700);
  est = await prateleira();
  const copia = est.itens[0];
  const pecas = await pg.evaluate(ids => ids.map(id => {
    const it = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1")).itens.find(x => x.id === id);
    return JSON.parse(localStorage.getItem(it.dados)).els.map(e => e.text).join();
  }), [copia.id, primeiro.id]);
  ok(est.itens.length === 3 && copia.nome === "cartão (cópia)" && est.atual === copia.id,
     "duplicar cria “cartão (cópia)” e abre ela");
  ok(pecas[0] === pecas[1] && pecas[0].length > 0, "com as mesmas peças");

  // ---- 4. o mesmo arquivo duas vezes ---------------------------------------------------
  await pg.evaluate(() => { els[0].y += 10; saveState(); });   // a cópia passa a ser diferente do original
  const [d] = await Promise.all([pg.waitForEvent("download"), pg.click("#moldeSalvar")]);
  const arq = path.join(require("os").tmpdir(), "molde-teste-" + Date.now() + ".json");
  fs.copyFileSync(await d.path(), arq);
  await pg.click("#moldeNovo");
  await pg.waitForTimeout(400);
  await pg.setInputFiles("#moldeArq", arq);
  await pg.waitForTimeout(800);
  const n1 = (await prateleira()).itens.length;
  const aviso = await pg.textContent("#moldeAviso");
  ok(n1 === 4 && /já estava na estante/.test(aviso), "abrir um arquivo de um molde que já está na estante abre ele, sem criar outro");
  await pg.evaluate(() => { els[0].x += 10; saveState(); });   // mudou: agora é outro molde
  await pg.setInputFiles("#moldeArq", arq);
  await pg.waitForTimeout(800);
  ok((await prateleira()).itens.length === 5, "mas, se o molde mudou desde então, o arquivo entra como molde novo");
  fs.unlinkSync(arq);

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
