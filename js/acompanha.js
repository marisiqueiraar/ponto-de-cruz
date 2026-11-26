/* ponto & letra — acompanha.js
   O modo de acompanhamento: marcar na mesa o que já foi bordado.
   Scripts clássicos, carregados em ordem pelo index.html.

   Com o botão de tique da mesa ligado, tocar num ponto marca que ele já foi
   bordado, e tocar de novo desmarca; arrastando sem soltar, o traço inteiro
   segue o primeiro toque, como no ajustar. O que foi bordado fica esmaecido,
   para o que falta saltar aos olhos, e o rodapé conta quanto já foi.

   A marca é por ponto: no ponto cruz, o quadradinho ("linha,coluna"); no
   ponto reto, o ponto entre dois furos, pela posição dos dois — e não pelo
   número da linha, que muda quando a peça é refeita. Assim, mexer na peça
   não apaga o que foi marcado: o que continua igual continua marcado, e a
   marca que ficou sem ponto embaixo simplesmente não conta. A exceção é o
   ponto cruz que muda de tamanho de grade: aí "linha 3, coluna 5" passa a
   ser outro lugar, e a marcação recomeça.

   A marca é coisa da mesa: não sai no PDF nem no PNG. Fica gravada com o
   molde e entra no desfazer, um traço por passo. */
var acompanha = false;
var borda = null;             // o traço em andamento: { id, el, val }

function dimsDe(el){ return el.kind === "reto" ? "" : el.cells.length + "x" + ((el.cells[0] || []).length); }

// as marcas que valem: {} vazio quando não há nenhuma
function feitoDe(el){
  if (!el.feito) return {};
  if (el.feito.d !== dimsDe(el)){ el.feito = null; return {}; }
  return el.feito.k;
}

function chaveSeg(a, b){
  var f = function(p){ return Math.round(p[0] * 100) + "," + Math.round(p[1] * 100); };
  var x = f(a), y = f(b);
  return x < y ? x + ";" + y : y + ";" + x;
}

// cada ponto da peça de ponto reto, com a chave dele
function segmentosDe(el){
  var out = [];
  (el.pontos || []).forEach(function(p){
    var fs = p.furos, n = fs.length, lim = p.fechada ? n : n - 1;
    for (var i = 0; i < lim; i++) out.push({ a: fs[i], b: fs[(i + 1) % n], k: chaveSeg(fs[i], fs[(i + 1) % n]) });
  });
  return out;
}

// quanto da peça já foi bordado: { feitos, total }
function progressoDe(el){
  var k = feitoDe(el), n = 0, tot = 0;
  if (el.kind === "reto"){
    segmentosDe(el).forEach(function(s){ tot++; if (k[s.k]) n++; });
  } else {
    el.cells.forEach(function(row, r){ row.forEach(function(v, q){ if (v){ tot++; if (k[r + "," + q]) n++; } }); });
  }
  return { feitos: n, total: tot };
}

function progressoTotal(){
  var n = 0, tot = 0;
  els.forEach(function(el){ var p = progressoDe(el); n += p.feitos; tot += p.total; });
  return { feitos: n, total: tot };
}

// o ponto sob o toque: a chave dele, ou null
function pontoSob(el, pt){
  var l = paperToLocal(el, pt.x, pt.y);
  if (el.kind === "reto"){
    var tol = Math.max(0.8, 10 / (cv._k || 1)), melhor = null, dm = tol;
    segmentosDe(el).forEach(function(s){
      var dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L2 = dx * dx + dy * dy;
      var t = L2 ? Math.max(0, Math.min(1, ((l.x - s.a[0]) * dx + (l.y - s.a[1]) * dy) / L2)) : 0;
      var d = Math.sqrt(Math.pow(s.a[0] + t * dx - l.x, 2) + Math.pow(s.a[1] + t * dy - l.y, 2));
      if (d < dm){ dm = d; melhor = s.k; }
    });
    return melhor;
  }
  var p = P(), q = Math.floor(l.x / p), r = Math.floor(l.y / p);
  return el.cells[r] && el.cells[r][q] ? r + "," + q : null;
}

// devolve 1 quando a marca mudou
function marcaPonto(el, chave){
  if (!chave) return 0;
  if (!el.feito || el.feito.d !== dimsDe(el)) el.feito = { d: dimsDe(el), k: {} };
  if (borda.val === null) borda.val = !el.feito.k[chave];
  if (!!el.feito.k[chave] === borda.val) return 0;
  if (borda.val) el.feito.k[chave] = 1; else delete el.feito.k[chave];
  borda.mudou++;
  return 1;
}

// chamado pelo pointerdown da mesa quando o modo está ligado
function comecaBorda(e, pt){
  var i = hitEl(pt);
  if (i < 0) return;
  cv.setPointerCapture(e.pointerId);
  borda = { id: e.pointerId, el: els[i], val: null, mudou: 0 };
  if (marcaPonto(borda.el, pontoSob(borda.el, pt))){ draw(); mostraProgresso(); }
}

function segueBorda(e){
  if (!borda || e.pointerId !== borda.id) return;
  if (marcaPonto(borda.el, pontoSob(borda.el, evPos(e)))){ draw(); mostraProgresso(); }
}

function fimBorda(e){
  if (!borda || (e && e.pointerId !== borda.id)) return;
  var mudou = borda.mudou;
  borda = null;
  if (mudou) pushHist();
}

function mostraProgresso(){
  if (!acompanha) return;
  var p = progressoTotal();
  $("modeHint").textContent = p.total
    ? "Bordado: " + p.feitos.toLocaleString("pt-BR") + " de " + p.total.toLocaleString("pt-BR") +
      " pontos (" + Math.floor(p.feitos * 100 / p.total) + "%). Toque num ponto para marcar ou desmarcar; " +
      "arrastando, o traço segue o primeiro toque."
    : "Não há pontos para marcar neste molde.";
  $("feitoLimpa").classList.toggle("hide", !p.feitos);
}

/* Na mesa, o que já foi bordado fica esmaecido: um véu branco sobre o
   quadradinho, ou um traço branco sobre o ponto reto. */
function drawFeitos(ctx, k, region){
  els.forEach(function(el){
    var f = feitoDe(el), chaves = Object.keys(f);
    if (!chaves.length) return;
    var tela = function(lx, ly){ var q = localToPaper(el, lx, ly); return [(q.x - region.x) * k, (q.y - region.y) * k]; };
    ctx.save();
    if (el.kind === "reto"){
      ctx.strokeStyle = "rgba(255,255,255,.78)";
      ctx.lineWidth = Math.max(2.4, (el.passo || RETO_PASSO) * k * 0.28);
      ctx.lineCap = "round";
      ctx.beginPath();
      segmentosDe(el).forEach(function(s){
        if (!f[s.k]) return;
        var a = tela(s.a[0], s.a[1]), b = tela(s.b[0], s.b[1]);
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      });
      ctx.stroke();
    } else {
      var p = P();
      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.beginPath();
      chaves.forEach(function(c){
        var rq = c.split(","), r = +rq[0], q = +rq[1];
        if (!el.cells[r] || !el.cells[r][q]) return;
        var a = tela(q * p, r * p), b = tela((q + 1) * p, r * p), d = tela((q + 1) * p, (r + 1) * p), e = tela(q * p, (r + 1) * p);
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.closePath();
      });
      ctx.fill();
    }
    ctx.restore();
  });
}

$("zFeito").addEventListener("click", function(){
  acompanha = !acompanha;
  this.classList.toggle("on", acompanha);
  this.setAttribute("aria-pressed", acompanha ? "true" : "false");
  if (acompanha && mao) $("zPan").click();     // as duas coisas pegam o mesmo arraste
  if (acompanha) mostraProgresso();
  else { $("feitoLimpa").classList.add("hide"); mostraDica(); }
});

$("feitoLimpa").addEventListener("click", function(){
  if (!this.classList.contains("perigo")){
    this.classList.add("perigo"); this.textContent = "confirmar";
    return;
  }
  this.classList.remove("perigo"); this.textContent = "desmarcar tudo";
  els.forEach(function(el){ el.feito = null; });
  draw(); pushHist(); mostraProgresso();
});
