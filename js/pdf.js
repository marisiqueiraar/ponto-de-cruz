/* ponto & letra — pdf.js
   Entregar arquivos e montar o PDF do molde.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

function saveName(ext){
  var it = itemAtual();
  var el = els[sel];
  var t = ((it && it.nome) || (el && el.kind === "text" ? el.text : "") || "bordado")
    .trim().replace(/\s+/g, "-").replace(/[^A-Za-z0-9\-]/g, "");
  return "molde-" + (t || "ponto-cruz") + "." + ext;
}

function showImage(url){
  var box = $("out");
  box.innerHTML = "";
  var p = document.createElement("p");
  p.className = "hint"; p.style.marginTop = "20px";
  p.textContent = "Segure a imagem abaixo e escolha Salvar em Fotos.";
  var img = document.createElement("img");
  img.src = url; img.alt = "Prévia gerada";
  img.style.maxWidth = "100%";
  img.style.border = "1px solid var(--line)";
  img.style.borderRadius = "6px";
  img.style.background = "#fff";
  box.appendChild(p); box.appendChild(img);
}

function dataURLToBlob(d){
  var parts = d.split(","), bin = atob(parts[1]), len = bin.length;
  var arr = new Uint8Array(len);
  for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: "image/png" });
}

// Salvar o arquivo é a única parte do app que muda de aparelho para aparelho,
// então há três caminhos, do melhor para o pior:
//   1. Chrome/Edge no desktop têm showSaveFilePicker: abre o diálogo do Windows
//      e o arquivo cai na pasta escolhida. É o único caminho que pergunta.
//   2. o iPhone não tem picker, e o jeito de chegar na pasta Arquivos é a folha
//      de compartilhar, onde existe "Salvar em Arquivos".
//   3. o resto cai no <a download>, que vai para a pasta de downloads, sem perguntar.
// O <a download> nunca leva target="_blank": com os dois juntos o Safari ignora
// o download e apenas abre o arquivo numa aba, que era o que acontecia aqui.
function deliver(blob, name, dataUrlForImg){
  if (window.showSaveFilePicker){
    savePicker(blob, name).then(function(r){
      if (r === "salvo"){ saved(name); return; }
      if (r === "cancelado") return;          // fechou o diálogo de propósito
      if (!anchorDownload(blob, name)) rescue(blob, name, dataUrlForImg);
      else saved(name);
    });
    return;
  }

  var file = null;
  try { if (window.File) file = new File([blob], name, { type: blob.type }); } catch(e){}
  if (file && navigator.canShare && navigator.canShare({ files: [file] })){
    navigator.share({ files: [file] }).then(function(){ clearOut(); }).catch(function(err){
      if (err && err.name === "AbortError") return;
      if (!anchorDownload(blob, name)) rescue(blob, name, dataUrlForImg);
      else saved(name);
    });
    return;
  }

  if (!anchorDownload(blob, name)) rescue(blob, name, dataUrlForImg);
  else saved(name);
}

function isPDF(name){ return name.slice(-4).toLowerCase() === ".pdf"; }

// o diálogo "salvar como" de verdade. Devolve sempre uma promessa que resolve
// em texto, para quem chamou decidir sem precisar distinguir tipos de erro.
function savePicker(blob, name){
  var tipo = isPDF(name)
    ? { description: "Molde em PDF", accept: { "application/pdf": [".pdf"] } }
    : { description: "Imagem PNG",   accept: { "image/png":       [".png"] } };
  return window.showSaveFilePicker({ suggestedName: name, types: [tipo] })
    .then(function(handle){ return handle.createWritable(); })
    .then(function(w){
      return w.write(blob).then(function(){ return w.close(); });
    })
    .then(function(){ return "salvo"; })
    .catch(function(err){
      return (err && err.name === "AbortError") ? "cancelado" : "falhou";
    });
}

// download comum, direto para a pasta de downloads. Devolve se o clique saiu.
function anchorDownload(blob, name){
  var href = null;
  try { href = URL.createObjectURL(blob); } catch(e){ return false; }
  try {
    var a = document.createElement("a");
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  } catch(e){
    URL.revokeObjectURL(href);
    return false;
  }
  // o blob precisa sobreviver ao download; um minuto é folga de sobra
  setTimeout(function(){ URL.revokeObjectURL(href); }, 60000);
  return true;
}

function clearOut(){ $("out").innerHTML = ""; }

function saved(name){
  var box = $("out");
  box.innerHTML = "";
  var p = document.createElement("p");
  p.className = "hint"; p.style.marginTop = "20px";
  p.textContent = "Pronto: " + name + " salvo.";
  box.appendChild(p);
}

// último recurso, quando nem o picker nem o download saíram: um link na página
// para a pessoa clicar na mão. No celular sem compartilhar, a prévia em imagem
// ainda é o caminho para "Salvar em Fotos".
function rescue(blob, name, dataUrlForImg){
  if (dataUrlForImg){ showImage(dataUrlForImg); return; }
  var href = null;
  try { href = URL.createObjectURL(blob); } catch(e){ return; }
  var box = $("out");
  box.innerHTML = "";
  var p = document.createElement("p");
  p.className = "hint"; p.style.marginTop = "20px";
  var link = document.createElement("a");
  link.href = href; link.download = name;
  link.textContent = "Baixar " + (isPDF(name) ? "o PDF" : "a imagem") + " na mão";
  link.style.color = "var(--mat)";
  p.appendChild(document.createTextNode("Não baixou sozinho? "));
  p.appendChild(link);
  box.appendChild(p);
}

$("dl").addEventListener("click", function(){
  var pa = paperMM();
  var k = Math.min(6, 1400 / pa.w);
  var c = document.createElement("canvas");
  c.width = Math.round(pa.w * k); c.height = Math.round(pa.h * k);
  paint(c.getContext("2d"), k, { x:0, y:0, w:pa.w, h:pa.h }, { photoAlpha: 1, outline: false });
  var url = c.toDataURL("image/png");
  var blob = null;
  try { blob = dataURLToBlob(url); } catch(e){}
  if (blob) deliver(blob, saveName("png"), url); else showImage(url);
});

/* Régua impressa. É o único jeito de descobrir, antes de furar, que a
   impressora reduziu a página: se estes 50 mm não medirem 50 mm na régua de
   verdade, o molde inteiro está fora de escala e nenhum furo vai bater. */
function reguaAfericao(pdf, x, y){
  pdf.setDrawColor(20);
  pdf.setLineWidth(0.3);
  pdf.line(x, y, x + 50, y);
  for (var i = 0; i <= 50; i += 10)
    pdf.line(x + i, y, x + i, y - (i % 50 === 0 ? 2.8 : 1.6));
  pdf.setFontSize(7);
  pdf.setTextColor(80);
  pdf.text("50 mm exatos", x + 53, y);
}

// mapinha das folhas: numa mesa com seis folhas parecidas, o desenho de qual
// é qual resolve mais rápido que o número escrito.
function mapaFolhas(pdf, plano, idx, dir, y){
  var c = Math.min(4, 24 / plano.cols, 20 / plano.rows);
  var x = dir - plano.cols * c;
  pdf.setLineWidth(0.15);
  pdf.setDrawColor(150);
  pdf.setFillColor(56, 73, 89);
  for (var r = 0; r < plano.rows; r++)
    for (var q = 0; q < plano.cols; q++)
      pdf.rect(x + q * c, y + r * c, c, c, (r * plano.cols + q) === idx ? "FD" : "D");
}

/* A legenda no rodapé. Sem ela o molde impresso não diz qual linha é qual:
   o traço sai na cor, mas cor de tela não é código de meada, e quem volta ao
   trabalho uma semana depois não tem como saber o que comprar de novo.
   Vai em toda folha, porque cada folha é recortada e usada sozinha. */
function legenda(pdf, plano){
  var usadas = linhasUsadas();
  if (!usadas.length) return;
  var comLetra = temGrafico();
  var util = plano.pageW - PDF_SIDE * 2;
  var y = folhaH(plano.land) - footMM() + 4;
  var x = 12, linha = 1, max = legendaLinhas();
  pdf.setFontSize(7);
  for (var i = 0; i < usadas.length; i++){
    var w = 9.5 + pdf.getTextWidth((comLetra ? usadas[i].letra + "  " : "") + usadas[i].rotulo);
    if (x > 12 && x - 12 + w > util){
      if (linha >= max){
        pdf.setTextColor(120);
        pdf.text("+ " + (usadas.length - i) + " linhas - legenda inteira na ultima folha", x, y);
        return;
      }
      linha++; x = 12; y += FOOT_LINHA;
    }
    var rgb = hexRGB(usadas[i].hex);
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    pdf.setDrawColor(120);
    pdf.setLineWidth(0.15);
    pdf.rect(x, y - 2.4, 3.2, 3.2, "FD");
    pdf.setTextColor(60);
    pdf.text((comLetra ? usadas[i].letra + "  " : "") + usadas[i].rotulo, x + 4.6, y);
    x += w;
  }
}

/* Legenda que não cabe em três linhas de rodapé vira folha. Truncar era a
   saída certa quando a legenda tinha duas ou três cores — um molde de
   gráfico colorido tem quinze, e um molde que não diz que linha vai em que
   letra não é molde, é desenho bonito.

   A folha vem por último e não leva molde nenhum: quem já sabe as linhas não
   imprime ela. */
function folhaLegenda(pdf, plano){
  var usadas = linhasUsadas();
  pdf.addPage(folhaAtual.jspdf, "portrait");
  pdf.setFontSize(15);
  pdf.setTextColor(20);
  pdf.text("Linhas do molde", 12, 15);
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  pdf.text("A letra e a que esta escrita dentro de cada quadradinho do molde. " +
           "Os metros sao de fio como ele passa no furo.", 12, 22);

  var colW = 92, x0 = 12, y0 = 32, passo = 6.4, porCol = Math.floor((280 - y0) / passo);
  pdf.setFontSize(8);
  usadas.forEach(function(l, i){
    var col = Math.floor(i / porCol), y = y0 + (i % porCol) * passo;
    if (col > 1) return;                   // duas colunas cabem; mais que isso não há
    var x = x0 + col * colW;
    var rgb = hexRGB(l.hex);
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    pdf.setDrawColor(120);
    pdf.setLineWidth(0.15);
    pdf.rect(x, y - 3.2, 4.4, 4.4, "FD");
    var t = corLegivel(l.hex);
    pdf.setTextColor(t[0], t[1], t[2]);
    pdf.setFont("helvetica", "bold");
    pdf.text(l.letra, x + 7.4, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(40);
    pdf.text(l.nome, x + 12.5, y);
    pdf.setTextColor(110);
    pdf.text(l.pontos.toLocaleString("pt-BR") + " pontos", x + 50, y);
    pdf.text(fmt(l.metros) + " m", x + 74, y);
  });
  if (usadas.length > porCol * 2){
    pdf.setTextColor(120);
    pdf.text("+ " + (usadas.length - porCol * 2) + " linhas nao couberam nesta folha.",
             12, y0 + porCol * passo + 6);
  }
}

function cabecalho(pdf, plano, idx){
  var pa = paperMM();
  var it = itemAtual(), t = els[sel];
  pdf.setFontSize(15);
  pdf.setTextColor(20);
  pdf.text((it && it.nome) || (t && t.kind === "text" && t.text) || "molde de furos", 12, 15);

  var y = 21;
  if (plano.tiled){
    pdf.setFontSize(10);
    pdf.setTextColor(56, 73, 89);
    pdf.text("folha " + (idx + 1) + " de " + (plano.cols * plano.rows) + "   |   linha " +
             (Math.floor(idx / plano.cols) + 1) + ", coluna " + (idx % plano.cols + 1), 12, 21);
    mapaFolhas(pdf, plano, idx, plano.pageW - 12, 9);
    y = 27;
  }

  pdf.setFontSize(9);
  pdf.setTextColor(80);
  var linhas = [
    "Papel " + fmt(pa.w) + " x " + fmt(pa.h) + " mm   |   " +
      (photo.off ? "sem foto" : "foto " + fmt(photo.w) + " x " + fmt(photo.h) + " mm") +
      "   |   furos de " + fmt(P()) + " mm   |   " + totalCount.toLocaleString("pt-BR") +
      " pontos, " + totalHoles.toLocaleString("pt-BR") + " furos",
    photo.off
      ? "Prenda o molde sobre o papel ou o tecido e fure pelos pontos."
      : "Cole a foto a " + fmt(photo.x) + " mm da borda esquerda e " + fmt(photo.y) +
        " mm da borda de cima do papel.",
    plano.tiled
      ? "Recorte pela moldura tracejada. As folhas vizinhas repetem uma faixa do desenho: sobreponha ate os furos coincidirem."
      : (plano.folhaCheia ? "A moldura tracejada e a borda do papel. " : "") +
        (photo.off ? "" : "Sobra: " + fmt(pa.w - photo.x - photo.w) + " mm a direita, " + fmt(pa.h - photo.y - photo.h) + " mm embaixo."),
    "Imprima em 100%, sem ajustar a pagina. Confira na regua abaixo antes de furar."
  ];
  linhas = linhas.filter(Boolean);     // sem foto, a linha da sobra fica vazia
  // esta folha não leva molde nenhum: o que ela precisa dizer é onde ele está
  if (plano.capa)
    linhas.splice(2, 0, "Esta folha e so instrucao. O molde esta inteiro na folha 2, em tamanho real; recorte pela moldura tracejada.");
  for (var i = 0; i < linhas.length; i++) pdf.text(linhas[i], 12, y + i * 5);
  reguaAfericao(pdf, 12, y + linhas.length * 5);
}

// qual folha continua de cada lado, escrito na margem. Com o texto girado o
// glifo cresce para a esquerda e a linha sobe, então a âncora vai meia
// palavra abaixo do meio para a legenda sair centrada no corte.
function vizinhas(pdf, plano, idx, ox, oy){
  var col = idx % plano.cols, lin = Math.floor(idx / plano.cols);
  pdf.setFontSize(7);
  pdf.setTextColor(120);
  var lado = function(txt, x, meio){
    pdf.text(txt, x, meio + pdf.getTextWidth(txt) / 2, { angle: 90 });
  };
  if (lin > 0)
    pdf.text("^ folha " + (idx - plano.cols + 1), ox + plano.tw / 2, oy - 2, { align: "center" });
  if (lin < plano.rows - 1)
    pdf.text("v folha " + (idx + plano.cols + 1), ox + plano.tw / 2, oy + plano.th + 5, { align: "center" });
  if (col > 0) lado("< folha " + idx, ox - 2, oy + plano.th / 2);
  if (col < plano.cols - 1) lado("folha " + (idx + 2) + " >", ox + plano.tw + 5, oy + plano.th / 2);
}

/* O molde de uma folha, em tamanho real. `vw` é o pedaço do papel que esta
   folha mostra, e tudo é recortado nele: sem o recorte, o traço de uma peça
   vizinha invade a margem e reaparece cortado pela metade depois da tesoura. */
function moldeNaFolha(pdf, vw, ox, oy){
  var pa = paperMM();

  // 4 px/mm basta para um fundo desenhado a 22% de opacidade, e a compressão
  // impede o jsPDF de embutir o raster cru — sem ela o molde sai com 6,5 MB
  var bg = document.createElement("canvas");
  var bgk = 4;
  bg.width = Math.round(vw.w * bgk); bg.height = Math.round(vw.h * bgk);
  var bctx = bg.getContext("2d");
  bctx.fillStyle = "#fff"; bctx.fillRect(0, 0, bg.width, bg.height);
  drawPhoto(bctx, bgk, vw, 0.22);
  pdf.addImage(bg.toDataURL("image/png"), "PNG", ox, oy, vw.w, vw.h, undefined, "FAST");

  // o `null` é o que impede o jsPDF de pintar este retângulo antes de usá-lo
  // como recorte — sem ele, cada folha sai com uma moldura sólida a mais.
  pdf.saveGraphicsState();
  pdf.rect(ox, oy, vw.w, vw.h, null);
  pdf.clip();
  pdf.discardPath();

  pdf.setDrawColor(20);
  pdf.setLineWidth(0.4);
  if (!photo.off) pdf.rect(ox + (photo.x - vw.x), oy + (photo.y - vw.y), photo.w, photo.h);

  /* A linha da borda do papel, onde esta folha alcança a borda. Com a
     moldura tracejada valendo o papel inteiro as duas cairiam uma em cima da
     outra, e o traço cheio por baixo apagaria o tracejado: aí a moldura já diz
     onde o papel acaba, e esta linha não tem o que acrescentar. */
  var cheia = vw.x <= 0.01 && vw.y <= 0.01 && folhaCheia(vw);
  var edges = [];
  if (!cheia){
    if (vw.x <= 0.01) edges.push(["v", 0]);
    if (vw.y <= 0.01) edges.push(["h", 0]);
    if (vw.x + vw.w >= pa.w - 0.01) edges.push(["v", pa.w]);
    if (vw.y + vw.h >= pa.h - 0.01) edges.push(["h", pa.h]);
  }
  pdf.setDrawColor(56, 73, 89);
  pdf.setLineWidth(0.6);
  edges.forEach(function(e){
    if (e[0] === "v"){
      var X = ox + (e[1] - vw.x);
      pdf.line(X, oy, X, oy + vw.h);
    } else {
      var Y = oy + (e[1] - vw.y);
      pdf.line(ox, Y, ox + vw.w, Y);
    }
  });

  // o recorte esconde o que sai da folha, mas o jsPDF grava o traço assim
  // mesmo: repartido em seis folhas, o arquivo sairia com seis cópias do
  // molde inteiro. Fora da folha, nem desenha.
  var fora = function(pt, m){
    return pt.x < vw.x - m || pt.x > vw.x + vw.w + m ||
           pt.y < vw.y - m || pt.y > vw.y + vw.h + m;
  };
  var cabe = function(el){
    var b = elPaperBox(el);
    return b.x <= vw.x + vw.w && b.x + b.w >= vw.x &&
           b.y <= vw.y + vw.h && b.y + b.h >= vw.y;
  };

  var p = P();
  pdf.setLineWidth(0.22);
  /* A letra só entra quando o molde tem gráfico colorido. É ela que faz o
     molde funcionar impresso em preto e branco — e é assim que ele sai da
     impressora de casa quase sempre. Num molde de uma cor por peça não há o
     que confundir, e a letra em cada quadradinho só sujaria o gabarito. */
  var letras = temGrafico() ? mapaLetras() : null;
  if (letras){
    pdf.setFontSize(Math.max(3.2, p * 2.834 * 0.58));
    pdf.setFont("helvetica", "bold");
  }
  /* O ponto reto no molde é o risco de furo a furo em cinza claro: é ele que
     diz de que furo vai a qual, sem disputar com o furo, que é o que se fura. */
  els.forEach(function(el){
    if (el.kind !== "reto" || !cabe(el)) return;
    pdf.setDrawColor(190, 190, 190);
    pdf.setLineWidth(0.25);
    (el.pontos || []).forEach(function(pt){
      var f = pt.furos, k = pt.fechada ? f.length : f.length - 1;
      for (var i = 0; i < k; i++){
        var a = localToPaper(el, f[i][0], f[i][1]), b = localToPaper(el, f[(i + 1) % f.length][0], f[(i + 1) % f.length][1]);
        if (fora(a, 2) && fora(b, 2)) continue;
        pdf.line(ox + (a.x - vw.x), oy + (a.y - vw.y), ox + (b.x - vw.x), oy + (b.y - vw.y));
      }
    });
  });
  pdf.setLineWidth(0.22);
  els.forEach(function(el){
    if (!cabe(el) || el.kind === "reto") return;
    var corEl = corDe(el).hex, atual = "";
    for (var r = 0; r < el.cells.length; r++){
      for (var q = 0; q < el.cells[r].length; q++){
        var v = el.cells[r][q];
        if (!v) continue;
        var meio = localToPaper(el, (q + 0.5) * p, (r + 0.5) * p);
        if (fora(meio, p)) continue;
        var sl = corCel(el, v);
        var hex = sl ? sl.hex : corEl;
        if (hex !== atual){
          atual = hex;
          var rgb = hexRGB(hex);
          pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
          if (letras){
            var t = corLegivel(hex);
            pdf.setTextColor(t[0], t[1], t[2]);
          }
        }
        var a1 = localToPaper(el, q * p + p * 0.22, r * p + p * 0.22);
        var a2 = localToPaper(el, (q + 1) * p - p * 0.22, (r + 1) * p - p * 0.22);
        var b1 = localToPaper(el, (q + 1) * p - p * 0.22, r * p + p * 0.22);
        var b2 = localToPaper(el, q * p + p * 0.22, (r + 1) * p - p * 0.22);
        pdf.line(ox + (a1.x - vw.x), oy + (a1.y - vw.y), ox + (a2.x - vw.x), oy + (a2.y - vw.y));
        pdf.line(ox + (b1.x - vw.x), oy + (b1.y - vw.y), ox + (b2.x - vw.x), oy + (b2.y - vw.y));
        if (letras && letras[hex])
          pdf.text(letras[hex], ox + (meio.x - vw.x), oy + (meio.y - vw.y),
                   { align: "center", baseline: "middle", angle: -el.rot });
      }
    }
  });
  if (letras){ pdf.setFont("helvetica", "normal"); pdf.setTextColor(60); }

  pdf.setFillColor(15, 15, 15);
  els.forEach(function(el){
    if (!cabe(el)) return;
    holesOf(el).forEach(function(h){
      if (fora(h, 1)) return;
      pdf.circle(ox + (h.x - vw.x), oy + (h.y - vw.y), 0.3, "F");
    });
  });

  pdf.restoreGraphicsState();

  // a moldura de recorte fica fora do clip: linha desenhada em cima da borda
  // perde metade da espessura para o recorte e sai mais fina de um lado.
  pdf.setDrawColor(150);
  pdf.setLineWidth(0.2);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.rect(ox, oy, vw.w, vw.h);
  pdf.setLineDashPattern([], 0);
}

/* ---- os PDF já gerados ----------------------------------------------

   A estante guarda o molde para continuar editando; isto guarda o PDF que
   saiu dele — o arquivo pronto para imprimir, com a data e o tamanho do
   papel que ele usou. Quem perdeu o download, ou quer a mesma folha de
   novo, não precisa refazer nada.

   Não há servidor: os arquivos ficam no IndexedDB deste navegador e não
   saem do aparelho. IndexedDB e não localStorage porque um PDF de molde
   grande tem megabytes, e a cota do localStorage é o que a estante e a
   foto já disputam. */
var HIST_DB = "ponto-letra", HIST_STORE = "moldes", HIST_MAX = 20;
var histDB = null, histOff = false, histURLs = [];

function withHist(fn){
  if (histOff){ fn(null); return; }
  if (histDB){ fn(histDB); return; }
  var req;
  try { req = window.indexedDB && indexedDB.open(HIST_DB, 1); } catch(e){ req = null; }
  if (!req){ histOff = true; fn(null); return; }
  req.onupgradeneeded = function(){
    var db = req.result;
    if (!db.objectStoreNames.contains(HIST_STORE)) db.createObjectStore(HIST_STORE, { keyPath: "id" });
  };
  req.onsuccess = function(){ histDB = req.result; fn(histDB); };
  req.onerror = req.onblocked = function(){ histOff = true; fn(null); };
}

function histWrite(job, ok, fail){
  withHist(function(db){
    if (!db){ if (fail) fail(); return; }
    var tx;
    try { tx = db.transaction(HIST_STORE, "readwrite"); } catch(e){ if (fail) fail(e); return; }
    try { job(tx.objectStore(HIST_STORE)); } catch(e){ if (fail) fail(e); return; }
    tx.oncomplete = function(){ if (ok) ok(); };
    tx.onerror = tx.onabort = function(){ if (fail) fail(tx.error); };
  });
}

// do mais recente para o mais antigo
function histAll(cb){
  withHist(function(db){
    if (!db){ cb(null); return; }
    var out = [], tx;
    try { tx = db.transaction(HIST_STORE, "readonly"); } catch(e){ cb(null); return; }
    var cur = tx.objectStore(HIST_STORE).openCursor();
    cur.onsuccess = function(){
      var c = cur.result;
      if (c){ out.push(c.value); c.continue(); }
    };
    tx.oncomplete = function(){
      out.sort(function(a, b){ return b.at - a.at; });
      cb(out);
    };
    tx.onerror = tx.onabort = function(){ cb(null); };
  });
}

// a miniatura é o molde desenhado pequeno, não uma página do PDF: é o que
// deixa reconhecer um arranjo numa fileira de 40px sem abrir o arquivo
function histThumb(R){
  try {
    var k = Math.min(3, 150 / R.w);
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(R.w * k));
    c.height = Math.max(1, Math.round(R.h * k));
    paint(c.getContext("2d"), k, R, { photoAlpha: 1, outline: false });
    return c.toDataURL("image/jpeg", 0.6);
  } catch(e){ return ""; }
}

function histSave(blob, name, note, thumb){
  // sem FileReader não há como virar bytes, e sem IndexedDB não há onde pôr:
  // nos dois casos guardar é impossível, e o PDF segue para o download igual
  if (histOff || !window.FileReader || !window.indexedDB) return;
  var fr = new FileReader();
  fr.onload = function(){
    var rec = {
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      at: Date.now(), name: name, size: blob.size, note: note, thumb: thumb, buf: fr.result
    };
    // cheio ou sem espaço: o mais antigo sai para o novo entrar
    histAll(function(list){
      var velhos = list && list.length > HIST_MAX - 1 ? list.slice(HIST_MAX - 1) : [];
      histWrite(function(st){
        velhos.forEach(function(v){ st.delete(v.id); });
        st.put(rec);
      }, histRender, function(){
        if (list && list.length){
          histWrite(function(st){ st.delete(list[list.length - 1].id); st.put(rec); }, histRender, histRender);
        } else { histRender(); }
      });
    });
  };
  fr.onerror = function(){};
  fr.readAsArrayBuffer(blob);
}

function histSize(n){
  if (n >= 1048576) return (Math.round(n / 104857.6) / 10).toFixed(1).replace(".", ",") + " MB";
  return Math.max(1, Math.round(n / 1024)) + " KB";
}

function histOpen(rec, baixar){
  var href;
  try { href = URL.createObjectURL(new Blob([rec.buf], { type: "application/pdf" })); }
  catch(e){ return; }
  histURLs.push(href);
  var a = document.createElement("a");
  a.href = href; a.target = "_blank"; a.rel = "noopener";
  if (baixar) a.download = rec.name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

var ICO_BAIXA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';

function histRow(rec){
  var l = document.createElement("div");
  l.className = "mold";

  if (rec.thumb){
    var img = document.createElement("img");
    img.className = "thumb"; img.src = rec.thumb; img.alt = "";
    l.appendChild(img);
  }

  var a = document.createElement("button");
  a.type = "button"; a.className = "abre";
  a.title = rec.note || rec.name;
  var nm = document.createElement("span");
  nm.className = "nm"; nm.textContent = rec.name;
  var qd = document.createElement("span");
  qd.className = "qd"; qd.textContent = quando(rec.at) + " · " + histSize(rec.size);
  a.appendChild(nm); a.appendChild(qd);
  a.addEventListener("click", function(){ histOpen(rec, false); });

  var d = document.createElement("button");
  d.type = "button"; d.className = "baixa";
  d.innerHTML = ICO_BAIXA;
  d.title = "baixar de novo";
  d.setAttribute("aria-label", "baixar de novo " + rec.name);
  d.addEventListener("click", function(){ histOpen(rec, true); });

  var x = document.createElement("button");
  x.type = "button"; x.className = "apaga";
  x.textContent = "\u00D7";
  x.title = "apagar este pdf";
  x.setAttribute("aria-label", "apagar o pdf " + rec.name);
  x.addEventListener("click", function(){
    if (!confirm("Apagar \u201C" + rec.name + "\u201D dos pdf guardados? Isso n\u00E3o se desfaz.")) return;
    histWrite(function(st){ st.delete(rec.id); }, histRender, histRender);
  });

  l.appendChild(a); l.appendChild(d); l.appendChild(x);
  return l;
}

function histRender(){
  var box = $("pdfLista"), dica = $("pdfDica"), limpar = $("pdfLimpar");
  if (!box) return;
  histURLs.splice(0).forEach(function(u){ try { URL.revokeObjectURL(u); } catch(e){} });
  histAll(function(list){
    box.innerHTML = "";
    if (!list){
      limpar.classList.add("hide");
      dica.textContent = "Este navegador n\u00E3o guarda os pdf \u2014 em janela an\u00F4nima, ou com os dados " +
                         "do site bloqueados, o arquivo s\u00F3 fica onde voc\u00EA o salvou.";
      return;
    }
    if (!list.length){
      limpar.classList.add("hide");
      dica.textContent = "Nenhum pdf guardado ainda. O pr\u00F3ximo molde que voc\u00EA baixar aparece aqui.";
      return;
    }
    limpar.classList.remove("hide");
    dica.textContent = "Cada pdf que voc\u00EA baixa fica guardado aqui, neste navegador e neste aparelho. " +
                       "Os " + HIST_MAX + " mais recentes; o " + (HIST_MAX + 1) + "\u00BA derruba o mais antigo.";
    list.slice(0, HIST_MAX).forEach(function(rec){ box.appendChild(histRow(rec)); });
  });
}

$("pdfLimpar").addEventListener("click", function(){
  if (!confirm("Apagar todos os pdf guardados neste navegador? Isso n\u00E3o se desfaz.")) return;
  histWrite(function(st){ st.clear(); }, histRender, histRender);
});

$("pdf").addEventListener("click", function(){
  if (!window.jspdf || !window.jspdf.jsPDF){
    alert("O gerador de PDF não carregou. Recarregue a página.");
    return;
  }
  if (!els.length) return;
  // gerar um molde grande segura a thread por um segundo. O botão avisa antes
  // de travar, e o setTimeout dá ao navegador a chance de pintar esse aviso —
  // só o nodeValue do texto muda, para o ícone não ir junto.
  var btn = this, rot = btn.lastChild, antes = rot.nodeValue;
  btn.disabled = true; rot.nodeValue = "gerando…";
  setTimeout(function(){
    try { montaPDF(); } finally { btn.disabled = false; rot.nodeValue = antes; }
  }, 30);
});

function montaPDF(){
  var R = cropArea();
  var plano = pdfPlan(R, contentArea());
  // o cabeçalho precisa saber se a moldura é a borda do papel ou a caixa do
  // desenho: o que ele manda recortar muda de um caso para o outro
  plano.folhaCheia = folhaCheia(R);
  /* `floatPrecision` e `compress` valem o molde inteiro: cada furo é um
     círculo de quatro curvas, e sem eles o jsPDF grava cada coordenada com
     dezessete casas decimais — 700 bytes por furo, megabytes por folha, que
     o celular ainda precisa baixar. Duas casas em pt são 3,5 milésimos de
     milímetro: mais fino do que qualquer agulha alcança. */
  var pdf = new window.jspdf.jsPDF({
    unit: "mm", format: folhaAtual.jspdf, orientation: plano.land ? "landscape" : "portrait",
    compress: true, floatPrecision: 2
  });

  if (plano.capa){
    // a folha de instrução vem primeiro, e não leva molde: sem ela, o molde
    // inteiro não caberia numa folha só
    cabecalho(pdf, plano, 0);
    legenda(pdf, plano);
    pdf.addPage(folhaAtual.jspdf, plano.land ? "landscape" : "portrait");
    moldeNaFolha(pdf, { x: R.x, y: R.y, w: plano.tw, h: plano.th },
                 (plano.pageW - plano.tw) / 2, plano.top);
  } else {
    for (var i = 0; i < plano.cols * plano.rows; i++){
      if (i) pdf.addPage(folhaAtual.jspdf, plano.land ? "landscape" : "portrait");
      var vw = { x: R.x + plano.xs[i % plano.cols], y: R.y + plano.ys[Math.floor(i / plano.cols)],
                 w: plano.tw, h: plano.th };
      var ox = (plano.pageW - plano.tw) / 2, oy = plano.top;
      cabecalho(pdf, plano, i);
      moldeNaFolha(pdf, vw, ox, oy);
      legenda(pdf, plano);
      if (plano.tiled) vizinhas(pdf, plano, i, ox, oy);
    }
  }

  // a legenda inteira sai em folha à parte quando o rodapé teve de truncar
  var todas = linhasUsadas();
  var legendaSolta = todas.length > 0 && legendaCoube(pdf, plano, todas) === false;
  if (legendaSolta) folhaLegenda(pdf, plano);

  var pa = paperMM();
  var folhas = plano.cols * plano.rows;
  var quantas = plano.capa
    ? "1 folha de molde + instruções"
    : folhas + (folhas === 1 ? " folha" : " folhas");
  var blob = pdf.output("blob"), nome = saveName("pdf");
  histSave(blob, nome, "papel " + fmt(pa.w) + " × " + fmt(pa.h) + " mm · " +
           totalCount + (totalCount === 1 ? " ponto" : " pontos") + " · " + quantas,
           histThumb(R));
  deliver(blob, nome, null);
}
