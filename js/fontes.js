/* ponto & letra — fontes.js
   A lista de fontes com amostra.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

/* ---- escolher a fonte vendo o traço ----------------------------------
   O <select id="font"> continua sendo a fonte da verdade — escondido, mas é
   ele que o resto do código lê e escreve. Esta lista só o preenche e dispara
   o mesmo evento "input", então nada mais precisou mudar.

   As fontes entram sob demanda: cada cartão só pede a sua quando chega à
   vista. Isso mantém a promessa do projeto de o navegador não baixar as 40
   famílias de uma vez — e a amostra em quadradinhos só é honesta depois que
   a fonte chegou, porque ela é amostrada do traço. */
var selFonte = $("font");
var FAMILIAS = [];
[].forEach.call(selFonte.querySelectorAll("optgroup"), function(g){
  [].forEach.call(g.querySelectorAll("option"), function(o){
    FAMILIAS.push({ valor: o.value, rotulo: o.textContent.trim(), grupo: g.label });
  });
});
var GRUPOS = FAMILIAS.reduce(function(a, f){
  if (a.indexOf(f.grupo) < 0) a.push(f.grupo);
  return a;
}, []);

var popAberto = false, grupoAtivo = "", cacheAmostra = {};

function palavraAmostra(){
  var el = els[sel];
  var t = el && el.kind === "text" ? (el.text || "").trim() : "";
  return (t || "amor").slice(0, 9);
}

// a mesma grade do molde, em miniatura: é o que a peça vira de verdade.
// O cache guarda as células, não o canvas: clonar um canvas copia o elemento
// e deixa o desenho para trás, porque o bitmap não faz parte do DOM.
function amostraFuros(fam, palavra){
  var el = els[sel];
  var esp = el && el.kind === "text" ? el.thick : 2;
  var sens = el && el.kind === "text" ? el.thr : 0.35;
  var chave = fam + "|" + palavra + "|" + esp + "|" + sens;
  var cells = cacheAmostra[chave];
  if (!cells){
    try { cells = textMatrix(palavra, fam, 7, esp, sens); } catch (e){ cells = [[0]]; }
    cacheAmostra[chave] = cells;
  }
  var lin = cells.length, col = cells[0] ? cells[0].length : 1, px = 3;
  var c = document.createElement("canvas");
  c.width = Math.max(1, col * px); c.height = Math.max(1, lin * px);
  var x = c.getContext("2d");
  x.fillStyle = "#384959";
  for (var r = 0; r < lin; r++)
    for (var q = 0; q < col; q++)
      if (cells[r][q]) x.fillRect(q * px, r * px, px - 0.4, px - 0.4);
  return c;
}

var observador = window.IntersectionObserver ? new IntersectionObserver(function(itens){
  itens.forEach(function(it){
    if (!it.isIntersecting) return;
    observador.unobserve(it.target);
    encheCartao(it.target);
  });
}, { root: null, rootMargin: "120px" }) : null;

function encheCartao(b){
  var fam = b.dataset.fam, palavra = palavraAmostra();
  var amostra = b.querySelector(".amostra");
  amostra.style.fontFamily = '"' + fam + '", cursive';
  var por = function(){
    var velho = b.querySelector("canvas");
    var novo = amostraFuros(fam, palavra);
    if (velho) b.replaceChild(novo, velho); else b.insertBefore(novo, b.lastChild);
  };
  if (document.fonts && document.fonts.load){
    document.fonts.load(fontStr(100, fam)).then(por).catch(por);
  } else por();
}

function mostraFonte(){
  var v = selFonte.value;
  var f = FAMILIAS.filter(function(x){ return x.valor === v; })[0];
  var b = $("fontBtn");
  b.textContent = f ? f.rotulo : v;
  b.style.fontFamily = '"' + v + '", cursive';
}

function listaFontes(){
  var q = ($("fontBusca").value || "").trim().toLowerCase();
  var caixa = $("fontLista");
  caixa.innerHTML = "";
  var vistas = FAMILIAS.filter(function(f){
    if (grupoAtivo && f.grupo !== grupoAtivo) return false;
    return !q || f.rotulo.toLowerCase().indexOf(q) >= 0;
  });
  if (!vistas.length){
    caixa.innerHTML = '<p class="vazio">Nenhuma fonte com esse nome.</p>';
    return;
  }
  vistas.forEach(function(f){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "fcard" + (f.valor === selFonte.value ? " on" : "");
    b.dataset.fam = f.valor;
    b.innerHTML = '<span class="amostra"></span><span class="nome"></span>';
    b.querySelector(".amostra").textContent = palavraAmostra();
    b.querySelector(".nome").textContent = f.rotulo;
    b.addEventListener("click", function(){
      selFonte.value = f.valor;
      selFonte.dispatchEvent(new Event("input", { bubbles: true }));
      mostraFonte();
      fechaPop();
    });
    caixa.appendChild(b);
    if (observador) observador.observe(b); else encheCartao(b);
  });
}

function abrePop(){
  var r = $("fontBtn").getBoundingClientRect();
  var pop = $("fontPop");
  pop.classList.remove("hide");
  popAberto = true;
  if (window.innerWidth > 860){          // no celular o CSS a prende embaixo
    var larg = pop.offsetWidth;
    pop.style.left = Math.max(8, Math.min(r.left - 10, window.innerWidth - larg - 8)) + "px";
    pop.style.top = (r.bottom + 8) + "px";
  }
  grupoAtivo = "";
  $("fontBusca").value = "";
  montaGrupos();
  listaFontes();
  var atual = $("fontLista").querySelector(".fcard.on");
  if (atual) atual.scrollIntoView({ block: "center" });
  $("fontBusca").focus();
}

function fechaPop(){ $("fontPop").classList.add("hide"); popAberto = false; }

function montaGrupos(){
  var caixa = $("fontGrupos");
  caixa.innerHTML = "";
  ["todas"].concat(GRUPOS).forEach(function(nome){
    var alvo = nome === "todas" ? "" : nome;
    var b = document.createElement("button");
    b.type = "button";
    b.className = alvo === grupoAtivo ? "on" : "";
    b.textContent = nome.toLowerCase();
    b.addEventListener("click", function(){
      grupoAtivo = alvo;
      montaGrupos(); listaFontes();
    });
    caixa.appendChild(b);
  });
}

$("fontBtn").addEventListener("click", function(e){
  e.stopPropagation();
  if (popAberto) fechaPop(); else abrePop();
});
$("fontBusca").addEventListener("input", listaFontes);
$("fontPop").addEventListener("click", function(e){ e.stopPropagation(); });
document.addEventListener("click", function(){ if (popAberto) fechaPop(); });
document.addEventListener("keydown", function(e){
  if (e.key === "Escape" && popAberto) fechaPop();
});
window.addEventListener("resize", function(){ if (popAberto) fechaPop(); });
