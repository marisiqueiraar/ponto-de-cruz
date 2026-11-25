/* ponto & letra — desenho.js
   Como cada peça vira quadradinhos: símbolo, imagem, palavra, padrão.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

function matrixFromStrings(rows, scale){
  var out = [];
  for (var r = 0; r < rows.length; r++){
    for (var sy = 0; sy < scale; sy++){
      var line = [];
      for (var q = 0; q < rows[r].length; q++){
        var v = rows[r].charAt(q) === "X" ? 1 : 0;
        for (var sx = 0; sx < scale; sx++) line.push(v);
      }
      out.push(line);
    }
  }
  return out;
}

/* A imagem vira quadradinho pela mesma conta da palavra: cada quadradinho
   pega o pedaço de imagem que cai dentro dele e pergunta quanta tinta tem
   ali. Tinta aqui é o escuro — a luminância invertida —, e acima da
   sensibilidade o quadradinho acende.

   Este é o caminho de uma linha só, e nele não há meio-tom: o que sai é
   silhueta — logo, monograma, brasão, desenho de traço. Foto de rosto vira
   mancha, e a saída para ela é a outra: `imgMapa`, que reparte a imagem em
   várias meadas. É por isso que os dois partem da mesma grade, logo acima.

   Devolve nada — e não uma peça em branco — quando a imagem ainda não
   chegou: quem chamou fica com as células que já tinha, que é o desenho
   certo, em vez de ver a peça sumir enquanto o navegador decodifica. */
function imgMatrix(el){
  var g = gradeDaImagem(el);
  if (!g) return null;
  var cells = [];
  for (var r = 0; r < g.rows; r++){
    var linha = [];
    for (var q = 0; q < g.cols; q++){
      var t = g.tinta[r * g.cols + q];
      linha.push((el.inv ? 1 - t : t) > el.thr ? 1 : 0);
    }
    cells.push(linha);
  }
  return trim(cells);
}

/* A imagem lida em quadradinhos, antes de virar liga-desliga ou paleta: a
   cor média de cada quadradinho e a grade em que ela cai. Os dois caminhos
   partem daqui, então a largura e a proporção saem iguais nos dois — trocar
   o número de cores não pode mexer no tamanho da peça. */
function gradeDaImagem(el){
  var img = origemPronta(el);
  if (!img) return null;
  var cols = Math.max(IMG_LARG_MIN, Math.min(IMG_LARG_MAX, el.larg | 0));
  var rows = Math.max(1, Math.round(cols * img.height / img.width));
  var S = Math.max(1, Math.min(SUPER, Math.floor(TETO_CANVAS / Math.max(cols, rows, 1))));
  var c = document.createElement("canvas");
  c.width = cols * S; c.height = rows * S;
  var x = c.getContext("2d");
  // o branco por baixo é o que dá à transparência o valor de "sem tinta":
  // sem ele o canvas vazio é preto de alfa zero, e o inverter mentiria
  x.fillStyle = "#fff";
  x.fillRect(0, 0, c.width, c.height);
  x.drawImage(img, 0, 0, c.width, c.height);
  var data;
  try { data = x.getImageData(0, 0, c.width, c.height).data; } catch (e){ return null; }
  var rgb = [], tinta = [], n = S * S;
  for (var r = 0; r < rows; r++){
    for (var q = 0; q < cols; q++){
      var sr = 0, sg = 0, sb = 0;
      for (var yy = 0; yy < S; yy++){
        for (var xx = 0; xx < S; xx++){
          var i = (((r * S + yy) * c.width) + (q * S + xx)) * 4;
          sr += data[i]; sg += data[i + 1]; sb += data[i + 2];
        }
      }
      sr /= n; sg /= n; sb /= n;
      rgb.push([sr, sg, sb]);
      // 0,299 / 0,587 / 0,114 é o cinza que o olho vê. A média simples dos
      // três deixaria o azul escuro claro demais, e um desenho azul sobre
      // branco perderia metade do traço
      tinta.push(1 - (sr * 0.299 + sg * 0.587 + sb * 0.114) / 255);
    }
  }
  return { cols: cols, rows: rows, rgb: rgb, tinta: tinta };
}

/* A imagem em várias linhas. O vazio vem primeiro: quadradinho mais claro
   que o corte não ganha linha nenhuma. É o que tira o fundo branco de um
   logo ou o quadriculado de um gráfico — e sem isso a primeira linha da
   paleta seria sempre uma meada branca para bordar o fundo inteiro.

   Depois o que sobrou é agrupado em `cores` tons, e cada tom vira a meada
   mais próxima da marca escolhida. A paleta fica guardada na peça: mexer na
   largura reaproveita as linhas que já estão lá, em vez de sortear outras.
   Quem pede paleta nova é mudar o número de cores, trocar a imagem ou o
   Recalcular. */
function imgMapa(el, refaz){
  var g = gradeDaImagem(el);
  if (!g) return null;
  var nCores = Math.max(2, Math.min(CORES_MAX, el.cores | 0));
  var corte = el.corte == null ? 0.1 : el.corte;

  var vivos = [];
  for (var i = 0; i < g.tinta.length; i++) if (g.tinta[i] > corte) vivos.push(i);
  if (!vivos.length) return { cells: [[0]], paleta: [] };

  var paleta = el.paleta && el.paleta.length && el.paletaDe === nCores && !refaz
    ? el.paleta
    : null;

  if (!paleta){
    // as cores juntadas em baldes antes das k-médias: mil quadradinhos de
    // tons quase iguais custariam mil pontos na conta e dariam o mesmo
    // centro. O balde é de 4 níveis por canal, fino o bastante para não
    // fundir dois tons que a paleta separaria
    var baldes = {}, ordemB = [];
    vivos.forEach(function(idx){
      var c = g.rgb[idx];
      var k = ((c[0] >> 2) << 12) | ((c[1] >> 2) << 6) | (c[2] >> 2);
      if (!baldes[k]){ baldes[k] = { s: [0, 0, 0], peso: 0 }; ordemB.push(k); }
      var b = baldes[k];
      b.s[0] += c[0]; b.s[1] += c[1]; b.s[2] += c[2]; b.peso++;
    });
    var pts = ordemB.map(function(k){
      var b = baldes[k];
      return { lab: labDe(b.s[0] / b.peso, b.s[1] / b.peso, b.s[2] / b.peso), peso: b.peso };
    });
    var cent = kmedias(pts, nCores);
    // o peso de cada centro decide quem escolhe a meada primeiro
    var pesos = cent.map(function(){ return 0; });
    pts.forEach(function(pt){
      var dono = 0, dd = 1e18;
      for (var j = 0; j < cent.length; j++){
        var d = dLab(pt.lab, cent[j]);
        if (d < dd){ dd = d; dono = j; }
      }
      pesos[dono] += pt.peso;
    });
    paleta = casaPaleta(cent, pesos, el.fonte || "anchor");
  }

  // cada quadradinho para o tom mais próximo da paleta
  var mapa = new Array(g.tinta.length);
  for (var v = 0; v < mapa.length; v++) mapa[v] = 0;
  vivos.forEach(function(idx){
    var lab = labDe(g.rgb[idx][0], g.rgb[idx][1], g.rgb[idx][2]);
    var dono = 0, dd = 1e18;
    for (var j = 0; j < paleta.length; j++){
      var d = dLab(lab, paleta[j].lab);
      if (d < dd){ dd = d; dono = j; }
    }
    mapa[idx] = dono + 1;          // zero é vazio, então a paleta é 1-based
  });

  var junta = juntaRepetidas(paleta, mapa);
  paleta = junta.paleta; mapa = junta.mapa;
  paleta = tiraVazias(paleta, mapa);

  var cells = [];
  for (var r = 0; r < g.rows; r++){
    var linha = [];
    for (var q = 0; q < g.cols; q++){
      var val = mapa[r * g.cols + q];
      // linha escondida some do desenho sem sair da paleta: é assim que se
      // tira um fundo que o corte não pegou, sem perder as outras
      if (val && paleta[val - 1] && paleta[val - 1].off) val = 0;
      linha.push(val);
    }
    cells.push(linha);
  }
  return { cells: trim(cells), paleta: paleta, de: nCores };
}

// duas cores que caíram na mesma meada viram uma só: legenda com a mesma
// linha duas vezes manda comprar duas meadas e bordar como se fossem tons
// diferentes, que é o erro que só aparece com a agulha na mão
function juntaRepetidas(paleta, mapa){
  var vistas = {}, para = [], nova = [];
  paleta.forEach(function(sl, i){
    // pela chave da cartela, e pela cor quando a meada foi escolhida à mão e
    // não tem chave — duas casas na mesma linha continuam sendo uma linha só
    var k = sl.chave || "#" + sl.hex;
    if (vistas[k] == null){
      vistas[k] = nova.length;
      nova.push(sl);
    }
    para[i + 1] = vistas[k] + 1;
  });
  if (nova.length === paleta.length) return { paleta: paleta, mapa: mapa };
  for (var i = 0; i < mapa.length; i++) if (mapa[i]) mapa[i] = para[mapa[i]];
  return { paleta: nova, mapa: mapa };
}

// cor que não sobrou em quadradinho nenhum sai da paleta: linha na legenda
// que não aparece no desenho manda comprar meada para nada
function tiraVazias(paleta, mapa){
  var usada = {}, i;
  for (i = 0; i < mapa.length; i++) if (mapa[i]) usada[mapa[i]] = 1;
  // a escondida fica: ela some do desenho de propósito, e sumir da paleta
  // tiraria o caminho de volta
  var para = [], nova = [];
  for (i = 0; i < paleta.length; i++){
    if (!usada[i + 1] && !paleta[i].off){ para[i + 1] = 0; continue; }
    nova.push(paleta[i]);
    para[i + 1] = nova.length;
  }
  if (nova.length === paleta.length) return paleta;
  for (i = 0; i < mapa.length; i++) if (mapa[i]) mapa[i] = para[mapa[i]] || 0;
  return nova;
}

function trim(cells){
  var loX = 1e9, hiX = -1, loY = 1e9, hiY = -1;
  for (var r = 0; r < cells.length; r++){
    for (var q = 0; q < cells[r].length; q++){
      if (!cells[r][q]) continue;
      if (q < loX) loX = q;
      if (q > hiX) hiX = q;
      if (r < loY) loY = r;
      if (r > hiY) hiY = r;
    }
  }
  if (hiX < 0) return [[0]];
  var out = [];
  for (var r2 = loY; r2 <= hiY; r2++) out.push(cells[r2].slice(loX, hiX + 1));
  return out;
}

/* A altura é medida na FONTE, não na palavra: quantos quadradinhos tem a
   maiúscula. Antes ela era a caixa de tinta da palavra escrita — e essa caixa
   sobe com o "l" e desce com o "g", então "amor" e "alegria" na mesma altura
   saíam com letras de tamanhos diferentes, o que não tem como não parecer
   erro. Pela maiúscula, a mesma altura dá sempre a mesma letra, tenha a
   palavra ascendente e descendente ou não — e o que ultrapassa, ultrapassa.

   A medida fica guardada por família, mas só depois que a fonte chegou: antes
   disso o canvas responde pela fonte genérica do sistema, e guardar isso
   congelaria a letra errada para o resto da sessão. */
var refAltura = {};
function alturaRef(x, fam){
  var pronta = !(document.fonts && document.fonts.check) ||
               document.fonts.check(fontStr(100, fam));
  if (pronta && refAltura[fam]) return refAltura[fam];
  x.font = fontStr(100, fam);
  var m = x.measureText("H");
  var cap = m.actualBoundingBoxAscent || 0;
  if (!(cap > 0)){
    // navegador sem caixa de tinta: a caixa da fonte serve de aproximação
    var fb = (m.fontBoundingBoxAscent || 0) + (m.fontBoundingBoxDescent || 0);
    cap = fb > 0 ? fb * 0.7 : 70;
  }
  if (pronta) refAltura[fam] = cap;
  return cap;
}

// a caixa de tinta da palavra e a altura da maiúscula, lado a lado: é a razão
// entre as duas que converte o número velho de altura no novo
function medeTexto(text, fam){
  try {
    var x = document.createElement("canvas").getContext("2d");
    var ref = alturaRef(x, fam);
    x.font = fontStr(100, fam);
    var m = x.measureText(text || " ");
    var h = (m.actualBoundingBoxAscent || 72) + (m.actualBoundingBoxDescent || 28);
    return h > 0 && ref > 0 ? { h: h, ref: ref } : null;
  } catch (e){ return null; }
}

function textMatrix(text, fam, targetRows, thick, thr, esp, arco){
  text = text || " ";
  esp = +esp || 0;
  arco = +arco || 0;
  var c = document.createElement("canvas");
  var x = c.getContext("2d");
  var ref = alturaRef(x, fam);
  x.font = fontStr(100, fam);
  var m0 = x.measureText(text);
  var asc = m0.actualBoundingBoxAscent || 72;
  var dsc = m0.actualBoundingBoxDescent || 28;
  var h = asc + dsc;
  if (h <= 0 || ref <= 0) return [[0]];

  /* Quantos pixels por quadradinho cabem no teto. A conta é feita em
     quadradinhos, que é a única medida que não depende da resposta. */
  var porQuadradinho = targetRows / ref;
  var colsQ = Math.ceil(m0.width * porQuadradinho) + 6;
  var linhasQ = Math.ceil(h * porQuadradinho) + 6;
  var largQ = colsQ, altQ = linhasQ;
  if (arco){
    var angQ = Math.abs(arco) * Math.PI / 180;
    var raioQ = (colsQ - 6) / angQ;
    largQ = colsQ + linhasQ;                       // as pontas giradas avançam
    altQ = linhasQ + raioQ * (1 - Math.cos(angQ / 2));
  }
  var S = Math.max(2, Math.min(SUPER, Math.floor(TETO_CANVAS / Math.max(largQ, altQ, 1))));

  var k = (targetRows * S) / ref;

  /* O espaçamento vai em quadradinhos, e não em pixels ou em por cento: dois
     quadradinhos entre as letras são dois quadradinhos em qualquer altura de
     peça, que é como quem borda conta. Ele entra antes de medir, senão a
     largura sai errada e a palavra nasce cortada. */
  var espPx = esp * S;
  if (espPx && "letterSpacing" in x) x.letterSpacing = (espPx / k) + "px";

  var m = x.measureText(text);
  var left = m.actualBoundingBoxLeft || 0;
  var right = m.actualBoundingBoxRight || m.width;
  var w = left + right;
  if (w <= 0) return [[0]];

  var pad = S * 3;
  var W = Math.ceil(w * k);
  var reto = document.createElement("canvas");
  reto.width = W + pad * 2;
  reto.height = Math.ceil(h * k) + pad * 2;
  var rx = reto.getContext("2d");
  rx.font = fontStr(100 * k, fam);
  if (espPx && "letterSpacing" in rx) rx.letterSpacing = espPx + "px";
  rx.textBaseline = "alphabetic";
  rx.fillStyle = "#000"; rx.strokeStyle = "#000";
  rx.lineJoin = "round"; rx.lineCap = "round";
  var bx = pad + left * k, by = pad + asc * k;
  if (thick > 0){ rx.lineWidth = thick * k * 0.55; rx.strokeText(text, bx, by); }
  rx.fillText(text, bx, by);

  var alvo = reto, ax = rx;
  if (arco){
    /* O arco dobra a IMAGEM da palavra, fatia por fatia, em vez de escrever
       letra por letra sobre a curva. Letra por letra é o jeito comum, e numa
       cursiva ele rompe as ligaduras — e ligadura é o que faz a palavra
       parecer escrita à mão, que é a razão de existir da lista de fontes
       deste app. Dobrando a imagem, a ligação entre as letras acompanha a
       curva junto com o resto do traço. */
    var ang = Math.abs(arco) * Math.PI / 180;
    var R = W / ang;                              // raio que faz a palavra ocupar o arco
    var flecha = R * (1 - Math.cos(ang / 2));     // o quanto o meio sobe ou desce
    alvo = document.createElement("canvas");
    alvo.width = Math.ceil(W + reto.height + pad * 2);
    alvo.height = Math.ceil(reto.height + flecha);
    ax = alvo.getContext("2d");
    var dcx = alvo.width / 2;
    var dby = arco > 0 ? by : by + flecha;        // a linha de base no meio da palavra
    var dcy = arco > 0 ? dby + R : dby - R;       // centro do círculo, abaixo ou acima
    var cxSrc = bx + W / 2;
    for (var sx = 0; sx < W + 2; sx++){
      var phi = ((bx + sx) - cxSrc) / R;
      ax.save();
      if (arco > 0){
        ax.translate(dcx + R * Math.sin(phi), dcy - R * Math.cos(phi));
        ax.rotate(phi);
      } else {
        ax.translate(dcx + R * Math.sin(phi), dcy + R * Math.cos(phi));
        ax.rotate(-phi);
      }
      // duas colunas de largura, uma de sobra: fatia de um pixel só deixa
      // falha entre as vizinhas assim que o arco abre
      ax.drawImage(reto, bx + sx, 0, 2, reto.height, -1, -by, 2, reto.height);
      ax.restore();
    }
  }

  var data = ax.getImageData(0, 0, alvo.width, alvo.height).data;
  return trim(amostraComEncaixe(data, alvo.width, alvo.height, S, thr));
}

/* Onde a grade cai sobre o traço decide a letra. Com a grade num lugar
   qualquer, um traço da largura de um quadradinho cai metade numa coluna e
   metade na outra: nenhuma das duas passa do limite, e o traço some — ou as
   duas passam, e ele engorda. Deslocar a grade um terço de quadradinho
   transforma "pontilhado" em "linha".

   Então a palavra é lida em até nove encaixes — zero, um terço e dois terços
   de quadradinho, em cada eixo — e fica o que tiver a leitura mais limpa:
   o menor erro somado (o quanto cada quadradinho ficou longe de "cheio" ou
   "vazio") mais uma multa por pedaço solto, porque traço partido em ilhas é
   o defeito que mais se vê no bordado. O encaixe zero vem primeiro e ganha os
   empates: palavra que já saía limpa não muda.

   A tinta de cada quadradinho sai de uma tabela de somas acumuladas, quatro
   leituras por quadradinho em qualquer encaixe — por isso nove leituras
   custam quase o mesmo que uma. */
var MULTA_ILHA = 1.5;   // quadradinhos de erro que um pedaço solto custa

function amostraComEncaixe(data, W, H, S, thr){
  var W1 = W + 1, I = new Int32Array(W1 * (H + 1));
  for (var y = 0; y < H; y++){
    var linha = 0;
    for (var x = 0; x < W; x++){
      linha += data[(y * W + x) * 4 + 3] > 90 ? 1 : 0;
      I[(y + 1) * W1 + x + 1] = I[y * W1 + x + 1] + linha;
    }
  }
  var passos = S >= 3 ? [0, Math.round(S / 3), Math.round(2 * S / 3)] : (S === 2 ? [0, 1] : [0]);
  var area = S * S, melhor = null;
  passos.forEach(function(oy){
    passos.forEach(function(ox){
      var cols = Math.floor((W - ox) / S), rows = Math.floor((H - oy) / S);
      var cells = [], erro = 0;
      for (var r = 0; r < rows; r++){
        var line = [], y0 = oy + r * S;
        for (var q = 0; q < cols; q++){
          var x0 = ox + q * S;
          var soma = I[(y0 + S) * W1 + x0 + S] - I[y0 * W1 + x0 + S] -
                     I[(y0 + S) * W1 + x0] + I[y0 * W1 + x0];
          var cob = soma / area, on = cob > thr;
          erro += on ? 1 - cob : cob;
          line.push(on ? 1 : 0);
        }
        cells.push(line);
      }
      var nota = erro + MULTA_ILHA * ilhas(cells);
      if (!melhor || nota < melhor.nota - 1e-9) melhor = { nota: nota, cells: cells };
    });
  });
  return melhor.cells;
}

// pedaços soltos de quadradinhos acesos, contando a vizinhança das diagonais:
// no bordado, dois pontos que se tocam pela quina são o mesmo traço
function ilhas(cells){
  var rows = cells.length, cols = rows ? cells[0].length : 0;
  var visto = new Uint8Array(rows * cols), n = 0, pilha = [];
  for (var r = 0; r < rows; r++)
    for (var q = 0; q < cols; q++){
      if (!cells[r][q] || visto[r * cols + q]) continue;
      n++;
      visto[r * cols + q] = 1;
      pilha.push(r, q);
      while (pilha.length){
        var qq = pilha.pop(), rr = pilha.pop();
        for (var dy = -1; dy <= 1; dy++)
          for (var dx = -1; dx <= 1; dx++){
            var r2 = rr + dy, q2 = qq + dx;
            if (r2 < 0 || q2 < 0 || r2 >= rows || q2 >= cols) continue;
            if (!cells[r2][q2] || visto[r2 * cols + q2]) continue;
            visto[r2 * cols + q2] = 1;
            pilha.push(r2, q2);
          }
      }
    }
  return n;
}

// espelhar troca a ordem das colunas, e mais nada: as células acesas à mão
// viram junto, então espelhar uma peça ajustada não descarta o ajuste
function espelha(cells){
  return cells.map(function(row){ return row.slice().reverse(); });
}

/* Fonte que o seletor não oferece é fonte que não chega, e fonte que não
   chega faz o canvas desenhar numa cursiva genérica — o molde sai errado sem
   avisar. Então o que vem da memória é conferido contra a lista. */
function fonteConhecida(nome){
  if (!nome) return false;
  return !!document.querySelector('#font option[value="' + String(nome).replace(/"/g, "") + '"]');
}

/* O ajuste ponto a ponto não mora nas células: mora numa lista de
   quadradinhos acesos e apagados por cima do que a fonte desenhou. É essa
   lista que faz a correção sobreviver a mexer na altura, no traço ou na
   sensibilidade — antes o desenho era refeito do zero e cada correção durava
   até o toque seguinte num controle, que é trabalho perdido no momento em que
   se está justamente acertando a palavra.

   Quando a grade muda de tamanho, cada ajuste vai na mesma proporção e
   preenche o bloco que passou a ocupar: assim um traço aceso à mão continua
   traço em vez de virar pontilhado ao subir a altura. Não é o mesmo desenho à
   mão de novo — é o mesmo desenho à mão levado junto, para retocar em vez de
   refazer. Quem quiser mesmo a peça limpa tem o Recalcular. */
function aplicaEdits(el, rowsAntes, colsAntes){
  if (!el.edits || !el.edits.length) return;
  var rows = el.cells.length, cols = el.cells[0] ? el.cells[0].length : 0;
  if (!rows || !cols || !rowsAntes || !colsAntes){ el.edits = []; return; }
  var sy = rows / rowsAntes, sx = cols / colsAntes;
  var novos = [], visto = {};
  el.edits.forEach(function(e){
    var r0 = Math.min(rows - 1, Math.max(0, Math.floor(e.r * sy)));
    var q0 = Math.min(cols - 1, Math.max(0, Math.floor(e.q * sx)));
    // grade menor junta dois ajustes no mesmo quadradinho: vale o primeiro
    var ch = r0 + ":" + q0;
    if (visto[ch]) return;
    visto[ch] = 1;
    var r1 = Math.min(rows, Math.max(r0 + 1, Math.round((e.r + 1) * sy)));
    var q1 = Math.min(cols, Math.max(q0 + 1, Math.round((e.q + 1) * sx)));
    for (var r = r0; r < r1; r++)
      for (var q = q0; q < q1; q++) el.cells[r][q] = e.v;
    novos.push({ r: r0, q: q0, v: e.v });
  });
  el.edits = novos;
  el.manual = novos.length;
}

// tocar de novo no mesmo quadradinho devolve o que a fonte tinha desenhado
// ali, então o ajuste sai da lista em vez de virar dois
function marcaEdit(el, r, q, v){
  if (!el.edits) el.edits = [];
  for (var i = 0; i < el.edits.length; i++){
    if (el.edits[i].r === r && el.edits[i].q === q){
      el.edits.splice(i, 1);
      el.manual = el.edits.length;
      return;
    }
  }
  el.edits.push({ r: r, q: q, v: v });
  el.manual = el.edits.length;
}

/* ---- a peça de padrão: moldura e faixa ------------------------------

   Uma peça só, e não uma peça por bloco. Vinte blocos soltos em volta de
   uma foto seriam vinte peças para arrastar, alinhar e laçar, e a primeira
   esbarrada desmancharia o espaçamento que é a graça da moldura. Como peça
   única ela anda, gira e se ajusta ponto a ponto como as outras.

   As células guardam o índice da linha, como o gráfico colorido — e é por
   isso que a legenda por letra, a lista de meadas, a troca de uma linha por
   outra e a conta de fio valem para ela sem uma linha de código a mais. */
var CORES_PAT = ["#E9B7C9", "#7B1F33", "#6F8440", "#C7B3DB", "#24395A",
                 "#E07A3A", "#F3E7C8", "#B3222C"];
var PAT_CORES_MAX = 8, PAT_REP_MAX = 40;

function gradeMotivo(ch, escala){
  var t = ch.slice(0, 2), k = ch.slice(2), linhas;
  if (t === "b:" && BLOCOS[k]) linhas = BLOCOS[k].m;
  else if (t === "m:" && MOTIVOS[k]) linhas = MOTIVOS[k].m;
  else if (t === "s:" && SYMS[k]) linhas = SYMS[k];
  else linhas = BLOCOS.estrela.m;
  var z = Math.max(1, escala | 0), out = [];
  linhas.forEach(function(l){
    var row = [];
    for (var i = 0; i < l.length; i++){
      var c = l.charAt(i);
      var v = c === "X" ? 1 : (c >= "1" && c <= "9" ? +c : 0);
      for (var s = 0; s < z; s++) row.push(v);
    }
    for (var s2 = 0; s2 < z; s2++) out.push(row.slice());
  });
  return out;
}

function motivosDe(el){
  return el.motivo === "sortido"
    ? ORDEM_BLOCOS.map(function(k){ return "b:" + k; })
    : [el.motivo];
}

/* Quantos blocos a moldura leva de cada lado: os suficientes para a abertura
   do meio caber a foto com a margem pedida em volta. A medida vem da foto
   (ou, sem foto, da caixa do meio do papel onde ela estaria), então trocar
   o tamanho da foto refaz a moldura do tamanho certo. */
function aneldaMoldura(el, bh, bw){
  var m = miraMM(), p = P(), g = el.gap | 0;
  var nx = 2 + Math.max(1, Math.ceil(((m.w + 2 * el.margem) / p + g) / (bw + g)));
  var ny = 2 + Math.max(1, Math.ceil(((m.h + 2 * el.margem) / p + g) / (bh + g)));
  // no sentido do relógio a partir do canto de cima à esquerda: é a ordem em
  // que os blocos sortidos se alternam, e ela não deixa dois iguais lado a
  // lado em nenhuma volta
  var lugares = [], q, r;
  for (q = 0; q < nx; q++) lugares.push([0, q]);
  for (r = 1; r < ny; r++) lugares.push([r, nx - 1]);
  for (q = nx - 2; q >= 0; q--) lugares.push([ny - 1, q]);
  for (r = ny - 2; r >= 1; r--) lugares.push([r, 0]);
  return { nx: nx, ny: ny, lugares: lugares };
}

function padraoMatriz(el){
  var N = el.paleta && el.paleta.length ? el.paleta.length : 1;
  var grades = motivosDe(el).map(function(ch){ return gradeMotivo(ch, el.scale); });
  var bh = 0, bw = 0, papeis = 1;
  grades.forEach(function(gr){
    bh = Math.max(bh, gr.length);
    bw = Math.max(bw, gr[0].length);
    gr.forEach(function(l){ l.forEach(function(v){ if (v > papeis) papeis = v; }); });
  });
  var g = Math.max(0, el.gap | 0), lugares, rows, cols;
  if (el.arranjo === "moldura"){
    var an = aneldaMoldura(el, bh, bw);
    lugares = an.lugares;
    rows = an.ny * bh + (an.ny - 1) * g;
    cols = an.nx * bw + (an.nx - 1) * g;
  } else {
    var n = Math.max(1, Math.min(PAT_REP_MAX, el.rep | 0));
    lugares = [];
    for (var i = 0; i < n; i++) lugares.push(el.deitada ? [0, i] : [i, 0]);
    rows = el.deitada ? bh : n * bh + (n - 1) * g;
    cols = el.deitada ? n * bw + (n - 1) * g : bw;
  }
  var cells = [];
  for (var r = 0; r < rows; r++){
    var l0 = [];
    for (var q = 0; q < cols; q++) l0.push(0);
    cells.push(l0);
  }
  /* A meada de cada papel anda pela paleta de bloco em bloco: o bloco i usa
     as linhas i·papéis + 1, + 2, + 3, dando a volta na paleta. Com tantas
     linhas quantos papéis, todo bloco sai igual; com o dobro, eles se
     alternam em dois esquemas — e, com os blocos sortidos se alternando em
     outro ritmo, a moldura sai variada como a de retalhos, sem ninguém ter
     pintado bloco por bloco. */
  lugares.forEach(function(lg, i){
    var gr = grades[i % grades.length];
    var r0 = lg[0] * (bh + g) + Math.floor((bh - gr.length) / 2);
    var q0 = lg[1] * (bw + g) + Math.floor((bw - gr[0].length) / 2);
    for (var r = 0; r < gr.length; r++)
      for (var q = 0; q < gr[r].length; q++){
        var v = gr[r][q];
        if (!v) continue;
        var slot = ((i * papeis + v - 1) % N) + 1;
        if (el.paleta && el.paleta[slot - 1] && el.paleta[slot - 1].off) continue;
        cells[r0 + r][q0 + q] = slot;
      }
  });
  return cells;
}

/* A paleta cresce e encolhe sem mexer no que já está nela: as meadas que
   você trocou à mão ficam, e só as casas novas ganham cor de fábrica. As de
   fábrica são casadas com a linha mais próxima da cartela, para a legenda
   já sair com código de loja e não com uma cor de tela. */
function paletaPat(el, n){
  var velha = el.paleta || [];
  if (velha.length >= n){ el.paleta = velha.slice(0, n); return; }
  // numa linha só, a faixa nasce com a linha corrente, como palavra e
  // símbolo; se ela não for meada de cartela nenhuma, vale a mais próxima
  var daCorrente = n === 1 && !!threadLabel(thread);
  var novas = [];
  for (var i = velha.length; i < n; i++){
    var hex = n === 1 ? thread : CORES_PAT[i % CORES_PAT.length];
    novas.push({ lab: labHex(hex), hex: hex, chave: "",
                 rotulo: daCorrente ? threadLabel(thread) : hex, off: 0 });
  }
  if (!daCorrente && CAT.length){
    var casadas = casaPaleta(novas.map(function(s){ return s.lab; }),
                             novas.map(function(s, i){ return novas.length - i; }),
                             CAT[0].id);
    // a casa não pode repetir uma meada que a paleta já tem: seria a mesma
    // linha duas vezes na legenda
    var tem = {};
    velha.forEach(function(s){ tem[s.hex] = 1; });
    casadas.forEach(function(s, i){ if (s && !tem[s.hex]){ novas[i] = s; tem[s.hex] = 1; } });
  }
  el.paleta = velha.concat(novas);
}

// a moldura fica centrada na foto: é a foto que ela emoldura
function centraNaMira(el){
  var m = miraMM(), b = bboxMM(el);
  el.x = Math.round((m.x + m.w / 2 - b.w / 2) * 10) / 10;
  el.y = Math.round((m.y + m.h / 2 - b.h / 2) * 10) / 10;
}

/* Refazer a peça sem tirá-la do lugar. Quem mexe na altura, na fonte, no
   texto ou na largura espera que a peça cresça ou encolha em volta de onde
   ela está — e não a partir do canto de cima à esquerda, que era o que o
   `rebuild` sozinho fazia: cada ajuste desalinhava o que já estava alinhado,
   e o alinhamento tinha de ser refeito à mão a cada mudança.

   Na vertical há uma exceção, a da foto: a peça que está inteira embaixo da
   foto cresce para baixo, e a que está inteira em cima cresce para cima. O
   nome embaixo da foto que ganhava uma maiúscula alta subia por cima dela;
   assim ele guarda a distância até a foto, que é a medida que foi acertada. */
function refazNoCentro(el, descarta){
  var tem = el.kind === "reto" ? !!el.pontos : el.cells && el.cells.length && el.cells[0].length > 1;
  var b0 = tem ? bboxMM(el) : null;
  var cx0 = b0 ? elPaperBox(el) : null;
  rebuild(el, descarta);
  if (!b0) return;
  var b1 = bboxMM(el);
  el.x = dec1(b0.x + b0.w / 2 - b1.w / 2);
  var y = b0.y + b0.h / 2 - b1.h / 2;
  if (!photo.off && !el.rot){
    if (cx0.y >= photo.y + photo.h - 0.05) y = b0.y;                       // embaixo: o topo fica
    else if (cx0.y + cx0.h <= photo.y + 0.05) y = b0.y + b0.h - b1.h;      // em cima: a base fica
  }
  el.y = dec1(y);
  // a peça que cresceu para fora do papel volta para dentro, se couber nele:
  // o centro é uma preferência, a borda do papel é onde o molde acaba
  var pa = paperMM(), c = elPaperBox(el);
  if (c.w <= pa.w && cx0.x >= -0.05 && cx0.x + cx0.w <= pa.w + 0.05){
    if (c.x < 0) el.x = dec1(el.x - c.x); else if (c.x + c.w > pa.w) el.x = dec1(el.x - (c.x + c.w - pa.w));
  }
  if (c.h <= pa.h && cx0.y >= -0.05 && cx0.y + cx0.h <= pa.h + 0.05){
    if (c.y < 0) el.y = dec1(el.y - c.y); else if (c.y + c.h > pa.h) el.y = dec1(el.y - (c.y + c.h - pa.h));
  }
}

/* A peça de ponto reto não tem células: tem caminhos e, deles, os furos. O
   desenho é refeito dos números da peça, encostado no zero, e a caixa dela é
   a dos furos. Espelhar vira o x. */
function refazReto(el){
  var d = DESENHOS_RETO[el.desenho] || DESENHOS_RETO.colmeia;
  el.desenho = DESENHOS_RETO[el.desenho] ? el.desenho : "colmeia";
  var op = opcoesReto(el), cams;
  op.passo = el.passo || RETO_PASSO;   // a folha precisa saber onde caem os furos da borda
  if (el.desenho === "palavra"){
    cams = palavraEmLinhas(el.texto || " ", el.font || FONTE_PADRAO, el.medida, 0);
  } else if (el.desenho === "imagem"){
    var img = origemPronta(el);
    // imagem que ainda não voltou da memória: os furos gravados continuam
    if (!img){ if (el.pontos) return; cams = []; }
    else cams = imagemEmLinhas(img, el.medida, op.sens, el.inv, el.modo);
  } else {
    cams = d.faz(el.medida, op);
    if (el.arranjo === "faixa")
      cams = arranjaFaixa(cams, Math.max(1, Math.min(40, el.rep | 0 || 1)), +el.gap || 0, el.deitada);
    else if (el.arranjo === "moldura"){
      // em volta da foto, centrada nela: o retângulo é a foto mais a margem
      var mira = miraMM(), mg = +el.margem || 0;
      var ret = { x: -mira.w / 2 - mg, y: -mira.h / 2 - mg, w: mira.w + 2 * mg, h: mira.h + 2 * mg };
      cams = (el.desenho === "ziguezague" || el.desenho === "ondas")
        ? molduraContinua(el.desenho, ret, op) : arranjaMoldura(cams, ret, +el.gap || 0);
    }
  }
  var pontos = pontosDoDesenho(cams, el.passo || RETO_PASSO);
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  pontos.forEach(function(pt){ pt.furos.forEach(function(f){
    x0 = Math.min(x0, f[0]); y0 = Math.min(y0, f[1]);
    x1 = Math.max(x1, f[0]); y1 = Math.max(y1, f[1]);
  }); });
  if (!(x1 >= x0)){ x0 = y0 = 0; x1 = y1 = 1; }
  var w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
  el.pontos = pontos.map(function(pt){
    return { fechada: pt.fechada, furos: pt.furos.map(function(f){
      var x = f[0] - x0, y = f[1] - y0;
      return [Math.round((el.flip ? w - x : x) * 100) / 100, Math.round(y * 100) / 100];
    }) };
  });
  el.w = w; el.h = h;
  el.edits = []; el.manual = 0;
}

// descarta: só o Recalcular pede a peça limpa, e ele avisa antes
function rebuild(el, descarta){
  if (el.kind === "reto"){ refazReto(el); return; }
  var rowsAntes = el.cells && el.cells.length ? el.cells.length : 0;
  var colsAntes = rowsAntes && el.cells[0] ? el.cells[0].length : 0;
  var novas;
  if (el.kind === "sym") novas = matrixFromStrings(SYMS[el.sym], el.scale);
  else if (el.kind === "pat"){
    paletaPat(el, Math.max(1, Math.min(PAT_CORES_MAX, el.cores | 0)));
    novas = padraoMatriz(el);
  }
  else if (el.kind === "img"){
    if (temPaleta(el)){
      // o Recalcular é o único que pede paleta nova: mexer na largura
      // reaproveita as linhas que já estão na peça, senão trocar um número
      // devolveria outras meadas sem ninguém ter pedido
      var m = imgMapa(el, !!descarta);
      if (m){ el.paleta = m.paleta; el.paletaDe = m.de; novas = m.cells; }
    } else {
      el.paleta = null; el.paletaDe = 0;
      novas = imgMatrix(el);
    }
  }
  else novas = textMatrix(el.text, el.font, el.rowsTarget, el.thick, el.thr, el.esp, el.arc);
  // imagem que ainda não voltou da memória não desfaz a peça: as células
  // gravadas continuam valendo, e mexer na largura volta a funcionar assim
  // que ela chega. Vale para o Recalcular também — peça que não dá para
  // refazer é peça que se preserva
  if (!novas) return;
  el.cells = novas;
  if (el.flip) el.cells = espelha(el.cells);
  if (descarta) el.edits = [];
  else aplicaEdits(el, rowsAntes, colsAntes);
  el.manual = el.edits ? el.edits.length : 0;
}
