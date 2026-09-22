// As medidas próprias do papel e da foto, num Chromium. O campo de número
// avisa a cada tecla: quem digita "150" passa por "1" e por "15" no caminho.
// Papel de 1 mm não é um papel a caminho — ele recoloca a foto, encosta as
// peças na borda e apara as guias, e nada disso volta quando o número fica
// pronto. Este teste digita devagar, como um dedo digita, e confere que o
// estrago não acontece: o que vale é a medida que cabe no limite do campo.
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
      return { guias: d.guias, caixa: d.photoBox,
               foto: { x: +d.photoBox.x, y: +d.photoBox.y } };
    });
  };
  // a proporção do papel na mesa diz que medida está valendo de verdade,
  // sem depender do número que ficou escrito no campo
  const proporcao = () => pg.evaluate(() => {
    const r = document.getElementById("grid").getBoundingClientRect();
    return r.width / r.height;
  });
  const aviso = (id) => pg.evaluate((q) => {
    const p = document.getElementById(q);
    return { texto: p.textContent.trim(), mal: p.classList.contains("mal") };
  }, id);
  // digita como um dedo digita: uma tecla de cada vez, no campo limpo
  const digita = async (id, texto) => {
    await pg.click(id, { clickCount: 3 });
    await pg.keyboard.press("Backspace");
    await pg.type(id, texto, { delay: 70 });
    await pg.waitForTimeout(150);
  };

  // ---- a cruz de guias serve de testemunha --------------------------------
  await pg.click("#zGuias");
  await pg.waitForTimeout(300);
  let s = await estado();
  ok(perto(s.guias.v[0], 105) && perto(s.guias.h[0], 148.5, 0.51),
     "a cruz nasce no meio da A4 (" + s.guias.v[0] + ", " + s.guias.h[0] + " mm)");

  // ---- digitar 150 não passa por um papel de 1 mm -------------------------
  await pg.click('.rail button[data-pane="papel"]');
  await pg.waitForTimeout(250);
  await pg.selectOption("#paperSize", "custom");
  await digita("#paperW", "150");
  s = await estado();
  ok(s.guias.v.length === 1 && perto(s.guias.v[0], 105),
     "a guia de 105 mm sobrevive ao caminho de \"1\" e \"15\" até 150");
  ok(perto(await proporcao(), 150 / 297, 0.01),
     "e o papel acaba com as medidas digitadas, 150 × 297 mm");
  ok((await aviso("paperAviso")).texto === "", "com o número pronto, nada a avisar");

  // ---- medida fora do limite: o papel segura, o campo é acertado ----------
  await digita("#paperW", "10");
  let av = await aviso("paperAviso");
  ok(av.texto !== "" && av.mal, "10 mm avisa em vermelho: \"" + av.texto + "\"");
  ok(perto(await proporcao(), 150 / 297, 0.01),
     "e o papel segue com o que valia, sem encolher para 10 mm");
  s = await estado();
  ok(s.guias.v.length === 1, "a guia continua lá enquanto o número não cabe");

  await pg.click("#paperH");               // sair do campo acerta o número
  await pg.waitForTimeout(300);
  ok(await pg.inputValue("#paperW") === "50",
     "ao sair, 10 vira o menor que cabe, 50 mm (deu " + await pg.inputValue("#paperW") + ")");
  ok((await aviso("paperAviso")).texto === "", "e o aviso se recolhe");
  ok(perto(await proporcao(), 50 / 297, 0.01), "o papel agora é o de 50 mm");

  // ---- acima do limite vai para o maior que cabe --------------------------
  await digita("#paperW", "900");
  ok((await aviso("paperAviso")).mal, "900 mm também avisa");
  await pg.click("#paperH");
  await pg.waitForTimeout(300);
  ok(await pg.inputValue("#paperW") === "600",
     "ao sair, 900 vira o maior que cabe, 600 mm (deu " + await pg.inputValue("#paperW") + ")");

  // ---- a foto tem os mesmos campos, e o mesmo cuidado ---------------------
  await digita("#paperW", "210");
  await pg.click("#paperH");
  await pg.waitForTimeout(300);
  await pg.click('.rail button[data-pane="foto"]');
  await pg.waitForTimeout(250);
  await pg.selectOption("#photoSize", "custom");
  const antes = (await estado()).foto;
  await digita("#photoWmm", "120");
  const depois = (await estado()).foto;
  ok(perto(antes.y, depois.y, 0.51),
     "digitar a largura da foto não a empurra papel acima (" +
     antes.y + " → " + depois.y + " mm)");
  await digita("#photoWmm", "5");
  ok((await aviso("photoAviso")).mal, "5 mm de foto avisa em vermelho");
  await pg.click("#photoHmm");
  await pg.waitForTimeout(300);
  ok(await pg.inputValue("#photoWmm") === "20",
     "e ao sair vira o menor que cabe, 20 mm (deu " + await pg.inputValue("#photoWmm") + ")");

  // ---- o molde guardado volta com a medida própria ------------------------
  await digita("#photoWmm", "120");
  await pg.click("#photoHmm");
  await pg.waitForTimeout(700);
  await pg.reload();
  await pg.waitForTimeout(2300);
  ok(await pg.inputValue("#paperW") === "210" && await pg.inputValue("#photoWmm") === "120",
     "as medidas próprias voltam com o molde");
  ok(perto(await proporcao(), 210 / 297, 0.01), "e o papel volta do tamanho que era");

  // ---- a orientação não vira as medidas próprias de lado ------------------
  await pg.click('.rail button[data-pane="papel"]');
  await pg.waitForTimeout(250);
  await pg.selectOption("#paperOr", "l");
  await pg.waitForTimeout(400);
  ok(perto(await proporcao(), 210 / 297, 0.01),
     "em Personalizado, Paisagem não troca a largura pela altura");
  ok(await pg.evaluate(() => document.getElementById("paperOrCampo").classList.contains("dim")),
     "e o seletor de orientação fica esmaecido, dizendo que não manda ali");

  // ---- a foto entra reduzida quando o papel não a comporta ----------------
  await digita("#paperW", "100");
  await digita("#paperH", "80");
  await pg.click("#paperSize");
  await pg.waitForTimeout(400);
  const cabe = await pg.evaluate(() => document.getElementById("paperCabe").textContent);
  const m = cabe.match(/com ([\d,]+) × ([\d,]+) mm impressos/);
  ok(!!m, "papel menor que a foto avisa com a medida impressa: \"" + cabe + "\"");
  const fw = m ? parseFloat(m[1].replace(",", ".")) : 0;
  const fh = m ? parseFloat(m[2].replace(",", ".")) : 0;
  ok(fw <= 100.01 && fh <= 80.01, "a foto reduzida cabe no papel (" + fw + " × " + fh + " mm)");
  ok(perto(fw / fh, 120 / 150, 0.01), "e entra na proporção que foi escolhida");
  let g = await estado();
  ok(g.caixa.w === "120" && g.caixa.h === "150",
     "a medida escolhida não se perde: o molde guarda 120 × 150 (" +
     g.caixa.w + " × " + g.caixa.h + ")");

  await digita("#paperW", "210");
  await digita("#paperH", "297");
  await pg.click("#paperSize");
  await pg.waitForTimeout(400);
  ok(await pg.evaluate(() => document.getElementById("paperCabe").textContent) === "",
     "papel grande de novo: a foto volta ao tamanho escolhido e o aviso some");

  // ---- molde gravado quando a orientação ainda trocava as medidas ---------
  await pg.waitForTimeout(700);
  await pg.evaluate(() => {
    const idx = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
    const it = idx.itens.find(i => i.id === idx.atual);
    const d = JSON.parse(localStorage.getItem(it.dados));
    d.paper = { size: "custom", or: "l", w: "150", h: "100" };  // 100 × 150 na prática
    localStorage.setItem(it.dados, JSON.stringify(d));
  });
  await pg.reload();
  await pg.waitForTimeout(2300);
  ok(await pg.inputValue("#paperW") === "100" && await pg.inputValue("#paperH") === "150",
     "o molde antigo volta com as medidas nos campos certos (" +
     await pg.inputValue("#paperW") + " × " + await pg.inputValue("#paperH") + ")");
  ok(await pg.inputValue("#paperOr") === "p", "e a orientação já não tem o que trocar");
  ok(perto(await proporcao(), 100 / 150, 0.01), "o papel continua do tamanho que era");

  ok(erros.length === 0, "nenhum erro de JavaScript" +
     (erros.length ? ": " + erros[0] : ""));

  await nav.close();
  process.exit(falhas ? 1 : 0);
})();
