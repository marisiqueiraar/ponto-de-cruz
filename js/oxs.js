/* ponto & letra — oxs.js
   Importar e exportar OXS, o formato aberto de gráfico de ponto cruz que
   programas como o WinStitch, o MacStitch e o KG-Chart leem e escrevem.
   Scripts clássicos, carregados em ordem pelo index.html.

   O OXS é um XML com uma grade: a paleta de linhas, um ponto cheio por
   quadradinho (x, y, índice da linha) e os pontos atrás, de cruzamento a
   cruzamento da grade. O app guarda outra coisa — peças soltas, giradas, em
   milímetros —, então a passagem é uma tradução, e tem perdas que valem dizer:

   - Exportar: cada quadradinho aceso de cada peça vai para o quadradinho da
     grade do papel em que cai o centro dele. Peça girada sai "endireitada"
     na grade, como sairia bordada em tela. O ponto reto vira ponto atrás,
     com os furos arredondados para o meio quadradinho mais perto, que é a
     precisão do formato. A grade sai recortada no que tem ponto.
   - Importar: os pontos cheios viram uma peça de gráfico colorido, com a
     paleta do arquivo; os pontos atrás viram uma peça de ponto reto por cor.
     Meio ponto, ponto de 3/4, nós e contas não têm equivalente aqui e ficam
     de fora — o aviso diz quantos. */

var OXS_CORES_MAX = 35;    // as células guardam o índice da linha numa letra de 0-9a-z

function xmlAttr(v){
  return String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function montaOXS(){
  var p = P(), pal = [], palIdx = {}, cheio = {}, atras = [];
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  var slot = function(hex, nome){
    var k = hex.toUpperCase() + "|" + nome;
    if (!(k in palIdx)){ palIdx[k] = pal.length + 1; pal.push({ hex: hex.toUpperCase(), nome: nome }); }
    return palIdx[k];
  };
  els.forEach(function(el){
    if (el.kind === "reto"){
      var c = corDe(el), s = slot(c.hex, c.nome);
      (el.pontos || []).forEach(function(pt){
        var fs = pt.furos, n = fs.length, lim = pt.fechada ? n : n - 1;
        for (var i = 0; i < lim; i++){
          var a = localToPaper(el, fs[i][0], fs[i][1]), b = localToPaper(el, fs[(i + 1) % n][0], fs[(i + 1) % n][1]);
          var g = [a.x / p, a.y / p, b.x / p, b.y / p].map(function(v){ return Math.round(v * 2) / 2; });
          if (g[0] === g[2] && g[1] === g[3]) continue;     // ponto que encolheu a nada no arredondamento
          atras.push({ g: g, s: s });
          x0 = Math.min(x0, Math.floor(Math.min(g[0], g[2]))); x1 = Math.max(x1, Math.ceil(Math.max(g[0], g[2])));
          y0 = Math.min(y0, Math.floor(Math.min(g[1], g[3]))); y1 = Math.max(y1, Math.ceil(Math.max(g[1], g[3])));
        }
      });
      return;
    }
    var base = corDe(el);
    el.cells.forEach(function(row, r){ row.forEach(function(v, q){
      if (!v) return;
      var sl = corCel(el, v);
      var s = sl ? slot(sl.hex, sl.rotulo || sl.hex) : slot(base.hex, base.nome);
      var c = localToPaper(el, (q + 0.5) * p, (r + 0.5) * p);
      var gx = Math.floor(c.x / p), gy = Math.floor(c.y / p);
      cheio[gx + "," + gy] = s;
      x0 = Math.min(x0, gx); x1 = Math.max(x1, gx + 1);
      y0 = Math.min(y0, gy); y1 = Math.max(y1, gy + 1);
    }); });
  });
  if (!pal.length) return null;
  var W = x1 - x0, H = y1 - y0, spi = Math.round(25.4 / p * 10) / 10;
  var it = itemAtual(), titulo = (it && it.nome) || "molde";
  var out = ['<?xml version="1.0" encoding="UTF-8"?>', "<chart>",
    '<format comments01="Exportado pelo ponto &amp; letra. Furos a ' + xmlAttr(fmt(p)) + ' mm." />',
    '<properties oxsversion="1.0" software="ponto &amp; letra" software_version="1" chartheight="' + H +
      '" chartwidth="' + W + '" charttitle="' + xmlAttr(titulo) + '" author="" copyright="" instructions="" ' +
      'stitchesperinch="' + spi + '" stitchesperinch_y="' + spi + '" palettecount="' + pal.length + '" />',
    "<palette>",
    '<palette_item index="0" number="cloth" name="cloth" color="FFFFFF" printcolor="FFFFFF" blendcolor="nil" ' +
      'comments="papel" strands="2" symbol="0" dashpattern="" bsstrands="2" bscolor="000000" />'];
  pal.forEach(function(l, i){
    var cor = l.hex.slice(1);
    out.push('<palette_item index="' + (i + 1) + '" number="' + xmlAttr(l.nome) + '" name="' + xmlAttr(l.nome) +
      '" color="' + cor + '" printcolor="' + cor + '" blendcolor="nil" comments="" strands="2" symbol="' + (i + 1) +
      '" dashpattern="" bsstrands="1" bscolor="' + cor + '" />');
  });
  out.push("</palette>", "<fullstitches>");
  Object.keys(cheio).forEach(function(k){
    var xy = k.split(",");
    out.push('<stitch x="' + (+xy[0] - x0) + '" y="' + (+xy[1] - y0) + '" palindex="' + cheio[k] + '" />');
  });
  out.push("</fullstitches>", "<partstitches>", "</partstitches>", "<backstitches>");
  atras.forEach(function(b, i){
    out.push('<backstitch x1="' + (b.g[0] - x0) + '" x2="' + (b.g[2] - x0) + '" y1="' + (b.g[1] - y0) + '" y2="' + (b.g[3] - y0) +
      '" palindex="' + b.s + '" objecttype="backstitch" sequence="' + i + '" />');
  });
  out.push("</backstitches>", "<ornaments_inc_knots_and_beads>", "</ornaments_inc_knots_and_beads>",
           "<commentboxes>", "</commentboxes>", "</chart>");
  return { xml: out.join("\n"), cheios: Object.keys(cheio).length, atras: atras.length, W: W, H: H };
}

function exportaOXS(){
  var o = montaOXS();
  if (!o) return avisaArquivo("Não há ponto nenhum no molde para exportar.");
  deliver(new Blob([o.xml], { type: "application/xml" }), saveName("oxs"), null);
  avisaArquivo("OXS salvo: grade de " + o.W + " × " + o.H + ", " + o.cheios.toLocaleString("pt-BR") +
               " pontos cheios" + (o.atras ? " e " + o.atras.toLocaleString("pt-BR") + " pontos atrás" : "") + ".");
}

// "DMC 310", "Anchor 268", "310": a chave do catálogo, se existir
function chaveOXS(numero, nome){
  var t = String(numero || "").trim(), m = t.match(/^(dmc|anchor)\s*[:#-]?\s*(\S+)/i);
  if (m){ var k = m[1].toLowerCase() + ":" + m[2]; return catIdx[k] ? k : ""; }
  if (/^\w+$/.test(t)){
    var marcaNome = /anchor/i.test(nome || "") ? "anchor" : "dmc";
    if (catIdx[marcaNome + ":" + t]) return marcaNome + ":" + t;
  }
  return "";
}

/* Lê o texto de um OXS e devolve as peças já desempacotadas (pelo mesmo
   caminho de um molde gravado, que é o que valida cada campo). */
function lerOXS(texto, nomeArquivo){
  var doc = new DOMParser().parseFromString(texto, "application/xml");
  if (doc.getElementsByTagName("parsererror").length || !doc.getElementsByTagName("chart").length)
    return { erro: "Esse arquivo não é um OXS que eu consiga ler." };
  var props = doc.getElementsByTagName("properties")[0];
  var titulo = (props && props.getAttribute("charttitle")) || String(nomeArquivo || "").replace(/\.oxs$/i, "") || "gráfico";
  var linhas = {};
  [].forEach.call(doc.getElementsByTagName("palette_item"), function(it){
    var i = +it.getAttribute("index"), cor = (it.getAttribute("color") || "").replace(/^#/, "");
    if (!(i > 0) || !/^[0-9A-Fa-f]{6}$/.test(cor)) return;
    var numero = (it.getAttribute("number") || "").trim(), nome = (it.getAttribute("name") || "").trim();
    var k = chaveOXS(numero, nome);
    linhas[i] = { hex: "#" + cor.toUpperCase(), chave: k,
                  rotulo: k ? nomeLinha(k) : (numero && numero !== nome ? numero + " " + nome : nome || numero || "#" + cor).trim() };
  });

  var pts = [], usados = {}, fora = 0;
  [].forEach.call(doc.getElementsByTagName("stitch"), function(s){
    var x = Math.round(+s.getAttribute("x")), y = Math.round(+s.getAttribute("y")), i = +s.getAttribute("palindex");
    if (!linhas[i] || !(x >= 0) || !(y >= 0)){ fora++; return; }
    pts.push([x, y, i]); usados[i] = (usados[i] || 0) + 1;
  });
  fora += doc.getElementsByTagName("partstitch").length;
  ["ornament", "knot", "bead", "object"].forEach(function(t){ fora += doc.getElementsByTagName(t).length; });

  var pecas = [], p = P();
  if (pts.length){
    var gx0 = 1e9, gy0 = 1e9, gx1 = -1, gy1 = -1;
    pts.forEach(function(a){ gx0 = Math.min(gx0, a[0]); gy0 = Math.min(gy0, a[1]); gx1 = Math.max(gx1, a[0]); gy1 = Math.max(gy1, a[1]); });
    // as linhas mais usadas primeiro; passando de 35, as que sobram vão para
    // a mais parecida entre as que ficaram
    var ordem = Object.keys(usados).map(Number).sort(function(a, b){ return usados[b] - usados[a]; });
    var fica = ordem.slice(0, OXS_CORES_MAX), vira = {}, juntou = ordem.length - fica.length;
    fica.forEach(function(i, n){ vira[i] = n + 1; });
    ordem.slice(OXS_CORES_MAX).forEach(function(i){
      var lab = labHex(linhas[i].hex), melhor = fica[0], dm = 1e9;
      fica.forEach(function(j){ var d = dLab(lab, labHex(linhas[j].hex)); if (d < dm){ dm = d; melhor = j; } });
      vira[i] = vira[melhor];
    });
    var W = gx1 - gx0 + 1, H = gy1 - gy0 + 1, grade = [];
    for (var r = 0; r < H; r++){ var row = []; for (var q = 0; q < W; q++) row.push(0); grade.push(row); }
    pts.forEach(function(a){ grade[a[1] - gy0][a[0] - gx0] = vira[a[2]]; });
    var paleta = fica.map(function(i){
      var l = linhas[i];
      return { lab: labHex(l.hex), hex: l.hex, chave: l.chave, rotulo: l.rotulo, off: 0 };
    });
    var dmc = fica.filter(function(i){ return /^dmc:/.test(linhas[i].chave); }).length;
    var anc = fica.filter(function(i){ return /^anchor:/.test(linhas[i].chave); }).length;
    pecas.push(unpackEl({ kind: "img", img: "", nome: titulo, larg: Math.max(IMG_LARG_MIN, Math.min(IMG_LARG_MAX, W)),
      thr: 0.5, cores: Math.min(CORES_MAX, fica.length), corte: 0, fonte: dmc > anc ? "dmc" : "anchor",
      paleta: paleta, paletaDe: Math.min(CORES_MAX, fica.length), x: 0, y: 0, rot: 0,
      color: paleta[0].hex, colorName: paleta[0].rotulo,
      cells: grade.map(function(row){ return row.map(function(v){ return v.toString(36); }).join(""); }) }));
  }

  // os pontos atrás: uma peça de ponto reto por linha, com os pontos seguidos
  // emendados numa linha só quando um começa onde o outro acabou
  var porCor = {};
  [].forEach.call(doc.getElementsByTagName("backstitch"), function(b){
    var i = +b.getAttribute("palindex");
    var g = ["x1", "y1", "x2", "y2"].map(function(a){ return +b.getAttribute(a); });
    if (!linhas[i] || g.some(isNaN)){ fora++; return; }
    (porCor[i] = porCor[i] || []).push(g);
  });
  Object.keys(porCor).forEach(function(i){
    var segs = porCor[i], linhasP = [], atual = null;
    segs.forEach(function(g){
      var a = [g[0] * p, g[1] * p], b = [g[2] * p, g[3] * p];
      var ult = atual && atual[atual.length - 1];
      if (ult && Math.abs(ult[0] - a[0]) < 1e-6 && Math.abs(ult[1] - a[1]) < 1e-6) atual.push(b);
      else { atual = [a, b]; linhasP.push(atual); }
    });
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    linhasP.forEach(function(l){ l.forEach(function(f){
      x0 = Math.min(x0, f[0]); y0 = Math.min(y0, f[1]); x1 = Math.max(x1, f[0]); y1 = Math.max(y1, f[1]);
    }); });
    var w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0), l = linhas[i];
    pecas.push(unpackEl({ kind: "reto", desenho: "imagem", img: "", nome: "pontos atrás de " + titulo,
      medida: Math.max(15, Math.min(250, Math.round(w))), passo: RETO_PASSO, x: 0, y: 0, rot: 0,
      color: l.hex, colorName: l.rotulo, w: w, h: h,
      pontos: linhasP.map(function(lp){
        return { f: 0, p: [].concat.apply([], lp.map(function(f){ return [f[0] - x0, f[1] - y0]; })) };
      }) }));
  });
  pecas = pecas.filter(Boolean);
  if (!pecas.length) return { erro: "Esse OXS não tem ponto cheio nem ponto atrás que eu saiba trazer." };
  return { pecas: pecas, fora: fora, juntou: juntou || 0, titulo: titulo };
}

function importaOXS(arquivo){
  var fr = new FileReader();
  fr.onerror = function(){ avisaArquivo("Não consegui ler esse arquivo."); };
  fr.onload = function(){
    var r;
    try { r = lerOXS(String(fr.result), arquivo.name); } catch (e){ r = { erro: "Esse arquivo não é um OXS que eu consiga ler." }; }
    if (r.erro) return avisaArquivo(r.erro);
    r.pecas.forEach(function(el){ poeEmLugarLivre(el); els.push(el); });
    sel = els.length - r.pecas.length; soUm(sel); foco = "el";
    renderChips(); syncControls(); renderPaleta(); renderFios(); draw(); pushHist();
    avisaArquivo("“" + r.titulo + "” entrou no molde: " + r.pecas.length + (r.pecas.length === 1 ? " peça" : " peças") + "." +
      (r.juntou ? " O gráfico tinha mais de " + OXS_CORES_MAX + " linhas; " + r.juntou + " foram trocadas pela mais parecida." : "") +
      (r.fora === 1 ? " 1 ponto (meio ponto, nó ou conta) não tem equivalente aqui e ficou de fora." :
       r.fora ? " " + r.fora.toLocaleString("pt-BR") + " pontos (meio ponto, nós, contas) não têm equivalente aqui e ficaram de fora." : ""));
  };
  fr.readAsText(arquivo);
}

$("oxsSalvar").addEventListener("click", exportaOXS);
$("oxsAbrir").addEventListener("click", function(){ $("oxsArq").click(); });
$("oxsArq").addEventListener("change", function(e){
  var f = e.target.files && e.target.files[0];
  if (f) importaOXS(f);
  e.target.value = "";
});
