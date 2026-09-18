// Setas, botões de alinhar e o aviso de peça fora do papel, num Chromium.
// São coisas que só existem quando alguém mexe na tela, então não há como
// conferi-las lendo o arquivo.
//
// A medida sai da memória do navegador: o app grava x e y de cada peça no
// localStorage a cada gesto, então dá para conferir milímetro por milímetro
// em vez de olhar a tela e torcer.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");

let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };
const perto = (a, b, t) => Math.abs(a - b) <= (t === undefined ? 0.051 : t);

// a caixa da peça já girada, em mm de papel — a mesma conta do app
function caixa(el, mm){
  const w = el.cols * mm, h = el.rows * mm, a = el.rot * Math.PI / 180;
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const [lx, ly] of [[0,0],[w,0],[0,h],[w,h]]){
    const dx = lx - w/2, dy = ly - h/2;
    const x = el.x + w/2 + dx*Math.cos(a) - dy*Math.sin(a);
    const y = el.y + h/2 + dx*Math.sin(a) + dy*Math.cos(a);
    minX = Math.min(minX,x); minY = Math.min(minY,y);
    maxX = Math.max(maxX,x); maxY = Math.max(maxY,y);
  }
  return { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
}

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
      return {
        mm: parseFloat(d.mm),
        foto: { x: +d.photoBox.x, y: +d.photoBox.y, w: +d.photoBox.w, h: +d.photoBox.h },
        els: d.els.map(e => ({ x:+e.x, y:+e.y, rot:+e.rot,
                               cols:e.cells[0].length, rows:e.cells.length }))
      };
    });
  };
  const aviso = () => pg.locator("#fitTxt").textContent();
  const classe = () => pg.locator("#fitHint").getAttribute("class");
  const seta = async (tecla, n) => { for (let i = 0; i < n; i++) await pg.locator("body").press(tecla); };

  await pg.click('.rail button[data-pane="pecas"]');
  await pg.waitForTimeout(300);
  await pg.click(".chip");
  await pg.waitForTimeout(300);

  // ---- o passo da seta é exatamente meio milímetro -----------------------
  let a = await estado();
  await seta("ArrowRight", 1);
  let b = await estado();
  ok(perto(b.els[0].x - a.els[0].x, 0.5), "uma seta anda 0,5 mm (andou " +
     (b.els[0].x - a.els[0].x).toFixed(2) + ")");
  ok(perto(b.els[0].y, a.els[0].y), "e não mexe no outro eixo");

  await seta("ArrowDown", 4);
  let c = await estado();
  ok(perto(c.els[0].y - b.els[0].y, 2), "quatro setas para baixo andam 2 mm");

  // ---- Shift anda dez vezes mais -----------------------------------------
  await seta("Shift+ArrowLeft", 2);
  let d = await estado();
  ok(perto(d.els[0].x - c.els[0].x, -10), "Shift anda 5 mm por seta (andou " +
     (d.els[0].x - c.els[0].x).toFixed(2) + " em duas)");

  // ---- a rajada de setas é um passo só no desfazer ------------------------
  await pg.keyboard.press("Control+z");
  let e2 = await estado();
  ok(perto(e2.els[0].x, c.els[0].x) && perto(e2.els[0].y, c.els[0].y),
     "um Ctrl+Z desfaz a rajada inteira, não seta por seta");

  // ---- seta dentro de um campo não mexe na peça --------------------------
  await pg.click('.rail button[data-pane="moldes"]');
  await pg.waitForTimeout(300);
  await pg.click("#moldeNome");
  const antesCampo = await estado();
  for (let i = 0; i < 10; i++) await pg.locator("#moldeNome").press("ArrowRight");
  const depoisCampo = await estado();
  ok(perto(depoisCampo.els[0].x, antesCampo.els[0].x),
     "seta dentro de um campo não empurra a peça");

  // ---- centralizar na foto, medido -----------------------------------------
  await pg.click('.rail button[data-pane="pecas"]');
  await pg.waitForTimeout(300);
  ok(await pg.locator("#alinha").isVisible(), "os botões de alinhar aparecem com peça selecionada");

  // A foto nasce centrada no papel, e aí os dois botões de centralizar dariam o
  // mesmo número — o teste passaria mesmo com um ligado no alvo errado. Então a
  // foto sai do meio antes: 20 mm para a direita.
  const caixaFoto = await pg.evaluate(() => {
    const c = document.getElementById("grid").getBoundingClientRect();
    return { x: c.x, y: c.y, w: c.width, h: c.height };
  });
  await pg.mouse.click(caixaFoto.x + caixaFoto.w * 0.5, caixaFoto.y + caixaFoto.h * 0.3);
  await pg.waitForTimeout(300);
  await seta("Shift+ArrowRight", 4);
  const comFoto = await estado();
  ok(!perto(comFoto.foto.x + comFoto.foto.w / 2, 105, 1),
     "a foto saiu do meio do papel (centro em " + (comFoto.foto.x + comFoto.foto.w/2).toFixed(1) + " mm)");

  await pg.click(".chip");
  await pg.waitForTimeout(300);

  await pg.click("#alFoto");
  let s = await estado();
  let cx = caixa(s.els[0], s.mm);
  ok(perto(cx.x + cx.w/2, s.foto.x + s.foto.w/2, 0.11),
     "centralizar na foto: centro da peça em " + (cx.x + cx.w/2).toFixed(2) +
     " mm, centro da foto em " + (s.foto.x + s.foto.w/2).toFixed(2));

  // a peça do app nasce inclinada em -4°: se a conta usasse a caixa sem girar,
  // o centro sairia deslocado. É esse o erro que este caso pega.
  ok(s.els[0].rot !== 0, "e a peça está inclinada (" + s.els[0].rot + "°), que é o caso difícil");

  // ---- centralizar no papel ----------------------------------------------
  await pg.click("#alPapel");
  s = await estado(); cx = caixa(s.els[0], s.mm);
  const papel = await pg.evaluate(() => parseFloat(document.getElementById("paperW").value));
  ok(perto(cx.x + cx.w/2, 210/2, 0.11),
     "centralizar no papel: centro em " + (cx.x + cx.w/2).toFixed(2) + " mm de 210");
  ok(!perto(s.foto.x + s.foto.w/2, 105, 1),
     "e o centro do papel é mesmo outro lugar que o centro da foto, aqui");

  // ---- pela base da foto ---------------------------------------------------
  await pg.click("#alBase");
  s = await estado(); cx = caixa(s.els[0], s.mm);
  ok(perto(cx.y + cx.h, s.foto.y + s.foto.h, 0.11),
     "pela base da foto: pé da peça em " + (cx.y + cx.h).toFixed(2) +
     " mm, pé da foto em " + (s.foto.y + s.foto.h).toFixed(2));

  // ---- o aviso de peça fora do papel ---------------------------------------
  ok(!/fora do papel/.test(await aviso()), "dentro do papel, sem aviso vermelho");
  await pg.click(".mesa"); await pg.waitForTimeout(200);
  await pg.click(".chip"); await pg.waitForTimeout(300);
  await seta("Shift+ArrowLeft", 60);        // 300 mm para a esquerda
  await pg.waitForTimeout(400);
  ok(/fora do papel/.test(await aviso()), "peça fora do papel avisa: \"" + (await aviso()) + "\"");
  ok(/over/.test(await classe()), "e o aviso fica vermelho (classe: " + (await classe()) + ")");

  await pg.click("#alPapel");
  await pg.waitForTimeout(500);
  ok(!/fora do papel/.test(await aviso()), "centralizar no papel traz de volta: \"" + (await aviso()) + "\"");

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
