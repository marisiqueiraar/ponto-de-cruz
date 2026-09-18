// A palavra nova, a altura e o ajuste feito à mão.
//
// Três promessas que só se provam mexendo nos controles com uma peça pronta na
// tela, e olhando as células — que é o que vira furo:
//   1. mexer na altura, no traço ou na fonte NÃO joga fora o quadradinho aceso
//      à mão; ele acompanha o desenho novo;
//   2. a mesma altura dá a mesma letra, tenha a palavra descendente ou não;
//   3. palavra nova nasce com o que está na barra de cima.
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

  // o molde gravado no navegador é a única janela para dentro do app: ele
  // guarda as células como elas estão, com a lista dos ajustes à mão junto
  const peca = async (i) => {
    await pg.waitForTimeout(600);
    return pg.evaluate((n) => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      const els = JSON.parse(localStorage.getItem(it.dados)).els;
      const e = els[n];
      return { cells: e.cells, cols: e.cells[0].length, rows: e.cells.length,
               manual: e.manual, edits: e.edits || [], rowsTarget: e.rowsTarget,
               font: e.font, thick: e.thick, thr: e.thr, esp: e.esp, arc: e.arc,
               rot: e.rot, n: els.length };
    }, i);
  };
  // o seletor de fonte fica escondido atrás da lista com amostra, então a
  // troca é feita no próprio campo, que é quem o app escuta
  const fonte = async (f) => {
    await pg.evaluate((nome) => {
      const s = document.getElementById("font");
      s.value = nome;
      s.dispatchEvent(new Event("input", { bubbles: true }));
    }, f);
    await pg.waitForTimeout(1000);
  };
  // clicar no trilho na aba já aberta fecha o painel, então a abertura é
  // condicional — senão o botão que se quer some justamente ao ser procurado
  const abre = async (nome) => {
    const precisa = await pg.evaluate((n) => {
      const app = document.querySelector(".app");
      const pane = document.querySelector(".pane.on");
      return !(pane && pane.dataset.pane === n && !app.classList.contains("fechado"));
    }, nome);
    if (precisa){ await pg.click('.rail button[data-pane="' + nome + '"]'); await pg.waitForTimeout(350); }
  };
  const campo = async (id, v) => {
    await pg.fill("#" + id, String(v));
    await pg.dispatchEvent("#" + id, "input");
    await pg.waitForTimeout(500);
  };

  await abre("pecas");
  await pg.click(".chip");
  await pg.waitForTimeout(300);
  await campo("rot", 0);            // reta: o clique cai no quadradinho pedido
  await campo("txt", "amo");
  await campo("rows", 18);

  // ---- 1. o ajuste à mão sobrevive aos controles -------------------------
  const antes = await peca(0);
  ok(antes.manual === 0, "a peça começa sem nenhum quadradinho à mão");

  // acende um quadradinho no meio da peça, pelo modo ponto a ponto
  const alvoCel = { r: Math.floor(antes.rows / 2), q: Math.floor(antes.cols / 2) };
  await pg.click("#edit");
  await pg.waitForTimeout(300);
  const ponto = await pg.evaluate((cel) => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(x => x.id === idx.atual);
    const el = JSON.parse(localStorage.getItem(it.dados)).els[0];
    const p = parseFloat(document.getElementById("mm").value);
    const cv = document.getElementById("grid");
    const k = cv._k || 1, b = cv.getBoundingClientRect();
    return { x: b.left + (el.x + (cel.q + 0.5) * p) * k,
             y: b.top + (el.y + (cel.r + 0.5) * p) * k };
  }, alvoCel);
  await pg.mouse.click(ponto.x, ponto.y);
  await pg.waitForTimeout(400);
  await pg.click("#edit");          // sai do modo ponto a ponto
  await pg.waitForTimeout(300);

  const mao = await peca(0);
  ok(mao.manual === 1, "um toque no quadradinho conta um ajuste à mão (" + mao.manual + ")");
  ok(mao.edits.length === 1, "e ele fica guardado na lista de ajustes");
  ok(mao.cells[alvoCel.r].charAt(alvoCel.q) !== antes.cells[alvoCel.r].charAt(alvoCel.q),
     "o quadradinho tocado mudou de estado");

  await campo("thick", 4);
  const grosso = await peca(0);
  ok(grosso.manual === 1, "engrossar o traço não joga o ajuste fora (" + grosso.manual + ")");

  await campo("rows", 30);
  const alto = await peca(0);
  ok(alto.rows > grosso.rows, "subir a altura refez a peça maior (" +
     grosso.rows + " → " + alto.rows + " linhas)");
  ok(alto.manual === 1, "e o ajuste continua lá depois de a grade mudar (" + alto.manual + ")");
  const e0 = alto.edits[0].split(",");
  ok(+e0[0] < alto.rows && +e0[1] < alto.cols,
     "o ajuste foi levado para dentro da grade nova (linha " + e0[0] + ", coluna " + e0[1] + ")");

  await fonte("Caveat");
  const outraFonte = await peca(0);
  ok(outraFonte.manual === 1, "trocar a fonte também leva o ajuste junto");

  // e o Recalcular continua sendo quem descarta
  await abre("molde");
  await pg.click("#reset");
  await pg.waitForTimeout(300);
  if (await pg.isVisible("#modalYes")) await pg.click("#modalYes");
  const limpa = await peca(0);
  ok(limpa.manual === 0, "recalcular é quem descarta o ajuste (" + limpa.manual + ")");

  // ---- 2. a mesma altura dá a mesma letra --------------------------------
  /* A medida é a altura da tinta nas primeiras colunas — a primeira letra, que
     é a mesma nas duas palavras. Comparar a grade inteira não diria nada:
     "amog" é mais alta que "amo" de propósito, porque o "g" desce. O que não
     pode mudar é o tamanho do "a". */
  const primeiraLetra = (c) => {
    const largura = Math.max(3, Math.floor(c.cols * 0.18));
    let lo = 1e9, hi = -1;
    for (let r = 0; r < c.rows; r++)
      for (let q = 0; q < largura; q++)
        if (c.cells[r].charAt(q) === "1"){ if (r < lo) lo = r; if (r > hi) hi = r; }
    return hi < 0 ? 0 : hi - lo + 1;
  };
  await fonte("Great Vibes");
  await campo("thick", 2);
  await campo("rows", 24);
  await campo("txt", "amo");
  const curta = await peca(0);
  await campo("txt", "amog");
  const comRabo = await peca(0);
  const a1 = primeiraLetra(curta), a2 = primeiraLetra(comRabo);
  ok(Math.abs(a1 - a2) <= 1,
     "a mesma altura dá a mesma letra com e sem descendente (" + a1 + " contra " + a2 + " linhas)");
  ok(comRabo.rows > curta.rows,
     "e o que desce passa da altura pedida, em vez de encolher a palavra (" +
     curta.rows + " → " + comRabo.rows + " linhas)");

  // a altura pedida manda na grade: o dobro do número, o dobro da letra
  await campo("txt", "amo");
  await campo("rows", 12);
  const doze = primeiraLetra(await peca(0));
  await campo("rows", 24);
  const vinteQuatro = primeiraLetra(await peca(0));
  const razao = vinteQuatro / doze;
  ok(razao > 1.7 && razao < 2.3,
     "dobrar a altura dobra a letra (" + doze + " → " + vinteQuatro + " linhas, ×" +
     razao.toFixed(2) + ")");

  // ---- 3. palavra nova nasce com o que está na barra ---------------------
  await campo("rows", 26);
  await campo("thick", 5);
  await campo("esp", 2);
  await fonte("Pacifico");
  await abre("pecas");
  await pg.click("#addText");
  await pg.waitForTimeout(1200);
  const nova = await peca(1);
  ok(nova.n === 2, "a palavra nova entrou no molde");
  ok(nova.rowsTarget === 26 && nova.thick === 5 && nova.esp === 2 && nova.font === "Pacifico",
     "e nasceu com a barra de cima: altura " + nova.rowsTarget + ", traço " + nova.thick +
     ", espaço " + nova.esp + ", fonte " + nova.font);

  // a mesma palavra nas duas peças: é a única comparação honesta de tamanho,
  // porque a medida é a altura da tinta da PRIMEIRA letra
  await campo("txt", "amo");
  const nova2 = await peca(1);
  const velha = await peca(0);
  const dif = Math.abs(primeiraLetra(nova2) - primeiraLetra(velha));
  ok(dif <= 1, "duas palavras pedidas iguais saem com a letra do mesmo tamanho (" +
     primeiraLetra(velha) + " contra " + primeiraLetra(nova2) + " linhas)");
  ok(nova2.rows === velha.rows && nova2.cols === velha.cols,
     "e com a grade do mesmo tamanho (" + velha.cols + " × " + velha.rows + " contra " +
     nova2.cols + " × " + nova2.rows + ")");

  // ---- 4. molde gravado antes: o número muda, o tamanho não -------------
  /* Antes, a altura era a caixa de tinta da palavra inteira. Um molde gravado
     naquela época traz o número velho, e o app o converte uma vez na volta.
     A prova: pôr 24 no formato antigo, recarregar e refazer a peça — ela tem de
     sair com 24 linhas de tinta, que era o que 24 queria dizer. */
  await pg.evaluate(() => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(x => x.id === idx.atual);
    const st = JSON.parse(localStorage.getItem(it.dados));
    st.els = [st.els[0]];
    const e = st.els[0];
    e.text = "amog"; e.font = "Great Vibes"; e.rowsTarget = 24;
    e.thick = 2; e.thr = 0.35; e.esp = 0; e.arc = 0; e.rot = 0; e.flip = 0;
    delete e.hv; delete e.edits;     // como era gravado antes
    localStorage.setItem(it.dados, JSON.stringify(st));
  });
  await pg.reload();
  await pg.waitForTimeout(2600);
  const migrada = await peca(0);
  ok(migrada.rowsTarget !== 24 && migrada.rowsTarget >= 8 && migrada.rowsTarget <= 60,
     "o número velho da altura foi convertido na volta (24 → " + migrada.rowsTarget + ")");

  await abre("molde");
  await pg.click("#reset");
  await pg.waitForTimeout(800);
  if (await pg.isVisible("#modalYes")) await pg.click("#modalYes");
  const refeita = await peca(0);
  ok(Math.abs(refeita.rows - 24) <= 3,
     "e a peça refeita sai do tamanho que aquele 24 queria dizer (" +
     refeita.rows + " linhas de tinta)");

  ok(erros.length === 0, "nenhum erro de JavaScript" +
     (erros.length ? " — " + erros.join(" | ") : ""));

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
