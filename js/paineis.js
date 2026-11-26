/* ponto & letra — paineis.js
   Painel da linha, alinhar, estante na tela, arquivo do molde e o começo.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

/* ---- painel da linha ------------------------------------------------ */
$("catBusca").addEventListener("input", listaCatalogo);

[].forEach.call(document.querySelectorAll("#catOrdem button"), function(b){
  b.addEventListener("click", function(){
    ordemModo = b.dataset.ordem;
    [].forEach.call(document.querySelectorAll("#catOrdem button"), function(x){
      x.classList.toggle("on", x === b);
    });
    listaCatalogo();
  });
});

$("avAdd").addEventListener("click", guardaAvulsa);
[].forEach.call(document.querySelectorAll("#avMarca, #avCode"), function(campo){
  campo.addEventListener("keydown", function(e){
    if (e.key === "Enter"){ e.preventDefault(); guardaAvulsa(); }
  });
});

// um ouvinte só para a grade inteira: são centenas de quadradinhos
$("catGrade").addEventListener("click", function(e){
  var b = e.target;                     // o quadradinho não tem filho: é ele mesmo
  if (!b || !b.classList || !b.classList.contains("cat")) return;
  if (linhaModo === "caixa") alternaNaCaixa(b.dataset.k, b);
  else aplicaNaPeca(b.dataset.k);
});

[].forEach.call(document.querySelectorAll("#toqueCaixa button"), function(b){
  b.addEventListener("click", function(){
    toqueCaixa = b.dataset.est;
    [].forEach.call(document.querySelectorAll("#toqueCaixa button"), function(x){
      x.classList.toggle("on", x === b);
      x.setAttribute("aria-pressed", x === b ? "true" : "false");
    });
  });
});

[].forEach.call(document.querySelectorAll("#linhaModo button"), function(b){
  b.addEventListener("click", function(){ mudaModoLinha(b.dataset.modo); });
});

$("loteAdd").addEventListener("click", function(){
  var r = poeLote($("loteMarca").value, $("loteCodigos").value);
  var partes = [];
  if (r.novas) partes.push(r.novas + (r.novas === 1 ? " entrou na caixa" : " entraram na caixa"));
  if (r.ja) partes.push(r.ja + (r.ja === 1 ? " já estava" : " já estavam"));
  if (r.faltou.length) partes.push("não achei na cartela: " + r.faltou.join(", "));
  $("loteAviso").textContent = partes.length ? partes.join(" · ") + "." : "Escreva os códigos acima.";
  if (!r.faltou.length) $("loteCodigos").value = "";
});

// esvaziar a caixa apaga trabalho de catálogo que não dá para desfazer, então
// pede um segundo toque em vez de abrir a janela de confirmar do recalcular
$("catLimpar").addEventListener("click", function(){
  if (!this.classList.contains("perigo")){
    this.classList.add("perigo");
    this.textContent = "confirmar";
    return;
  }
  minhas = [];
  estoque = {};
  salvaLinhas();
  montaMarcas();
  listaCatalogo();
  contaLinhas();
});

/* ---- alinhar e empurrar a peça --------------------------------------

   Arrastando com o mouse, acertar milímetro é sorte, e a foto já tinha três
   botões de posicionar na barra enquanto a peça não tinha nenhum.

   O que se move é a caixa JÁ GIRADA: centralizar uma palavra inclinada pelo
   canto de cima dela deixaria o texto visivelmente torto no papel. */
function moveEl(el, dx, dy){
  el.x = Math.round((el.x + dx) * 10) / 10;
  el.y = Math.round((el.y + dy) * 10) / 10;
}

function alinha(modo){
  var el = els[sel];
  if (!el) return;
  var b = elPaperBox(el), pa = paperMM();
  if (modo === "foto" && photo.off) modo = "papel";
  if (modo === "foto")  moveEl(el, (photo.x + photo.w / 2) - (b.x + b.w / 2), 0);
  if (modo === "papel") moveEl(el, (pa.w / 2) - (b.x + b.w / 2), 0);
  if (modo === "base" && !photo.off) moveEl(el, 0, (photo.y + photo.h) - (b.y + b.h));
  // nome em duas linhas: a de baixo centraliza pela de cima, não pela foto
  if (modo === "acima" && sel > 0){
    var c = elPaperBox(els[sel - 1]);
    moveEl(el, (c.x + c.w / 2) - (b.x + b.w / 2), 0);
  }
  draw(); pushHist();
}

$("alFoto").addEventListener("click", function(){ alinha("foto"); });
$("alPapel").addEventListener("click", function(){ alinha("papel"); });
$("alBase").addEventListener("click", function(){ alinha("base"); });
$("alAcima").addEventListener("click", function(){ alinha("acima"); });

var SETAS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

document.addEventListener("keydown", function(e){
  var d = SETAS[e.key];
  if (!d || e.ctrlKey || e.metaKey || e.altKey) return;
  var tag = ((e.target || {}).tagName || "").toUpperCase();
  // dentro de um campo, a seta anda no texto e no número
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  var passo = e.shiftKey ? 5 : 0.5;
  if (noLaco()){
    andaLaco(d[0] * passo, d[1] * passo);
  } else if (foco === "photo"){
    photo.x = Math.round((photo.x + d[0] * passo) * 10) / 10;
    photo.y = Math.round((photo.y + d[1] * passo) * 10) / 10;
    clampPhoto();
  } else {
    var el = els[sel];
    if (!el || foco !== "el") return;
    moveEl(el, d[0] * passo, d[1] * passo);
  }
  e.preventDefault();      // senão a seta rola a mesa junto
  draw();
  pushLater();             // uma rajada de setas vira um passo só no desfazer
});

/* ---- a estante na tela ---------------------------------------------- */

function quando(ms){
  if (!ms) return "agora";
  var d = new Date(ms);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " às " +
         d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function renderMoldes(){
  var box = $("moldeLista");
  if (!box) return;
  box.innerHTML = "";
  estante.itens.forEach(function(it){
    var l = document.createElement("div");
    l.className = "mold" + (it.id === estante.atual ? " on" : "");

    var a = document.createElement("button");
    a.type = "button"; a.className = "abre";
    var nm = document.createElement("span");
    nm.className = "nm"; nm.textContent = it.nome || "sem nome";
    var qd = document.createElement("span");
    qd.className = "qd";
    qd.textContent = (it.pecas || 0) + ((it.pecas === 1) ? " peça" : " peças") + " · " + quando(it.em);
    a.appendChild(nm); a.appendChild(qd);
    a.addEventListener("click", function(){ abreMolde(it.id); });

    var f = document.createElement("button");
    f.type = "button"; f.className = "fixa" + (it.fixo ? " on" : "");
    f.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3l7 7-2 2-1-1-4 4 1 4-2 2-4-4-5 5-1-1 5-5-4-4 2-2 4 1 4-4-1-1z"/></svg>';
    f.title = it.fixo ? "soltar do topo" : "fixar no topo da lista";
    f.setAttribute("aria-label", (it.fixo ? "soltar do topo o molde " : "fixar no topo o molde ") + (it.nome || "sem nome"));
    f.setAttribute("aria-pressed", it.fixo ? "true" : "false");
    f.addEventListener("click", function(){ fixaMolde(it); });

    var x = document.createElement("button");
    x.type = "button"; x.className = "apaga";
    x.textContent = "×";
    x.title = "apagar este molde";
    x.setAttribute("aria-label", "apagar o molde " + (it.nome || "sem nome"));
    x.addEventListener("click", function(){ apagaMolde(it.id); });

    l.appendChild(a); l.appendChild(f); l.appendChild(x);
    box.appendChild(l);
  });
  // o campo do nome não é reescrito enquanto estão digitando nele
  var at = itemAtual(), campo = $("moldeNome");
  if (at && campo && campo !== document.activeElement) campo.value = at.nome || "";
  if ($("moldeTit")) $("moldeTit").textContent = (at && at.nome) || "sem nome";
}

/* Abrir outro molde é trocar tudo o que está na tela: peças, papel, foto,
   linha e o desfazer. O que estava aberto é gravado antes — nunca se perde
   trabalho por ter clicado no molde errado. */
function abreItem(it){
  if (!it) return;
  photoImg = null; photoURL = null;
  // `restored` é o que segura o redesenho cego das fontes, 1,4 s depois de
  // abrir a página: molde vindo da memória não pode ser recalculado, senão
  // perde os ajustes feitos ponto a ponto
  restored = restoreState(it.dados);
  if (!restored) moldeEmBranco();
  renderChips(); syncControls(); renderMoldes();
  restorePhoto(); restoreOrigens(); mostraFonte(); draw(); mostraZoom(); guiasSync(); resetHist();
}

/* A estante fica por ordem de uso: o molde aberto sobe para o topo. Antes era
   por ordem de criação, e o molde de todo dia afundava debaixo dos testes.
   O molde fixado (o alfinete) fica sempre em cima dos outros; entre os
   fixados, vale também a ordem de uso. */
function sobeNaEstante(it){
  var i = estante.itens.indexOf(it);
  if (i < 0) return;
  estante.itens.splice(i, 1);
  var topo = 0;
  if (!it.fixo) while (topo < estante.itens.length && estante.itens[topo].fixo) topo++;
  estante.itens.splice(topo, 0, it);
}

function fixaMolde(it){
  it.fixo = it.fixo ? 0 : 1;
  sobeNaEstante(it);
  salvaEstante();
  renderMoldes();
}

function abreMolde(id){
  if (id === estante.atual) return;
  saveState();
  estante.atual = id;
  sobeNaEstante(itemAtual());
  salvaEstante();
  abreItem(itemAtual());
}

/* Duplicar é copiar as três chaves do molde (desenho, foto e imagens das
   peças) para um molde novo, que já abre. A foto é a que estoura a cota:
   sem espaço para ela, a cópia sai sem foto e diz isso. */
function duplicaMolde(){
  saveState();
  var de = itemAtual();
  if (!de) return;
  var dados = null, foto = null, imgs = null;
  try { dados = localStorage.getItem(de.dados); } catch (e){}
  try { foto = localStorage.getItem(de.foto); } catch (e){}
  try { imgs = localStorage.getItem(IMG_STORE + "/" + de.id); } catch (e){}
  if (!dados) return avisaArquivo("Não há nada gravado para duplicar.");
  var it = criaMolde((de.nome || "sem nome") + " (cópia)");
  it.auto = 0;
  try { localStorage.setItem(it.dados, dados); }
  catch (e){
    estante.itens = estante.itens.filter(function(x){ return x.id !== it.id; });
    estante.atual = de.id;
    salvaEstante(); renderMoldes();
    return avisaArquivo("Não coube na memória do navegador. Apague um molde antigo e tente de novo.");
  }
  var semFoto = false;
  if (foto){ try { localStorage.setItem(it.foto, foto); } catch (e2){ semFoto = true; } }
  if (imgs){ try { localStorage.setItem(IMG_STORE + "/" + it.id, imgs); } catch (e3){} }
  salvaEstante();
  abreItem(it);
  avisaArquivo(semFoto ? "Cópia feita, mas sem a foto: ela não coube na memória do navegador."
                       : "Cópia feita: “" + it.nome + "”. É ela que está aberta agora.");
}

function moldeEmBranco(){
  els = [];
  guias.on = false; guias.v = []; guias.h = [];
  syncPhotoSize();
  lastPaper = paperMM();
  var pa = paperMM();
  photo.x = (pa.w - photo.w) / 2;
  photo.y = pa.h * 0.14;
  photoImg = null; photoURL = null;
  // molde novo nasce vazio: a palavra de exemplo que vinha antes ("champ")
  // era a primeira coisa a apagar em todo molde
  sel = 0; marca = []; marcaFoto = false; foco = "none";
}

function apagaMolde(id){
  var it = null;
  estante.itens.forEach(function(x){ if (x.id === id) it = x; });
  if (!it) return;
  if (!confirm("Apagar o molde “" + (it.nome || "sem nome") + "”? Isso não se desfaz.")) return;
  try { localStorage.removeItem(it.dados); } catch (e){}
  try { localStorage.removeItem(it.foto); } catch (e){}
  try { localStorage.removeItem(IMG_STORE + "/" + it.id); } catch (e){}
  var era = estante.atual === id;
  estante.itens = estante.itens.filter(function(x){ return x.id !== id; });
  if (era){
    // apagou o que estava aberto: abre o mais recente, ou uma folha limpa
    if (estante.itens.length){
      estante.atual = estante.itens[0].id;
      salvaEstante();
      abreItem(itemAtual());
      return;
    }
    estante.atual = "";
    criaMolde("");
    moldeEmBranco();
    renderChips(); syncControls(); draw(); resetHist();
  }
  salvaEstante();
  renderMoldes();
}

function avisaArquivo(msg){
  var p = $("moldeAviso");
  if (p) p.textContent = msg || "";
}

/* ---- o molde como arquivo -------------------------------------------

   O navegador guarda, mas não carrega: o trabalho não vai para outro
   aparelho e some com os dados do site. O arquivo leva o molde inteiro, foto
   junto, porque molde sem a foto perde o guia de onde cada peça fica. */
function exportaMolde(){
  saveState();
  var it = itemAtual();
  if (!it) return;
  var dados = null, foto = null, imgs = null;
  try { dados = localStorage.getItem(it.dados); } catch (e){}
  try { foto = localStorage.getItem(it.foto); } catch (e){}
  // as imagens das peças vão junto pelo mesmo motivo da foto: molde sem elas
  // abre desenhado, mas a largura e a sensibilidade ficam travadas no outro
  // aparelho, e ninguém entenderia por quê
  try { imgs = JSON.parse(localStorage.getItem(IMG_STORE + "/" + it.id)); } catch (e){}
  if (!dados) return avisaArquivo("Não há nada gravado para salvar.");
  var corpo;
  try {
    corpo = JSON.stringify({ app: "ponto-e-letra", v: 1, nome: it.nome || "sem nome",
                             em: new Date().toISOString(), molde: JSON.parse(dados),
                             foto: foto || null, imagens: imgs || null });
  } catch (e){ return avisaArquivo("Não consegui montar o arquivo."); }
  deliver(new Blob([corpo], { type: "application/json" }), saveName("json"), null);
  avisaArquivo("Arquivo salvo com a foto e as imagens das peças junto.");
}

function importaMolde(arquivo){
  var fr = new FileReader();
  fr.onerror = function(){ avisaArquivo("Não consegui ler esse arquivo."); };
  fr.onload = function(){
    var a = null;
    try { a = JSON.parse(String(fr.result)); } catch (e){}
    if (!a || a.app !== "ponto-e-letra" || !a.molde || !a.molde.els || !a.molde.els.length)
      return avisaArquivo("Esse arquivo não é um molde do ponto & letra.");
    saveState();                     // o que está aberto continua guardado
    /* O mesmo arquivo aberto duas vezes criava dois moldes iguais. Agora,
       se algum molde da estante tem exatamente o mesmo desenho, ele é que
       abre — quem quiser mesmo uma cópia tem o botão duplicar. */
    var igual = null, corpo = JSON.stringify(a.molde);
    estante.itens.forEach(function(x){
      if (igual) return;
      try { if (localStorage.getItem(x.dados) === corpo) igual = x; } catch (e0){}
    });
    if (igual){
      if (igual.id !== estante.atual){ estante.atual = igual.id; sobeNaEstante(igual); salvaEstante(); abreItem(igual); }
      return avisaArquivo("Esse molde já estava na estante, como “" + (igual.nome || "sem nome") +
                          "”: abri ele em vez de criar outro igual. Para ter uma cópia, use duplicar.");
    }
    var it = criaMolde(a.nome || "molde aberto de arquivo");
    try { localStorage.setItem(it.dados, JSON.stringify(a.molde)); }
    catch (e){
      estante.itens = estante.itens.filter(function(x){ return x.id !== it.id; });
      estante.atual = estante.itens.length ? estante.itens[0].id : "";
      salvaEstante();
      return avisaArquivo("Não coube na memória do navegador. Apague um molde antigo e tente de novo.");
    }
    // a foto é o item que estoura a cota; sem ela o molde ainda vale
    if (typeof a.foto === "string" && a.foto.indexOf("data:image") === 0){
      try { localStorage.setItem(it.foto, a.foto); } catch (e2){}
    }
    if (a.imagens && typeof a.imagens === "object"){
      try { localStorage.setItem(IMG_STORE + "/" + it.id, JSON.stringify(a.imagens)); }
      catch (e3){}
    }
    salvaEstante();
    abreItem(it);
    avisaArquivo("Molde aberto: “" + (it.nome || "sem nome") + "”.");
  };
  fr.readAsText(arquivo);
}

$("moldeNovo").addEventListener("click", function(){
  saveState();
  criaMolde("");
  moldeEmBranco();
  renderChips(); syncControls(); renderMoldes(); draw(); mostraZoom(); resetHist();
  avisaArquivo("");
});

/* O nome muda na lista a cada tecla, mas só é gravado quando a digitação
   para por meio segundo (ou o campo perde o foco): antes era uma escrita
   no navegador por tecla. */
var nomeTimer = 0;
function gravaNome(){ clearTimeout(nomeTimer); nomeTimer = 0; salvaEstante(); }
$("moldeNome").addEventListener("blur", function(){ if (nomeTimer) gravaNome(); });
$("moldeNome").addEventListener("input", function(){
  var it = itemAtual();
  if (!it) return;
  it.nome = this.value.trim();
  it.auto = it.nome ? 0 : 1;   // campo vazio devolve o nome para o app
  clearTimeout(nomeTimer);
  nomeTimer = setTimeout(gravaNome, 500);
  var alvo = $("moldeLista").querySelector(".mold.on .nm");
  if (alvo) alvo.textContent = it.nome || "sem nome";
});

$("moldeSalvar").addEventListener("click", exportaMolde);
$("moldeDup").addEventListener("click", duplicaMolde);
$("moldeAbrir").addEventListener("click", function(){ $("moldeArq").click(); });
$("moldeArq").addEventListener("change", function(e){
  var f = e.target.files && e.target.files[0];
  if (f) importaMolde(f);
  e.target.value = "";     // o mesmo arquivo pode ser aberto de novo
});

/* ---- etapas, menu e painéis -----------------------------------------
   Quatro etapas na barra de cima, na ordem em que se trabalha: papel e
   foto, peças, linhas e imprimir. O que não é passo do molde — a lista de
   moldes, a caixa de linhas, a ajuda — abre pelo menu do logo, no mesmo
   painel, com um "voltar" para a etapa em que se estava.

   Os nomes antigos continuam valendo (foto, molde, moldes), para quem chama
   abreAba de fora — e são os mesmos que o README e os testes usam. */
var ETAPAS = ["papel", "pecas", "linha", "imprimir"];
var APELIDO = { foto: "papel", molde: "imprimir" };
var etapaAtual = "pecas";

function abreAba(nome, ancora){
  nome = APELIDO[nome] || nome;
  var app = document.querySelector(".app");
  var etapa = ETAPAS.indexOf(nome) >= 0;
  if (etapa) etapaAtual = nome;
  [].forEach.call(document.querySelectorAll(".rail button"), function(x){
    x.classList.toggle("on", x.dataset.pane === nome);
    if (x.dataset.pane === nome) x.setAttribute("aria-current", "step"); else x.removeAttribute("aria-current");
  });
  [].forEach.call(document.querySelectorAll(".pane"), function(pane){
    pane.classList.toggle("on", pane.dataset.pane === nome);
  });
  // o catálogo de cores é um só: na caixa ele marca o que você tem, nas
  // linhas ele pinta a peça
  var caixa = nome === "caixa";
  var casa = $(caixa ? "caixaCat" : "linhaCat");
  if ($("catalogo").parentNode !== casa) casa.appendChild($("catalogo"));
  if ((linhaModo === "caixa") !== caixa) mudaModoLinha(caixa ? "caixa" : "peca");
  if (nome === "imprimir") renderChecagem();
  app.classList.remove("fechado");
  app.classList.add("painelAberto");   // no celular, a gaveta passa a mostrar a etapa
  fechaMenu();
  if (ancora && $(ancora)) $(ancora).scrollIntoView({ block: "start" });
  else document.querySelector(".panel").scrollTop = 0;
  draw();   /* a gaveta do celular muda a altura da mesa */
}

[].forEach.call(document.querySelectorAll(".rail button"), function(b){
  b.addEventListener("click", function(){
    var app = document.querySelector(".app");
    // no celular, tocar de novo na etapa aberta fecha a gaveta
    var vendo = !app.classList.contains("comSel") || app.classList.contains("painelAberto");
    if (celular && celular.matches && b.classList.contains("on") && vendo){
      app.classList.toggle("fechado");
      draw();
      return;
    }
    abreAba(b.dataset.pane);
  });
});
[].forEach.call(document.querySelectorAll("[data-vai]"), function(b){
  b.addEventListener("click", function(){ abreAba(b.dataset.vai); });
});

// os painéis do menu ganham um "voltar" para a etapa em que se estava
[].forEach.call(document.querySelectorAll(".menuPane"), function(pane){
  var v = document.createElement("button");
  v.type = "button"; v.className = "voltar";
  v.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>voltar ao molde';
  v.addEventListener("click", function(){ abreAba(etapaAtual); });
  pane.insertBefore(v, pane.firstChild);
});

/* As explicações ficam atrás de um "?" no título de cada painel: o que é
   texto corrido (nota sem id, fora dos "como funciona") some, e o "?" mostra
   tudo de uma vez. As notas com id são avisos que o app escreve na hora —
   essas ficam sempre à vista. */
[].forEach.call(document.querySelectorAll(".pane"), function(pane){
  var notas = [].filter.call(pane.querySelectorAll("p.note"), function(p){
    return !p.id && !p.closest("details");
  });
  if (!notas.length) return;
  notas.forEach(function(p){ p.classList.add("expl"); });
  var h = pane.querySelector("h2");
  if (!h) return;
  var q = document.createElement("button");
  q.type = "button"; q.className = "qq"; q.textContent = "?";
  q.setAttribute("aria-expanded", "false");
  q.setAttribute("aria-label", "explicações de " + h.textContent);
  q.addEventListener("click", function(){
    var on = pane.classList.toggle("explica");
    q.setAttribute("aria-expanded", on ? "true" : "false");
  });
  h.appendChild(q);
});

/* No painel da direita, o campo que tem explicação ganha um "?" ao lado do
   nome: o texto que antes só aparecia passando o mouse (e nunca no celular)
   abre embaixo do campo. */
[].forEach.call(document.querySelectorAll(".sel .t[title]"), function(t){
  var nome = t.querySelector("span");
  if (!nome) return;
  var q = document.createElement("button");
  q.type = "button"; q.className = "q"; q.textContent = "?";
  q.setAttribute("aria-expanded", "false");
  q.setAttribute("aria-label", "o que é " + nome.textContent);
  q.addEventListener("click", function(){
    var aberta = t.nextElementSibling && t.nextElementSibling.classList.contains("dica");
    if (aberta) t.parentNode.removeChild(t.nextElementSibling);
    else {
      var d = document.createElement("p");
      d.className = "dica"; d.textContent = t.title;
      t.parentNode.insertBefore(d, t.nextSibling);
    }
    q.setAttribute("aria-expanded", aberta ? "false" : "true");
  });
  nome.appendChild(q);
});

/* ---- o menu do logo ---- */
function abreMenu(){
  renderMenu();
  $("menu").classList.remove("hide");
  $("menuBtn").setAttribute("aria-expanded", "true");
}
function fechaMenu(){
  $("menu").classList.add("hide");
  $("menuBtn").setAttribute("aria-expanded", "false");
}
$("menuBtn").addEventListener("click", function(e){
  e.stopPropagation();
  if ($("menu").classList.contains("hide")) abreMenu(); else fechaMenu();
});
document.addEventListener("click", function(e){
  if (!$("menu").classList.contains("hide") && !$("menu").contains(e.target)) fechaMenu();
});
document.addEventListener("keydown", function(e){
  if (e.key === "Escape" && !$("menu").classList.contains("hide")){ fechaMenu(); $("menuBtn").focus(); }
});

// os três moldes do alto da estante, para trocar sem abrir a lista
function renderMenu(){
  var box = $("menuMoldes");
  box.innerHTML = "";
  estante.itens.slice(0, 3).forEach(function(it){
    var b = document.createElement("button");
    b.type = "button"; b.className = "mm" + (it.id === estante.atual ? " on" : "");
    b.setAttribute("role", "menuitem");
    var nm = document.createElement("span");
    nm.textContent = it.nome || "sem nome";
    var qd = document.createElement("small");
    qd.textContent = (it.pecas || 0) + ((it.pecas === 1) ? " peça" : " peças") + " · " + (it.id === estante.atual ? "aberto agora" : quando(it.em));
    nm.appendChild(qd);
    b.appendChild(nm);
    b.addEventListener("click", function(){ fechaMenu(); abreMolde(it.id); });
    box.appendChild(b);
  });
  var n = minhas.length, compra = acabadas().length + minhas.filter(function(k){ return estoque[k] === "pouco"; }).length;
  $("menuCaixa").textContent = (n ? n + (n === 1 ? " linha" : " linhas") : "nenhuma linha marcada") +
    (compra ? " · " + compra + " para comprar" : "");
}
[].forEach.call(document.querySelectorAll("#menu [data-pane]"), function(b){
  b.addEventListener("click", function(){ abreAba(b.dataset.pane, b.dataset.ancora); });
});
var instalar = null;
window.addEventListener("beforeinstallprompt", function(e){
  e.preventDefault(); instalar = e;
  $("menuInstalar").classList.remove("hide");
});
[].forEach.call(document.querySelectorAll("#menu [data-faz]"), function(b){
  b.addEventListener("click", function(){
    var f = b.dataset.faz;
    fechaMenu();
    if (f === "calibrar") abreCalib();
    else if (f === "instalar"){ if (instalar){ instalar.prompt(); instalar = null; $("menuInstalar").classList.add("hide"); } }
    else { $(f).click(); if (f === "moldeNovo" || f === "moldeDup") abreAba(etapaAtual); }
  });
});

/* ---- antes de baixar: o que conferir ----
   A lista da etapa imprimir junta os avisos que antes ficavam espalhados —
   o rodapé de cabe/não cabe, os furos colados, as linhas que você não tem —
   e cada um que precisa de gesto leva à etapa em que ele se resolve. */
function renderChecagem(){
  var box = $("checa");
  if (!box || !document.querySelector('.pane[data-pane="imprimir"]').classList.contains("on")) return;
  var itens = [];
  var fit = $("fitHint"), txt = ($("fitTxt").textContent || "").trim();
  if (!els.length) itens.push({ c: "meio", t: "O molde ainda não tem peça nenhuma.", vai: "pecas", l: "pôr uma peça" });
  if (txt) itens.push({ c: fit.classList.contains("over") ? "mal" : (fit.classList.contains("tight") ? "meio" : ""),
                        t: txt.charAt(0).toUpperCase() + txt.slice(1) + ".",
                        vai: fit.classList.contains("over") ? "pecas" : "", l: "ver na mesa" });
  var falta = linhasUsadas().filter(function(l){
    return !minhas.concat(acabadas()).some(function(k){ return nomeLinha(k) === l.nome && estadoLinha(k) !== "acabou"; });
  });
  if (els.length && minhas.length){
    if (falta.length) itens.push({ c: "meio", t: (falta.length === 1 ? "1 linha do molde não está" : falta.length + " linhas do molde não estão") +
                                   " na sua caixa: " + falta.slice(0, 3).map(function(l){ return l.nome; }).join(", ") + (falta.length > 3 ? "…" : "") + ".",
                                   vai: "linha", l: "ver as linhas" });
    else itens.push({ c: "", t: "Todas as linhas do molde estão na sua caixa." });
  }
  box.innerHTML = "";
  itens.forEach(function(it){
    var d = document.createElement("div");
    d.className = it.c;
    var b = document.createElement("b");
    b.textContent = it.c === "mal" || it.c === "meio" ? "!" : "✓";
    var s = document.createElement("span");
    s.textContent = it.t + " ";
    if (it.vai){
      var a = document.createElement("a");
      a.textContent = it.l; a.tabIndex = 0;
      a.addEventListener("click", function(){ abreAba(it.vai); });
      s.appendChild(a);
    }
    d.appendChild(b); d.appendChild(s);
    box.appendChild(d);
  });
}
$("pdf2").addEventListener("click", function(){ $("pdf").click(); });

window.addEventListener("resize", draw);

/* A altura mudou de significado, e molde gravado antes disso traz o número
   velho. As células estão gravadas como estão, então a peça volta do tamanho
   em que foi desenhada — mas o número na barra passaria a dizer outra coisa, e
   o primeiro toque na altura daria um pulo de tamanho sem explicação. Então
   ele é convertido uma vez, na volta, pela razão entre a caixa de tinta
   daquela palavra e a altura da maiúscula da fonte: o número muda, o tamanho
   não. A conversão espera a fonte chegar — medir na fonte genérica do sistema
   daria um número errado para sempre. */
function migraAltura(){
  var pend = [], fams = {};
  els.forEach(function(el){
    if (el.kind !== "text" || el.hv >= 2) return;
    pend.push(el);
    fams[el.font] = 1;
  });
  if (!pend.length) return;
  var converte = function(){
    pend.forEach(function(el){
      if (el.hv >= 2) return;   // a barra já mexeu nela: o número novo é dela
      var m = medeTexto(el.text, el.font);
      if (m) el.rowsTarget = Math.max(8, Math.min(60, Math.round(el.rowsTarget * m.ref / m.h)));
      el.hv = 2;
    });
    syncControls();
    scheduleSave();
  };
  if (!(document.fonts && document.fonts.load)){ converte(); return; }
  var cargas = Object.keys(fams).map(function(f){ return document.fonts.load(fontStr(100, f)); });
  Promise.all(cargas).then(converte)["catch"](converte);
}

/* No celular as etapas descem para o pé da tela, como abas; no computador
   ficam no meio da barra de cima. */
var celular = window.matchMedia ? window.matchMedia("(max-width:860px)") : null;
function arrumaBarra(){
  var rail = $("rail"), app = document.querySelector(".app"), right = document.querySelector(".right");
  if (celular && celular.matches){
    if (rail.parentNode !== app) app.appendChild(rail);
  } else if (rail.parentNode !== right.parentNode){
    right.parentNode.insertBefore(rail, right);
  }
}
if (celular){
  if (celular.addEventListener) celular.addEventListener("change", function(){ arrumaBarra(); draw(); });
  else if (celular.addListener) celular.addListener(function(){ arrumaBarra(); draw(); });
}

function boot(){
  arrumaBarra();
  ["paperW","paperH","photoWmm","photoHmm"].forEach(propriaIni);
  carregaLinhas();          // antes de restaurar: a caixa é a primeira marca
  carregaEstante();         // e antes do molde: é ela que diz qual abrir
  var it = itemAtual();
  restored = !!it && restoreState(it.dados);
  if (!restored) moldeEmBranco();
  /* A linha de fábrica era uma cor de tela (#B3B347) que não existe em
     cartela nenhuma: a primeira palavra nascia com uma meada que não se
     compra. Sem molde gravado, ela vira a meada mais próxima da primeira
     marca do catálogo. */
  if (!threadLabel(thread) && CAT.length){
    var casada = casaPaleta([labHex(thread)], [1], CAT[0].id)[0];
    if (casada) thread = casada.hex;
  }
  papelPainel(); fotoPainel();
  renderMoldes();
  histRender();
  montaMarcas();
  montaFonteLinhas();
  montaLote();
  mudaModoLinha("peca");   // também monta a grade
  contaLinhas();
  renderChips();
  syncControls();
  migraAltura();
  restorePhoto();
  restoreOrigens();
  mostraFonte();
  draw();
  mostraZoom();
  guiasSync();
  resetHist();
}
if (document.fonts && document.fonts.ready){ document.fonts.ready.then(boot); } else boot();

// redesenho cego para quando as fontes da web chegam depois do primeiro traçado.
// numa sessão restaurada ele fica de fora: as células guardadas já são o
// resultado final, e recalcular apagaria os ajustes feitos ponto a ponto.
// Se a fonte não tiver carregado na sessão anterior, o botão Recalcular refaz.
setTimeout(function(){
  if (!restored && els.length){
    els.forEach(function(el){ rebuild(el); });
    draw(); resetHist();
  }
}, 1400);

/* Instalar o app (app-sw.js): só existe servido por http(s) — aberto do
   disco, como nos testes, o navegador não aceita service worker, e o app
   funciona igual sem ele. */
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
  navigator.serviceWorker.register("app-sw.js").catch(function(){});
}
