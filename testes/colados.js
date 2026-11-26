// Furos de peças diferentes colados demais.
//
// As promessas:
//   1. duas peças com furos a 1 mm uns dos outros acendem o aviso na barra e
//      a região marcada em vermelho na tela — no papel essa tira rasga;
//   2. furos exatamente no mesmo lugar não avisam: é um furo só;
//   3. peças afastadas não avisam;
//   4. o aviso some quando o problema some.
//
// Os moldes entram pelo botão de abrir arquivo, como entraria um molde
// salvo: é o jeito de pôr as peças em posições exatas, ao décimo de milímetro.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

// um quadrado cheio de 4 × 4 pontos: 25 furos a 2,5 mm
const quadrado = (x, y) => ({ kind: "sym", sym: "heart", scale: 1, x, y, rot: 0, manual: 0,
  color: "#B3222C", colorName: "", edits: [], cells: ["1111", "1111", "1111", "1111"] });
const molde = (els) => JSON.stringify({ app: "ponto-e-letra", v: 1, nome: "furos", em: "",
  molde: { v: 1, paper: { size: "210x297", or: "p", w: "210", h: "297" },
           photoBox: { size: "none", or: "p", w: "100", h: "150", x: 55, y: 60 },
           mm: "2.5", thread: "#B3222C", sel: 0, guias: { on: 0, v: [], h: [] }, els },
  foto: null, imagens: null });

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1280, height: 860 } });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);

  const abre = async (nome, els) => {
    await pg.evaluate(() => abreAba("moldes"));
    const [janela] = await Promise.all([pg.waitForEvent("filechooser"), pg.click("#moldeAbrir")]);
    await janela.setFiles({ name: nome + ".json", mimeType: "application/json",
                            buffer: Buffer.from(molde(els)) });
    await pg.waitForTimeout(900);   // a busca roda depois do último desenho
  };
  const aviso = () => pg.textContent("#fitTxt");
  const vermelho = async () => {
    // pixels vermelhos do círculo (#D7263D) na tela
    return pg.evaluate(() => {
      const c = document.getElementById("grid"), x = c.getContext("2d");
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4)
        if (d[i] > 190 && d[i + 1] < 70 && d[i + 2] > 40 && d[i + 2] < 90) n++;
      return n;
    });
  };

  // ---- 1. a 1 mm: avisa -----------------------------------------------------
  await abre("colados", [quadrado(50, 50), quadrado(61, 50)]);   // 2ª começa 1 mm depois do fim da 1ª
  let t = await aviso();
  ok(/furos colados/.test(t), "furos a 1 mm acendem o aviso: \"" + t.trim() + "\"");
  ok(await pg.getAttribute("#fitHint", "class") === "fit over", "em vermelho");
  ok(await vermelho() > 30, "e a região aparece marcada em vermelho na tela");

  // ---- 2. no mesmo lugar: é um furo só ---------------------------------------
  await abre("mesmo", [quadrado(50, 50), quadrado(60, 50)]);     // a 2ª começa no último furo da 1ª
  t = await aviso();
  ok(!/furos colados/.test(t), "furos que coincidem não avisam: \"" + t.trim() + "\"");

  // ---- 3. afastadas: nada -----------------------------------------------------
  await abre("longe", [quadrado(50, 50), quadrado(90, 50)]);
  t = await aviso();
  ok(!/furos colados/.test(t), "peças afastadas não avisam");
  ok(await vermelho() < 20, "nem marcam nada na tela");

  // ---- 4. a 1 mm e depois afastando com a seta ---------------------------------
  await abre("anda", [quadrado(50, 50), quadrado(61, 50)]);
  ok(/furos colados/.test(await aviso()), "de novo colados");
  await pg.evaluate(() => abreAba("pecas"));
  await pg.click("#chips .chip:nth-child(2)");
  await pg.evaluate(() => document.activeElement.blur());
  for (let i = 0; i < 3; i++) await pg.locator("body").press("Shift+ArrowRight");
  await pg.waitForTimeout(900);
  ok(!/furos colados/.test(await aviso()), "afastada 15 mm, o aviso some");

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
