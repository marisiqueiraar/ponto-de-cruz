/* ponto & letra — previa.js
   A prévia da folha impressa, na etapa imprimir.
   Scripts clássicos, carregados em ordem pelo index.html.

   A prévia não é um segundo desenho do molde: é o MESMO código que monta o
   PDF, rodando sobre um papel de mentira. A FolhaCanvas atende aos comandos
   do jsPDF que o pdf.js usa (texto, retângulo, linha, círculo, recorte,
   imagem...) e anota cada um; depois desenha tudo num canvas por página.
   Assim o que aparece na tela é o que sai na impressora — cabeçalho, régua,
   moldura de recorte, cópias lado a lado, folhas repartidas —, e qualquer
   mudança no PDF aparece na prévia sem ninguém precisar lembrar dela. */

var PT_MM = 25.4 / 72;
var medidor = document.createElement("canvas").getContext("2d");

function corPDF(a){
  if (typeof a[0] === "string") return a[0];
  if (a.length >= 3) return "rgb(" + (a[0] | 0) + "," + (a[1] | 0) + "," + (a[2] | 0) + ")";
  var g = a[0] | 0;
  return "rgb(" + g + "," + g + "," + g + ")";
}

function FolhaCanvas(o){
  this.paginas = [];
  this.fonte = { tam: 16, estilo: "normal" };
  this.addPage(o && o.format, o && o.orientation);
}
FolhaCanvas.prototype = {
  addPage: function(formato, orientacao){
    var land = orientacao === "landscape" || orientacao === "l";
    this.pag = { w: folhaW(land), h: folhaH(land), ops: [], imagens: [] };
    this.paginas.push(this.pag);
    return this;
  },
  _op: function(f){ this.pag.ops.push(f); return this; },
  _fonte: function(k){
    return (this.fonte.estilo === "bold" ? "bold " : "") + (this.fonte.tam * PT_MM * k) + "px Helvetica, Arial, sans-serif";
  },
  setFontSize: function(t){ this.fonte = { tam: t, estilo: this.fonte.estilo }; var f = this.fonte; return this._op(function(c){ c.fonte = f; }); },
  setFont: function(fam, est){ this.fonte = { tam: this.fonte.tam, estilo: est || "normal" }; var f = this.fonte; return this._op(function(c){ c.fonte = f; }); },
  getTextWidth: function(s){
    medidor.font = this._fonte(1);
    return medidor.measureText(String(s)).width;
  },
  setTextColor: function(){ var c = corPDF(arguments); return this._op(function(x){ x.texto = c; }); },
  setDrawColor: function(){ var c = corPDF(arguments); return this._op(function(x){ x.ctx.strokeStyle = c; }); },
  setFillColor: function(){ var c = corPDF(arguments); return this._op(function(x){ x.ctx.fillStyle = c; }); },
  setLineWidth: function(w){ return this._op(function(x){ x.ctx.lineWidth = Math.max(0.6, w * x.k); }); },
  setLineDashPattern: function(d){ d = d || []; return this._op(function(x){ x.ctx.setLineDash(d.map(function(v){ return v * x.k; })); }); },
  saveGraphicsState: function(){ return this._op(function(x){ x.ctx.save(); }); },
  restoreGraphicsState: function(){ return this._op(function(x){ x.ctx.restore(); }); },
  clip: function(){ return this._op(function(x){ x.ctx.clip(); }); },
  discardPath: function(){ return this._op(function(x){ x.ctx.beginPath(); }); },
  _pinta: function(x, estilo){
    // o jsPDF chama de "D" o contorno; null só faz o caminho, para o recorte
    if (estilo === null) return;
    var e = String(estilo || "S").toUpperCase();
    if (e.indexOf("F") >= 0) x.ctx.fill();
    if (e.indexOf("D") >= 0 || e.indexOf("S") >= 0) x.ctx.stroke();
  },
  rect: function(a, b, w, h, estilo){
    var self = this;
    return this._op(function(x){ x.ctx.beginPath(); x.ctx.rect(a * x.k, b * x.k, w * x.k, h * x.k); self._pinta(x, estilo); });
  },
  roundedRect: function(a, b, w, h, rx, ry, estilo){
    var self = this;
    return this._op(function(x){
      var c = x.ctx, k = x.k, r = Math.min(rx, w / 2, h / 2) * k;
      c.beginPath();
      c.moveTo(a * k + r, b * k);
      c.arcTo((a + w) * k, b * k, (a + w) * k, (b + h) * k, r);
      c.arcTo((a + w) * k, (b + h) * k, a * k, (b + h) * k, r);
      c.arcTo(a * k, (b + h) * k, a * k, b * k, r);
      c.arcTo(a * k, b * k, (a + w) * k, b * k, r);
      c.closePath();
      self._pinta(x, estilo);
    });
  },
  line: function(a, b, c2, d){
    return this._op(function(x){ var c = x.ctx; c.beginPath(); c.moveTo(a * x.k, b * x.k); c.lineTo(c2 * x.k, d * x.k); c.stroke(); });
  },
  lines: function(deltas, a, b, escala, estilo, fechada){
    var self = this, s = escala || [1, 1];
    return this._op(function(x){
      var c = x.ctx, px = a, py = b;
      c.beginPath(); c.moveTo(px * x.k, py * x.k);
      deltas.forEach(function(d){ px += d[0] * s[0]; py += d[1] * s[1]; c.lineTo(px * x.k, py * x.k); });
      if (fechada) c.closePath();
      self._pinta(x, estilo);
    });
  },
  circle: function(a, b, r, estilo){
    var self = this;
    return this._op(function(x){ x.ctx.beginPath(); x.ctx.arc(a * x.k, b * x.k, Math.max(r * x.k, 0.6), 0, Math.PI * 2); self._pinta(x, estilo || "S"); });
  },
  text: function(s, a, b, o){
    o = o || {};
    var linhas = Array.isArray(s) ? s : [String(s)], self = this, f = this.fonte;
    return this._op(function(x){
      var c = x.ctx, k = x.k;
      c.save();
      c.font = self._fonteDe(x.fonte || f, k);
      c.fillStyle = x.texto || "#000";
      c.textAlign = o.align === "center" ? "center" : o.align === "right" ? "right" : "left";
      c.textBaseline = o.baseline === "middle" ? "middle" : o.baseline === "top" ? "top" : "alphabetic";
      c.translate(a * k, b * k);
      if (o.angle) c.rotate(-o.angle * Math.PI / 180);
      var alto = (x.fonte || f).tam * PT_MM * k * 1.15;
      linhas.forEach(function(l, i){ c.fillText(l, 0, i * alto); });
      c.restore();
    });
  },
  _fonteDe: function(f, k){
    return (f.estilo === "bold" ? "bold " : "") + (f.tam * PT_MM * k) + "px Helvetica, Arial, sans-serif";
  },
  addImage: function(dados, fmt0, a, b, w, h){
    var img = new Image(), pag = this.pag;
    pag.imagens.push(new Promise(function(ok){ img.onload = ok; img.onerror = ok; }));
    img.src = dados;
    return this._op(function(x){ if (img.width) x.ctx.drawImage(img, a * x.k, b * x.k, w * x.k, h * x.k); });
  },
  output: function(){ return null; },

  // desenha cada página num canvas de `k` pixels por milímetro
  desenha: function(k){
    return Promise.all(this.paginas.map(function(p){ return Promise.all(p.imagens); })).then(function(){
      return this.paginas.map(function(p){
        var cv = document.createElement("canvas");
        cv.width = Math.round(p.w * k); cv.height = Math.round(p.h * k);
        var ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.fillStyle = "#000"; ctx.strokeStyle = "#000"; ctx.lineWidth = Math.max(0.6, 0.2 * k);
        var estado = { ctx: ctx, k: k, texto: "#000", fonte: null };
        p.ops.forEach(function(op){ op(estado); });
        return cv;
      });
    }.bind(this));
  }
};

/* Roda o montaPDF de verdade com o papel de mentira no lugar do jsPDF, e
   devolve a FolhaCanvas (ou null, se não havia o que imprimir). */
function montaPrevia(){
  var doc = null, antiga = fabricaDoc;
  fazendoPrevia = true;
  fabricaDoc = function(o){ doc = new FolhaCanvas(o); return doc; };
  try { montaPDF(); }
  catch (e){ doc = null; }
  finally { fabricaDoc = antiga; fazendoPrevia = false; }
  return doc;
}

/* Na etapa imprimir a mesa mostra a folha, e um botão volta para o molde.
   A prévia é refeita meio segundo depois da última mudança: montar o PDF
   inteiro a cada quadro de um arraste seria desperdício. */
var previaTimer = 0, previaVendo = true, previaVez = 0;
function previaAtiva(){
  var p = document.querySelector('.pane[data-pane="imprimir"]');
  return !!(p && p.classList.contains("on")) && previaVendo;
}
function agendaPrevia(){
  var box = $("previa");
  if (!box) return;
  var on = previaAtiva();
  box.classList.toggle("hide", !on);
  $("previaBtn").classList.toggle("hide", !document.querySelector('.pane[data-pane="imprimir"]').classList.contains("on"));
  if (!on) return;
  clearTimeout(previaTimer);
  previaTimer = setTimeout(refazPrevia, 450);
}
function refazPrevia(){
  if (!previaAtiva()) return;
  var vez = ++previaVez, doc = montaPrevia(), box = $("previaFolhas");
  if (!doc){ box.innerHTML = '<p class="previaVazia">Ainda não há o que imprimir.</p>'; $("previaTxt").textContent = ""; return; }
  var n = doc.paginas.length;
  // a folha inteira cabe na altura da mesa; repartido, as folhas vêm lado a lado
  // até três folhas cabem lado a lado na largura; mais que isso, rola
  var alto = Math.max(200, $("previa").clientHeight - 90);
  var lado = Math.min(n, 3), larg = Math.max(200, $("previa").clientWidth - 40 - 18 * (lado - 1));
  var k = Math.min(4, alto / doc.paginas[0].h, larg / (lado * doc.paginas[0].w)) * (window.devicePixelRatio || 1);
  doc.desenha(k).then(function(cvs){
    if (vez !== previaVez) return;
    box.innerHTML = "";
    cvs.forEach(function(cv, i){
      var f = document.createElement("figure");
      cv.style.width = (cv.width / (window.devicePixelRatio || 1)) + "px";
      cv.style.height = (cv.height / (window.devicePixelRatio || 1)) + "px";
      f.appendChild(cv);
      var cap = document.createElement("figcaption");
      cap.textContent = n > 1 ? "folha " + (i + 1) + " de " + n : "";
      f.appendChild(cap);
      box.appendChild(f);
    });
    $("previaTxt").textContent = n > 1 ? "Assim saem as " + n + " folhas" : "Assim sai a folha";
  });
}
$("previaBtn").addEventListener("click", function(){
  previaVendo = !previaVendo;
  this.textContent = previaVendo ? "ver o molde" : "ver a folha";
  this.setAttribute("aria-pressed", previaVendo ? "true" : "false");
  agendaPrevia();
  draw();
});
