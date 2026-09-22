// A imagem virando quadradinho.
//
// A promessa da peça de imagem é estreita e inteira: o que está escuro na
// imagem acende, o que está claro apaga, a largura pedida é a largura que sai,
// e o desenho sobrevive a fechar o navegador — junto com a imagem que o
// gerou, sem a qual a largura e a sensibilidade viram controles mortos.
//
// O teste desenha as imagens aqui dentro, em PNG cru, porque a única forma de
// afirmar "este quadradinho acendeu porque ali era preto" é saber onde estava
// o preto.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

const { png } = require("./png.js");

// 100 × 100 branco com um quadrado preto de 10 a 50: um quarto da imagem,
// encostado em canto nenhum — assim o corte das bordas vazias tem o que cortar
const QUADRADO = png(100, 100, (x, y) => (x >= 10 && x < 50 && y >= 10 && y < 50) ? 0 : 255);
// o mesmo quadrado em cinza médio: 128 de 255 é meia tinta, e é o que deixa
// perguntar ao limiar onde exatamente ele corta
const CINZA = png(100, 100, (x, y) => (x >= 10 && x < 50 && y >= 10 && y < 50) ? 128 : 255);

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1280, height: 860 } });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);

  // o molde gravado é a janela para dentro do app, como nos outros testes:
  // ele traz as células como elas estão
  const peca = async (i) => {
    await pg.waitForTimeout(600);
    return pg.evaluate((n) => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(x => x.id === idx.atual);
      const els = JSON.parse(localStorage.getItem(it.dados)).els;
      const e = els[n];
      const acesos = e.cells.reduce((a, l) => a + [...l].filter(c => c === "1").length, 0);
      const imgs = localStorage.getItem("ponto-e-letra/molde/imagens/v1/" + it.id);
      return { kind: e.kind, nome: e.nome, larg: e.larg, thr: e.thr, inv: e.inv,
               cols: e.cells[0].length, rows: e.cells.length, acesos,
               cells: e.cells, n: els.length,
               guardada: !!(imgs && JSON.parse(imgs)[e.img]) };
    }, i);
  };
  const campo = async (id, v) => {
    await pg.fill("#" + id, String(v));
    await pg.dispatchEvent("#" + id, "input");
    await pg.waitForTimeout(500);
  };
  // o arquivo entra pelo mesmo caminho da pessoa: o botão pede, o navegador
  // abre a janela, e é nela que o arquivo é posto
  const escolhe = async (botao, nome, buf) => {
    const [janela] = await Promise.all([pg.waitForEvent("filechooser"), pg.click(botao)]);
    await janela.setFiles({ name: nome, mimeType: "image/png", buffer: buf });
    await pg.waitForTimeout(700);
  };

  // ---- 1. a imagem vira peça, com a largura pedida -----------------------
  await escolhe("#addImg", "coroa-da-vo.png", QUADRADO);
  let p = await peca(1);
  ok(p.n === 2, "a imagem entrou como uma segunda peça");
  ok(p.kind === "img", "do tipo imagem");
  ok(p.nome === "coroa-da-vo", "com o nome do arquivo, sem a extensão");
  ok(p.larg === 40, "e a largura de fábrica, 40 quadradinhos");

  // o quadrado preto ocupa 40 dos 100 pixels da imagem: numa peça de 40 de
  // largura são 16 quadradinhos, e o resto é borda branca que o corte tira
  ok(p.cols === 16 && p.rows === 16,
     "o quadrado preto virou 16 × 16 quadradinhos (saiu " + p.cols + " × " + p.rows + ")");
  ok(p.acesos === 16 * 16, "todos acesos: ali era preto inteiro");
  ok(p.guardada, "a imagem ficou guardada na chave dela, fora do molde");

  // ---- 2. a largura manda, e a proporção segue ---------------------------
  await campo("imgLarg", 80);
  p = await peca(1);
  ok(p.cols === 32 && p.rows === 32,
     "o dobro da largura dá o dobro de quadradinhos (saiu " + p.cols + " × " + p.rows + ")");
  await campo("imgLarg", 40);

  // ---- 3. a sensibilidade corta onde diz que corta -----------------------
  // preto sobre branco é o caso fácil: a sensibilidade não o move
  await campo("imgThr", 70);
  const duro = await peca(1);
  await campo("imgThr", 10);
  const mole = await peca(1);
  ok(duro.acesos === 16 * 16 && mole.acesos === 16 * 16,
     "preto sobre branco acende igual de 10 a 70 de sensibilidade");
  await campo("imgThr", 50);

  // o caso que prova a conta: cinza médio é meia tinta, então ele acende
  // abaixo de 50 e apaga acima — numa peça nova, ao lado da primeira
  await escolhe("#addImg", "cinza.png", CINZA);
  await campo("imgThr", 40);
  const claro = await peca(2);
  ok(claro.cols === 16 && claro.acesos === 16 * 16,
     "cinza médio acende com a sensibilidade em 40");
  await campo("imgThr", 60);
  const escuro = await peca(2);
  ok(escuro.acesos === 0, "e apaga com ela em 60: o corte é a meia tinta");
  const aviso = await pg.textContent("#imgAviso");
  ok(/não acendeu nenhum quadradinho/.test(aviso || ""),
     "e a peça que não acendeu nada diz por quê: \"" + (aviso || "") + "\"");
  await campo("imgThr", 40);

  // ---- 4. inverter troca o claro pelo escuro -----------------------------
  await pg.click(".chip:nth-child(2)");     // de volta ao quadrado preto
  await pg.waitForTimeout(300);
  await pg.click("#imgInv");
  const invertida = await peca(1);
  ok(invertida.inv === 1, "a peça ficou marcada como invertida");
  ok(invertida.cols === 40 && invertida.rows === 40,
     "agora quem acende é o fundo, e ele vai de borda a borda (saiu " +
     invertida.cols + " × " + invertida.rows + ")");
  ok(invertida.acesos === 40 * 40 - 16 * 16,
     "com o buraco exato do quadrado preto (acesos: " + invertida.acesos + ")");
  await pg.click("#imgInv");
  await pg.waitForTimeout(400);

  // ---- 5. o desenho e a imagem sobrevivem a fechar o navegador -----------
  const antes = await peca(1);
  await pg.reload();
  await pg.waitForTimeout(2300);
  const depois = await peca(1);
  ok(JSON.stringify(depois.cells) === JSON.stringify(antes.cells),
     "o molde reabre com os mesmos quadradinhos");

  // e a imagem voltou junto. A barra de cima é montada antes de ela chegar —
  // e sem imagem ela desliga a largura e a sensibilidade, porque não haveria
  // com que refazer o desenho. Sem clicar em nada: é a peça que já estava
  // selecionada, e quem religa os campos é a imagem chegando
  ok(!(await pg.isDisabled("#imgLarg")) && !(await pg.isDisabled("#imgThr")),
     "a barra de cima volta ligada assim que a imagem chega");
  await pg.click(".chip:nth-child(2)");
  await pg.waitForTimeout(300);
  await campo("imgLarg", 60);
  const refeita = await peca(1);
  ok(refeita.cols === 24 && refeita.rows === 24,
     "e a largura ainda refaz o desenho depois de reabrir (saiu " +
     refeita.cols + " × " + refeita.rows + ")");

  // ---- 6. trocar a imagem guarda o lugar da peça -------------------------
  const lugar = await pg.evaluate(() => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(x => x.id === idx.atual);
    const e = JSON.parse(localStorage.getItem(it.dados)).els[1];
    return { x: e.x, y: e.y, color: e.color };
  });
  const FAIXA = png(100, 100, (x, y) => (y >= 20 && y < 40) ? 0 : 255);
  await escolhe("#imgTroca", "faixa.png", FAIXA);
  const trocada = await peca(1);
  ok(trocada.nome === "faixa", "a peça passou a ser a imagem nova");
  ok(trocada.cols === 60 && trocada.rows === 12,
     "com o desenho dela, na largura que a peça já tinha (saiu " +
     trocada.cols + " × " + trocada.rows + ")");
  const agora = await pg.evaluate(() => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(x => x.id === idx.atual);
    const e = JSON.parse(localStorage.getItem(it.dados)).els[1];
    return { x: e.x, y: e.y, color: e.color };
  });
  ok(agora.x === lugar.x && agora.y === lugar.y && agora.color === lugar.color,
     "sem sair do lugar nem trocar de linha");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" +
     (erros.length ? ": " + erros[0] : ""));

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
