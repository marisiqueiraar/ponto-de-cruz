// As guias pontilhadas, num Chromium. Guia é coisa de tela — nasce de um
// arraste, mede em milímetros de papel e some quando volta para a régua —,
// então não há como conferi-la lendo o arquivo.
//
// A medida sai de duas fontes que precisam concordar: o que o app grava no
// localStorage (milímetros de papel) e onde o risco está na tela (pixels).
// É a concordância entre as duas que prova que a guia mede o papel e não a
// mesa: um risco no lugar certo com o número errado enganaria mais do que
// não ter guia nenhuma.
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
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
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
        guias: d.guias,
        foto: { x: +d.photoBox.x, y: +d.photoBox.y, w: +d.photoBox.w, h: +d.photoBox.h },
        els: d.els.map(e => ({ x:+e.x, y:+e.y, rot:+e.rot,
                               cols:e.cells[0].length, rows:e.cells.length }))
      };
    });
  };
  // onde o papel está na tela, para converter mm de papel em pixels
  const papelNaTela = () => pg.evaluate(() => {
    const c = document.getElementById("grid").getBoundingClientRect();
    const mm = parseFloat(document.getElementById("paperW").value) || 210;
    return { x: c.x, y: c.y, w: c.width, h: c.height, k: c.width / mm };
  });
  // onde as réguas estão na tela: é de dentro delas que a guia é puxada
  const regua = (qual) => pg.evaluate((q) => {
    const r = document.getElementById(q).getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }, qual);
  const riscos = () => pg.evaluate(() => {
    const l = [];
    document.querySelectorAll("#guias .g").forEach(g => {
      const r = g.getBoundingClientRect();
      l.push({ eixo: g.dataset.eixo, rotulo: g.querySelector("i").textContent,
               x: r.x + r.width / 2, y: r.y + r.height / 2 });
    });
    return l;
  });

  // ---- a opção nasce desligada ------------------------------------------
  ok((await riscos()).length === 0, "sem ligar a opção, nenhuma guia na mesa");

  // ---- ligar abre a cruz no meio do papel ---------------------------------
  await pg.click("#zGuias");
  await pg.waitForTimeout(300);
  let rs = await riscos();
  ok(rs.length === 2, "ligar a opção abre uma cruz: " + rs.length + " guias");
  ok(rs.filter(r => r.eixo === "v").length === 1 && rs.filter(r => r.eixo === "h").length === 1,
     "uma de cima para baixo e uma de lado a lado");

  let pap = await papelNaTela();
  let v = rs.find(r => r.eixo === "v"), h = rs.find(r => r.eixo === "h");
  ok(perto(v.x, pap.x + pap.w / 2, 1.2), "a que desce cai no meio do papel (" +
     v.x.toFixed(1) + " px contra " + (pap.x + pap.w/2).toFixed(1) + ")");
  ok(perto(h.y, pap.y + pap.h / 2, 1.2), "a que atravessa cai no meio do papel");
  ok(v.rotulo === "10,5", "e diz em centímetros onde está: \"" + v.rotulo + "\" de 21 cm");

  // a guia atravessa a mesa inteira, e não só o papel — é o que a faz servir
  // para a peça que ainda está fora da folha
  const comprida = await pg.evaluate(() => {
    const g = document.querySelector("#guias .g.v").getBoundingClientRect();
    const m = document.querySelector(".guias").getBoundingClientRect();
    return g.height >= m.height - 1;
  });
  ok(comprida, "a guia vai de ponta a ponta da mesa, não só do papel");

  // ---- a guia é do molde, e volta com ele ---------------------------------
  let s = await estado();
  ok(!!s.guias && s.guias.on === 1, "a opção fica gravada no molde");
  ok(perto(s.guias.v[0], 105) && perto(s.guias.h[0], 297 / 2, 0.51),
     "e as guias vão gravadas em milímetros de papel (" + s.guias.v[0] + ", " + s.guias.h[0] + ")");

  // ---- puxar outra guia da régua ------------------------------------------
  // da régua de cima desce a guia que atravessa; ela para em 50 mm do papel
  const alvoY = pap.y + 50 * pap.k;
  const rh = await regua("rulerH");
  await pg.mouse.move(pap.x + pap.w / 2, rh.y + rh.h / 2);
  await pg.mouse.down();
  await pg.mouse.move(pap.x + pap.w / 2, alvoY, { steps: 12 });
  await pg.mouse.up();
  s = await estado();
  ok(s.guias.h.length === 2, "puxar da régua de cima solta mais uma guia (" +
     s.guias.h.length + " agora)");
  const nova = s.guias.h[s.guias.h.length - 1];
  ok(perto(nova, 50, 0.6), "solta onde o dedo largou: " + nova + " mm, esperado 50");
  ok(nova === Math.round(nova), "e para em milímetro inteiro, não em 49,7");

  // ---- levar a guia de volta para a régua tira ela -------------------------
  pap = await papelNaTela();
  await pg.mouse.move(pap.x + pap.w / 2, pap.y + nova * pap.k);
  await pg.mouse.down();
  await pg.mouse.move(pap.x + pap.w / 2, rh.y + rh.h / 2, { steps: 12 });
  await pg.mouse.up();
  s = await estado();
  ok(s.guias.h.length === 1, "levada de volta para a régua, a guia se vai (" +
     s.guias.h.length + " sobrou)");

  // ---- o ímã: arrastar a peça encosta ela na guia ---------------------------
  await pg.click('.rail button[data-pane="pecas"]');
  await pg.waitForTimeout(300);
  await pg.click(".chip");
  await pg.waitForTimeout(300);

  // a guia que desce vai para 60 mm, longe do meio, para o ímã ter o que fazer
  pap = await papelNaTela();
  await pg.mouse.move(pap.x + 105 * pap.k, pap.y + pap.h * 0.8);
  await pg.mouse.down();
  await pg.mouse.move(pap.x + 60 * pap.k, pap.y + pap.h * 0.8, { steps: 12 });
  await pg.mouse.up();
  s = await estado();
  ok(perto(s.guias.v[0], 60, 0.6), "a guia arrastada para 60 mm ficou em " + s.guias.v[0]);

  // pega a peça e larga com o lado esquerdo dela a uns 2 mm da guia: sem ímã
  // pararia ali mesmo; com ímã encosta
  let cx = caixa(s.els[0], s.mm);
  const pegaX = pap.x + (cx.x + cx.w / 2) * pap.k, pegaY = pap.y + (cx.y + cx.h / 2) * pap.k;
  const destinoX = pegaX + (60 + 2 - cx.x) * pap.k;
  await pg.mouse.move(pegaX, pegaY);
  await pg.mouse.down();
  await pg.mouse.move(destinoX, pegaY, { steps: 14 });
  await pg.mouse.up();
  s = await estado();
  cx = caixa(s.els[0], s.mm);
  ok(perto(cx.x, 60, 0.11), "a peça larga encostada na guia: lado esquerdo em " +
     cx.x.toFixed(2) + " mm, guia em 60");

  // e com a opção desligada o mesmo gesto não gruda em nada
  await pg.click("#zGuias");
  await pg.waitForTimeout(300);
  ok((await riscos()).length === 0, "desligar a opção tira os riscos da mesa");
  s = await estado();
  cx = caixa(s.els[0], s.mm);
  const partiu = cx.x;
  pap = await papelNaTela();
  const p2x = pap.x + (cx.x + cx.w / 2) * pap.k, p2y = pap.y + (cx.y + cx.h / 2) * pap.k;
  await pg.mouse.move(p2x, p2y);
  await pg.mouse.down();
  await pg.mouse.move(p2x + 12 * pap.k, p2y, { steps: 10 });
  await pg.mouse.move(p2x + 2 * pap.k, p2y, { steps: 10 });   // volta para perto da guia antiga
  await pg.mouse.up();
  s = await estado();
  cx = caixa(s.els[0], s.mm);
  ok(!perto(cx.x, partiu, 0.5) && perto(cx.x, partiu + 2, 0.6),
     "desligada, a peça para onde o dedo largou (" + cx.x.toFixed(2) +
     " mm, guia antiga em " + partiu.toFixed(2) + ")");

  // ---- a guia não entra no PDF ---------------------------------------------
  // o molde sai do canvas, e a guia é um elemento por cima dele: se um dia
  // alguém desenhá-la no canvas, este caso cai
  await pg.click("#zGuias");
  await pg.waitForTimeout(400);
  const noCanvas = await pg.evaluate(() => {
    const cv = document.getElementById("grid");
    return cv.parentNode.querySelectorAll("#guias").length === 0;
  });
  ok(noCanvas, "as guias moram fora do canvas — o PDF sai do canvas");

  // ---- a troca de papel não deixa guia medindo mentira ----------------------
  await pg.click('.rail button[data-pane="papel"]');
  await pg.waitForTimeout(300);
  await pg.selectOption("#paperSize", "148x210");      // A5
  await pg.waitForTimeout(500);
  s = await estado();
  const fora = (s.guias.v || []).filter(x => x > 148).concat((s.guias.h || []).filter(x => x > 210));
  ok(fora.length === 0, "trocando para um papel menor, nenhuma guia sobra fora da folha" +
     (fora.length ? " — sobrou " + fora.join(", ") : ""));

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" +
     (erros.length ? ": " + erros.join(" | ") : ""));

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
