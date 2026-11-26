/* ponto & letra — toque.js
   Arrastar, pinçar, laçar e acender ponto a ponto.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

var drag = null;
var pointers = {};
var pinch = null;
var cv = $("grid");

function nPointers(){ return Object.keys(pointers).length; }

/* a pinça que muda o zoom precisa medir em pixels de tela: a distância em
   milímetros entre dois dedos encolhe conforme o zoom cresce, e realimentaria
   a própria conta */
var cpts = {};
function cspread(){
  var k = Object.keys(cpts);
  if (k.length < 2) return 0;
  var a = cpts[k[0]], b = cpts[k[1]];
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}
function cmid(){
  var k = Object.keys(cpts);
  var a = cpts[k[0]], b = cpts[k[1]];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

var pan = null;

function spread(){
  var k = Object.keys(pointers);
  var a = pointers[k[0]], b = pointers[k[1]];
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

// o número que os dois dedos esticam, um por tipo de peça: a altura da
// maiúscula, a largura da imagem, o tamanho do símbolo
function tamanhoDe(el){
  if (el.kind === "text") return el.rowsTarget;
  if (el.kind === "img") return el.larg;
  if (el.kind === "reto") return el.medida;
  return el.scale;   // símbolo e padrão: o tamanho de cada motivo
}

function resizeSelected(steps){
  var el = els[sel];
  if (!el) return;
  var b = bboxMM(el);
  var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  if (el.kind === "text"){
    var v = Math.max(8, Math.min(60, steps));
    if (v === el.rowsTarget) return;
    el.rowsTarget = v;
    el.hv = 2;
    $("rows").value = v;
    $("rowsOut").textContent = v;
  } else if (el.kind === "img"){
    if (!origemPronta(el)) return;
    var lg = Math.max(IMG_LARG_MIN, Math.min(IMG_LARG_MAX, steps));
    if (lg === el.larg) return;
    el.larg = lg;
    $("imgLarg").value = lg;
    $("imgLargOut").textContent = lg;
  } else if (el.kind === "reto"){
    var dr = DESENHOS_RETO[el.desenho];
    var md = Math.max(dr.min, Math.min(dr.max, Math.round(steps)));
    if (md === el.medida) return;
    el.medida = md;
    $("retoMed").value = md;
  } else if (el.kind === "pat"){
    var zp = Math.max(1, Math.min(4, steps));
    if (zp === el.scale) return;
    el.scale = zp;
    $("patScale").value = zp;
  } else {
    var z = Math.max(1, Math.min(6, steps));
    if (z === el.scale) return;
    el.scale = z;
    $("symScale").value = z;
    $("symScaleOut").textContent = z;
  }
  rebuild(el);
  var nb = bboxMM(el);
  el.x = Math.round((cx - nb.w / 2) * 10) / 10;
  el.y = Math.round((cy - nb.h / 2) * 10) / 10;
  draw();
}

function evPos(e){
  var b = cv.getBoundingClientRect();
  var k = cv._k || 1;
  return { x: (e.clientX - b.left) / k, y: (e.clientY - b.top) / k };
}

/* Ímã das guias. A caixa que se compara é a JÁ GIRADA, pelo mesmo motivo
   dos botões de alinhar: encostar uma palavra inclinada pelo canto de cima
   dela a deixaria torta. Três referências por eixo — os dois lados e o meio
   —, porque tanto faz alinhar duas palavras pela esquerda ou pelo centro,
   e a guia não tem como adivinhar qual das duas você quis. */
/* O ímã. Além das guias ligadas, a peça que anda encosta nas bordas e no
   meio das outras peças, nas bordas e no meio da foto e no meio do papel —
   é onde quase todo alinhamento cai, e antes só havia ímã com guia ligada.
   `quem` é o que está andando (a peça, a lista do laço, ou "foto"), para não
   encostar em si mesmo. Quando encosta em algo que não é guia, a linha em que
   encostou aparece na mesa enquanto se arrasta (`imaVisto`). */
var imaVisto = null;

function imanta(b, quem){
  var g = { x: 0, y: 0 };
  imaVisto = { x: null, y: null };
  var folga = FOLGA_PX / (cv._k || 1);
  var linhas = { x: [], y: [] };
  if (guias.on){
    guias.v.forEach(function(v){ linhas.x.push({ v: v, guia: 1 }); });
    guias.h.forEach(function(v){ linhas.y.push({ v: v, guia: 1 }); });
  }
  var anda = function(o){ return o === quem || (quem && quem.indexOf && quem.indexOf(o) >= 0); };
  var poe = function(c){
    linhas.x.push({ v: c.x }, { v: c.x + c.w / 2 }, { v: c.x + c.w });
    linhas.y.push({ v: c.y }, { v: c.y + c.h / 2 }, { v: c.y + c.h });
  };
  els.forEach(function(o){ if (!anda(o)) poe(elPaperBox(o)); });
  if (!photo.off && quem !== "foto" && !(quem && quem.foto)) poe(photo);
  var pa = paperMM();
  linhas.x.push({ v: pa.w / 2 }); linhas.y.push({ v: pa.h / 2 });
  [["x", "w"], ["y", "h"]].forEach(function(eixo){
    var bordas = [b[eixo[0]], b[eixo[0]] + b[eixo[1]] / 2, b[eixo[0]] + b[eixo[1]]];
    var dist = folga, achou = null;
    for (var i = 0; i < bordas.length; i++)
      linhas[eixo[0]].forEach(function(l){
        var d = l.v - bordas[i];
        if (Math.abs(d) < dist){ dist = Math.abs(d); g[eixo[0]] = d; achou = l; }
      });
    if (achou && !achou.guia) imaVisto[eixo[0]] = achou.v;
  });
  return g;
}

function hitEl(pt){
  for (var i = els.length - 1; i >= 0; i--){
    var l = paperToLocal(els[i], pt.x, pt.y);
    var b = bboxMM(els[i]);
    if (l.x >= -2 && l.y >= -2 && l.x <= b.w + 2 && l.y <= b.h + 2) return i;
  }
  return -1;
}

/* ---- o laço: várias peças, e a foto, de uma vez --------------------
   Arrastar no vazio desenha um retângulo; o que couber inteiro dentro dele
   entra no laço. É "couber inteiro", e não "encostar", por causa da foto:
   ela costuma estar embaixo de tudo, e pelo encostar qualquer laço em volta
   de duas palavras levaria a foto junto sem ninguém pedir. Envolver a foto
   inteira é um jeito de dizer que ela vai — e Shift soma a peça que o
   retângulo não pegou. */
function noLaco(){ return marca.length + (marcaFoto ? 1 : 0) > 1; }
function marcado(i){ return marca.indexOf(i) >= 0; }

function soUm(i){
  marca = i >= 0 && els[i] ? [i] : [];
  marcaFoto = false;
}

function alternaMarca(i){
  var p = marca.indexOf(i);
  if (p >= 0){ marca.splice(p, 1); if (!marca.length && !marcaFoto) foco = "none"; }
  else { marca.push(i); sel = i; foco = "el"; }
}

function lacoRect(){
  return { x: Math.min(laco.x0, laco.x), y: Math.min(laco.y0, laco.y),
           w: Math.abs(laco.x - laco.x0), h: Math.abs(laco.y - laco.y0) };
}

function dentro(b, r){
  return b.x >= r.x && b.y >= r.y && b.x + b.w <= r.x + r.w && b.y + b.h <= r.y + r.h;
}

function fechaLaco(r, soma){
  if (!soma) soUm(-1);
  els.forEach(function(el, i){
    if (dentro(elPaperBox(el), r) && !marcado(i)) marca.push(i);
  });
  if (dentro(photo, r)) marcaFoto = true;
  marca.sort(function(a, b){ return a - b; });
  if (marca.length){ if (!marcado(sel)) sel = marca[0]; foco = "el"; }
  else foco = marcaFoto ? "photo" : "none";
}

/* O bloco anda inteiro, então quem é limitado é o passo, e não cada peça:
   a foto não pode sair do papel, e se ela parasse na borda sozinha o bloco
   se desmancharia no meio do arraste. Peça pode passar da borda — disso
   quem avisa é o "peça fora do papel" na barra de cima. */
function seguraPasso(dx, dy, bx, by){
  if (!marcaFoto) return { x: dx, y: dy };
  var pa = paperMM();
  return { x: Math.max(-bx, Math.min(pa.w - photo.w - bx, dx)),
           y: Math.max(-by, Math.min(pa.h - photo.h - by, dy)) };
}

// a caixa de tudo o que está laçado, com as peças já giradas. O bloco anda
// rígido, então ela é medida uma vez e depois só acompanha o deslocamento
function caixaDoLaco(){
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  marca.forEach(function(i){
    if (!els[i]) return;
    var b = elPaperBox(els[i]);
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
  });
  if (marcaFoto){
    x0 = Math.min(x0, photo.x); y0 = Math.min(y0, photo.y);
    x1 = Math.max(x1, photo.x + photo.w); y1 = Math.max(y1, photo.y + photo.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function pegaLaco(pt){
  var d = { kind:"laco", x: pt.x, y: pt.y, itens: [], foto: null, caixa: caixaDoLaco() };
  marca.forEach(function(i){
    if (els[i]) d.itens.push({ i: i, x: els[i].x, y: els[i].y });
  });
  if (marcaFoto) d.foto = { x: photo.x, y: photo.y };
  return d;
}

// o arraste conta sempre da posição de partida, e não do passo anterior:
// somar passo a passo acumularia o arredondamento de cada evento
function arrastaLaco(pt){
  var f = drag.foto || { x: 0, y: 0 };
  var p = seguraPasso(pt.x - drag.x, pt.y - drag.y, f.x, f.y);
  /* O ímã das guias pega o bloco pela caixa de tudo junto, e não peça por
     peça: cada uma encostando na sua guia desmancharia o arranjo que o laço
     existe para preservar. Depois de encostar, o passo passa pela foto de
     novo — encostar numa guia não é motivo para a foto sair do papel. */
  var c = drag.caixa;
  var noBloco = drag.itens.map(function(it){ return els[it.i]; });
  if (drag.foto) noBloco.foto = true;
  var g = imanta({ x: c.x + p.x, y: c.y + p.y, w: c.w, h: c.h }, noBloco);
  if (g.x || g.y) p = seguraPasso(p.x + g.x, p.y + g.y, f.x, f.y);
  drag.itens.forEach(function(it){
    els[it.i].x = Math.round((it.x + p.x) * 10) / 10;
    els[it.i].y = Math.round((it.y + p.y) * 10) / 10;
  });
  if (drag.foto){
    photo.x = Math.round((drag.foto.x + p.x) * 10) / 10;
    photo.y = Math.round((drag.foto.y + p.y) * 10) / 10;
    clampPhoto();
  }
}

function andaLaco(dx, dy){
  var p = seguraPasso(dx, dy, photo.x, photo.y);
  marca.forEach(function(i){ if (els[i]) moveEl(els[i], p.x, p.y); });
  if (marcaFoto){
    photo.x = Math.round((photo.x + p.x) * 10) / 10;
    photo.y = Math.round((photo.y + p.y) * 10) / 10;
    clampPhoto();
  }
}

/* Apagar o laço tira as peças laçadas de uma vez, e de trás para a frente:
   apagar da primeira para a última mudaria o índice das que ainda faltam. A
   moldura da foto não é peça e fica — ela é o lugar da foto no papel, e não
   uma coisa posta em cima dele. Sem pergunta antes: o desfazer devolve o
   bloco inteiro num passo, como em qualquer outro gesto do app. */
function apagaLaco(){
  if (!marca.length) return;
  var ordem = marca.slice().sort(function(a, b){ return b - a; });
  var menor = ordem[ordem.length - 1];
  ordem.forEach(function(i){ if (els[i]) els.splice(i, 1); });
  sel = Math.max(0, Math.min(menor, els.length - 1));
  soUm(els.length ? sel : -1);
  foco = els.length ? "el" : "none";
  renderChips(); syncControls(); draw(); pushHist();
}

$("delLaco").addEventListener("click", apagaLaco);

/* Duplicar o bloco: cada peça laçada ganha uma cópia, 5 mm para o lado e para
   baixo, com identidade nova; o laço passa para as cópias, que é o que se
   quer mover em seguida. A moldura copiada que estava em volta de uma peça
   do bloco passa a ficar em volta da cópia dessa peça. */
function duplicaLaco(){
  if (!marca.length) return;
  var novos = [], troca = {};
  marca.slice().sort(function(a, b){ return a - b; }).forEach(function(i){
    var c = unpackEl(packEl(els[i]));
    if (!c) return;
    troca[uidDe(els[i])] = c.uid = novoId();
    c.x = dec1(c.x + 5); c.y = dec1(c.y + 5);
    novos.push(c);
  });
  novos.forEach(function(c){ if (c.alvo && troca[c.alvo]) c.alvo = troca[c.alvo]; });
  var ini = els.length;
  els = els.concat(novos);
  marca = novos.map(function(_, k){ return ini + k; });
  marcaFoto = false;
  sel = marca[0];
  renderChips(); syncControls(); draw(); pushHist();
}

// o bloco inteiro para o meio do papel, pela caixa de tudo o que está nele
function centralizaLaco(){
  var c = caixaDoLaco(), pa = paperMM();
  if (!c) return;
  var dx = pa.w / 2 - (c.x + c.w / 2), dy = pa.h / 2 - (c.y + c.h / 2);
  marca.forEach(function(i){ els[i].x = dec1(els[i].x + dx); els[i].y = dec1(els[i].y + dy); });
  if (marcaFoto){ photo.x += dx; photo.y += dy; clampPhoto(); }
  draw(); pushHist();
}
$("dupLaco").addEventListener("click", duplicaLaco);
$("meioLaco").addEventListener("click", centralizaLaco);

/* ---- acender e apagar em traço -------------------------------------
   Um toque acende ou apaga um quadradinho; o dedo (ou o botão do mouse)
   apertado e arrastando acende ou apaga a fileira inteira por onde passa.
   Três decisões moram aqui:

   o primeiro quadradinho do traço decide se o traço inteiro acende ou
   apaga, e não cada quadradinho por si — senão passar de volta por cima do
   próprio traço ficaria piscando, e numa curva, onde o dedo cruza o que
   acabou de acender, o resultado seria adivinhação;

   entre um evento e o outro o ponteiro pula vários quadradinhos, então o
   traço liga o de agora ao de antes em linha reta — sem isso um arraste
   rápido sai furado, e furo no molde é ponto que falta no pano;

   e o traço inteiro é um passo só no desfazer, como o arraste do controle
   deslizante já era. */
var pinta = null;

/* O ajustar da peça de ponto reto: tocar num furo o escolhe; tocar noutro
   liga os dois com um ponto. Tocar no meio de um ponto (longe dos furos) o
   corta. Tocar de novo no furo escolhido desfaz a escolha. A folga do toque
   é medida em pixels de tela, como a do ímã, e vira mm pelo zoom. */
function ajustaReto(el, pt){
  var l = paperToLocal(el, pt.x, pt.y), k = cv._k || 1;
  var tol = Math.max(1.2, 10 / k);           // ~10 px de dedo
  // o furo só é pego bem perto dele — até um terço do ponto —, senão o toque
  // no meio de um ponto curto cairia sempre num dos furos das pontas
  var f = furoPerto(el, [l.x, l.y], Math.min(tol, (el.passo || RETO_PASSO) * 0.34));
  el.maos = el.maos || [];
  if (f){
    if (el._escolhido && Math.abs(el._escolhido[0] - f[0]) < 1e-6 && Math.abs(el._escolhido[1] - f[1]) < 1e-6){
      el._escolhido = null; draw(); return;
    }
    if (!el._escolhido){ el._escolhido = f.slice(); draw(); return; }
    el.maos.push({ t: "liga", a: el._escolhido.slice(), b: f.slice() });
    el._escolhido = null;
  } else {
    // o ponto mais perto do toque: distância do toque ao segmento
    var melhor = null, dm = tol * 0.8;
    (el.pontos || []).forEach(function(p){
      var fs = p.furos, n = fs.length, lim = p.fechada ? n : n - 1;
      for (var i = 0; i < lim; i++){
        var a = fs[i], b = fs[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
        var t = L2 ? Math.max(0, Math.min(1, ((l.x - a[0]) * dx + (l.y - a[1]) * dy) / L2)) : 0;
        var d = Math.sqrt(Math.pow(a[0] + t * dx - l.x, 2) + Math.pow(a[1] + t * dy - l.y, 2));
        if (d < dm){ dm = d; melhor = [a, b]; }
      }
    });
    if (!melhor) return;
    el.maos.push({ t: "corta", a: melhor[0].slice(), b: melhor[1].slice() });
  }
  rebuild(el);
  renderFios(); draw(); pushHist();
}

function celulaEm(el, pt){
  var l = paperToLocal(el, pt.x, pt.y);
  var p = P();
  return { q: Math.floor(l.x / p), r: Math.floor(l.y / p) };
}

// devolve 1 quando o quadradinho mudou de fato. O traço anota quadradinho
// por quadradinho na lista de ajustes da peça, e não um total: é o que faz
// o ajuste à mão sobreviver a uma mudança de altura
function pintaCelula(q, r){
  var el = pinta.el;
  if (!el.cells[r] || el.cells[r][q] === undefined) return 0;
  // numa peça de paleta acende com a linha escolhida na aba linha, que é o
  // que a lista de meadas promete; nas outras, slotAtivo dá 1
  if (pinta.val < 0) pinta.val = el.cells[r][q] ? 0 : slotAtivo(el);
  if (el.cells[r][q] === pinta.val) return 0;
  el.cells[r][q] = pinta.val;
  marcaEdit(el, r, q, pinta.val);
  return 1;
}

function pintaAte(pt){
  var c = celulaEm(pinta.el, pt), n = 0;
  if (pinta.q === null){
    n = pintaCelula(c.q, c.r);
  } else {
    var dq = c.q - pinta.q, dr = c.r - pinta.r;
    var passos = Math.max(Math.abs(dq), Math.abs(dr));
    for (var i = 1; i <= passos; i++){
      n += pintaCelula(pinta.q + Math.round(dq * i / passos),
                       pinta.r + Math.round(dr * i / passos));
    }
  }
  pinta.q = c.q; pinta.r = c.r;
  pinta.mudou += n;
  return n;
}

cv.addEventListener("pointerdown", function(e){
  e.preventDefault();
  var pt = evPos(e);
  pointers[e.pointerId] = pt;
  cpts[e.pointerId] = { x: e.clientX, y: e.clientY };

  if (mao){
    cv.setPointerCapture(e.pointerId);
    if (nPointers() === 2){
      pan = null;
      pinch = { d0: cspread(), base: zoom, vista: true };
      return;
    }
    pan = { x: e.clientX, y: e.clientY, sl: stage.scrollLeft, st: stage.scrollTop };
    stage.classList.add("pegando");
    return;
  }
  // marcando o que já foi bordado, o toque marca — não seleciona nem arrasta
  if (acompanha){ comecaBorda(e, pt); return; }
  var i = hitEl(pt);
  // cores por bloco: o toque troca o esquema do bloco, e não começa arraste
  if (modoBloco && i === sel && trocaEsquemaEm(els[sel], pt)) return;
  var onPhoto = !photo.off && pt.x >= photo.x && pt.x <= photo.x + photo.w &&
                pt.y >= photo.y && pt.y <= photo.y + photo.h;
  var soma = !editing && (e.shiftKey || e.ctrlKey || e.metaKey);
  var antes = marca.join(",") + "|" + marcaFoto + "|" + foco + "|" + sel;

  // tocar no que já está laçado arrasta o bloco inteiro: desmanchar o laço
  // aqui obrigaria a laçar de novo a cada arraste
  var pega = noLaco() && (i >= 0 ? marcado(i) : (onPhoto && marcaFoto));
  var lacando = !editing && i < 0 && !onPhoto;

  if (soma && (i >= 0 || onPhoto)){
    if (i >= 0) alternaMarca(i);
    else { marcaFoto = !marcaFoto; if (marcaFoto) foco = "photo";
           else if (!marca.length) foco = "none"; }
    syncControls(); renderChips(); draw();
    return;
  }
  if (!pega && !(lacando && soma)){
    var want = i >= 0 ? "el" : (onPhoto ? "photo" : "none");
    if (i >= 0) sel = i;
    soUm(i);
    marcaFoto = !!onPhoto && i < 0;
    foco = want;
  }
  if (antes !== marca.join(",") + "|" + marcaFoto + "|" + foco + "|" + sel){
    syncControls(); renderChips();
  }
  if (editing && els[sel] && els[sel].kind === "reto"){
    ajustaReto(els[sel], pt);
    return;
  }
  if (editing){
    var el = els[sel]; if (!el) return;
    if (pinta) return;                     // um dedo por traço: o segundo espera
    // a captura mantém o traço vivo se o ponteiro sair da grade e voltar
    cv.setPointerCapture(e.pointerId);
    pinta = { id: e.pointerId, el: el, val: -1, q: null, r: null, mudou: 0 };
    if (pintaAte(pt)) draw();
    return;
  }
  cv.setPointerCapture(e.pointerId);
  if (nPointers() === 2 && els[sel]){
    drag = null; laco = null;
    pinch = { d0: spread(), base: tamanhoDe(els[sel]) };
    return;
  }
  if (pega){
    drag = pegaLaco(pt);
  } else if (i >= 0){
    drag = { kind:"el", i: sel, dx: pt.x - els[sel].x, dy: pt.y - els[sel].y };
  } else if (onPhoto){
    drag = { kind:"photo", dx: pt.x - photo.x, dy: pt.y - photo.y };
  } else {
    // no vazio, o botão apertado desenha o laço
    laco = { x0: pt.x, y0: pt.y, x: pt.x, y: pt.y, soma: soma };
  }
});

cv.addEventListener("pointermove", function(e){
  if (cpts[e.pointerId]) cpts[e.pointerId] = { x: e.clientX, y: e.clientY };
  if (borda){ e.preventDefault(); segueBorda(e); return; }
  if (pinta){
    if (e.pointerId !== pinta.id) return;
    e.preventDefault();
    if (pintaAte(evPos(e))) draw();
    return;
  }
  if (laco){
    e.preventDefault();
    var l = evPos(e);
    laco.x = l.x; laco.y = l.y;
    draw();
    return;
  }
  if (pinch && pinch.vista && nPointers() === 2){
    e.preventDefault();
    var m = cmid();
    setZoom(pinch.base * (cspread() / (pinch.d0 || 1)), m.x, m.y);
    return;
  }
  if (pan){
    e.preventDefault();
    stage.scrollLeft = pan.sl - (e.clientX - pan.x);
    stage.scrollTop  = pan.st - (e.clientY - pan.y);
    return;
  }
  if (pointers[e.pointerId]) pointers[e.pointerId] = evPos(e);
  if (pinch && nPointers() === 2){
    e.preventDefault();
    var ratio = spread() / (pinch.d0 || 1);
    resizeSelected(Math.round(pinch.base * ratio));
    return;
  }
  if (!drag) return;
  e.preventDefault();
  var pt = evPos(e);
  if (drag.kind === "laco"){
    arrastaLaco(pt);
    draw();
    return;
  }
  var nx = pt.x - drag.dx, ny = pt.y - drag.dy, g;
  if (drag.kind === "el"){
    var el = els[drag.i];
    var b = elPaperBox(el);      // onde a caixa girada está agora...
    g = imanta({ x: b.x + nx - el.x, y: b.y + ny - el.y, w: b.w, h: b.h }, el);  // ...e onde ia parar
    el.x = Math.round((nx + g.x) * 10) / 10;
    el.y = Math.round((ny + g.y) * 10) / 10;
  } else {
    g = imanta({ x: nx, y: ny, w: photo.w, h: photo.h }, "foto");
    photo.x = Math.round((nx + g.x) * 10) / 10;
    photo.y = Math.round((ny + g.y) * 10) / 10;
    clampPhoto();
  }
  draw();
});

function endDrag(e){
  fimBorda(e);
  imaVisto = null;           // a linha do ímã é só durante o arraste
  var mexeu = !!(drag || (pinch && !pinch.vista));
  if (laco){
    var r = lacoRect();
    // retângulo de nada é clique no vazio, e clique no vazio já largou a
    // seleção quando o botão desceu
    if (r.w > 1 || r.h > 1) fechaLaco(r, laco.soma);
    laco = null;
    syncControls(); renderChips(); draw();
  }
  if (pinta && (!e || e.pointerId === pinta.id)){
    if (pinta.mudou) mexeu = true;         // traço que não mudou nada não é passo
    pinta = null;
  }
  if (e && pointers[e.pointerId]) delete pointers[e.pointerId];
  if (e && cpts[e.pointerId]) delete cpts[e.pointerId];
  if (nPointers() < 2) pinch = null;
  drag = null;
  if (pan){ pan = null; stage.classList.remove("pegando"); }
  if (mexeu) pushHist();
}
cv.addEventListener("pointerup", endDrag);
cv.addEventListener("pointercancel", endDrag);
