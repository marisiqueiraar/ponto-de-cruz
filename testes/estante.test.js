// A estante mexe no que o navegador guarda. Um erro aqui não desenha errado:
// apaga trabalho. O que se testa é isso — o que sobrevive e o que some.
const fs = require("fs");

function memoriaFalsa(inicial){
  const m = new Map(Object.entries(inicial || {}));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (m._cheia) throw new Error("QuotaExceeded"); m.set(k, String(v)); },
    removeItem: k => m.delete(k),
    chaves: () => [...m.keys()].sort(),
    _m: m
  };
}

let falhas = 0;
const ok = (c, m) => { console.log((c ? "ok    " : "FALHA ") + m); if (!c) falhas++; };

const MOLDE = k => JSON.stringify({ v:1, paper:{size:"a4"}, photoBox:{x:10,y:20},
  mm:"2.5", pal:0, thread:"#BE5103", sel:0,
  els:[{kind:"text",text:k,x:1,y:2,rot:0,manual:3,color:"#BE5103",colorName:"Terracota",cells:["11","10"]}] });

function monta(inicial){
  // o mundo mínimo que o código da estante toca
  const reg = { abriu: [], renderizou: 0, avisos: [] };
  const campo = { value: "", tagName: "INPUT" };
  const lista = { innerHTML: "", filhos: [], appendChild(x){ this.filhos.push(x); },
                  querySelector: () => null };
  const aviso = { textContent: "" };
  global.localStorage = memoriaFalsa(inicial);
  global.document = {
    activeElement: null,
    createElement: () => ({ className:"", type:"", textContent:"", title:"",
      style:{}, dataset:{}, appendChild(){}, setAttribute(){}, addEventListener(){} })
  };
  global.confirm = () => reg.confirma !== false;
  global.Blob = class { constructor(p){ this.p = p.join(""); } text(){ return Promise.resolve(this.p); } };
  global.FileReader = class {
    readAsText(f){ this.result = f._txt; setTimeout(() => this.onload(), 0); }
  };
  const ctx = {
    $: id => ({ moldeLista: lista, moldeNome: campo, moldeAviso: aviso }[id] || null),
    restoreState: chave => { reg.abriu.push(chave); return !!localStorage.getItem(chave); },
    moldeEmBranco: () => { reg.abriu.push("branco"); },
    saveState: () => { reg.gravou = (reg.gravou || 0) + 1; },
    renderChips(){}, syncControls(){}, restorePhoto(){}, mostraFonte(){},
    draw(){}, mostraZoom(){}, resetHist(){},
    saveName: ext => "molde-teste." + ext,
    deliver: (blob, nome) => { reg.baixou = { nome, blob }; },
    els: [], restored: false, photoImg: null, photoURL: null,
    STORE: "ponto-e-letra/molde/v1", PHOTO_STORE: "ponto-e-letra/molde/foto/v1",
    reg
  };
  const src = fs.readFileSync(__dirname + "/estante.js", "utf8");
  const nomes = Object.keys(ctx);
  const f = new Function(...nomes, src + `
    ; return { estante: () => estante, carregaEstante, criaMolde, itemAtual, abreMolde,
               apagaMolde, exportaMolde, importaMolde, abreItem, renderMoldes };`);
  return { api: f(...nomes.map(n => ctx[n])), reg, campo, aviso };
}

(async () => {
  // ---- 1. molde que já estava gravado entra na estante sem ser copiado ----
  {
    const antes = { "ponto-e-letra/molde/v1": MOLDE("amor"),
                    "ponto-e-letra/molde/foto/v1": "data:image/jpeg;base64,AAAA" };
    const { api } = monta(antes);
    const chavesAntes = localStorage.chaves();
    api.carregaEstante();
    const e = api.estante();
    ok(e.itens.length === 1, "o molde antigo virou um item da estante");
    ok(e.itens[0].dados === "ponto-e-letra/molde/v1", "apontando para a chave de sempre");
    ok(e.itens[0].foto === "ponto-e-letra/molde/foto/v1", "e para a foto de sempre");
    ok(localStorage.getItem("ponto-e-letra/molde/v1") === MOLDE("amor"), "o molde não foi tocado");
    ok(localStorage.getItem("ponto-e-letra/molde/foto/v1") === "data:image/jpeg;base64,AAAA",
       "a foto não foi copiada nem movida");
    const novas = localStorage.chaves().filter(k => !chavesAntes.includes(k));
    ok(novas.length === 1 && novas[0] === "ponto-e-letra/moldes/v1",
       "só o índice foi escrito (escreveu: " + novas.join(", ") + ")");
  }

  // ---- 2. moldes diferentes não dividem chave ----------------------------
  {
    const { api } = monta({});
    const a = api.criaMolde("um"), b = api.criaMolde("dois"), c = api.criaMolde("tres");
    const chaves = [a, b, c].flatMap(x => [x.dados, x.foto]);
    ok(new Set(chaves).size === 6, "três moldes, seis chaves distintas");
    ok(api.estante().atual === c.id, "o último criado fica aberto");
    ok(api.estante().itens[0].id === c.id, "e aparece no topo da lista");
  }

  // ---- 3. apagar tira só as chaves daquele molde -------------------------
  {
    const { api, reg } = monta({});
    const a = api.criaMolde("guardar");
    localStorage.setItem(a.dados, MOLDE("guardar"));
    localStorage.setItem(a.foto, "data:image/jpeg;base64,GUARDA");
    const b = api.criaMolde("descartar");
    localStorage.setItem(b.dados, MOLDE("descartar"));
    localStorage.setItem(b.foto, "data:image/jpeg;base64,DESCARTA");
    api.apagaMolde(b.id);
    ok(localStorage.getItem(b.dados) === null, "o molde apagado sumiu");
    ok(localStorage.getItem(b.foto) === null, "a foto dele também");
    ok(localStorage.getItem(a.dados) === MOLDE("guardar"), "o outro molde continua inteiro");
    ok(localStorage.getItem(a.foto) === "data:image/jpeg;base64,GUARDA", "e a foto dele também");
    ok(api.estante().atual === a.id, "o que sobrou passou a ser o aberto");
    ok(reg.abriu.includes(a.dados), "e foi realmente carregado na tela");
  }

  // ---- 4. apagar o último deixa uma folha limpa, não um buraco -----------
  {
    const { api, reg } = monta({});
    const a = api.criaMolde("unico");
    localStorage.setItem(a.dados, MOLDE("unico"));
    api.apagaMolde(a.id);
    ok(api.estante().itens.length === 1, "sobrou um molde novo, vazio");
    ok(api.estante().itens[0].id !== a.id, "com outra identidade");
    ok(reg.abriu.includes("branco"), "e a tela foi para o branco");
  }

  // ---- 5. trocar de molde grava o que estava aberto ----------------------
  {
    const { api, reg } = monta({});
    const a = api.criaMolde("a");
    localStorage.setItem(a.dados, MOLDE("a"));
    const b = api.criaMolde("b");
    localStorage.setItem(b.dados, MOLDE("b"));
    reg.gravou = 0;
    api.abreMolde(a.id);
    ok(reg.gravou === 1, "gravou o molde aberto antes de trocar");
    ok(api.estante().atual === a.id, "e passou para o outro");
    reg.gravou = 0;
    api.abreMolde(a.id);
    ok(reg.gravou === 0, "clicar no que já está aberto não faz nada");
  }

  // ---- 6. arquivo: salvar e abrir de volta -------------------------------
  {
    const { api, reg } = monta({});
    const a = api.criaMolde("presente");
    localStorage.setItem(a.dados, MOLDE("presente"));
    localStorage.setItem(a.foto, "data:image/jpeg;base64,FOTO");
    api.exportaMolde();
    ok(!!reg.baixou, "o arquivo foi entregue para baixar");
    const arq = JSON.parse(reg.baixou.blob.p);
    ok(arq.app === "ponto-e-letra" && arq.v === 1, "com a marca do app dentro");
    ok(arq.foto === "data:image/jpeg;base64,FOTO", "e a foto junto");
    ok(JSON.stringify(arq.molde) === MOLDE("presente"), "e o molde inteiro");

    // abrir num navegador zerado
    const outro = monta({});
    outro.api.importaMolde({ _txt: JSON.stringify(arq) });
    await new Promise(r => setTimeout(r, 5));
    const it = outro.api.itemAtual();
    ok(!!it, "o arquivo virou um molde na estante");
    ok(it && localStorage.getItem(it.dados) === MOLDE("presente"), "com o mesmo conteúdo");
    ok(it && localStorage.getItem(it.foto) === "data:image/jpeg;base64,FOTO", "e a mesma foto");
    ok(it && it.nome === "presente", "e o mesmo nome");
    ok(outro.reg.gravou === 1, "gravando antes o molde que estava aberto");
  }

  // ---- 7. arquivo de outra coisa não entra --------------------------------
  {
    const { api, aviso } = monta({});
    api.criaMolde("meu");
    const antes = api.estante().itens.length;
    api.importaMolde({ _txt: JSON.stringify({ app: "outro-app", molde: { els: [1] } }) });
    await new Promise(r => setTimeout(r, 5));
    ok(api.estante().itens.length === antes, "arquivo de outro app não cria molde");
    ok(/não é um molde/.test(aviso.textContent), "e diz o que houve: \"" + aviso.textContent + "\"");

    api.importaMolde({ _txt: "isso não é json" });
    await new Promise(r => setTimeout(r, 5));
    ok(api.estante().itens.length === antes, "texto qualquer também não");
  }

  // ---- 8. memória cheia na hora de importar não deixa item fantasma ------
  {
    const { api, aviso } = monta({});
    api.criaMolde("meu");
    const antes = api.estante().itens.length;
    localStorage._m._cheia = true;
    api.importaMolde({ _txt: JSON.stringify({ app:"ponto-e-letra", v:1, nome:"grande",
                                              molde: JSON.parse(MOLDE("grande")), foto:null }) });
    await new Promise(r => setTimeout(r, 5));
    ok(api.estante().itens.length === antes, "cota estourada não deixa molde vazio na estante");
    ok(/mem[óo]ria/.test(aviso.textContent), "e avisa: \"" + aviso.textContent + "\"");
  }

  console.log(falhas ? "\n" + falhas + " FALHAS" : "\ntudo certo");
  process.exit(falhas ? 1 : 0);
})();
