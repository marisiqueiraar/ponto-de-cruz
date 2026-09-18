// Acender e apagar em traço, num Chromium. É gesto: só existe quando alguém
// arrasta, então não há como conferir lendo o arquivo.
//
// As três perguntas que este teste faz são as três decisões do traço: ele
// pinta TODOS os quadradinhos entre um evento e o outro (um arraste rápido
// manda um pulo só, e o molde não pode sair furado), o primeiro quadradinho
// manda no traço inteiro (voltar por cima não apaga o que acabou de acender),
// e o traço todo desfaz de uma vez.
//
// A medida sai da memória do navegador, como em posicao.js: as células vão
// gravadas linha por linha, então dá para afirmar "estes oito acenderam e mais
// nenhum" em vez de olhar a tela e torcer.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");

let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };
const acesos = cells => cells.reduce((n, l) => n + (l.match(/1/g) || []).length, 0);

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1280, height: 820 } });
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);

  const estado = async () => {
    await pg.waitForTimeout(600);          // a gravação é adiada em 400 ms
    return pg.evaluate(() => {
      const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const it = idx.itens.find(i => i.id === idx.atual);
      const d = JSON.parse(localStorage.getItem(it.dados));
      const e = d.els[+d.sel || 0];
      return { mm: parseFloat(d.mm), x: +e.x, y: +e.y, rot: +e.rot,
               manual: +e.manual || 0, cells: e.cells };
    });
  };

  // Onde cai, na tela, o centro do quadradinho (q, r) da peça. É a conta do
  // app ao contrário: a largura do canvas é o papel inteiro, e localToPaper()
  // gira a caixa em torno do próprio centro — a peça de abertura vem torta de
  // fábrica, então ignorar o giro erraria de um quadradinho inteiro.
  const tela = async (st, q, r) => {
    const m = await pg.evaluate(() => {
      const cv = document.getElementById("grid");
      const b = cv.getBoundingClientRect();
      const v = document.getElementById("paperSize").value;
      let w, h;
      if (v === "custom"){
        w = parseFloat(document.getElementById("paperW").value) || 210;
        h = parseFloat(document.getElementById("paperH").value) || 297;
      } else { const p = v.split("x"); w = parseFloat(p[0]); h = parseFloat(p[1]); }
      if (document.getElementById("paperOr").value === "l"){ const t = w; w = h; h = t; }
      return { left: b.left, top: b.top, k: b.width / w };
    });
    const w = st.cells[0].length * st.mm, h = st.cells.length * st.mm;
    const a = st.rot * Math.PI / 180;
    const dx = (q + 0.5) * st.mm - w / 2, dy = (r + 0.5) * st.mm - h / 2;
    return {
      x: m.left + (st.x + w / 2 + dx * Math.cos(a) - dy * Math.sin(a)) * m.k,
      y: m.top  + (st.y + h / 2 + dx * Math.sin(a) + dy * Math.cos(a)) * m.k
    };
  };

  const trago = async (st, pontos) => {
    const p0 = await tela(st, pontos[0][0], pontos[0][1]);
    await pg.mouse.move(p0.x, p0.y);
    await pg.mouse.down();
    for (const [q, r] of pontos.slice(1)){
      const p = await tela(st, q, r);
      await pg.mouse.move(p.x, p.y);       // de um pulo só: é isso que o app
    }                                      // tem de preencher sozinho
    await pg.mouse.up();
  };

  await pg.click('.rail button[data-pane="pecas"]');
  await pg.waitForTimeout(300);
  await pg.click(".chip");
  await pg.waitForTimeout(300);
  await pg.click("#edit");                 // modo ponto a ponto
  await pg.waitForTimeout(300);

  let st = await estado();

  // um pedaço apagado, bastante longo, dentro da grade: é ali que o traço passa
  let linha = -1, ini = -1, N = 12;
  st.cells.forEach((row, r) => {
    if (linha >= 0) return;
    const m = row.match(new RegExp("0{" + N + ",}"));
    if (m && m.index > 0){ linha = r; ini = m.index; }
  });
  ok(linha >= 0, "achei uma fileira apagada de " + N + " quadradinhos para riscar");
  if (linha < 0){ await nav.close(); process.exit(1); }

  const antes = acesos(st.cells);
  const fim = ini + N - 1;

  // ---- 1. um arraste só acende a fileira inteira -------------------------
  await trago(st, [[ini, linha], [fim, linha]]);
  let d = await estado();
  const risco = d.cells[linha].slice(ini, ini + N);
  ok(risco === "1".repeat(N), "o arraste acendeu os " + N + " quadradinhos, sem furo (saiu " + risco + ")");
  ok(acesos(d.cells) - antes === N, "e não acendeu mais nenhum fora do traço");
  ok(d.manual === N, "o rodapé conta os " + N + " à mão (contou " + d.manual + ")");

  // ---- 2. o traço inteiro é um passo só no desfazer -----------------------
  await pg.locator("body").press("Control+z");
  d = await estado();
  ok(acesos(d.cells) === antes && d.manual === 0,
     "um desfazer devolve o traço inteiro, não quadradinho por quadradinho");

  // ---- 3. voltar por cima dentro do mesmo traço não apaga -----------------
  await trago(st, [[ini, linha], [fim, linha], [ini, linha]]);
  d = await estado();
  ok(d.cells[linha].slice(ini, ini + N) === "1".repeat(N),
     "ir e voltar no mesmo traço deixa a fileira acesa: quem manda é o primeiro");
  ok(d.manual === N, "e conta " + N + " mudanças, não " + (2 * N - 1) + " (contou " + d.manual + ")");

  // ---- 4. começar em cima de aceso apaga o caminho ------------------------
  await trago(st, [[ini, linha], [fim, linha]]);
  d = await estado();
  ok(d.cells[linha].slice(ini, ini + N) === "0".repeat(N),
     "o traço que começa num aceso apaga a fileira inteira");
  ok(acesos(d.cells) === antes, "e o desenho volta ao que era antes do primeiro traço");

  await nav.close();
  console.log(falhas ? "\n" + falhas + " falha(s)" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
