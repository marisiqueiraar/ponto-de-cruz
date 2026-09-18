// Arco, espaçamento e espelho. As três mudam a FORMA da peça, e a forma é o
// que vira furo — então o que se mede aqui são as células, lidas da memória
// do navegador, e não a aparência.
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
  const pg = await nav.newPage({ viewport: { width: 1280, height: 820 } });
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);

  const celulas = async () => {
    await pg.waitForTimeout(700);
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(i => i.id === idx.atual);
      const e = JSON.parse(localStorage.getItem(it.dados)).els[0];
      return { linhas: e.cells, cols: e.cells[0].length, rows: e.cells.length,
               esp: e.esp, arc: e.arc, flip: e.flip };
    });
  };
  const campo = async (id, v) => {
    await pg.fill("#" + id, String(v));
    await pg.dispatchEvent("#" + id, "input");
  };
  // As células são gravadas como strings de "0" e "1", uma por linha.
  // O topo da tinta em cada coluna é onde o arco aparece.
  const perfil = c => Array.from({ length: c.cols }, (_, q) => {
    for (let r = 0; r < c.rows; r++) if (c.linhas[r].charAt(q) === "1") return r;
    return -1;
  });

  await pg.click('.rail button[data-pane="pecas"]');
  await pg.waitForTimeout(300);
  await pg.click(".chip");
  await pg.waitForTimeout(300);
  await campo("txt", "amorosa");
  await campo("rot", 0);                       // reta, para o arco ser o único efeito
  /* "amorosa" não tem ascendente nem descendente, e a altura é contada pela
     maiúscula da fonte: na altura de fábrica a palavra cabe em nove linhas, e
     nove linhas não medem curvatura nenhuma — o arco ficaria menor que o
     arredondamento da grade. 40 devolve a esta palavra a grade em que o resto
     do teste foi escrito. */
  await campo("rows", 40);
  const base = await celulas();
  ok(base.cols > 10 && base.rows > 5, "a palavra virou grade (" + base.cols + " × " + base.rows + ")");

  // ---- espaçamento -------------------------------------------------------
  await campo("esp", 3);
  const espacado = await celulas();
  ok(espacado.esp === 3, "o espaçamento foi gravado na peça");
  ok(espacado.cols > base.cols, "três quadradinhos entre letras alargam a palavra (" +
     base.cols + " → " + espacado.cols + " colunas)");
  ok(Math.abs(espacado.rows - base.rows) <= 1,
     "e não mexem na altura (" + base.rows + " → " + espacado.rows + ")");
  // seis letras de intervalo em "amorosa" (7 letras): ~6 × 3 = 18 colunas a mais
  const ganho = espacado.cols - base.cols;
  ok(ganho >= 12 && ganho <= 26, "o alargamento bate com seis intervalos de 3 (" + ganho + " colunas)");
  await campo("esp", 0);

  // ---- arco --------------------------------------------------------------
  // A MESMA medida nas duas palavras: o quanto as pontas ficam abaixo do meio.
  // Comparar isso com a variação total do perfil seria comparar coisas
  // diferentes — numa cursiva, ascendentes e descendentes já variam sozinhos.
  const curvatura = c => {
    const p = perfil(c).map((v, i) => [i, v]).filter(x => x[1] >= 0);
    const em = f => p[Math.floor((p.length - 1) * f)][1];
    return (em(0.06) + em(0.94)) / 2 - em(0.5);
  };
  const reta = await celulas();
  const curvaReta = curvatura(reta);

  await campo("arc", 60);
  const arcada = await celulas();
  ok(arcada.arc === 60, "o arco foi gravado na peça");
  ok(arcada.rows > reta.rows, "arquear aumenta a altura da peça (" +
     reta.rows + " → " + arcada.rows + " linhas)");

  // numa palavra arqueada para cima, o topo da tinta no meio fica ACIMA do
  // topo nas pontas. É isso que distingue um arco de uma palavra só mais alta.
  const p = perfil(arcada);
  const dentro = p.map((v, i) => [i, v]).filter(x => x[1] >= 0);
  const meio = dentro[Math.floor(dentro.length / 2)][1];
  const esq = dentro[Math.floor(dentro.length * 0.06)][1];
  const dir = dentro[Math.floor(dentro.length * 0.94)][1];
  ok(meio < esq && meio < dir,
     "o meio da palavra fica acima das pontas (meio " + meio + ", pontas " + esq + " e " + dir + ")");
  const curvaArco = curvatura(arcada);
  ok(curvaArco > curvaReta + 4,
     "e a mesma palavra reta não curva assim (" + curvaArco.toFixed(1) +
     " arqueada contra " + curvaReta.toFixed(1) + " reta)");

  // arco para o outro lado inverte
  await campo("arc", -60);
  const vale = await celulas();
  const pv = perfil(vale).map((v, i) => [i, v]).filter(x => x[1] >= 0);
  const meioV = pv[Math.floor(pv.length / 2)][1];
  const esqV = pv[Math.floor(pv.length * 0.06)][1];
  ok(meioV > esqV, "arco negativo vira vale: o meio desce (" + meioV + " contra " + esqV + ")");
  await campo("arc", 0);

  // ---- espelho -----------------------------------------------------------
  const antes = await celulas();
  await pg.click("#flipEl");
  const depois = await celulas();
  ok(depois.flip === 1, "espelhar foi gravado na peça");
  ok(depois.cols === antes.cols && depois.rows === antes.rows,
     "espelhar não muda o tamanho da grade");
  const invertida = antes.linhas.every((l, i) => l.split("").reverse().join("") === depois.linhas[i]);
  ok(invertida, "cada linha saiu com as colunas ao contrário");

  await pg.click("#flipEl");
  const volta = await celulas();
  ok(volta.flip === 0 && volta.linhas.every((l, i) => l === antes.linhas[i]),
     "espelhar duas vezes devolve a peça como era");

  // ---- espelho sobrevive ao Recalcular ------------------------------------
  await pg.click("#flipEl");
  await pg.waitForTimeout(400);
  await pg.click('.rail button[data-pane="molde"]');
  await pg.waitForTimeout(300);
  await pg.click("#reset");
  await pg.waitForTimeout(400);
  const modal = await pg.locator("#modal").isVisible();
  if (modal){ await pg.click("#modalYes"); }
  const refeita = await celulas();
  ok(refeita.flip === 1, "depois do Recalcular a peça continua espelhada");

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
