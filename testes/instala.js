// O app instalável, num Chromium servido por http (service worker não
// funciona aberto do disco).
//
// As promessas:
//   1. o manifesto existe, é JSON válido e aponta ícones de 192 e 512 px que
//      existem e têm esse tamanho;
//   2. o service worker se registra e controla a página;
//   3. sem internet, a página abre do cache e o app funciona;
//   4. com internet, a página vem da rede (o cache não prende versão velha).
let chromium;
try { chromium = require("playwright").chromium; }
catch (e){
  try { chromium = require("/opt/node22/lib/node_modules/playwright").chromium; }
  catch (e2){ console.log("pulado: precisa do playwright e de um Chromium."); process.exit(0); }
}
const http = require("http"), fs = require("fs"), path = require("path");
const raiz = path.resolve(__dirname, "..");
let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png",
                ".webmanifest": "application/manifest+json", ".json": "application/json",
                ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf" };
let marca = "";   // muda o index.html servido, para ver se o que chega é da rede

const srv = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/") u = "/index.html";
  const f = path.join(raiz, u);
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end(); }
  let corpo = fs.readFileSync(f);
  if (u === "/index.html" && marca) corpo = Buffer.from(corpo.toString("utf8").replace("<body", "<body data-marca=\"" + marca + "\""));
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" });
  res.end(corpo);
});

(async () => {
  // ---- 1. manifesto --------------------------------------------------------------
  let man = null;
  try { man = JSON.parse(fs.readFileSync(path.join(raiz, "manifest.webmanifest"), "utf8")); } catch (e){}
  ok(man && man.display === "standalone" && man.start_url, "o manifesto é JSON válido e abre como app");
  const tam = f => { const b = fs.readFileSync(path.join(raiz, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  const icones = (man && man.icons) || [];
  ok(["192x192", "512x512"].every(s => icones.some(i => i.sizes === s && fs.existsSync(path.join(raiz, i.src)) &&
     tam(i.src).join("x") === s)), "os ícones de 192 e 512 px existem e têm esse tamanho");

  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + srv.address().port + "/";
  const nav = await chromium.launch();
  const ctx = await nav.newContext();
  const pg = await ctx.newPage();
  const erros = [];
  pg.on("pageerror", e => erros.push(e.message));
  await pg.goto(url);
  await pg.waitForTimeout(2300);

  // ---- 2. registrado ---------------------------------------------------------------
  const sw = await pg.evaluate(async () => {
    const r = await navigator.serviceWorker.ready;
    return r.active && r.active.scriptURL;
  });
  ok(/app-sw\.js$/.test(sw || ""), "o service worker se registra (" + (sw || "nenhum") + ")");
  await pg.reload();
  await pg.waitForTimeout(1500);
  ok(await pg.evaluate(() => !!navigator.serviceWorker.controller), "e controla a página");

  // ---- 4. com rede, a página nova ---------------------------------------------------------
  marca = "nova";
  await pg.reload();
  await pg.waitForTimeout(1500);
  ok(await pg.evaluate(() => document.body.dataset.marca) === "nova", "com internet, o index.html vem da rede, e não do cache");

  // ---- 3. sem rede ---------------------------------------------------------------------
  await ctx.setOffline(true);
  await pg.reload();
  await pg.waitForTimeout(2300);
  ok(await pg.evaluate(() => typeof els !== "undefined" && !!document.querySelector("#addText")),
     "sem internet, a página abre do cache");
  await pg.click("#addText");
  await pg.waitForTimeout(500);
  ok(await pg.evaluate(() => els.length) >= 1, "e o app funciona: a palavra nasce");
  await ctx.setOffline(false);

  ok(erros.length === 0, "nenhum erro de JavaScript no caminho" + (erros.length ? ": " + erros[0] : ""));
  await nav.close();
  srv.close();
  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
