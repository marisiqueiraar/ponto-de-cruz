/* Desativa o service worker deixado pelo app React que já esteve neste domínio.
   Aquele app usava vite-plugin-pwa com o HTML dentro do globPatterns do workbox,
   então o navegador passou a servir a página do cache, offline-first — e seguia
   entregando a versão antiga mesmo depois de novos deploys, porque service worker
   é por origem e sobrevive a qualquer publicação.

   Este arquivo ocupa o lugar daquele (mesmo caminho, /sw.js). Na próxima visita o
   navegador busca /sw.js para checar atualização, encontra este, apaga todos os
   caches, se desregistra e recarrega as abas abertas. A partir daí a página volta
   a vir da rede, e este arquivo deixa de ser chamado.

   Só pode ser removido do repositório quando não houver mais navegador por aí com
   o service worker antigo registrado — na dúvida, é barato deixar ficar. */
self.addEventListener("install", function(){
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil((async function(){
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k); }));
    } catch (e){ /* sem Cache Storage: seguir para o desregistro mesmo assim */ }

    await self.registration.unregister();

    var windows = await self.clients.matchAll({ type: "window" });
    windows.forEach(function(c){
      try { c.navigate(c.url); } catch (e){ /* aba que não aceita navegação: ignorar */ }
    });
  })());
});
