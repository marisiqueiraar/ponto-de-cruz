// O gráfico colorido, no navegador.
//
// A peça de várias linhas é a que quebra a premissa do app inteiro — uma cor
// por peça —, então o que se prova aqui é que ela quebra só onde devia:
//   1. a imagem vira uma paleta de meadas de verdade, da cartela pedida;
//   2. o corte de fundo tira o fundo, e o olho tira uma linha escolhida;
//   3. mexer na largura NÃO sorteia meadas novas — só mudar o número de cores,
//      a cartela ou a imagem pedem paleta nova;
//   4. trocar uma cor no catálogo troca só a linha escolhida, e não a peça;
//   5. o gráfico sobrevive a fechar o navegador, com as trocas feitas à mão.
const { png } = require("./png.js");
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

/* Quatro faixas de cor bem separadas sobre fundo quase branco. Separadas de
   propósito: com tons vizinhos, qual meada casa com qual vira opinião, e o
   teste passaria a medir o gosto do agrupador em vez do que ele promete. */
const FAIXAS = png(120, 160, (x, y) => {
  if (x < 12 || x > 107 || y < 12 || y > 147) return [248, 246, 243];   // fundo
  if (y < 46) return [214, 32, 28];      // vermelho
  if (y < 80) return [240, 202, 54];     // amarelo
  if (y < 114) return [44, 82, 156];     // azul
  return [26, 26, 30];                   // preto
});

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1400, height: 900 } });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);

  const peca = async (i) => {
    await pg.waitForTimeout(650);
    return pg.evaluate((n) => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      const e = JSON.parse(localStorage.getItem(it.dados)).els[n];
      const acesos = e.cells.reduce((a, l) => a + [...l].filter(c => c !== "0").length, 0);
      const valores = {};
      e.cells.forEach(l => [...l].forEach(c => { if (c !== "0") valores[c] = (valores[c] || 0) + 1; }));
      return { cores: e.cores, cols: e.cells[0].length, rows: e.cells.length, acesos,
               valores: valores,
               paleta: (e.paleta || []).map(s => ({ rotulo: s.rotulo, hex: s.hex, off: s.off })) };
    }, i);
  };
  const campo = async (id, v) => {
    await pg.fill("#" + id, String(v));
    await pg.dispatchEvent("#" + id, "input");
    await pg.waitForTimeout(700);
  };
  const escolhe = async (botao, nome, buf) => {
    const [janela] = await Promise.all([pg.waitForEvent("filechooser"), pg.click(botao)]);
    await janela.setFiles({ name: nome, mimeType: "image/png", buffer: buf });
    await pg.waitForTimeout(800);
  };

  // a palavra de fábrica sai: o molde fica só com o gráfico, e os índices não
  // dependem de quantas peças nasceram antes
  await pg.click(".chip");
  await pg.waitForTimeout(300);
  await pg.click("#delEl");
  await pg.waitForTimeout(400);

  await escolhe("#addImg", "faixas.png", FAIXAS);
  await campo("imgLarg", 40);

  // ---- 1. uma cor é silhueta; de duas para cima é gráfico ---------------
  // imagem de várias cores já nasce gráfico: em uma linha só ela perderia as
  // cores, do mesmo jeito que foto vira mancha
  let p = await peca(0);
  ok(p.cores === 8 && p.paleta.length > 1, "a imagem de quatro cores nasce gráfico, em 8 (" + p.cores + ")");
  await campo("imgCores", 1);
  p = await peca(0);
  ok(p.cores === 1 && !p.paleta.length, "em 1 cor ela é silhueta, sem paleta");
  await campo("imgCores", 4);
  p = await peca(0);
  ok(p.cores === 4, "pedindo 4 cores, a peça vira gráfico");
  ok(p.paleta.length === 4, "com quatro linhas na paleta (" + p.paleta.length + ")");
  ok(p.paleta.every(s => /^Anchor \d+$/.test(s.rotulo)),
     "e cada uma é uma meada de verdade da Anchor: " + p.paleta.map(s => s.rotulo).join(", "));
  ok(Object.keys(p.valores).length === 4,
     "as quatro aparecem no desenho (" + Object.keys(p.valores).length + ")");

  // ---- 2. o corte tira o fundo ------------------------------------------
  // o fundo quase branco tem 3% de tinta: com o corte em 10 ele sai, e a peça
  // fica do tamanho das faixas; em 0 ele entra e a peça cresce
  const comCorte = await peca(0);
  await campo("imgCorte", 0);
  const semCorte = await peca(0);
  ok(semCorte.cols > comCorte.cols && semCorte.rows > comCorte.rows,
     "com o corte em 0 o fundo entra e a peça cresce (" +
     comCorte.cols + "×" + comCorte.rows + " → " + semCorte.cols + "×" + semCorte.rows + ")");
  await campo("imgCorte", 10);

  // ---- 3. a largura NÃO sorteia meadas novas ----------------------------
  const antesLarg = (await peca(0)).paleta.map(s => s.rotulo).join("|");
  await campo("imgLarg", 64);
  const depoisLarg = await peca(0);
  ok(depoisLarg.paleta.map(s => s.rotulo).join("|") === antesLarg,
     "mexer na largura mantém as mesmas linhas");
  ok(depoisLarg.cols > comCorte.cols, "e o desenho refaz maior (" + depoisLarg.cols + " colunas)");

  // trocar a cartela, sim, pede paleta nova
  await pg.selectOption("#imgFonte", "dmc");
  await pg.waitForTimeout(800);
  const dmc = await peca(0);
  ok(dmc.paleta.every(s => /^DMC /.test(s.rotulo)),
     "trocando para DMC, a paleta vem da DMC: " + dmc.paleta.map(s => s.rotulo).join(", "));
  await pg.selectOption("#imgFonte", "anchor");
  await pg.waitForTimeout(800);

  // ---- 4. o catálogo troca a linha escolhida, e não a peça --------------
  await pg.click('.rail button[data-pane="linha"]');
  await pg.waitForTimeout(400);
  const linhas = await pg.$$(".paleta .sl");
  ok(linhas.length === 4, "o painel lista as quatro linhas do gráfico (" + linhas.length + ")");
  await linhas[1].click();                       // escolhe a segunda
  await pg.waitForTimeout(300);
  const antesTroca = await peca(0);
  // a primeira cor da grade do catálogo, seja ela qual for
  await pg.click(".grade button");
  await pg.waitForTimeout(700);
  const depoisTroca = await peca(0);
  ok(depoisTroca.paleta[1].rotulo !== antesTroca.paleta[1].rotulo,
     "tocar numa cor troca a linha escolhida (" + antesTroca.paleta[1].rotulo +
     " → " + depoisTroca.paleta[1].rotulo + ")");
  ok(depoisTroca.paleta[0].rotulo === antesTroca.paleta[0].rotulo &&
     depoisTroca.paleta[2].rotulo === antesTroca.paleta[2].rotulo,
     "e deixa as outras onde estavam");
  ok(depoisTroca.valores["2"] === antesTroca.valores["2"],
     "sem mexer em que quadradinhos são dela: a meada mudou, o desenho não");

  // ---- 5. o olho esconde uma linha --------------------------------------
  const acesosAntes = depoisTroca.acesos;
  await pg.click(".paleta .sl:nth-child(2) .olho");
  await pg.waitForTimeout(700);
  const escondida = await peca(0);
  ok(escondida.acesos < acesosAntes,
     "o olho tira os quadradinhos daquela linha do desenho (" +
     acesosAntes + " → " + escondida.acesos + ")");
  ok(escondida.paleta.length === 4 && escondida.paleta[1].off === 1,
     "sem tirar a linha da lista, para dar como desfazer");
  await pg.click(".paleta .sl:nth-child(2) .olho");
  await pg.waitForTimeout(700);
  ok((await peca(0)).acesos === acesosAntes, "e clicar de novo devolve");

  // ---- 6. o gráfico sobrevive a fechar o navegador ----------------------
  const antes = await peca(0);
  await pg.reload();
  await pg.waitForTimeout(2300);
  const depois = await peca(0);
  ok(depois.paleta.map(s => s.rotulo).join("|") === antes.paleta.map(s => s.rotulo).join("|"),
     "o molde reabre com as mesmas linhas, inclusive a trocada à mão");
  ok(depois.acesos === antes.acesos && depois.cols === antes.cols,
     "e com o mesmo desenho");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" +
     (erros.length ? ": " + erros[0] : ""));

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
