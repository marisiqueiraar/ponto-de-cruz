/* ponto & letra — gravar.js
   Gravar e restaurar o molde, e o desfazer.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

/* ---- memória local: gravar e restaurar ------------------------------ */

/* As células vão gravadas como estão, e não recalculadas na volta: é o que
   preserva os ajustes feitos à mão no modo ponto a ponto. Uma linha por
   string, um caractere por quadradinho — mais compacto que JSON de array e
   igualmente legível.

   O caractere é base 36, e não "0" ou "1": zero continua sendo o vazio, e de
   1 em diante é o índice da linha na paleta da peça. Uma peça de uma cor só
   grava exatamente o que gravava antes, então molde antigo volta igual. */
function celChar(v){ return (v | 0).toString(36); }
function packEl(el){
  var r = { kind: el.kind, x: el.x, y: el.y, rot: el.rot, manual: el.manual || 0,
            color: el.color || "", colorName: el.colorName || "",
            // a lista dos ajustes à mão vai junto com as células, e não no
            // lugar delas: as células são o desenho final, a lista é o que
            // permite refazer o desenho sem perder a correção
            edits: (el.edits || []).map(function(e){ return e.r + "," + e.q + "," + e.v; }),
            cells: el.cells.map(function(row){ return row.map(celChar).join(""); }) };
  if (el.kind === "text"){
    r.text = el.text; r.font = el.font;
    r.rowsTarget = el.rowsTarget; r.thick = el.thick; r.thr = el.thr;
    r.esp = el.esp || 0; r.arc = el.arc || 0; r.flip = el.flip || 0;
    r.hv = 2;   // a altura desta peça já está contada pela maiúscula
  } else if (el.kind === "img"){
    // o id, e não a imagem: ela é grande e mora na sua própria chave. Assim
    // o desfazer, que guarda o arranjo inteiro em texto a cada passo,
    // continua custando alguns quilobytes em vez de alguns megabytes
    r.img = el.img; r.nome = el.nome || "";
    r.larg = el.larg; r.thr = el.thr;
    r.inv = el.inv ? 1 : 0; r.flip = el.flip || 0;
    r.cores = el.cores || 1;
    r.corte = el.corte == null ? 0.1 : el.corte;
    r.fonte = el.fonte || "anchor";
    if (el.paleta && el.paleta.length){
      // a paleta é da peça e vai com ela: sem isso, o molde reabriria com o
      // gráfico em cinza nenhum e as trocas de meada feitas à mão perdidas
      r.paleta = el.paleta.map(function(sl){
        return { lab: sl.lab.map(function(v){ return Math.round(v * 100) / 100; }),
                 hex: sl.hex, chave: sl.chave || "",
                 rotulo: sl.rotulo || "", off: sl.off ? 1 : 0 };
      });
      r.paletaDe = el.paletaDe || el.cores;
    }
  } else if (el.kind === "pat"){
    r.arranjo = el.arranjo; r.motivo = el.motivo; r.scale = el.scale;
    r.gap = el.gap; r.margem = el.margem; r.rep = el.rep;
    r.deitada = el.deitada ? 1 : 0; r.cores = el.cores; r.flip = el.flip || 0;
    r.paleta = (el.paleta || []).map(function(sl){
      return { lab: sl.lab.map(function(v){ return Math.round(v * 100) / 100; }),
               hex: sl.hex, chave: sl.chave || "",
               rotulo: sl.rotulo || "", off: sl.off ? 1 : 0 };
    });
  } else {
    r.sym = el.sym; r.scale = el.scale;
  }
  return r;
}

function unpackEl(r){
  if (!r || !r.cells || !r.cells.length) return null;
  var cells = r.cells.map(function(row){
    var line = [];
    for (var i = 0; i < row.length; i++){
      var v = parseInt(row.charAt(i), 36);
      line.push(isNaN(v) || v < 0 ? 0 : v);
    }
    return line;
  });
  var kind = r.kind === "sym" || r.kind === "img" || r.kind === "pat" ? r.kind : "text";
  var el = { kind: kind, cells: cells,
             x: +r.x || 0, y: +r.y || 0, rot: +r.rot || 0, manual: +r.manual || 0,
             edits: [] };
  var rowsEl = cells.length, colsEl = cells[0] ? cells[0].length : 0;
  if (r.edits && r.edits.length){
    r.edits.forEach(function(t){
      var v = String(t).split(",");
      // o valor é o índice da linha, e não um liga-desliga: num gráfico
      // colorido o ajuste à mão guarda com que meada o quadradinho foi aceso
      var e = { r: +v[0], q: +v[1], v: Math.max(0, +v[2] || 0) };
      // ajuste fora da grade é lixo de um molde que mudou de tamanho por fora
      if (e.r >= 0 && e.q >= 0 && e.r < rowsEl && e.q < colsEl) el.edits.push(e);
    });
    el.manual = el.edits.length;
  }
  // molde gravado antes de a cor morar na peça volta sem cor, e aí vale a
  // corrente — que é exatamente a cor com que ele foi desenhado na época
  if (typeof r.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(r.color)){
    el.color = r.color;
    el.colorName = typeof r.colorName === "string" ? r.colorName : "";
  }
  if (el.kind === "text"){
    el.text = typeof r.text === "string" ? r.text : "";
    el.font = fonteConhecida(r.font) ? r.font : (FONTE_TROCADA[r.font] || FONTE_PADRAO);
    el.hv = +r.hv || 1;   // 1 é altura contada pela caixa de tinta da palavra
    el.rowsTarget = +r.rowsTarget || 16;
    el.thick = r.thick == null ? 2 : +r.thick;
    el.thr = +r.thr || 0.35;
    el.esp = +r.esp || 0;
    el.arc = +r.arc || 0;
    el.flip = r.flip ? 1 : 0;
  } else if (el.kind === "img"){
    el.img = typeof r.img === "string" ? r.img : "";
    el.nome = typeof r.nome === "string" && r.nome ? r.nome : "imagem";
    el.larg = Math.max(IMG_LARG_MIN, Math.min(IMG_LARG_MAX, +r.larg || 40));
    el.thr = +r.thr || 0.5;
    el.inv = r.inv ? 1 : 0;
    el.flip = r.flip ? 1 : 0;
    el.cores = Math.max(1, Math.min(CORES_MAX, +r.cores || 1));
    el.corte = r.corte == null ? 0.1 : +r.corte;
    el.fonte = typeof r.fonte === "string" && r.fonte ? r.fonte : "anchor";
    if (r.paleta && r.paleta.length){
      el.paleta = r.paleta.map(function(sl){
        return { lab: (sl.lab || [0, 0, 0]).map(Number),
                 hex: /^#[0-9A-Fa-f]{6}$/.test(sl.hex || "") ? sl.hex : "#888888",
                 chave: sl.chave || "", rotulo: sl.rotulo || "", off: sl.off ? 1 : 0 };
      });
      el.paletaDe = +r.paletaDe || el.cores;
    }
  } else if (el.kind === "pat"){
    el.arranjo = r.arranjo === "faixa" ? "faixa" : "moldura";
    el.motivo = typeof r.motivo === "string" && (r.motivo === "sortido" || nomeMotivo(r.motivo))
      ? r.motivo : "sortido";
    el.scale = Math.max(1, Math.min(4, +r.scale || 1));
    el.gap = Math.max(0, Math.min(10, r.gap == null ? 1 : +r.gap));
    el.margem = Math.max(0, Math.min(60, r.margem == null ? 6 : +r.margem));
    el.rep = Math.max(1, Math.min(PAT_REP_MAX, +r.rep || 6));
    el.deitada = r.deitada ? 1 : 0;
    el.cores = Math.max(1, Math.min(PAT_CORES_MAX, +r.cores || 1));
    el.flip = r.flip ? 1 : 0;
    el.paleta = (r.paleta || []).map(function(sl){
      return { lab: (sl.lab || [0, 0, 0]).map(Number),
               hex: /^#[0-9A-Fa-f]{6}$/.test(sl.hex || "") ? sl.hex : "#888888",
               chave: sl.chave || "", rotulo: sl.rotulo || "", off: sl.off ? 1 : 0 };
    });
  } else {
    el.sym = SYMS[r.sym] ? r.sym : "heart";
    el.scale = +r.scale || 1;
  }
  return el;
}

/* A cota do navegador estourando era o pior silêncio que sobrava: o
   `saveState()` engolia o erro e o trabalho parava de ser gravado sem
   ninguém avisar. Com vários moldes, cada um com a sua foto, deixou de ser
   hipótese — cabem oito ou dez moldes nos 5 MB típicos.

   O aviso vai no rodapé, onde já se diz que está gravado, e o que fazer fica
   escrito na aba moldes, junto da lista que a pessoa vai usar para apagar um.
   A foto é o único item capaz de estourar a cota sozinho, e ela mora numa
   chave separada de propósito: quando é ela que não cabe, o molde continua
   gravado e o aviso diz isso. */
var memoriaCheia = false;
function marcaMemoria(cheia, oQue){
  if (!cheia && !memoriaCheia) return;
  memoriaCheia = cheia;
  var g = $("gravado");
  if (g){
    g.textContent = cheia ? "não coube na memória" : "salvo neste navegador";
    g.classList.toggle("cheia", cheia);
    g.title = cheia
      ? "O navegador ficou sem espaço. Salve o arquivo do molde na aba moldes e apague um molde antigo."
      : "";
  }
  var a = $("moldeAviso");
  if (!a) return;
  if (cheia)
    a.textContent = "A memória do navegador encheu" + (oQue ? " ao gravar " + oQue : "") +
      ". Salve o arquivo do molde agora — e apague um molde da lista acima para abrir espaço.";
  else if (/memória do navegador encheu/.test(a.textContent)) a.textContent = "";
}

function saveState(){
  var it = itemAtual() || criaMolde(nomeSugerido());
  try {
    localStorage.setItem(it.dados, JSON.stringify({
      v: 1,
      paper: { size: $("paperSize").value, or: $("paperOr").value,
               w: $("paperW").value, h: $("paperH").value, folha: folhaAtual.id },
      photoBox: { size: $("photoSize").value, or: $("photoOr").value,
                  w: $("photoWmm").value, h: $("photoHmm").value,
                  x: Math.round(photo.x * 10) / 10, y: Math.round(photo.y * 10) / 10 },
      mm: $("mm").value, thread: thread, sel: sel,
      guias: { on: guias.on ? 1 : 0, v: guias.v, h: guias.h },
      els: els.map(packEl)
    }));
  } catch (e){ marcaMemoria(true, "o molde"); return; }
  marcaMemoria(false);
  salvaOrigens();
  it.em = Date.now();
  it.pecas = els.length;
  /* O nome que o app sugeriu acompanha as peças até você escrever um: antes
     ele era tirado uma vez só, da primeira palavra, e ficava — o molde
     continuava "champ" no cabeçalho do PDF depois de a palavra ser apagada.
     `auto` marca o nome sugerido; escrever no campo desliga isso. Molde
     gravado antes, sem a marca, guarda o nome que tem. */
  if (!it.nome || it.auto){
    it.nome = nomeSugerido();
    it.auto = 1;
  }
  salvaEstante();
  renderMoldes();
}

function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 400);
}

// primeiro na caixa, que é onde o nome importa; depois no catálogo inteiro,
// para um molde restaurado não perder o nome de uma cor que ainda não é sua
function threadLabel(hex){
  for (var k = 0; k < minhas.length; k++){
    var l = catIdx[minhas[k]];
    if (l && l.hex === hex) return rotulo(l);
  }
  var chaves = Object.keys(catIdx);
  for (var i = 0; i < chaves.length; i++)
    if (catIdx[chaves[i]].hex === hex) return rotulo(catIdx[chaves[i]]);
  return "";
}

function restoreState(chave){
  var raw;
  try { raw = localStorage.getItem(chave); } catch (e){ return false; }
  if (!raw) return false;
  var s;
  try { s = JSON.parse(raw); } catch (e){ return false; }
  if (!s || s.v !== 1 || !s.els || !s.els.length) return false;

  var pieces = s.els.map(unpackEl).filter(Boolean);
  if (!pieces.length) return false;

  if (s.paper){
    // molde gravado antes da escolha da folha saía sempre em A4
    folhaAtual = FOLHAS[s.paper.folha] || FOLHAS.a4;
    $("folha").value = folhaAtual.id;
    if (s.paper.size) $("paperSize").value = s.paper.size;
    if (s.paper.or) $("paperOr").value = s.paper.or;
    if (s.paper.w) $("paperW").value = s.paper.w;
    if (s.paper.h) $("paperH").value = s.paper.h;
    /* Molde gravado quando a orientação ainda trocava as medidas próprias: a
       troca entra nos campos de uma vez, e o papel continua do tamanho que
       era — só que agora dizendo a verdade sobre qual lado é a largura. */
    if ($("paperSize").value === "custom" && $("paperOr").value === "l"){
      var pw = $("paperW").value;
      $("paperW").value = $("paperH").value;
      $("paperH").value = pw;
      $("paperOr").value = "p";
    }
    propriaFirma("paperW"); propriaFirma("paperH"); papelAviso();
    papelPainel();
  }
  if (s.photoBox){
    if (s.photoBox.size) $("photoSize").value = s.photoBox.size;
    if (s.photoBox.or) $("photoOr").value = s.photoBox.or;
    if (s.photoBox.w) $("photoWmm").value = s.photoBox.w;
    if (s.photoBox.h) $("photoHmm").value = s.photoBox.h;
    if ($("photoSize").value === "custom" && $("photoOr").value === "l"){
      var fw = $("photoWmm").value;
      $("photoWmm").value = $("photoHmm").value;
      $("photoHmm").value = fw;
      $("photoOr").value = "p";
    }
    propriaFirma("photoWmm"); propriaFirma("photoHmm"); fotoAviso();
    fotoPainel();
  }
  if (s.mm != null){
    $("mm").value = s.mm;
    $("mmOut").textContent = fmt(parseFloat($("mm").value));
  }

  syncPhotoSize();                      // define photo.w/h a partir dos controles
  if (s.photoBox){
    photo.x = +s.photoBox.x || 0;
    photo.y = +s.photoBox.y || 0;
  }
  clampPhoto();
  lastPaper = paperMM();

  // s.pal, de quando havia paletas prontas, é ignorado de propósito
  if (typeof s.thread === "string" && /^#[0-9A-Fa-f]{6}$/.test(s.thread)) thread = s.thread;

  // as guias são do molde, e não do navegador: quem guardou o arranjo com uma
  // guia na base da foto quer achá-la ali na volta
  var gs = s.guias;
  guias.on = !!(gs && gs.on);
  guias.v = (gs && gs.v || []).map(Number).filter(function(v){ return isFinite(v); });
  guias.h = (gs && gs.h || []).map(Number).filter(function(v){ return isFinite(v); });
  guiasApara();

  els = pieces;
  sel = Math.min(Math.max(0, s.sel | 0), els.length - 1);
  soUm(sel);
  return true;
}

// a foto costuma ser o maior item do navegador: vai reduzida, e num formato
// com perda, porque serve só de guia na tela e a 22% no PDF
function savePhoto(img){
  var it = itemAtual() || criaMolde(nomeSugerido());
  try {
    var k = Math.min(1, PHOTO_MAX_PX / Math.max(img.width, img.height));
    var c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    localStorage.setItem(it.foto, c.toDataURL("image/jpeg", 0.85));
  } catch (e){
    // sem a foto o molde continua inteiro: ela é guia de posição, não furo
    try { localStorage.removeItem(it.foto); } catch (e2){}
    marcaMemoria(true, "a foto");
  }
}

function restorePhoto(){
  var it = itemAtual();
  if (!it) return;
  var url;
  try { url = localStorage.getItem(it.foto); } catch (e){ return; }
  if (!url) return;
  var img = new Image();
  img.onload = function(){ photoImg = img; draw(); };
  img.src = url;
}

/* Só as imagens que alguma peça ainda usa são gravadas: apagar a peça leva
   a imagem dela junto na próxima gravação, sem varredura nenhuma. Duas
   peças que nasceram de um duplicar apontam para o mesmo id e continuam
   pesando uma imagem só. */
function salvaOrigens(){
  var it = itemAtual();
  if (!it) return;
  var usadas = {}, tem = false;
  els.forEach(function(el){
    if (el.kind !== "img" || !el.img) return;
    var o = origens[el.img];
    if (!o || !o.url) return;
    usadas[el.img] = o.url;
    tem = true;
  });
  var chave = IMG_STORE + "/" + it.id;
  if (!tem){ try { localStorage.removeItem(chave); } catch (e){} return; }
  try { localStorage.setItem(chave, JSON.stringify(usadas)); }
  catch (e){
    // como a foto: sem elas o molde continua inteiro, porque as células já
    // estão gravadas. O que fica avisado é o que se perdeu — poder refazer
    // o desenho a partir da imagem
    try { localStorage.removeItem(chave); } catch (e2){}
    marcaMemoria(true, "as imagens das peças");
  }
}

function restoreOrigens(){
  var it = itemAtual();
  if (!it) return;
  var raw;
  try { raw = localStorage.getItem(IMG_STORE + "/" + it.id); } catch (e){ return; }
  if (!raw) return;
  var m = null;
  try { m = JSON.parse(raw); } catch (e){ return; }
  if (!m) return;
  Object.keys(m).forEach(function(id){
    var url = m[id];
    if (typeof url !== "string" || url.indexOf("data:image") !== 0) return;
    // imagem que já está viva nesta sessão fica como está: trocar de molde e
    // voltar não a manda decodificar de novo, nem a apaga no meio do caminho
    if (origens[id] && origens[id].img) return;
    var img = new Image();
    origens[id] = { url: url, img: null };
    img.onload = function(){
      if (!origens[id]) return;
      origens[id].img = img;
      /* A peça já estava desenhada pelas células gravadas — a imagem
         chegando não muda um quadradinho. O que ela muda é a barra de cima:
         ela foi montada antes, quando ainda não havia com que refazer o
         desenho, e desligou a largura e a sensibilidade. Agora há. */
      var el = els[sel];
      if (el && el.kind === "img" && el.img === id) syncControls();
    };
    img.src = url;
  });
}

/* ---- desfazer e refazer --------------------------------------------
   Cada passo é o arranjo inteiro em texto, gravado do mesmo jeito que a
   memória local: as células vão como estão, então desfazer devolve também o
   que foi aceso ou apagado à mão. */
var hist = [], hpos = -1, HMAX = 80, voltando = false, histTimer = 0;

function snapshot(){
  return JSON.stringify({ els: els.map(packEl), px: photo.x, py: photo.y, sel: sel });
}

function pushHist(){
  if (voltando) return;
  clearTimeout(histTimer); histTimer = 0;
  var snap = snapshot();
  if (hist[hpos] === snap) return;
  hist.length = hpos + 1;
  hist.push(snap);
  if (hist.length > HMAX) hist.shift();
  hpos = hist.length - 1;
  updateHist();
}

// um arraste de controle deslizante dispara dezenas de eventos: um passo só
function pushLater(){
  if (voltando) return;
  clearTimeout(histTimer);
  histTimer = setTimeout(pushHist, 450);
}

function applyHist(snap){
  var d;
  try { d = JSON.parse(snap); } catch (e){ return; }
  voltando = true;
  els = (d.els || []).map(unpackEl).filter(Boolean);
  photo.x = +d.px || 0; photo.y = +d.py || 0;
  clampPhoto();
  sel = Math.min(Math.max(0, d.sel | 0), els.length - 1);
  soUm(sel);                 // índice de antes pode nem existir mais
  if (!els.length) foco = "none";
  else if (foco === "none") foco = "el";
  renderChips(); syncControls(); draw();
  voltando = false;
  updateHist();
}

// o arranjo de abertura é o fundo da pilha: não há o que desfazer antes dele
function resetHist(){ hist.length = 0; hpos = -1; pushHist(); }

function undo(){ if (hpos > 0){ hpos--; applyHist(hist[hpos]); } }
function redo(){ if (hpos < hist.length - 1){ hpos++; applyHist(hist[hpos]); } }

function updateHist(){
  $("undo").disabled = hpos <= 0;
  $("redo").disabled = hpos >= hist.length - 1;
}

function manualCount(){
  var n = 0;
  els.forEach(function(el){ n += el.manual || 0; });
  return n;
}

$("undo").addEventListener("click", undo);
$("redo").addEventListener("click", redo);

document.addEventListener("keydown", function(e){
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
  var t = e.target || {};
  var tag = (t.tagName || "").toUpperCase();
  // dentro de um campo, Ctrl+Z é o desfazer do próprio navegador
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  e.preventDefault();
  if (e.shiftKey) redo(); else undo();
});
