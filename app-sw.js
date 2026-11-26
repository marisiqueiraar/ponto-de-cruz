/* ponto & letra — app-sw.js
   O service worker que deixa o app ser instalado e abrir sem internet.

   Ele é o contrário do que causou o problema que o sw.js conserta: aquele
   servia a página do cache primeiro, e o app ficava preso numa versão velha
   depois de cada publicação. Este vai SEMPRE à rede primeiro. O cache só é
   usado quando a rede falha — sem internet, o app abre com a última versão
   que funcionou; com internet, nunca. Não há versão de cache para trocar a
   cada publicação, porque a cópia do cache é refeita a cada visita.

   Na instalação, ele guarda a página e tudo o que ela carrega (lido do
   próprio index.html, para a lista nunca ficar para trás). As fontes entram
   no cache conforme são usadas. */
var CACHE = "ponto-e-letra";

self.addEventListener("install", function(event){
  event.waitUntil((async function(){
    var c = await caches.open(CACHE);
    try {
      var r = await fetch("index.html", { cache: "no-cache" });
      var html = await r.clone().text();
      await c.put("index.html", r);
      var lista = ["./"];
      html.replace(/(?:src|href)="([^"#:]+\.(?:js|css|png|webmanifest))"/g, function(_, u){ lista.push(u); });
      await Promise.all(lista.map(function(u){
        return fetch(u, { cache: "no-cache" }).then(function(x){ if (x.ok) return c.put(u, x); }).catch(function(){});
      }));
    } catch (e){ /* sem rede na instalação: o cache se enche nas próximas visitas */ }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", function(event){
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async function(){
    try {
      var r = await fetch(req);
      if (r.ok){
        var copia = r.clone();
        caches.open(CACHE).then(function(c){ return c.put(req, copia); });
      }
      return r;
    } catch (e){
      var c = await caches.open(CACHE);
      var achou = await c.match(req, { ignoreSearch: true });
      if (achou) return achou;
      if (req.mode === "navigate") return (await c.match("index.html")) || Response.error();
      return Response.error();
    }
  })());
});
