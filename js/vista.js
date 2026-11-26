/* ponto & letra — vista.js
   Zoom, mover a vista e as guias.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

/* ---- zoom e mover a vista -------------------------------------------
   O papel cresce dentro da mesa, que rola. Assim nem o desenho nem o acerto
   de toque mudam de conta: evPos continua lendo a posição pelo retângulo do
   canvas, que já considera o rolamento. */
var ZMIN = 0.25, ZMAX = 8;
var stage = $("stage");

/* Tamanho real na tela. A tela não sabe quantos pixels tem um milímetro —
   isso muda de aparelho para aparelho, e o navegador não conta. Então se
   pergunta uma vez, com um cartão de banco encostado na tela: 85,6 mm é a
   largura de todo cartão desse tipo. A resposta fica neste aparelho, à parte
   do molde (o mesmo molde aberto no celular pede outro número). Com ela, o
   1:1 põe o zoom em que um milímetro do papel tem um milímetro na tela. */
var TELA = "ponto-e-letra/tela/v1", CARTAO_MM = 85.6;
var pxPorMm = 0;
try { pxPorMm = +(JSON.parse(localStorage.getItem(TELA) || "{}").pxmm) || 0; } catch (e){}

function tamanhoReal(){
  if (!(pxPorMm > 0) || !(fitK > 0)) return false;
  setZoom(pxPorMm / fitK);
  return true;
}
function abreCalib(){
  var larg = pxPorMm > 0 ? Math.round(pxPorMm * CARTAO_MM) : 323;
  $("calibLarg").value = larg;
  $("calibCartao").style.width = larg + "px";
  $("calib").classList.remove("hide");
}
$("calibLarg").addEventListener("input", function(){ $("calibCartao").style.width = this.value + "px"; });
$("calibNo").addEventListener("click", function(){ $("calib").classList.add("hide"); });
$("calibSim").addEventListener("click", function(){
  pxPorMm = parseFloat($("calibLarg").value) / CARTAO_MM;
  try { localStorage.setItem(TELA, JSON.stringify({ pxmm: pxPorMm })); } catch (e){}
  $("calib").classList.add("hide");
  tamanhoReal();
});
// um toque vai para o tamanho real; com o zoom já nele, toque longo (ou Shift)
// recalibra — a primeira vez sempre calibra
$("z11").addEventListener("click", function(e){
  if (e.shiftKey || !tamanhoReal()) abreCalib();
});
$("z11").addEventListener("contextmenu", function(e){ e.preventDefault(); abreCalib(); });

function mostraZoom(){
  $("zVal").textContent = Math.round(zoom * 100) + "%";
  var real = pxPorMm > 0 && fitK > 0 && Math.abs(zoom * fitK - pxPorMm) < 0.01;
  $("z11").classList.toggle("on", real);
  $("zOut").disabled = zoom <= ZMIN + 1e-6;
  $("zIn").disabled = zoom >= ZMAX - 1e-6;
}

/* muda o zoom mantendo parado o ponto do papel que está sob o cursor */
function setZoom(z, cx, cy){
  z = Math.max(ZMIN, Math.min(ZMAX, z));
  if (Math.abs(z - zoom) < 1e-6) return;
  var r = stage.getBoundingClientRect();
  if (cx == null){ cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
  var antes = cv.getBoundingClientRect();
  var fx = antes.width ? (cx - antes.left) / antes.width : 0.5;
  var fy = antes.height ? (cy - antes.top) / antes.height : 0.5;
  zoom = z;
  draw();
  var dep = cv.getBoundingClientRect();
  stage.scrollLeft += (dep.left + fx * dep.width) - cx;
  stage.scrollTop  += (dep.top  + fy * dep.height) - cy;
  rulers(cv._k || 1);
  mostraZoom();
}

$("zIn").addEventListener("click", function(){ setZoom(zoom * 1.25); });
$("zOut").addEventListener("click", function(){ setZoom(zoom / 1.25); });
$("zVal").addEventListener("click", function(){ setZoom(1); });
/* A dica do rodapé tem três donos — a mãozinha, as guias e o arraste comum —
   e sai de um lugar só para nenhum deles apagar o aviso do outro. */
function mostraDica(){
  $("modeHint").textContent = mao
    ? "Arraste para mover a vista. Toque de novo na mãozinha para voltar a posicionar as peças."
    : guias.on
      ? "Puxe da régua para soltar outra guia e leve a guia de volta para a régua para tirá-la. Arrastando, a peça encosta na guia."
      : "Arraste a palavra ou a foto para posicionar. Dois dedos sobre a peça selecionada aumentam ou diminuem a letra.";
}

$("zPan").addEventListener("click", function(){
  mao = !mao;
  this.classList.toggle("on", mao);
  stage.classList.toggle("mao", mao);
  mostraDica();
});

stage.addEventListener("scroll", function(){ rulers(cv._k || 1); });

stage.addEventListener("wheel", function(e){
  if (!(e.ctrlKey || e.metaKey)) return;   // rolar sem tecla continua deslocando
  e.preventDefault();
  setZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
}, { passive: false });

/* ---- guias pontilhadas ----------------------------------------------

   Os botões de alinhar resolvem o centro e a seta resolve o meio milímetro.
   O que faltava era o meio do caminho: uma linha de referência escolhida por
   você — "as duas palavras começam aqui", "o coração fica nesta altura" —
   para arrastar no olho e ainda assim parar no lugar certo.

   A guia nasce puxada da régua para dentro da mesa e volta para a régua para
   ser tirada, que é como se tira uma régua de verdade de cima do papel. Ela
   é risco de tela: não entra no molde nem no PDF, porque nunca esteve no
   papel — o desenho do PDF sai do canvas, e a guia é um elemento por cima
   dele. */

var puxa = null;        /* a guia na mão: {eixo, i} */

function guiasRender(ox, oy, k){
  var box = $("guias");
  if (!box) return;
  if (!guias.on){ if (box.firstChild) box.innerHTML = ""; return; }
  var h = "";
  guias.v.forEach(function(mm, i){
    h += '<span class="g v" data-eixo="v" data-i="' + i + '" style="left:' +
         (ox + mm * k).toFixed(1) + 'px"><i>' + fmt(mm / 10) + '</i></span>';
  });
  guias.h.forEach(function(mm, i){
    h += '<span class="g h" data-eixo="h" data-i="' + i + '" style="top:' +
         (oy + mm * k).toFixed(1) + 'px"><i>' + fmt(mm / 10) + '</i></span>';
  });
  box.innerHTML = h;
  if (puxa){
    var g = box.querySelector('.g.' + puxa.eixo + '[data-i="' + puxa.i + '"]');
    if (g) g.classList.add("pega");
  }
}

/* Onde uma guia solta gosta de parar: as bordas e o meio do papel, as bordas
   e o meio da foto. Longe delas, o milímetro inteiro mais próximo — guia em
   73,4 mm é número que ninguém repete com a régua na mão. */
function encaixaGuia(eixo, v){
  var pa = paperMM();
  var notas = eixo === "v"
    ? [0, pa.w / 2, pa.w, photo.x, photo.x + photo.w / 2, photo.x + photo.w]
    : [0, pa.h / 2, pa.h, photo.y, photo.y + photo.h / 2, photo.y + photo.h];
  if (photo.off) notas = notas.slice(0, 3);
  var dist = FOLGA_PX / (cv._k || 1), achou = null;
  for (var i = 0; i < notas.length; i++){
    var d = Math.abs(notas[i] - v);
    if (d < dist){ dist = d; achou = notas[i]; }
  }
  return achou === null ? Math.round(v) : Math.round(achou * 10) / 10;
}

// guia fora do papel não mede nada, pela mesma razão que a régua da mesa pára
// na borda da folha: o zero dela é o papel, não a mesa
function guiasApara(){
  var pa = paperMM();
  guias.v = guias.v.filter(function(v){ return v >= 0 && v <= pa.w; });
  guias.h = guias.h.filter(function(v){ return v >= 0 && v <= pa.h; });
}

function moveGuia(e){
  if (!puxa) return;
  e.preventDefault();
  var pt = evPos(e);
  guias[puxa.eixo][puxa.i] = encaixaGuia(puxa.eixo, puxa.eixo === "v" ? pt.x : pt.y);
  rulers(cv._k || 1);
}

function soltaGuia(){
  if (!puxa) return;
  var pa = paperMM(), lim = puxa.eixo === "v" ? pa.w : pa.h;
  var v = guias[puxa.eixo][puxa.i];
  if (!(v >= 0 && v <= lim)) guias[puxa.eixo].splice(puxa.i, 1);
  puxa = null;
  rulers(cv._k || 1);
  scheduleSave();
}

// A régua de cima solta a guia que atravessa e a da esquerda solta a que
// desce — é o gesto de empurrar uma régua de verdade para fora da borda.
// O toque seco na régua não deixa guia nenhuma: ela nasce fora do papel e
// soltaGuia() a descarta.
[["rulerH", "h"], ["rulerV", "v"]].forEach(function(par){
  var r = $(par[0]), eixo = par[1];
  r.addEventListener("pointerdown", function(e){
    if (!guias.on) return;
    e.preventDefault();
    r.setPointerCapture(e.pointerId);
    var pt = evPos(e);
    guias[eixo].push(encaixaGuia(eixo, eixo === "v" ? pt.x : pt.y));
    puxa = { eixo: eixo, i: guias[eixo].length - 1 };
    rulers(cv._k || 1);
  });
  r.addEventListener("pointermove", moveGuia);
  r.addEventListener("pointerup", soltaGuia);
  r.addEventListener("pointercancel", soltaGuia);
});

// A captura fica na camada, e não na guia: cada mexida refaz os riscos, e o
// elemento que recebeu o toque deixa de existir no meio do arraste.
$("guias").addEventListener("pointerdown", function(e){
  var g = e.target;
  while (g && g !== this && !(g.classList && g.classList.contains("g"))) g = g.parentNode;
  if (!g || g === this) return;
  /* A faixa de pegar a guia tem 9 px, e a peça que está embaixo dela era
     impossível de pegar ali. Agora a guia só fica com o toque quando ele cai
     em cima do risco (a 2 px dele) — ou quando não há peça embaixo. Com a
     mãozinha ligada, o toque é sempre da vista. Senão ele passa para a mesa,
     como se a guia não estivesse ali. */
  var r = g.getBoundingClientRect();
  var dRisco = g.dataset.eixo === "v" ? Math.abs(e.clientX - (r.left + r.width / 2))
                                       : Math.abs(e.clientY - (r.top + r.height / 2));
  var embaixo = hitEl(evPos(e)) >= 0;
  if (mao || (embaixo && dRisco > 2)){
    e.preventDefault();
    cv.dispatchEvent(new PointerEvent("pointerdown", e));
    return;
  }
  e.preventDefault();
  this.setPointerCapture(e.pointerId);
  puxa = { eixo: g.dataset.eixo, i: +g.dataset.i };
  g.classList.add("pega");
});
$("guias").addEventListener("pointermove", moveGuia);
$("guias").addEventListener("pointerup", soltaGuia);
$("guias").addEventListener("pointercancel", soltaGuia);

// a opção é do molde, e não do navegador: abrir outro molde acende ou apaga o
// botão junto com as guias dele
function guiasSync(){
  $("zGuias").classList.toggle("on", guias.on);
  $("zGuias").setAttribute("aria-pressed", guias.on ? "true" : "false");
  $("mesa").classList.toggle("guiando", guias.on);
  mostraDica();
  rulers(cv._k || 1);
}

$("zGuias").addEventListener("click", function(){
  guias.on = !guias.on;
  // ligar e nada aparecer pareceria botão quebrado: da primeira vez a opção
  // abre a cruz no meio do papel, que é de onde quase todo arranjo parte
  if (guias.on && !guias.v.length && !guias.h.length){
    var pa = paperMM();
    guias.v = [Math.round(pa.w / 2 * 10) / 10];
    guias.h = [Math.round(pa.h / 2 * 10) / 10];
  }
  guiasSync();
  scheduleSave();
});
