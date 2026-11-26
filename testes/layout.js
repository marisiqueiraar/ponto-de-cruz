// O layout em etapas, num Chromium.
//
// As promessas:
//   1. as quatro etapas trocam o painel da esquerda, e os nomes antigos
//      (foto, molde) caem na etapa certa;
//   2. o menu do logo abre, fecha com Esc, leva aos moldes, à caixa e à
//      ajuda, e o "voltar" devolve à etapa em que se estava;
//   3. as explicações ficam atrás do "?" do título, e o "?" de um campo da
//      peça abre a explicação dele;
//   4. o painel da direita convida quando nada está selecionado, e mostra o
//      nome, o tipo e a linha da peça selecionada;
//   5. escolher uma linha do molde e tocar numa cor troca a linha em todas
//      as peças que a usam;
//   6. a etapa imprimir lista o que conferir, com os furos colados;
//   7. no celular, as etapas ficam no pé, a gaveta mostra a peça tocada e
//      volta para a etapa ao tocar nela.
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
  const pg = await nav.newPage({ viewport: { width: 1440, height: 900 } });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  const aberto = () => pg.evaluate(() => document.querySelector(".pane.on").dataset.pane);

  // ---- 1. etapas ---------------------------------------------------------------
  for (const [botao, painel] of [["papel", "papel"], ["linha", "linha"], ["imprimir", "imprimir"], ["pecas", "pecas"]]){
    await pg.click('#rail button[data-pane="' + botao + '"]');
    ok(await aberto() === painel, "a etapa " + botao + " abre o painel dela");
  }
  await pg.evaluate(() => abreAba("foto"));
  ok(await aberto() === "papel" && await pg.isVisible("#photoSize"), "o nome antigo foto cai em papel e foto");
  await pg.evaluate(() => abreAba("molde"));
  ok(await aberto() === "imprimir" && await pg.isVisible("#mm"), "e molde cai em imprimir, com o espaço entre furos");
  await pg.click('#rail button[data-pane="pecas"]');

  // ---- 2. menu --------------------------------------------------------------------
  await pg.click("#menuBtn");
  ok(await pg.isVisible("#menu") && await pg.getAttribute("#menuBtn", "aria-expanded") === "true", "o logo abre o menu");
  await pg.keyboard.press("Escape");
  ok(!(await pg.isVisible("#menu")), "Esc fecha o menu");
  await pg.click("#menuBtn");
  await pg.click('#menu [data-pane="moldes"]');
  ok(await aberto() === "moldes" && !(await pg.isVisible("#menu")), "ver todos abre os moldes e fecha o menu");
  await pg.click('.pane[data-pane="moldes"] .voltar');
  ok(await aberto() === "pecas", "voltar devolve à etapa peças");
  await pg.click("#menuBtn");
  await pg.click('#menu [data-pane="caixa"]');
  ok(await aberto() === "caixa" && await pg.isVisible("#toqueCaixa") && await pg.isVisible("#catGrade"),
     "minha caixa abre com o catálogo em modo caixa");
  await pg.click("#menuBtn");
  await pg.click('#menu [data-pane="ajuda"]');
  ok(await aberto() === "ajuda", "a ajuda abre pelo menu");
  await pg.click('.pane[data-pane="ajuda"] .voltar');

  // ---- 3. explicações -----------------------------------------------------------------
  await pg.click('#rail button[data-pane="imprimir"]');
  const expl = '.pane[data-pane="imprimir"] p.expl';
  ok(!(await pg.locator(expl).first().isVisible()), "as explicações da etapa começam escondidas");
  await pg.click('.pane[data-pane="imprimir"] h2 .qq');
  ok(await pg.locator(expl).first().isVisible(), "o ? do título mostra as explicações");
  await pg.click('.pane[data-pane="imprimir"] h2 .qq');
  await pg.click('#rail button[data-pane="pecas"]');

  // ---- 4. painel da seleção ------------------------------------------------------------
  ok(await pg.isVisible("#selVazio") && !(await pg.isVisible("#selCab")), "sem seleção, o painel da direita convida");
  await pg.click("#addText");
  await pg.waitForTimeout(400);
  await pg.fill("#txt", "amor"); await pg.dispatchEvent("#txt", "input");
  await pg.waitForTimeout(300);
  ok(await pg.textContent("#selNome") === "amor" && /palavra/.test(await pg.textContent("#selTipo")),
     "com a palavra selecionada, o painel diz o nome e o tipo");
  ok(await pg.isVisible("#selLinha") && /m de fio/.test(await pg.textContent("#selFio")), "e a linha dela, com os metros");
  await pg.click('#ctlText .t:has(#thr) .q');
  ok(/tinta/.test(await pg.textContent("#ctlText .dica")), "o ? da sensibilidade abre a explicação embaixo do campo");
  await pg.click("#selTroca");
  ok(await aberto() === "linha", "trocar a linha leva à etapa linhas");

  // ---- 5. trocar uma linha em todo o molde --------------------------------------------
  await pg.click('#rail button[data-pane="pecas"]');
  await pg.click("#addText");
  await pg.waitForTimeout(400);
  const cor0 = await pg.evaluate(() => [corDe(els[0]).hex, corDe(els[1]).hex]);
  await pg.click('#rail button[data-pane="linha"]');
  await pg.click("#fios .fio");
  ok(await pg.isVisible("#trocaTodo"), "escolher a linha do molde avisa que a próxima cor troca em todo o molde");
  const nova = await pg.evaluate(c => [...document.querySelectorAll("#catGrade .cat")].find(b => catIdx[b.dataset.k].hex !== c).dataset.k, cor0[0]);
  await pg.click('#catGrade .cat[data-k="' + nova + '"]');
  const cor1 = await pg.evaluate(() => [corDe(els[0]).hex, corDe(els[1]).hex]);
  ok(cor0[0] === cor0[1] && cor1[0] === cor1[1] && cor1[0] !== cor0[0], "as duas palavras trocam de linha juntas");
  await pg.click("#trocaTodoNao");

  // ---- 6. antes de baixar ---------------------------------------------------------------
  await pg.evaluate(() => { els[1].x = els[0].x + 1; els[1].y = els[0].y; draw(); });
  await pg.waitForTimeout(900);
  await pg.click('#rail button[data-pane="imprimir"]');
  await pg.waitForTimeout(300);
  const checa = await pg.textContent("#checa");
  ok(/furos colados/i.test(checa), "a etapa imprimir avisa dos furos colados: " + checa + " / " + await pg.textContent("#fitTxt"));

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));

  // ---- 7. celular -------------------------------------------------------------------------
  const cel = await nav.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await cel.goto(alvo);
  await cel.waitForTimeout(2300);
  const nav7 = await cel.evaluate(() => { const r = document.getElementById("rail").getBoundingClientRect(); return r.bottom > innerHeight - 70; });
  ok(nav7, "no celular as etapas ficam no pé da tela");
  await cel.evaluate(() => addText());
  await cel.waitForTimeout(300);
  ok(await cel.isVisible("#selNome") && !(await cel.isVisible(".panel")), "a palavra nova aparece na gaveta, no lugar da etapa");
  await cel.tap('#rail button[data-pane="linha"]');
  await cel.waitForTimeout(300);
  ok(await cel.isVisible("#catGrade") && !(await cel.isVisible("#selNome")), "tocar numa etapa mostra a etapa");
  const c = await cel.evaluate(() => { const b = elPaperBox(els[0]), r = cv.getBoundingClientRect(), k = cv._k;
    return { x: r.left + (b.x + b.w / 2) * k, y: r.top + (b.y + b.h / 2) * k }; });
  await cel.evaluate(() => { foco = "none"; syncControls(); });
  await cel.tap("#grid", { position: { x: c.x - (await cel.evaluate(() => cv.getBoundingClientRect().left)), y: c.y - (await cel.evaluate(() => cv.getBoundingClientRect().top)) } });
  await cel.waitForTimeout(300);
  ok(await cel.isVisible("#selNome"), "tocar na peça traz a gaveta de volta para ela");

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
