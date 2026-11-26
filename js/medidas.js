/* ponto & letra — medidas.js
   Espaçamento, medidas próprias, papel e foto.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

function P(){ return parseFloat($("mm").value); }

/* ---- medidas próprias -----------------------------------------------

   O campo de número avisa a cada tecla, e quem digita "100" passa por "1" e
   por "10" no caminho. Papel de 1 mm não é um papel a caminho: ele reposiciona
   a foto, encosta as peças na borda e apara as guias — e nada disso volta
   quando o número fica pronto. Então enquanto se digita só vale a medida que
   cabe no limite do campo; a que não cabe espera, e é acertada quando o campo
   se despede. */
var propria = {};

function limites(id){
  var el = $(id);
  return { min: parseFloat(el.min), max: parseFloat(el.max) };
}

function propriaIni(id){ propria[id] = parseFloat($(id).value); }

function propriaFora(id){
  var t = $(id).value.trim(), v = parseFloat(t), lim = limites(id);
  if (t === "") return false;                    // campo vazio é meio de frase
  return !isFinite(v) || v < lim.min || v > lim.max;
}

function propriaLe(id){                          // a cada tecla: só o que vale
  if (propriaFora(id)) return false;
  var v = parseFloat($(id).value);
  if (isFinite(v)) propria[id] = v;
  return true;
}

function propriaFirma(id){                       // ao sair: o número é acertado
  var v = parseFloat($(id).value), lim = limites(id);
  if (isFinite(v)) propria[id] = Math.max(lim.min, Math.min(lim.max, v));
  $(id).value = propria[id];
  return propria[id];
}

function propriaAviso(idAviso, oQue, pares){
  var p = $(idAviso);
  if (!p) return;
  var fora = pares.filter(function(par){ return propriaFora(par[0]); });
  p.classList.toggle("mal", fora.length > 0);
  if (!fora.length){ p.textContent = ""; return; }
  var lim = limites(pares[0][0]);
  p.textContent = "A " + fora.map(function(par){ return par[1]; }).join(" e a ") +
    (fora.length > 1 ? " ficam" : " fica") + " entre " + lim.min + " e " + lim.max +
    " mm. Até o número caber, " + oQue + " segue com " + propria[pares[0][0]] +
    " \u00d7 " + propria[pares[1][0]] + " mm.";
}

var PAPEL_PARES = [["paperW", "largura"], ["paperH", "altura"]];
var FOTO_PARES  = [["photoWmm", "largura"], ["photoHmm", "altura"]];

function papelAviso(){ propriaAviso("paperAviso", "o papel", PAPEL_PARES); }
function fotoAviso(){ propriaAviso("photoAviso", "a foto", FOTO_PARES); }

function paperMM(){
  var v = $("paperSize").value, w, h;
  if (v === "custom"){
    w = propria.paperW || 210;
    h = propria.paperH || 297;
  } else {
    var q = v.split("x"); w = parseFloat(q[0]); h = parseFloat(q[1]);
  }
  /* No Personalizado quem manda são os dois campos: eles já dizem qual é a
     largura e qual é a altura, e deixar a orientação trocá-los faria o papel
     sair do avesso do que está escrito ali. */
  if (v !== "custom" && $("paperOr").value === "l"){ var t = w; w = h; h = t; }
  return { w: w, h: h };
}

function photoSizeMM(){
  var v = $("photoSize").value, w, h;
  if (v === "none") return { w: photo.w, h: photo.h };
  if (v === "custom"){
    w = propria.photoWmm || 100;
    h = propria.photoHmm || 150;
  } else {
    var q = v.split("x"); w = parseFloat(q[0]); h = parseFloat(q[1]);
  }
  if (v !== "custom" && $("photoOr").value === "l"){ var t = w; w = h; h = t; }
  return { w: w, h: h };
}

function syncPhotoSize(){
  var z = photoSizeMM();
  photo.w = z.w; photo.h = z.h;
  photo.off = $("photoSize").value === "none";
  if (photo.off){ marcaFoto = false; if (foco === "photo") foco = "none"; }
  clampPhoto();
}

/* As duas medidas são livres: a folha é a que você vai imprimir e a foto é a
   que você mandou revelar, e não cabe ao app escolher uma pela outra. O que
   ele deve é não deixar a conta passar em silêncio — foto maior que a folha
   sai recortada na borda do papel, e some do PDF o que ficou de fora. Por
   isso o aviso não é de um momento: `showFit()` passa por aqui a cada
   mudança de estado, e enquanto não couber ele fica. */
function fotoForaDoPapel(){
  if (photo.off) return false;
  var pa = paperMM();
  return photo.x < -0.01 || photo.y < -0.01 ||
         photo.x + photo.w > pa.w + 0.01 || photo.y + photo.h > pa.h + 0.01;
}

function avisaFotoCabe(){
  var pa = paperMM(), maior = !photo.off && (photo.w > pa.w + 0.01 || photo.h > pa.h + 0.01);
  var txt = "";
  if (maior)
    txt = "A foto de " + fmt(photo.w) + " × " + fmt(photo.h) + " mm é maior que o papel de " +
      fmt(pa.w) + " × " + fmt(pa.h) + " mm. O molde é recortado no papel, então o que passa " +
      "da borda não sai no PDF: diminua a foto, ou aumente o papel.";
  else if (fotoForaDoPapel())
    txt = "A foto passou da borda do papel de " + fmt(pa.w) + " × " + fmt(pa.h) + " mm. " +
      "O que está fora não sai no PDF: arraste a foto de volta para dentro da folha.";
  ["photoCabe", "paperCabe"].forEach(function(id){
    var p = $(id);
    if (!p) return;
    p.textContent = txt;
    p.classList.toggle("mal", txt !== "");
  });
}

function clampPhoto(){
  var pa = paperMM();
  photo.x = Math.max(0, Math.min(pa.w - photo.w, photo.x));
  photo.y = Math.max(0, Math.min(pa.h - photo.h, photo.y));
}
