// O consumo de linha. Um número errado aqui faz alguém comprar linha errada,
// então o que se testa não é "aparece algo": é se os metros na tela batem com
// a conta que a própria tela diz estar fazendo, e se os dois respondem ao
// espaçamento entre furos.
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const alvo = "file://" + require("path").resolve(__dirname, "..", "index.html");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };
const num = t => parseFloat(String(t).replace(",", "."));

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto(alvo);
  await pg.waitForTimeout(2300);
  await pg.click('.rail button[data-pane="molde"]');
  await pg.waitForTimeout(400);

  const lido = async () => {
    await pg.waitForTimeout(500);
    return pg.evaluate(() => ({
      pontos: parseInt(document.getElementById("count").textContent.replace(/\D/g, ""), 10),
      conta: document.getElementById("fiosConta").textContent,
      linhas: [...document.querySelectorAll("#fios .fio")].map(d => ({
        nome: d.querySelector(".nm").textContent,
        metros: d.querySelector("b").textContent,
        titulo: d.title
      })),
      mm: parseFloat(document.getElementById("mm").value)
    }));
  };

  let r = await lido();
  ok(r.linhas.length === 1, "uma peça, uma linha na lista (" + r.linhas.length + ")");
  ok(/pontos/.test(r.linhas[0].titulo), "a linha diz quantos pontos: " + r.linhas[0].titulo);

  // ---- a conta escrita bate com a geometria? -----------------------------
  const numeros = t => (t.match(/\d+(?:,\d+)?/g) || []).map(num);
  const nums = numeros(r.conta);
  const [furo, frente, avesso, perda, total] = nums;
  ok(furo === r.mm, "a conta usa o espaçamento de agora (" + furo + " mm)");
  ok(Math.abs(frente - 2 * r.mm * Math.SQRT2) < 0.06,
     "frente = duas diagonais: " + frente + " mm contra " + (2*r.mm*Math.SQRT2).toFixed(2));
  ok(Math.abs(avesso - 2 * r.mm) < 0.06,
     "avesso = dois lados: " + avesso + " mm contra " + (2*r.mm).toFixed(2));
  ok(Math.abs(total - (frente + avesso) * (1 + perda/100)) < 0.11,
     "o total é (frente + avesso) + " + perda + "%: " + total + " mm");
  console.log("      conta na tela: " + r.conta);

  // ---- os metros batem com pontos × mm por ponto? ------------------------
  const pontos = parseInt(r.linhas[0].titulo.replace(/\D/g, ""), 10);
  const esperado = pontos * total / 1000;
  ok(Math.abs(num(r.linhas[0].metros) - esperado) < 0.12,
     pontos + " pontos × " + total + " mm = " + esperado.toFixed(2) + " m, e a tela diz " +
     r.linhas[0].metros);
  ok(pontos === r.pontos, "e os pontos batem com o contador do molde (" + pontos + ")");

  // ---- mexer no espaçamento muda a conta e os metros ---------------------
  await pg.evaluate(() => {
    const e = document.getElementById("mm");
    e.value = "5"; e.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const r2 = await lido();
  const n2 = numeros(r2.conta);
  ok(n2[0] === 5, "furos de 5 mm entraram na conta");
  ok(Math.abs(n2[1] - 2 * 5 * Math.SQRT2) < 0.06, "e a frente dobrou: " + n2[1] + " mm");
  ok(num(r2.linhas[0].metros) > num(r.linhas[0].metros),
     "furo maior pede mais fio (" + r.linhas[0].metros + " → " + r2.linhas[0].metros + ")");
  await pg.evaluate(() => {
    const e = document.getElementById("mm");
    e.value = "2.5"; e.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await pg.waitForTimeout(500);

  // ---- duas linhas, duas somas separadas ---------------------------------
  await pg.click('.rail button[data-pane="pecas"]');
  await pg.waitForTimeout(300);
  await pg.click("#addSym");
  await pg.waitForTimeout(600);
  await pg.click('.rail button[data-pane="linha"]');
  await pg.waitForTimeout(400);
  await pg.click(".grade .cat:nth-child(2)");   // outra cor, tirada da cartela
  await pg.waitForTimeout(600);
  await pg.click('.rail button[data-pane="molde"]');
  const r3 = await lido();
  ok(r3.linhas.length === 2, "duas cores, duas linhas na lista (" + r3.linhas.length + ")");
  const soma = r3.linhas.reduce((a, l) => a + parseInt(l.titulo.replace(/\D/g, ""), 10), 0);
  ok(soma === r3.pontos, "a soma das linhas bate com o total de pontos (" + soma + " de " + r3.pontos + ")");
  console.log("      " + r3.linhas.map(l => l.nome + " " + l.metros).join("   |   "));

  await nav.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
