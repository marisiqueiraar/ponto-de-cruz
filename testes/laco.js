// O laço: pegar a foto e as peças de uma vez e mover o bloco inteiro, num
// Chromium. Como em posicao.js, a medida sai do que o app grava no
// localStorage — assim dá para afirmar "todo mundo andou o mesmo milímetro"
// em vez de "a tela mexeu".
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
      return { foto: { x: +d.photoBox.x, y: +d.photoBox.y,
                       w: +d.photoBox.w, h: +d.photoBox.h },
               mm: parseFloat(d.mm),
               els: d.els.map(e => ({ x: +e.x, y: +e.y, rot: +e.rot,
                                      cols: e.cells[0].length, rows: e.cells.length })) };
    });
  };

  // mm de papel -> pixel de tela: o canvas inteiro é o papel
  const mapa = () => pg.evaluate(() => {
    const b = document.getElementById("grid").getBoundingClientRect();
    const v = document.getElementById("paperSize").value;
    let w, h;
    if (v === "custom"){
      w = parseFloat(document.getElementById("paperW").value) || 210;
      h = parseFloat(document.getElementById("paperH").value) || 297;
    } else { const p = v.split("x"); w = parseFloat(p[0]); h = parseFloat(p[1]); }
    if (document.getElementById("paperOr").value === "l"){ const t = w; w = h; h = t; }
    return { left: b.left, top: b.top, k: b.width / w, pw: w, ph: h };
  });

  const arrasta = async (de, para) => {
    const m = await mapa();
    await pg.mouse.move(m.left + de[0] * m.k, m.top + de[1] * m.k);
    await pg.mouse.down();
    await pg.mouse.move(m.left + para[0] * m.k, m.top + para[1] * m.k);
    await pg.mouse.up();
  };
  const clica = async (x, y) => {
    const m = await mapa();
    await pg.mouse.click(m.left + x * m.k, m.top + y * m.k);
  };
  const noLaco = () => pg.locator("#ctlGrupo").getAttribute("class");
  const diz = () => pg.locator("#ctlGrupoTxt").textContent();
  // o centro da peça acerta o alvo mesmo girada: o giro é em torno dele
  const centro = (st, i) => ({ x: st.els[i].x + st.els[i].cols * st.mm / 2,
                               y: st.els[i].y + st.els[i].rows * st.mm / 2 });

  // a caixa da peça JÁ GIRADA, a mesma que o ímã das guias compara
  const caixa = (e, mm) => {
    const w = e.cols * mm, h = e.rows * mm, a = e.rot * Math.PI / 180;
    const W = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a));
    const H = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
    return { x: e.x + w / 2 - W / 2, y: e.y + h / 2 - H / 2, w: W, h: H };
  };
  // e a caixa de tudo o que está laçado, que é por onde o bloco encosta
  const caixaDoBloco = (st, comFoto) => {
    const bs = st.els.map(e => caixa(e, st.mm));
    if (comFoto) bs.push(st.foto);
    const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
    return { x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x,
             h: Math.max(...bs.map(b => b.y + b.h)) - y };
  };
  const seta = async (tecla, n) => { for (let i = 0; i < n; i++) await pg.locator("body").press(tecla); };
  // o que prova que o bloco não se desmanchou: a distância de cada peça até a
  // foto é a mesma de antes
  const arranjo = st => st.els.map(e => [e.x - st.foto.x, e.y - st.foto.y]);
  const mesmoArranjo = (a, b) => a.length === b.length &&
    a.every((p, i) => perto(p[0], b[i][0]) && perto(p[1], b[i][1]));

  await pg.click('.rail button[data-pane="pecas"]');
  await pg.waitForTimeout(300);
  await pg.click("#addSym");                // duas peças e a foto na mesa
  await pg.waitForTimeout(300);

  const st0 = await estado();
  ok(st0.els.length === 2, "a mesa tem duas peças e a foto");

  // ---- 1. o retângulo pega o que couber inteiro dentro dele ---------------
  await arrasta([1, 1], [209, 296]);
  await pg.waitForTimeout(200);
  ok(!/hide/.test(await noLaco()), "o laço em volta de tudo acendeu a barra do bloco");
  ok(/2 peças e a foto no laço/.test(await pg.locator("#ctlGrupoTxt").textContent()),
     "e a barra diz o que está laçado: " + (await pg.locator("#ctlGrupoTxt").textContent()));

  // ---- 2. as setas movem o bloco inteiro ---------------------------------
  await seta("ArrowRight", 2);              // 0,5 mm cada
  let st = await estado();
  ok(perto(st.foto.x - st0.foto.x, 1), "duas setas andam 1 mm com a foto junto (andou " +
     (st.foto.x - st0.foto.x).toFixed(2) + ")");
  ok(st.els.every((e, i) => perto(e.x - st0.els[i].x, 1) && perto(e.y, st0.els[i].y)),
     "e as duas peças andam o mesmo 1 mm, sem sair do lugar no outro eixo");

  // ---- 3. arrastar de dentro do laço move tudo ---------------------------
  // as posições de partida saem da medida, não de número escrito à mão: quem
  // decide onde a foto abre é o app
  const base = st, antes = arranjo(st);
  await arrasta([105, 135], [125, 125]);    // pega pela foto, que está laçada
  st = await estado();
  ok(perto(st.foto.x - base.foto.x, 20) && perto(st.foto.y - base.foto.y, -10),
     "o arraste de dentro do laço levou a foto 20 mm para o lado e 10 para cima (andou " +
     (st.foto.x - base.foto.x).toFixed(1) + ", " + (st.foto.y - base.foto.y).toFixed(1) + ")");
  ok(mesmoArranjo(arranjo(st), antes), "e o bloco chegou inteiro: as distâncias não mudaram");
  const meio = st;

  // ---- 4. a foto segura o bloco na borda, em vez de o desmanchar ---------
  const m = await mapa();
  const borda = m.pw - base.foto.w;         // a foto encostada na borda direita
  await arrasta([125, 125], [205, 125]);
  st = await estado();
  ok(perto(st.foto.x, borda), "a foto para na borda do papel (" + borda +
     " mm, ficou em " + st.foto.x.toFixed(1) + ")");
  ok(mesmoArranjo(arranjo(st), antes), "e as peças param junto com ela: o bloco não se desmancha");

  // ---- 5. o arraste do bloco é um passo só no desfazer -------------------
  await pg.locator("body").press("Control+z");
  st = await estado();
  ok(perto(st.foto.x, meio.foto.x) && perto(st.foto.y, meio.foto.y) &&
     mesmoArranjo(arranjo(st), antes),
     "um desfazer devolve o bloco inteiro para onde ele estava");

  // ---- 6. clique no vazio larga o laço -----------------------------------
  await clica(5, 290);
  await pg.waitForTimeout(200);
  ok(/hide/.test(await noLaco()), "um clique no vazio desmancha o laço");

  // ---- 7. o laço só leva quem cabe inteiro dentro dele --------------------
  await arrasta([1, 1], [209, 180]);        // pega a foto pela metade: não leva
  await pg.waitForTimeout(200);
  ok(/hide/.test(await noLaco()),
     "um laço que corta a foto ao meio não a leva, e sozinho não vira bloco");

  // ---- 8. Shift soma ao laço o que o retângulo não pegou -----------------
  const c0 = centro(st, 0), c1 = centro(st, 1);
  await clica(c0.x, c0.y);
  await pg.waitForTimeout(200);
  ok(/hide/.test(await noLaco()), "uma peça sozinha não é bloco");
  await pg.keyboard.down("Shift");
  await clica(c1.x, c1.y);
  await pg.keyboard.up("Shift");
  await pg.waitForTimeout(200);
  ok(/2 peças no laço/.test(await diz()),
     "Shift soma a outra peça ao laço, sem a foto (barra: " + (await diz()) + ")");

  await pg.keyboard.down("Shift");
  await clica(c1.x, c1.y);
  await pg.keyboard.up("Shift");
  await pg.waitForTimeout(200);
  ok(/hide/.test(await noLaco()), "e Shift de novo na mesma peça tira ela do laço");

  // ---- 9. o ímã das guias pega o bloco pela caixa de todos juntos --------
  // é a regra que o laço existe para proteger: se cada peça encostasse na sua
  // guia, o arranjo que se acabou de laçar chegaria do outro lado desmanchado
  await pg.click("#zGuias");                // a cruz nasce no meio do papel
  await pg.waitForTimeout(300);
  await arrasta([1, 1], [209, 296]);
  await pg.waitForTimeout(200);
  st = await estado();
  const arranjoAntes = arranjo(st);
  const bloco = caixaDoBloco(st, true);
  const GUIA = 105;                         // metade de 210 mm de papel
  // a mira é o meio do bloco, e não a borda: com a foto dentro do laço, uma
  // borda longe da guia pediria um passo que a foto não tem para dar — ela
  // pararia na borda do papel antes de o ímã ter chance
  const pedido = GUIA + 1.2 - (bloco.x + bloco.w / 2);
  const folgaFoto = pedido < 0 ? -st.foto.x : 210 - st.foto.w - st.foto.x;
  ok(Math.abs(pedido) < Math.abs(folgaFoto),
     "o passo pedido cabe no que a foto pode andar (" + pedido.toFixed(1) +
     " mm de " + folgaFoto.toFixed(1) + ")");
  // o bloco se pega longe das guias: a faixa da guia é a que responde ao
  // toque ali, e o arraste sairia mexendo nela em vez de no bloco
  await arrasta([130, 100], [130 + pedido, 100]);
  st = await estado();
  const blocoDepois = caixaDoBloco(st, true);
  const depois = blocoDepois.x + blocoDepois.w / 2;
  ok(perto(depois, GUIA), "o bloco encostou na guia pelo meio de todos juntos (parou em " +
     depois.toFixed(2) + " mm, guia em " + GUIA + ")");
  ok(mesmoArranjo(arranjo(st), arranjoAntes),
     "e encostou inteiro: o ímã não desmanchou o arranjo de dentro do bloco");
  await pg.click("#zGuias");                // desliga: o resto não é sobre guias
  await pg.waitForTimeout(300);

  // ---- 10. apagar o bloco laçado ----------------------------------------
  await arrasta([1, 1], [209, 296]);        // laça tudo de novo
  await pg.waitForTimeout(200);
  ok(/2 peças e a foto no laço/.test(await diz()), "tudo laçado outra vez");
  const antesDeApagar = await estado();

  await pg.click("#delLaco");
  st = await estado();
  ok(st.els.length === 0, "apagar o laço levou as duas peças (sobraram " + st.els.length + ")");
  // a moldura da foto é o lugar da foto no papel, não uma peça: ela fica
  ok(perto(st.foto.x, antesDeApagar.foto.x) && perto(st.foto.y, antesDeApagar.foto.y),
     "e deixou a moldura da foto onde estava");
  ok(/hide/.test(await noLaco()), "sem peça nenhuma, a barra do bloco sai da frente");

  // ---- 11. e volta num passo só ------------------------------------------
  await pg.locator("body").press("Control+z");
  st = await estado();
  ok(st.els.length === 2 &&
     st.els.every((e, i) => perto(e.x, antesDeApagar.els[i].x) && perto(e.y, antesDeApagar.els[i].y)),
     "um desfazer devolve as duas peças no lugar em que estavam");

  await nav.close();
  console.log(falhas ? "\n" + falhas + " falha(s)" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
