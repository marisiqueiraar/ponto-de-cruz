// Os itens de tela e uso do backlog, num Chromium.
//
// As promessas:
//   1. a peça que anda encosta na borda de outra peça, sem guia ligada;
//   2. o 1:1 calibrado com o cartão grava a medida da tela e põe o zoom no
//      tamanho real;
//   3. o laço duplica o bloco (cópias com identidade nova, laçadas) e leva o
//      bloco para o meio do papel;
//   4. o desenho de cada peça fica guardado e só se refaz quando ela muda;
//   5. o espaço entre letras funciona neste navegador (o campo fica ligado);
//   6. num celular, a barra de cima ocupa menos de 110 px.
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

  // duas peças de ponto reto
  await pg.click("#addReto");
  await pg.waitForTimeout(400);
  await pg.click("#addReto");
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { els[1].x = els[0].x + 40; els[1].y = els[0].y + 30; draw(); });

  // ---- 1. ímã entre peças ---------------------------------------------------------
  const ima = await pg.evaluate(() => {
    guias.on = false;
    const o = elPaperBox(els[0]), b = elPaperBox(els[1]);
    const teste = { x: o.x + o.w + 0.4, y: b.y, w: b.w, h: b.h };   // quase encostada na direita da outra
    const g = imanta(teste, els[1]);
    return { gx: g.x, visto: imaVisto.x, borda: o.x + o.w };
  });
  ok(Math.abs(ima.gx + 0.4) < 0.01 && Math.abs(ima.visto - ima.borda) < 0.01,
     "a peça a 0,4 mm da outra encosta nela, e a linha do ímã aparece");

  // ---- 2. tamanho real -------------------------------------------------------------
  await pg.click("#z11");
  ok(await pg.isVisible("#calib"), "o primeiro toque no 1:1 abre a calibração com o cartão");
  await pg.fill("#calibLarg", "400");
  await pg.dispatchEvent("#calibLarg", "input");
  await pg.click("#calibSim");
  await pg.waitForTimeout(300);
  const real = await pg.evaluate(() => ({
    gravado: JSON.parse(localStorage.getItem("ponto-e-letra/tela/v1")).pxmm,
    agora: zoom * fitK, on: $("z11").classList.contains("on")
  }));
  ok(Math.abs(real.gravado - 400 / 85.6) < 1e-6 && Math.abs(real.agora - real.gravado) < 0.01 && real.on,
     "a medida da tela fica gravada e o zoom vai para " + real.agora.toFixed(2) + " px por mm");
  await pg.click("#zFit").catch(() => {});

  // ---- 3. o laço duplica e centraliza ------------------------------------------------
  await pg.evaluate(() => { marca = [0, 1]; marcaFoto = false; syncControls(); draw(); });
  ok(await pg.isVisible("#dupLaco") && await pg.isVisible("#meioLaco"), "com o laço, aparecem duplicar e centralizar");
  await pg.click("#dupLaco");
  await pg.waitForTimeout(300);
  const dup = await pg.evaluate(() => ({ n: els.length, marca: marca.slice(),
    uids: els.map(e => uidDe(e)), dx: els[2].x - els[0].x, dy: els[2].y - els[0].y }));
  ok(dup.n === 4 && dup.marca.join() === "2,3", "duplicar faz duas cópias e laça as cópias");
  ok(new Set(dup.uids).size === 4 && Math.abs(dup.dx - 5) < 0.01 && Math.abs(dup.dy - 5) < 0.01,
     "cada cópia tem identidade própria e sai 5 mm para o lado e para baixo");
  await pg.click("#meioLaco");
  await pg.waitForTimeout(300);
  const meio = await pg.evaluate(() => { const c = caixaDoLaco(), pa = paperMM();
    return [c.x + c.w / 2 - pa.w / 2, c.y + c.h / 2 - pa.h / 2]; });
  ok(Math.abs(meio[0]) < 0.1 && Math.abs(meio[1]) < 0.1, "centralizar leva o bloco para o meio do papel");

  // ---- 4. o desenho guardado ------------------------------------------------------
  const guarda = await pg.evaluate(() => {
    draw();
    const c1 = els[0]._desenho && els[0]._desenho.canvas;
    draw();
    const mesmo = els[0]._desenho && els[0]._desenho.canvas === c1;
    els[0].medida = (els[0].medida || 20) + 4; refazReto(els[0]); draw();
    return { tinha: !!c1, mesmo, refez: els[0]._desenho.canvas !== c1 };
  });
  ok(guarda.tinha && guarda.mesmo, "o desenho da peça fica guardado entre um quadro e outro");
  ok(guarda.refez, "e se refaz quando a peça muda");

  // ---- 5. espaço entre letras ---------------------------------------------------------
  ok(!(await pg.evaluate(() => $("esp").disabled)), "neste navegador o espaço entre letras fica ligado");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));

  // ---- 6. a barra no celular -------------------------------------------------------------
  const cel = await nav.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await cel.goto(alvo);
  await cel.waitForTimeout(2000);
  const alt = await cel.evaluate(() => document.querySelector("header.top").getBoundingClientRect().height);
  ok(alt < 110, "no celular a barra de cima tem " + Math.round(alt) + " px");

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
