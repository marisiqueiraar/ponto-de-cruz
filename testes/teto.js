// O teto do canvas de rascunho.
//
// A promessa é que reduzir a resolução do rascunho NÃO muda a grade de
// quadradinhos — ela vem da altura escolhida, não do rascunho. Se essa
// promessa quebrar, o molde muda de tamanho sozinho quando a palavra cresce,
// que é pior do que o problema que o teto resolve.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
const TETO = 4000, SUPER = 6;
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1280, height: 860 } });
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  await pg.click('.rail button[data-pane="pecas"]');
  await pg.waitForTimeout(300);
  await pg.click(".chip");
  await pg.waitForTimeout(300);
  const põe = async (id, v) => {
    await pg.fill("#" + id, String(v));
    await pg.dispatchEvent("#" + id, "input");
    await pg.waitForTimeout(650);
  };
  const grade = async () => {
    await pg.waitForTimeout(500);
    return pg.evaluate(() => {
      const i = JSON.parse(localStorage.getItem("ponto-e-letra/moldes/v1"));
      const e = JSON.parse(localStorage.getItem(i.itens.find(x => x.id === i.atual).dados)).els[0];
      return { c: e.cells[0].length, l: e.cells.length,
               pontos: e.cells.join("").split("1").length - 1 };
    });
  };

  await põe("rot", 0);
  await põe("arc", 120);

  // ---- a palavra cresce; a grade tem de crescer junto, sem degrau ----------
  // Se o teto mudasse a grade, haveria um salto exatamente onde ele entra.
  const frases = [
    "amorosa",
    "amorosa para sempre",
    "amorosa para sempre e um dia",
    "amorosa para sempre e um dia inteiro",
    "amorosa para sempre e um dia inteiro alem disso"
  ];
  const medidas = [];
  for (const f of frases){
    await põe("txt", f);
    await põe("rows", 60);
    const g = await grade();
    const px = Math.max(g.c, g.l) * SUPER;
    medidas.push({ f, g, px });
    console.log("      " + String(g.c + "×" + g.l).padEnd(10) + " " +
      String(g.pontos).padStart(6) + " pontos   rascunho a 6 px/quadradinho seria " +
      px + " px" + (px > TETO ? "  (acima do teto: foi reduzido)" : ""));
    ok(g.pontos > 50, "\"" + f.slice(0, 22) + "…\" virou desenho de verdade (" + g.pontos + " pontos)");
  }

  ok(medidas.some(m => m.px > TETO), "algum caso passou do teto — senão o teste não testa nada");

  /* Colunas por letra cai naturalmente conforme a frase cresce — palavra curta
     numa altura fixa é proporcionalmente mais larga. Então o que se mede não é a
     estabilidade da razão, e sim se a fronteira do teto produz um degrau MAIOR
     que a variação natural entre dois casos em que o teto nem entrou. */
  const razoes = medidas.map(m => m.g.c / m.f.length);
  const saltos = razoes.slice(1).map((r, i) => Math.abs(r / razoes[i] - 1));
  const iTeto = medidas.findIndex(m => m.px > TETO);
  const naFronteira = saltos[iTeto - 1];
  const semTeto = saltos.filter((_, i) => i !== iTeto - 1);
  ok(naFronteira <= Math.max(...semTeto),
     "o degrau na fronteira do teto (" + (naFronteira * 100).toFixed(1) +
     "%) não é maior que a variação natural (" +
     semTeto.map(x => (x * 100).toFixed(1) + "%").join(", ") + ")");

  /* E a prova direta: antes do teto existir, este mesmo pior caso dava uma
     grade de 763 × 243 quadradinhos, medida no Chromium. Com o rascunho
     reduzido ela precisa continuar a mesma, a menos de arredondamento. */
  const pior = medidas[medidas.length - 1].g;
  ok(Math.abs(pior.c - 763) <= 3 && Math.abs(pior.l - 243) <= 3,
     "o pior caso mantém a grade que tinha sem o teto: " + pior.c + " × " + pior.l +
     " contra 763 × 243");

  // ---- e a altura da peça segue a altura pedida ---------------------------
  await põe("txt", "amorosa para sempre e um dia inteiro alem disso");
  const alturas = [];
  for (const r of [20, 40, 60]){
    await põe("rows", r);
    const g = await grade();
    alturas.push({ r, l: g.l, c: g.c });
  }
  ok(alturas[2].l > alturas[1].l && alturas[1].l > alturas[0].l,
     "mais altura pedida, mais linhas na grade (" + alturas.map(a => a.l).join(" < ") + ")");
  const porAltura = alturas.map(a => a.l / a.r);
  ok(Math.max(...porAltura) / Math.min(...porAltura) < 1.25,
     "e a proporção se mantém onde o teto entra (" + porAltura.map(x => x.toFixed(2)).join(", ") + ")");

  ok(erros.length === 0, "nenhum erro de JavaScript no pior caso" +
     (erros.length ? " — " + erros.join(" | ") : ""));

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
