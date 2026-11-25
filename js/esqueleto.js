/* ponto & letra — esqueleto.js
   O traço de uma letra (ou de um desenho) reduzido à linha do meio, e essa
   linha virando caminhos de ponto reto.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior.

   No ponto cruz a palavra é a área do traço, em quadradinhos. No ponto reto
   ela é a linha que a caneta faria: o meio do traço. É por isso que a
   cursiva fina, que em quadradinho vira pontilhado, sai limpa aqui — o
   traço fino é justamente o que uma linha só desenha bem.

   O caminho é o de sempre em desenho de traço:
     1. a palavra é escrita grande num canvas e vira preto e branco;
     2. o preto é afinado até ficar com um pixel de largura (Zhang-Suen), sem
        partir nenhuma linha;
     3. essa linha de pixels é percorrida e cortada nos cruzamentos e nas
        pontas, virando caminhos;
     4. as pontinhas que o afinamento deixa nas quinas grossas são podadas, e
        cada caminho é simplificado e passado para milímetros.
   Daí em diante é um desenho como a colmeia: reto.js põe os furos. */

var ESQ_PX_MM = 10;        // pixels por milímetro no rascunho

// 2. afinar: as duas passadas do Zhang-Suen até nada mais sair
function afina(bin, W, H){
  var img = new Uint8Array(bin), mudou = true, apaga = [];
  var v = function(x, y){ return x < 0 || y < 0 || x >= W || y >= H ? 0 : img[y * W + x]; };
  while (mudou){
    mudou = false;
    for (var passo = 0; passo < 2; passo++){
      apaga.length = 0;
      for (var y = 0; y < H; y++)
        for (var x = 0; x < W; x++){
          if (!img[y * W + x]) continue;
          var p2 = v(x, y - 1), p3 = v(x + 1, y - 1), p4 = v(x + 1, y), p5 = v(x + 1, y + 1),
              p6 = v(x, y + 1), p7 = v(x - 1, y + 1), p8 = v(x - 1, y), p9 = v(x - 1, y - 1);
          var b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (b < 2 || b > 6) continue;
          var a = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) +
                  (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
          if (a !== 1) continue;
          if (passo === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
          apaga.push(y * W + x);
        }
      if (apaga.length) mudou = true;
      for (var i = 0; i < apaga.length; i++) img[apaga[i]] = 0;
    }
  }
  return img;
}

var VIZ8 = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];

// 3. percorrer: nós são as pontas (1 vizinho) e os cruzamentos (3 ou mais);
// cada caminho vai de um nó a outro. O que sobra sem nó nenhum é laço fechado
// — o "o", o miolo do "a".
function percorre(img, W, H){
  var viz = function(i){
    var x = i % W, y = (i - x) / W, out = [];
    for (var k = 0; k < 8; k++){
      var xx = x + VIZ8[k][0], yy = y + VIZ8[k][1];
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && img[yy * W + xx]) out.push(yy * W + xx);
    }
    return out;
  };
  var grau = {}, nos = [], i;
  for (i = 0; i < W * H; i++){
    if (!img[i]) continue;
    var g = viz(i).length;
    grau[i] = g;
    if (g !== 2) nos.push(i);
  }
  var usado = {}, caminhos = [];
  var chave = function(a, b){ return a < b ? a + ":" + b : b + ":" + a; };
  var anda = function(ini, prox){
    var cam = [ini, prox], ant = ini, at = prox;
    usado[chave(ini, prox)] = 1;
    while (grau[at] === 2){
      var vs = viz(at), seg = vs[0] === ant ? vs[1] : vs[0];
      if (seg === undefined || usado[chave(at, seg)]) break;
      usado[chave(at, seg)] = 1;
      ant = at; at = seg; cam.push(at);
      if (at === ini) break;
    }
    return cam;
  };
  nos.forEach(function(n){
    viz(n).forEach(function(m){
      if (usado[chave(n, m)]) return;
      caminhos.push({ px: anda(n, m), fechada: false });
    });
  });
  // laços sem nó
  for (i = 0; i < W * H; i++){
    if (!img[i] || grau[i] !== 2) continue;
    var vs = viz(i);
    if (usado[chave(i, vs[0])]) continue;
    var c = anda(i, vs[0]);
    caminhos.push({ px: c, fechada: c[c.length - 1] === i });
  }
  return caminhos.map(function(c){
    return { pts: c.px.map(function(p){ var x = p % W; return [x, (p - x) / W]; }),
             fechada: c.fechada, ponta: c.px.length && (grau[c.px[0]] === 1 || grau[c.px[c.px.length - 1]] === 1) };
  });
}

// os pedaços pequenos de tinta, soltos: o centro de cada um, se ele cabe
// num quadrado de 2,5 mm — pingo de "i", acento, ponto final
function pingos(bin, W, H, pxmm){
  var visto = new Uint8Array(W * H), out = [], lim = 2.5 * pxmm, pilha = [];
  for (var i = 0; i < W * H; i++){
    if (!bin[i] || visto[i]) continue;
    var x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    pilha.push(i); visto[i] = 1;
    while (pilha.length){
      var j = pilha.pop(), x = j % W, y = (j - x) / W;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (var k = 0; k < 8; k++){
        var xx = x + VIZ8[k][0], yy = y + VIZ8[k][1], jj = yy * W + xx;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H || !bin[jj] || visto[jj]) continue;
        visto[jj] = 1; pilha.push(jj);
      }
    }
    if (x1 - x0 <= lim && y1 - y0 <= lim) out.push([(x0 + x1) / 2, (y0 + y1) / 2]);
  }
  return out;
}

// Ramer-Douglas-Peucker: tira os pixels que não mudam a forma
function simplificaRDP(pts, tol){
  if (pts.length < 3) return pts.slice();
  var a = pts[0], b = pts[pts.length - 1], dx = b[0] - a[0], dy = b[1] - a[1];
  var L = Math.sqrt(dx * dx + dy * dy) || 1, maxD = -1, idx = 0;
  for (var i = 1; i < pts.length - 1; i++){
    var d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L;
    if (!(L > 1e-9)) d = Math.sqrt(Math.pow(pts[i][0] - a[0], 2) + Math.pow(pts[i][1] - a[1], 2));
    if (d > maxD){ maxD = d; idx = i; }
  }
  if (maxD <= tol) return [a, b];
  var e = simplificaRDP(pts.slice(0, idx + 1), tol), f = simplificaRDP(pts.slice(idx), tol);
  return e.slice(0, -1).concat(f);
}

function comprimentoPx(pts){
  var s = 0;
  for (var i = 1; i < pts.length; i++) s += Math.sqrt(Math.pow(pts[i][0] - pts[i - 1][0], 2) + Math.pow(pts[i][1] - pts[i - 1][1], 2));
  return s;
}

/* De uma imagem preto e branco aos caminhos em milímetros. `poda` é o
   comprimento, em mm, abaixo do qual uma pontinha solta é tirada: é o que o
   afinamento deixa nas quinas grossas, e no bordado vira um ponto torto para
   fora da letra. Pontas encostadas em cruzamentos próximos se juntam num furo
   só — dois furos a meio milímetro rasgariam o papel. */
function caminhosDoTraco(bin, W, H, pxmm, poda){
  var fino = afina(bin, W, H);
  var cams = percorre(fino, W, H);
  var minPx = (poda || 1.5) * pxmm;
  /* O pingo do "i" e o acento afinam até quase nada — um pixel, uma
     pontinha — e a poda os levaria junto. Pedaço solto que não encosta em
     linha nenhuma vira um ponto curtinho, deitado no meio dele. */
  var soltos = pingos(bin, W, H, pxmm);
  cams = cams.filter(function(c){
    if (c.pts.length < 2) return false;
    if (!(c.ponta && comprimentoPx(c.pts) < minPx)) return true;
    return false;
  });
  soltos.forEach(function(p){
    var perto = cams.some(function(c){ return c.pts.some(function(q){
      return Math.abs(q[0] - p[0]) < 1.2 * pxmm && Math.abs(q[1] - p[1]) < 1.2 * pxmm; }); });
    if (!perto) cams.push({ pts: [[p[0] - 0.9 * pxmm, p[1]], [p[0] + 0.9 * pxmm, p[1]]], fechada: false, ponta: false });
  });
  // juntar as pontas que caíram a menos de 0,6 mm umas das outras
  var juntaPx = 0.6 * pxmm, grupos = [];
  cams.forEach(function(c){
    [0, c.pts.length - 1].forEach(function(i){
      var p = c.pts[i], g = null;
      for (var k = 0; k < grupos.length && !g; k++)
        if (Math.abs(grupos[k].x - p[0]) <= juntaPx && Math.abs(grupos[k].y - p[1]) <= juntaPx) g = grupos[k];
      if (!g){ g = { x: p[0], y: p[1], n: 0, sx: 0, sy: 0, quem: [] }; grupos.push(g); }
      g.sx += p[0]; g.sy += p[1]; g.n++; g.quem.push([c, i]);
    });
  });
  grupos.forEach(function(g){
    var x = g.sx / g.n, y = g.sy / g.n;
    g.quem.forEach(function(q){ q[0].pts[q[1]] = [x, y]; });
  });
  return cams.map(function(c){
    var s = simplificaRDP(c.pts, 0.25 * pxmm);
    return { curva: true, fechada: c.fechada,
             pts: (c.fechada ? s.slice(0, -1) : s).map(function(p){ return [p[0] / pxmm, p[1] / pxmm]; }) };
  }).filter(function(c){ return c.pts.length > 1; });
}

/* A palavra em linhas. A altura é a da maiúscula, em milímetros — a mesma
   régua do ponto cruz, só que aqui medida direto em mm, porque não há
   quadradinho. Devolve os caminhos já encostados no zero. */
function palavraEmLinhas(texto, fam, alturaMM, esp){
  texto = texto || " ";
  var px = ESQ_PX_MM, c = document.createElement("canvas"), x = c.getContext("2d");
  x.font = fontStr(100, fam);
  var ref = x.measureText("H").actualBoundingBoxAscent || 70;
  var tam = 100 * alturaMM * px / ref;
  x.font = fontStr(tam, fam);
  if (esp && "letterSpacing" in x) x.letterSpacing = (esp * px) + "px";
  var m = x.measureText(texto);
  var asc = m.actualBoundingBoxAscent || tam, dsc = m.actualBoundingBoxDescent || tam * 0.3;
  var esq = m.actualBoundingBoxLeft || 0, dir = m.actualBoundingBoxRight || m.width;
  var pad = 8, W = Math.ceil(esq + dir) + pad * 2, H = Math.ceil(asc + dsc) + pad * 2;
  c.width = W; c.height = H;
  x = c.getContext("2d");
  x.font = fontStr(tam, fam);
  if (esp && "letterSpacing" in x) x.letterSpacing = (esp * px) + "px";
  x.fillStyle = "#000";
  x.textBaseline = "alphabetic";
  x.fillText(texto, pad + esq, pad + asc);
  var d = x.getImageData(0, 0, W, H).data, bin = new Uint8Array(W * H);
  for (var i = 0; i < W * H; i++) bin[i] = d[i * 4 + 3] > 110 ? 1 : 0;
  var cams = caminhosDoTraco(bin, W, H, px, 1.5);
  var cx = caixaCaminhos(cams);
  cams.forEach(function(cm){ cm.pts = cm.pts.map(function(p){ return [p[0] - cx.x, p[1] - cx.y]; }); });
  return cams;
}
