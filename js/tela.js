/* ponto & letra — tela.js
   O desenho na tela: papel, foto, pontos, réguas.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

function drawPhoto(ctx, k, region, alpha){
  if (photo.off) return;
  var X = (photo.x - region.x) * k, Y = (photo.y - region.y) * k;
  var W = photo.w * k, H = photo.h * k;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (photoImg){
    var ir = photoImg.width / photoImg.height, tr = photo.w / photo.h;
    var sw, sh, sx, sy;
    if (ir > tr){ sh = photoImg.height; sw = sh * tr; sx = (photoImg.width - sw) / 2; sy = 0; }
    else { sw = photoImg.width; sh = sw / tr; sx = 0; sy = (photoImg.height - sh) / 2; }
    ctx.drawImage(photoImg, sx, sy, sw, sh, X, Y, W, H);
  } else {
    ctx.fillStyle = "#DDD8CC";
    ctx.fillRect(X, Y, W, H);
    ctx.fillStyle = "#9A948A";
    ctx.font = (12) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(fmt(photo.w) + " × " + fmt(photo.h) + " mm", X + W / 2, Y + H / 2);
    ctx.textAlign = "start";
  }
  ctx.restore();
  ctx.strokeStyle = "#1E2A26";
  ctx.lineWidth = 1;
  ctx.strokeRect(X + .5, Y + .5, W - 1, H - 1);
}

/* Na mesa, o ponto reto é o risco do fio de furo a furo, na cor da linha, e
   o furo um pontinho escuro: é o furo que se fura, e na colmeia e na palavra
   ele é a única coisa que diz onde o ponto acaba. */
function drawReto(ctx, el, k, region, color, lw){
  var b = bboxMM(el);
  ctx.save();
  ctx.translate((b.x - region.x + b.w / 2) * k, (b.y - region.y + b.h / 2) * k);
  ctx.rotate(el.rot * Math.PI / 180);
  ctx.translate(-b.w / 2 * k, -b.h / 2 * k);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.2, lw * 0.9);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  (el.pontos || []).forEach(function(pt){
    var f = pt.furos;
    ctx.beginPath();
    ctx.moveTo(f[0][0] * k, f[0][1] * k);
    for (var i = 1; i < f.length; i++) ctx.lineTo(f[i][0] * k, f[i][1] * k);
    if (pt.fechada) ctx.closePath();
    ctx.stroke();
  });
  if (editing && el._escolhido){
    ctx.strokeStyle = "#D7263D"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(el._escolhido[0] * k, el._escolhido[1] * k, Math.max(5, 1.2 * k), 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = color;
  }
  ctx.fillStyle = "#26323D";
  var r = Math.max(1, Math.min(2.2, 0.32 * k));
  (el.pontos || []).forEach(function(pt){ pt.furos.forEach(function(f){
    ctx.beginPath(); ctx.arc(f[0] * k, f[1] * k, r, 0, Math.PI * 2); ctx.fill();
  }); });
  ctx.restore();
}

function drawStitches(ctx, el, k, region, color, lw){
  if (el.kind === "reto") return drawReto(ctx, el, k, region, color, lw);
  var p = P() * k;
  var b = bboxMM(el);
  ctx.save();
  ctx.translate((b.x - region.x + b.w / 2) * k, (b.y - region.y + b.h / 2) * k);
  ctx.rotate(el.rot * Math.PI / 180);
  ctx.translate(-b.w / 2 * k, -b.h / 2 * k);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  var inset = p * 0.22;
  // a peça de paleta troca de cor de quadradinho para quadradinho, e trocar
  // o `strokeStyle` a cada ponto custa caro num gráfico de milhares deles:
  // só se troca quando a cor muda de verdade
  var atual = color;
  for (var r = 0; r < el.cells.length; r++){
    for (var q = 0; q < el.cells[r].length; q++){
      if (!el.cells[r][q]) continue;
      var sl = corCel(el, el.cells[r][q]);
      if (sl && sl.hex !== atual){ atual = sl.hex; ctx.strokeStyle = atual; }
      else if (!sl && atual !== color){ atual = color; ctx.strokeStyle = atual; }
      var X = q * p, Y = r * p;
      ctx.beginPath();
      ctx.moveTo(X + inset, Y + inset); ctx.lineTo(X + p - inset, Y + p - inset);
      ctx.moveTo(X + p - inset, Y + inset); ctx.lineTo(X + inset, Y + p - inset);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawOutline(ctx, el, k, region){
  var b = bboxMM(el);
  ctx.save();
  ctx.translate((b.x - region.x + b.w / 2) * k, (b.y - region.y + b.h / 2) * k);
  ctx.rotate(el.rot * Math.PI / 180);
  ctx.strokeStyle = "#384959";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeRect(-b.w / 2 * k - 3, -b.h / 2 * k - 3, b.w * k + 6, b.h * k + 6);
  ctx.setLineDash([]);
  ctx.restore();
}

function paint(ctx, k, region, opts){
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, region.w * k, region.h * k);
  drawPhoto(ctx, k, region, opts.photoAlpha);
  totalCount = 0; totalHoles = 0;
  els.forEach(function(el, i){
    totalCount += countOf(el);
    totalHoles += holesOf(el).length;
    drawStitches(ctx, el, k, region, corDe(el).hex, Math.max(1.3, P() * k * 0.15));
    if (opts.outline && marcado(i)) drawOutline(ctx, el, k, region);
  });
  if (opts.outline && marcaFoto) drawFotoOutline(ctx, k, region);
  if (opts.outline) drawColados(ctx, k, region);
  if (opts.outline && laco) drawLaco(ctx, k, region);
}

// a foto também ganha contorno quando está marcada: sem isso, um bloco de
// foto mais palavras ficaria com metade dele sem dizer que está laçada
function drawFotoOutline(ctx, k, region){
  ctx.save();
  ctx.strokeStyle = "#384959";
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeRect((photo.x - region.x) * k - 3, (photo.y - region.y) * k - 3,
                 photo.w * k + 6, photo.h * k + 6);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawLaco(ctx, k, region){
  var r = lacoRect();
  ctx.save();
  ctx.fillStyle = "rgba(56,73,89,.07)";
  ctx.strokeStyle = "#384959";
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1;
  ctx.fillRect((r.x - region.x) * k, (r.y - region.y) * k, r.w * k, r.h * k);
  ctx.strokeRect((r.x - region.x) * k, (r.y - region.y) * k, r.w * k, r.h * k);
  ctx.setLineDash([]);
  ctx.restore();
}

/* O aviso de escala mora colado no botão de baixar, porque é sobre o que vai
   sair quando ele for apertado. Três estados: cabe, cabe por pouco, não cabe. */
var AVISO_CAPA = "O que vai ser recortado não cabe embaixo do cabeçalho, então o PDF sai em duas " +
  "páginas: a primeira com as instruções, a régua e a legenda, a segunda com o molde " +
  "sozinho na folha, inteiro e em tamanho real. Imprimir e usar é só a segunda.";

function showFit(cr){
  var plano = pdfPlan(cr, contentArea());
  var pageH = folhaH(plano.land), nomeF = folhaAtual.nome;
  /* A folga é medida contra a folha que o PDF vai mesmo usar. Na folha de
     instrução o molde ganha a página inteira, e aí quem manda é a distância
     do furo à borda, não da região: a folga em volta do desenho pode encostar
     na margem sem custar um ponto. O próprio plano já traz essa conta. */
  var folga = plano.capa ? plano.folga
    : Math.min(plano.pageW - PDF_SIDE * 2 - cr.w, pageH - PDF_TOP - footMM() - cr.h);
  /* A área continua sendo a do desenho, e não a da moldura: com a moldura
     valendo a folha inteira, esse número viraria "21 × 29,7 cm" em todo molde
     e deixaria de dizer o tamanho da peça, que é para o que se olha. */
  var ju = cropJusto();
  var area = fmt(ju.w / 10) + " × " + fmt(ju.h / 10) + " cm";
  // a moldura só encolhe para o desenho quando a folha inteira custaria uma
  // folha de molde a mais; dizer isso evita a pergunta
  var recorte = folhaCheia(cr) ? "" :
    " A moldura de recorte sai no tamanho do desenho, e não na folha inteira: " +
    "há furo perto demais da borda do papel, e a folha inteira sairia repartida.";
  var box = $("fitHint"), txt = $("fitTxt"), state = "";
  var fora = pecasForaDoPapel();
  var fotoFora = fotoForaDoPapel();
  avisaFotoCabe();               // o aviso dos painéis acompanha o da barra

  if (fora || fotoFora){
    // vem antes de tudo: não adianta saber em quantas folhas sai um molde
    // a que está faltando meia palavra — ou a foto inteira
    state = "over";
    var quem = [];
    if (fotoFora) quem.push("a foto");
    if (fora) quem.push(fora === 1 ? "1 peça" : fora + " peças");
    txt.textContent = quem.join(" e ") + " fora do papel";
    var pa = paperMM();
    box.title = (fotoFora
      ? "A foto tem " + fmt(photo.w) + " × " + fmt(photo.h) + " mm e o papel, " +
        fmt(pa.w) + " × " + fmt(pa.h) + " mm. "
      : "") +
      (fora ? (fora === 1 ? "Uma peça passou" : fora + " peças passaram") +
              " da borda do papel. " : "") +
      "O molde é recortado no papel, então o que está fora não vai sair no PDF. " +
      (fotoFora ? "Mude o tamanho da foto ou do papel. " : "") +
      (fora ? "Arraste de volta, ou use os botões de alinhar na aba peças." : "");
  } else if (colados && colados.n){
    // furo colado rasga o papel: vem logo depois do que está fora dele
    state = "over";
    // dentro de uma peça só, é palavra (ou desenho) pequena demais para o ponto
    var dentro = colados.pares.filter(function(c){ return c.i === c.j; }).length;
    var np = colados.pares.length - dentro;
    txt.textContent = np ? "furos colados entre " + (np === 1 ? "2 peças" : np + " pares de peças")
                         : "furos colados dentro de " + (dentro === 1 ? "1 peça" : dentro + " peças");
    box.title = colados.n + (colados.n === 1 ? " furo fica" : " furos ficam") +
      " a menos de " + fmt(colados.d) + " mm de um furo de outra peça. No papel a tira " +
      "entre eles rasga. A região tracejada em vermelho mostra onde: afaste as peças, ou " +
      "encoste-as até os furos coincidirem — furo no mesmo lugar vira um furo só." +
      (dentro ? " Dentro de uma peça de ponto reto, é o desenho pequeno para o ponto: " +
                "aumente a peça ou encurte o ponto." : "");
  } else if (plano.tiled){
    var n = plano.cols * plano.rows;
    state = "multi";
    txt.textContent = "tamanho real em " + n + " folhas";
    box.title = "Área do molde: " + area + " — não cabe numa folha " + nomeF + " inteira, então o PDF sai " +
      "em " + n + " folhas (" + plano.rows + " × " + plano.cols + "), todas em tamanho real. " +
      "As vizinhas repetem uma faixa do desenho: é por ela que você sobrepõe uma na outra " +
      "até os furos coincidirem.";
  } else if (folga < 5){
    state = "tight";
    txt.textContent = "cabe em " + nomeF + " · " + fmt(folga) + " mm de folga";
    box.title = "Área do molde: " + area + ". Cabe numa folha " + nomeF + " em tamanho real, com " +
      fmt(folga) + " mm de sobra até a margem." + recorte + (plano.capa ? " " + AVISO_CAPA : "");
  } else {
    txt.textContent = "cabe em " + nomeF + " · tamanho real";
    box.title = "Área do molde: " + area + ". Cabe numa folha " + nomeF + " em tamanho real." +
      recorte + (plano.capa ? " " + AVISO_CAPA : "");
  }
  box.className = "fit" + (state ? " " + state : "");
  $("areaOut").textContent = "área do molde " + area;
  var mn = manualCount();
  $("manualOut").textContent = mn ? mn + (mn === 1 ? " quadradinho" : " quadradinhos") + " à mão" : "";
}

/* Réguas em centímetros com o zero na borda do papel — não na borda da mesa.
   Régua cujo zero está em outro lugar não mede nada. */
// a espessura da régua é uma coisa só, definida no CSS: lida daqui para o
// JS não guardar uma cópia que possa envelhecer sozinha
var RULE = parseFloat(getComputedStyle(document.documentElement)
             .getPropertyValue("--rule")) || 22;

function rulers(k){
  var cvr = cv.getBoundingClientRect();
  var mr = $("mesa").getBoundingClientRect();
  var pxcm = k * 10;
  if (!(pxcm > 0)) return;
  // as réguas começam depois do quadradinho de canto, então o zero do papel
  // vale o mesmo desconto nos dois eixos
  var ox = cvr.left - mr.left - RULE;
  var oy = cvr.top - mr.top - RULE;
  var larg = mr.width - RULE, alt = mr.height - RULE;
  // A régua mede o papel, não a mesa: o zero é a borda da folha, então marca
  // fora dela não mede coisa nenhuma — "32" numa folha de 29,7 só engana. O
  // último tique é o último centímetro inteiro que cabe no papel.
  var pa = paperMM();
  var fimX = pa.w / 10, fimY = pa.h / 10;
  var a = "", b = "", i, x, y, big;
  var passo = pxcm < 14 ? 5 : (pxcm < 30 ? 2 : 1);   // sem números grudados
  var i0 = Math.max(0, Math.floor(-ox / pxcm));
  for (i = i0; i <= fimX && (x = ox + i * pxcm) < larg && i - i0 < 600; i++){
    big = i % passo === 0;
    a += '<span class="t' + (big ? " big" : "") + '" style="left:' + x + 'px"></span>';
    if (big) a += '<span class="l" style="left:' + x + 'px">' + i + '</span>';
  }
  i0 = Math.max(0, Math.floor(-oy / pxcm));
  for (i = i0; i <= fimY && (y = oy + i * pxcm) < alt && i - i0 < 600; i++){
    big = i % passo === 0;
    b += '<span class="t' + (big ? " big" : "") + '" style="top:' + y + 'px"></span>';
    if (big) b += '<span class="l" style="top:' + y + 'px">' + i + '</span>';
  }
  $("rulerH").innerHTML = a;
  $("rulerV").innerHTML = b;
  guiasRender(ox, oy, k);      // as guias medem pela mesma origem que a régua
}

/* A busca de furos colados roda depois do último desenho, e não a cada um:
   num arraste são dezenas de desenhos por segundo, e o que interessa é onde
   a peça foi solta. Enquanto se mexe, as marcas somem; paradas, voltam. */
var colados = null, coladosTimer = 0, coladosDesenhando = false;
function agendaColados(){
  if (coladosDesenhando) return;
  colados = null;
  clearTimeout(coladosTimer);
  coladosTimer = setTimeout(function(){
    colados = furosColados();
    coladosDesenhando = true;
    try { draw(); } finally { coladosDesenhando = false; }
  }, 200);
}

// a região onde duas peças se encostam, tracejada em vermelho por cima, com
// uma folga em volta para o traço não cobrir os furos que ele aponta
function drawColados(ctx, k, region){
  if (!colados || !colados.pares.length) return;
  ctx.save();
  ctx.strokeStyle = "#D7263D";
  ctx.fillStyle = "rgba(215, 38, 61, 0.08)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  var m = Math.max(4, colados.d * k);
  colados.pares.forEach(function(c){
    var x = (c.x - region.x) * k - m, y = (c.y - region.y) * k - m;
    var w = c.w * k + 2 * m, h = c.h * k + 2 * m;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  });
  ctx.restore();
}

// o recorte do papel na mesa: os cantos redondos somem do papel, e o furo da
// fita aparece tracejado, onde a tesoura e o furador vão passar
function recorteNaMesa(ctx, k, pa){
  if (papelCantos > 0){
    var r = Math.min(papelCantos, pa.w / 2, pa.h / 2) * k, W = pa.w * k, H = pa.h * k;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.moveTo(r, 0); ctx.arcTo(0, 0, 0, r, r); ctx.lineTo(0, H - r); ctx.arcTo(0, H, r, H, r);
    ctx.lineTo(W - r, H); ctx.arcTo(W, H, W, H - r, r); ctx.lineTo(W, r); ctx.arcTo(W, 0, W - r, 0, r);
    ctx.closePath();
    ctx.fill("evenodd");
    ctx.restore();
  }
  if (papelFita){
    var f = furoFita();
    ctx.save();
    ctx.strokeStyle = "#6B7C8C"; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(f.x * k, f.y * k, f.r * k, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

function draw(){
  acompanhaAlvos();
  var cv = $("grid"), ctx = cv.getContext("2d");
  var pa = paperMM();
  var box = cv.parentNode;
  var availW = box.clientWidth - 40;
  var availH = box.clientHeight - 40;
  fitK = Math.min(availW / pa.w, availH / pa.h);
  if (!(fitK > 0)) fitK = 1;
  var k = fitK * zoom;
  var dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(pa.w * k * dpr);
  cv.height = Math.round(pa.h * k * dpr);
  cv.style.width = (pa.w * k) + "px";
  cv.style.height = (pa.h * k) + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint(ctx, k, { x: 0, y: 0, w: pa.w, h: pa.h }, { photoAlpha: 1, outline: true });
  cv._k = k;

  $("count").textContent = totalCount.toLocaleString("pt-BR");
  $("holes").textContent = totalHoles.toLocaleString("pt-BR");
  var el = els[sel];
  if (el){
    var b = bboxMM(el);
    $("size").textContent = fmt(b.w / 10) + " × " + fmt(b.h / 10) + " cm";
    // a altura pedida vale em quadradinhos; quem borda compra régua em
    // milímetros, então o número aparece nas duas medidas
    $("letraMM").textContent = el.kind === "text"
      ? el.rowsTarget + " quadradinhos · " + fmt(el.rowsTarget * P()) + " mm"
      : "—";
  } else { $("size").textContent = "—"; $("letraMM").textContent = "—"; }

  recorteNaMesa(ctx, k, pa);
  showFit(cropArea());
  renderFios();
  mostraMedidas();
  variosPainel();
  rulers(k);
  agendaColados();

  // toda alteração de estado passa por aqui, então é o único lugar que precisa
  // pedir a gravação; o adiamento junta as centenas de draws de um arraste num
  // único write ao fim do gesto. O desenho que só acrescenta as marcas de
  // furos colados não mudou nada no molde, e não adia a gravação
  if (!coladosDesenhando) scheduleSave();
}
