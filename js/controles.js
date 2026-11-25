/* ponto & letra — controles.js
   Painéis e barra de cima: criar peças e mexer nelas.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

/* A conta aparece com os números do espaçamento de agora, e não como
   fórmula genérica: "7,1 mm de frente" diz mais do que "2p√2", e muda
   junto quando se mexe no espaçamento entre furos. */
function renderFios(){
  var box = $("fios");
  if (!box) return;
  box.innerHTML = "";
  var lista = linhasUsadas();
  if (!lista.length){
    box.innerHTML = '<p class="note vazio">Nenhuma peça no molde ainda.</p>';
    $("fiosConta").textContent = "";
    return;
  }
  lista.forEach(function(l){
    var d = document.createElement("div");
    d.className = "fio";
    d.title = l.pontos.toLocaleString("pt-BR") + " pontos";
    var pt = document.createElement("span");
    pt.className = "pt"; pt.style.background = l.hex;
    var nm = document.createElement("span");
    nm.className = "nm"; nm.textContent = l.nome;
    var qt = document.createElement("b");
    qt.textContent = fmt(l.metros) + " m";
    d.appendChild(pt); d.appendChild(nm); d.appendChild(qt);
    box.appendChild(d);
  });
  $("fiosConta").textContent =
    "Com furos de " + fmt(P()) + " mm, cada ponto cheio gasta " + fmt(fioFrente()) +
    " mm de frente (duas diagonais), " + fmt(fioAvesso()) + " mm de avesso (dois lados) e " +
    Math.round((PERDA - 1) * 100) + "% de perda: " + fmt(fioPorPonto()) + " mm por ponto.";
}

/* A linha escolhida na paleta: é ela que o catálogo troca e que o ajustar
   pinta. Mora na peça e não é gravada — escolha de momento, não desenho. */
function slotAtivo(el){
  var n = el && el.paleta ? el.paleta.length : 0;
  if (!n) return 1;
  var v = el.slot | 0;
  return v >= 1 && v <= n ? v : 1;
}

var OLHO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-5 0-9 4.5-9 7s4 7 9 7 9-4.5 9-7-4-7-9-7zm0 11a4 4 0 110-8 4 4 0 010 8z"/></svg>';
var OLHO_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4.3L4.3 3l16.7 16.7-1.3 1.3-3-3A10 10 0 0112 19c-5 0-9-4.5-9-7 0-1.4 1.2-3.3 3.1-4.8L3 4.3zM12 5c5 0 9 4.5 9 7 0 1-.7 2.4-1.9 3.7L15.6 12A3.9 3.9 0 0012 8.1L9.6 5.7A10 10 0 0112 5z"/></svg>';

function renderPaleta(){
  var caixa = $("paleta"), lista = $("paletaLista");
  if (!caixa || !lista) return;
  var el = els[sel];
  var pal = foco === "el" && el && el.paleta && el.paleta.length ? el.paleta : null;
  caixa.classList.toggle("hide", !pal);
  lista.innerHTML = "";
  if (!pal) return;
  var n = contaPorCor(el), ativo = slotAtivo(el);
  var letras = mapaLetras();
  pal.forEach(function(sl, i){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "sl" + (i + 1 === ativo ? " on" : "") + (sl.off ? " off" : "");
    b.setAttribute("aria-pressed", i + 1 === ativo ? "true" : "false");
    var pt = document.createElement("i");
    pt.style.background = sl.hex;
    var lt = document.createElement("span");
    lt.className = "lt";
    lt.textContent = sl.off ? "—" : (letras[sl.hex] || "");
    var nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = sl.rotulo || sl.hex;
    var qt = document.createElement("b");
    qt.className = "qt";
    qt.textContent = (n[i + 1] || 0).toLocaleString("pt-BR");
    var olho = document.createElement("span");
    olho.className = "olho";
    olho.setAttribute("role", "button");
    olho.setAttribute("tabindex", "0");
    olho.title = sl.off ? "mostrar esta linha de novo" : "esconder esta linha do desenho";
    olho.innerHTML = sl.off ? OLHO_OFF : OLHO;
    var escondeIsto = function(e){
      e.stopPropagation();
      sl.off = sl.off ? 0 : 1;
      refazNoCentro(el);
      renderPaleta(); renderChips(); renderFios(); draw(); pushHist();
    };
    olho.addEventListener("click", escondeIsto);
    olho.addEventListener("keydown", function(e){
      if (e.key === "Enter" || e.key === " ") escondeIsto(e);
    });
    b.appendChild(pt); b.appendChild(lt); b.appendChild(nm);
    b.appendChild(qt); b.appendChild(olho);
    b.addEventListener("click", function(){
      el.slot = i + 1;
      renderPaleta(); mostraThread();
    });
    lista.appendChild(b);
  });
}

function renderChips(){
  var box = $("chips");
  box.innerHTML = "";
  els.forEach(function(el, i){
    var b = document.createElement("button");
    b.className = "chip" + (marcado(i) ? " on" : "");
    b.setAttribute("aria-pressed", marcado(i) ? "true" : "false");
    // o ponto de cor é o que deixa ver o arranjo inteiro de uma vez, sem
    // ter de selecionar peça por peça para lembrar de que linha é cada uma
    if (el.paleta && el.paleta.length){
      // três pontos dizem "isto tem paleta" de longe, sem precisar abrir a
      // peça para descobrir que ela não é de uma cor só
      el.paleta.slice(0, 3).forEach(function(sl){
        var p3 = document.createElement("span");
        p3.className = "pt";
        p3.style.background = sl.hex;
        p3.title = el.paleta.length + " linhas";
        b.appendChild(p3);
      });
    } else {
      var cor = corDe(el);
      var pt = document.createElement("span");
      pt.className = "pt";
      pt.style.background = cor.hex;
      pt.title = cor.nome;
      b.appendChild(pt);
    }
    b.appendChild(document.createTextNode(nomePeca(el)));
    // com Shift (ou Ctrl) a ficha soma ao laço em vez de trocar a seleção:
    // é o caminho para laçar duas peças distantes sem passar por cima do resto
    b.addEventListener("click", function(e){
      if (e.shiftKey || e.ctrlKey || e.metaKey) alternaMarca(i);
      else { sel = i; soUm(i); foco = "el"; }
      syncControls(); draw(); renderChips();
    });
    box.appendChild(b);
  });
}

function syncControls(){
  var el = els[sel];
  var piece = foco === "el" && !!el;
  // com uma linha por peça, o painel precisa dizer qual peça ele está
  // pintando — senão o quadradinho marcado vira adivinhação
  mostraThread();
  /* Com um bloco laçado a barra não mostra os campos da peça: eles mexeriam
     em uma só das laçadas, e ninguém saberia em qual. Ela diz o que está no
     laço e o que dá para fazer com ele. */
  var bloco = noLaco();
  $("ctlGrupo").classList.toggle("hide", !bloco);
  if (bloco){
    var n = marca.length;
    var q = n ? n + (n === 1 ? " peça" : " peças") : "";
    if (marcaFoto) q += (q ? " e " : "") + "a foto";
    // o texto é curto de propósito: a barra rola, e o que empurra o botão de
    // apagar para debaixo da máscara é justamente o que ninguém vai ler duas
    // vezes. Como se move o bloco está no rodapé, que é onde moram os gestos
    $("ctlGrupoTxt").textContent = q + " no laço";
    $("delLacoTxt").textContent = n === 1 ? "apagar a peça" : "apagar as " + n + " peças";
    $("delLaco").title = (n === 1 ? "apagar a peça laçada" : "apagar as " + n + " peças laçadas") +
      (marcaFoto ? " — a moldura da foto não é peça e fica onde está" : "") +
      ". O desfazer devolve tudo num passo.";
    ["alinha", "ctlPhoto", "ctlPiece", "ctlActs", "ctlNone", "ctlText", "ctlSym", "ctlImg", "ctlPat"]
      .forEach(function(id){ $(id).classList.add("hide"); });
    return;
  }
  $("alinha").classList.toggle("hide", !piece);
  $("alAcima").classList.toggle("hide", !piece || sel < 1);
  $("flipEl").classList.toggle("on", !!(el && el.flip));
  $("ctlPhoto").classList.toggle("hide", foco !== "photo");
  $("ctlPiece").classList.toggle("hide", !piece);
  $("ctlActs").classList.toggle("hide", !piece);
  $("ctlNone").classList.toggle("hide", foco !== "none");
  if (foco === "none"){
    var pa = paperMM();
    $("ctlNone").textContent = fmt(pa.w / 10) + " × " + fmt(pa.h / 10) + " cm";
  }
  if (!piece){
    ["ctlText", "ctlSym", "ctlImg", "ctlPat"].forEach(function(id){ $(id).classList.add("hide"); });
    return;
  }
  // uma barra por tipo de peça: mostrar a certa é esconder as outras duas
  var barras = { text: "ctlText", sym: "ctlSym", img: "ctlImg", pat: "ctlPat" };
  Object.keys(barras).forEach(function(k){
    $(barras[k]).classList.toggle("hide", el.kind !== k);
  });
  if (el.kind === "text"){
    $("txt").value = el.text;
    $("font").value = el.font;
    mostraFonte();
    $("rows").value = el.rowsTarget; $("rowsOut").textContent = el.rowsTarget;
    $("thick").value = el.thick; $("thickOut").textContent = el.thick;
    $("thr").value = Math.round(el.thr * 100); $("thrOut").textContent = Math.round(el.thr * 100);
    $("esp").value = el.esp || 0; $("espOut").textContent = el.esp || 0;
    $("arc").value = el.arc || 0; $("arcOut").textContent = el.arc || 0;
  } else if (el.kind === "img"){
    var grafico = temPaleta(el);
    $("imgLarg").value = el.larg; $("imgLargOut").textContent = el.larg;
    $("imgCores").value = el.cores || 1; $("imgCoresOut").textContent = el.cores || 1;
    var pc = Math.round(el.thr * 100);
    $("imgThr").value = pc; $("imgThrOut").textContent = pc;
    var pk = Math.round((el.corte == null ? 0.1 : el.corte) * 100);
    $("imgCorte").value = pk; $("imgCorteOut").textContent = pk;
    $("imgFonte").value = el.fonte || "anchor";
    // sensibilidade e inverter são de silhueta; corte de fundo e cartela são
    // de gráfico. Mostrar os quatro deixaria dois mexendo em nada
    $("tImgThr").classList.toggle("hide", grafico);
    $("imgInv").classList.toggle("hide", grafico);
    $("tImgCorte").classList.toggle("hide", !grafico);
    $("tImgFonte").classList.toggle("hide", !grafico);
    $("imgInv").classList.toggle("on", !!el.inv);
    // sem a imagem não há o que refazer: os dois campos ficam à vista, para
    // a peça continuar dizendo com que números ela foi desenhada, mas
    // desligados, porque mexer neles não mudaria um quadradinho
    var semImg = !origemPronta(el);
    $("imgLarg").disabled = semImg;
    $("imgThr").disabled = semImg;
    $("imgInv").disabled = semImg;
    $("imgCores").disabled = semImg;
    $("imgCorte").disabled = semImg;
    $("imgFonte").disabled = semImg;
    $("imgInv").title = semImg
      ? "A imagem desta peça não está mais na memória do navegador. Use o trocar para pôr o arquivo de novo."
      : "Troca o claro pelo escuro — é o que resolve desenho branco sobre fundo escuro.";
  } else if (el.kind === "pat"){
    var faixa = el.arranjo === "faixa";
    $("patArr").value = el.arranjo;
    $("patMot").value = el.motivo;
    $("patScale").value = el.scale;
    $("patGap").value = el.gap;
    $("patMargem").value = el.margem;
    $("patRep").value = el.rep;
    $("patCores").value = el.cores;
    $("patDeit").classList.toggle("on", !!el.deitada);
    // a margem é da foto e a repetição é da fileira: cada arranjo mostra a sua
    $("tPatMargem").classList.toggle("hide", faixa);
    $("tPatRep").classList.toggle("hide", !faixa);
    $("patDeit").classList.toggle("hide", !faixa);
  } else {
    $("sym").value = el.sym;
    $("symScale").value = el.scale; $("symScaleOut").textContent = el.scale;
  }
  $("rot").value = el.rot; $("rotOut").textContent = el.rot;
}

function loadFontThen(fn, fam){
  var f = fam || $("font").value;
  if (document.fonts && document.fonts.load){
    document.fonts.load(fontStr(100, f)).then(fn).catch(fn);
  } else fn();
}

/* Palavra nova nasce com o que está na barra de cima — fonte, altura, traço,
   sensibilidade, espaço, arco e inclinação —, e não com os valores de fábrica.
   Antes, pedir a segunda linha de um nome com os mesmos controles à vista
   devolvia uma palavra de outro tamanho, e não havia como saber por quê: os
   controles mostravam uma coisa e a peça nova tinha nascido de outra. Só a
   primeira palavra de um molde em branco usa os valores de fábrica, porque aí
   não há barra nenhuma de onde herdar.

   De fábrica ela nasce reta: a inclinação de -4° que vinha antes era um
   gosto, não um pedido, e palavra torta sem ninguém ter mandado é ajuste a
   mais para desfazer. */
function comoEstaNaBarra(){
  var pd = { text:"amor", font:"Great Vibes", rowsTarget:16, thick:2, thr:0.35,
             esp:0, arc:0, rot:0 };
  var temTexto = false;
  els.forEach(function(el){ if (el.kind === "text") temTexto = true; });
  if (!temTexto) return pd;
  var num = function(id, min, max, alt){
    var v = parseInt($(id).value, 10);
    return isNaN(v) ? alt : Math.max(min, Math.min(max, v));
  };
  if (fonteConhecida($("font").value)) pd.font = $("font").value;
  pd.rowsTarget = num("rows", 8, 60, pd.rowsTarget);
  pd.thick = num("thick", 0, 12, pd.thick);
  pd.thr = num("thr", 10, 80, 35) / 100;
  pd.esp = num("esp", 0, 8, 0);
  pd.arc = num("arc", -120, 120, 0);
  pd.rot = num("rot", -45, 45, pd.rot);
  return pd;
}

/* A caixa para onde as peças miram: a foto. Sem foto, uma caixa do tamanho
   dela no meio do papel — a mesma conta de sempre, só que mirando o centro da
   folha em vez de um retângulo que não está lá. */
function miraMM(){
  if (!photo.off) return photo;
  var pa = paperMM();
  return { x: (pa.w - photo.w) / 2, y: (pa.h - photo.h) / 2, w: photo.w, h: photo.h };
}

/* Onde a peça nova nasce: num lugar livre, perto da foto. Antes a palavra
   nascia em cima da borda de baixo da foto e o símbolo dentro dela, no
   canto — toda peça nova começava trepada em alguma coisa, e o primeiro
   gesto era sempre tirá-la dali.

   A ordem dos lugares é a de quem borda sobre foto: embaixo, que é onde vai
   o nome; em cima; dos lados. Cada lugar é empurrado para longe da foto até
   não encostar em peça nenhuma, e vale o primeiro que couber inteiro no
   papel. Se nada couber, a peça vai para embaixo da foto assim mesmo — o
   aviso de peça fora do papel diz o resto. Sem foto, ela nasce no meio do
   papel, descendo até achar espaço. */
var FOLGA_NOVA = 5;   // mm entre a peça nova e o que já está no papel

function encosta(a, b, folga){
  return a.x < b.x + b.w + folga && b.x < a.x + a.w + folga &&
         a.y < b.y + b.h + folga && b.y < a.y + a.h + folga;
}

function poeEmLugarLivre(el){
  var pa = paperMM(), b = elPaperBox(el), w = b.w, h = b.h, F = FOLGA_NOVA;
  var outras = els.filter(function(o){ return o !== el; }).map(elPaperBox);
  var livre = function(c){
    if (c.x < 0 || c.y < 0 || c.x + w > pa.w || c.y + h > pa.h) return false;
    var cx = { x: c.x, y: c.y, w: w, h: h };
    if (!photo.off && encosta(cx, photo, F - 0.01)) return false;
    return !outras.some(function(o){ return encosta(cx, o, F - 0.01); });
  };
  // cada candidato é um ponto de partida e uma direção para andar
  var cands = [];
  if (!photo.off){
    var f = photo;
    cands.push({ x: f.x + (f.w - w) / 2, y: f.y + f.h + F, dx: 0, dy: 1 });
    cands.push({ x: f.x + (f.w - w) / 2, y: f.y - F - h, dx: 0, dy: -1 });
    cands.push({ x: f.x + f.w + F, y: f.y + (f.h - h) / 2, dx: 1, dy: 0 });
    cands.push({ x: f.x - F - w, y: f.y + (f.h - h) / 2, dx: -1, dy: 0 });
  } else {
    cands.push({ x: (pa.w - w) / 2, y: (pa.h - h) / 2, dx: 0, dy: 1 });
    cands.push({ x: (pa.w - w) / 2, y: (pa.h - h) / 2, dx: 0, dy: -1 });
  }
  var achou = null;
  for (var i = 0; i < cands.length && !achou; i++){
    var c = { x: cands[i].x, y: cands[i].y };
    for (var passo = 0; passo < 200; passo++){
      if (livre(c)){ achou = c; break; }
      c.x += cands[i].dx * 2; c.y += cands[i].dy * 2;
      if (c.x < -w || c.y < -h || c.x > pa.w || c.y > pa.h) break;
    }
  }
  if (!achou) achou = { x: cands[0].x, y: cands[0].y };
  // a caixa girada e a caixa da peça têm o mesmo centro
  var bb = bboxMM(el);
  el.x = dec1(achou.x + w / 2 - bb.w / 2);
  el.y = dec1(achou.y + h / 2 - bb.h / 2);
}

function addText(){
  var pd = comoEstaNaBarra();
  var el = { kind:"text", text: pd.text, font: pd.font, rowsTarget: pd.rowsTarget,
             thick: pd.thick, thr: pd.thr, rot: pd.rot,
             esp: pd.esp, arc: pd.arc, flip:0, hv:2, edits:[],
             x: 0, y: 0, cells:[[0]],
             color: thread, colorName: threadLabel(thread) || thread };
  rebuild(el);
  poeEmLugarLivre(el);
  els.push(el); sel = els.length - 1; soUm(sel); foco = "el";
  renderChips(); syncControls(); draw(); pushHist();
  // o texto de fábrica é só um lugar para escrever: ele já vem selecionado,
  // e a primeira tecla o substitui
  var campo = $("txt");
  if (campo && campo.offsetParent){ campo.focus(); campo.select(); }
}

function addSym(){
  var el = { kind:"sym", sym:"heart", scale:2, rot:0, x: 0, y: 0,
             flip:0, edits:[], cells:[[0]], color: thread, colorName: threadLabel(thread) || thread };
  rebuild(el);
  poeEmLugarLivre(el);
  els.push(el); sel = els.length - 1; soUm(sel); foco = "el";
  renderChips(); syncControls(); draw(); pushHist();
}

/* A moldura nasce em volta da foto, com os blocos sortidos e seis linhas
   — o bastante para os blocos se alternarem em dois esquemas de cor. */
function addMoldura(){
  var el = { kind:"pat", arranjo:"moldura", motivo:"sortido", scale:1, gap:1,
             margem:6, rep:6, deitada:0, cores:6, rot:0, flip:0, edits:[],
             x:0, y:0, cells:[[0]] };
  rebuild(el);
  centraNaMira(el);
  els.push(el); sel = els.length - 1; soUm(sel); foco = "el";
  renderChips(); syncControls(); renderPaleta(); renderFios(); draw(); pushHist();
}

/* A faixa nasce de pé, no meio do papel, com motivos bastantes para correr
   o comprimento dele com 1 cm de folga em cada ponta: num papel de
   marca-página, é o marca-página pronto. Num A4 é uma fileira longa, que se
   encurta no repetir. */
function addFaixa(){
  var el = { kind:"pat", arranjo:"faixa", motivo:"m:medalhao", scale:1, gap:1,
             margem:6, rep:1, deitada:0, cores:1, rot:0, flip:0, edits:[],
             x:0, y:0, cells:[[0]] };
  var pa = paperMM(), p = P(), h = gradeMotivo(el.motivo, 1).length;
  el.rep = Math.max(1, Math.min(PAT_REP_MAX,
    Math.floor(((pa.h - 20) / p + el.gap) / (h + el.gap))));
  rebuild(el);
  var b = bboxMM(el);
  el.x = Math.round((pa.w - b.w) / 2 * 10) / 10;
  el.y = Math.round((pa.h - b.h) / 2 * 10) / 10;
  els.push(el); sel = els.length - 1; soUm(sel); foco = "el";
  renderChips(); syncControls(); renderPaleta(); renderFios(); draw(); pushHist();
}

// o seletor de desenho: os blocos de retalho primeiro, que são da moldura,
// depois os motivos de faixa e por fim os símbolos, que também repetem bem
function montaMotivos(){
  var s = $("patMot");
  var grupo = function(rot, itens){
    var g = document.createElement("optgroup");
    g.label = rot;
    itens.forEach(function(it){
      var o = document.createElement("option");
      o.value = it[0]; o.textContent = it[1];
      g.appendChild(o);
    });
    s.appendChild(g);
  };
  grupo("blocos de retalho", [["sortido", "sortidos"]].concat(
    ORDEM_BLOCOS.map(function(k){ return ["b:" + k, BLOCOS[k].nome]; })));
  grupo("motivos de faixa", Object.keys(MOTIVOS).map(function(k){ return ["m:" + k, MOTIVOS[k].nome]; }));
  grupo("símbolos", Object.keys(NOMES_SYM).map(function(k){ return ["s:" + k, NOMES_SYM[k]]; }));
}
montaMotivos();

$("patDeit").addEventListener("click", function(){
  var el = els[sel];
  if (!el || el.kind !== "pat") return;
  el.deitada = el.deitada ? 0 : 1;
  this.classList.toggle("on", !!el.deitada);
  refazNoCentro(el);
  draw(); pushHist();
});

/* A imagem entra reduzida, como a foto, e pelo mesmo motivo: o que ela vai
   virar são quadradinhos, e 512 px já dão mais pixels por quadradinho do que
   a maior largura consegue usar — guardar o original inteiro só encheria a
   cota do navegador sem mudar um furo.

   O que fica na memória da sessão é o canvas reduzido, e não uma imagem nova
   feita a partir do data-url: o canvas já está decodificado, então a peça
   nasce desenhada no mesmo gesto em vez de piscar vazia esperando o
   navegador ler o que ele mesmo acabou de escrever. */
function guardaOrigem(id, img){
  var k = Math.min(1, IMG_MAX_PX / Math.max(img.width, img.height));
  var c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * k));
  c.height = Math.max(1, Math.round(img.height * k));
  var x = c.getContext("2d");
  // o alfa vira branco aqui, uma vez, e não a cada refazer: transparência de
  // logo é fundo, e não tinta
  x.fillStyle = "#fff";
  x.fillRect(0, 0, c.width, c.height);
  x.drawImage(img, 0, 0, c.width, c.height);
  var url = "";
  // com perda de propósito: o que sai daqui ainda passa por um limiar, e
  // artefato de jpeg não muda um quadradinho
  try { url = c.toDataURL("image/jpeg", 0.85); } catch (e){ url = ""; }
  origens[id] = { url: url, img: c };
}

/* Foto de gente, de bicho, de paisagem: em uma cor só ela vira mancha
   picotada, porque o limiar corta os meios-tons no meio. O que separa foto
   de logo é quanto da imagem fica fora dos três tons mais comuns: num logo
   quase nada (o fundo, a tinta e a borda suavizada, que é fina), numa foto
   um bom pedaço. Logo de muitas cores também passa por foto aqui, e está
   certo: em uma linha só ele perderia as cores do mesmo jeito. Vale só para
   a escolha de fábrica: o campo cores continua lá. */
var FOTO_CORES = 8;
function pareceFoto(el){
  var img = origemPronta(el);
  if (!img) return false;
  // lida numa grade fina, e não na da peça: na grade de 40 a borda de um
  // logo cai no meio dos quadradinhos e vira meio-tom de mentira
  var k = Math.min(1, 200 / Math.max(img.width, img.height));
  var c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * k));
  c.height = Math.max(1, Math.round(img.height * k));
  var x = c.getContext("2d"), data;
  x.drawImage(img, 0, 0, c.width, c.height);
  try { data = x.getImageData(0, 0, c.width, c.height).data; } catch (e){ return false; }
  // 16 níveis por canal: uma foto em preto e branco também tem que passar
  var conta = {}, n = data.length / 4, tons = 0;     // `tons`: pixels nos 3 tons mais comuns
  for (var i = 0; i < data.length; i += 4){
    var q = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    conta[q] = (conta[q] || 0) + 1;
  }
  var maiores = Object.keys(conta).map(function(t){ return conta[t]; })
    .sort(function(p, q){ return q - p; });
  for (var j = 0; j < 3 && j < maiores.length; j++) tons += maiores[j];
  return (n - tons) / n > 0.2;
}

function addImg(img, nome){
  var id = novoId(), m = miraMM();
  guardaOrigem(id, img);
  var el = { kind:"img", img:id, nome: nome || "imagem",
             larg: 40, thr: 0.5, inv: 0, rot: 0,
             x: m.x, y: m.y, flip:0, edits:[], cells:[[0]],
             color: thread, colorName: threadLabel(thread) || thread };
  if (pareceFoto(el)){ el.cores = FOTO_CORES; el.corte = 0.1; el.fonte = $("imgFonte").value || "anchor"; }
  rebuild(el);
  // nasce num lugar livre, como as outras peças: uma imagem grande no meio da
  // foto escondia a própria foto que ela devia acompanhar
  poeEmLugarLivre(el);
  els.push(el); sel = els.length - 1; soUm(sel); foco = "el";
  renderChips(); syncControls(); draw(); pushHist();
  avisaVazio(el);
}

/* Peça de imagem que não acendeu nada é uma peça de um quadradinho apagado:
   na tela ela é um ponto, e o motivo — sensibilidade alta demais, ou desenho
   claro sobre fundo escuro — não está em lugar nenhum. O aviso é onde a
   imagem foi pedida, e some sozinho quando o desenho volta. */
function avisaVazio(el){
  var vazia = el && el.kind === "img" && el.cells.length === 1 &&
              el.cells[0].length === 1 && !el.cells[0][0];
  if (!vazia) return avisaImagem("");
  // o controle que resolve não é o mesmo nos dois caminhos, e mandar mexer
  // no que está escondido na barra é pior do que não avisar nada
  avisaImagem(temPaleta(el)
    ? "Essa imagem não acendeu nenhum quadradinho: o corte de fundo levou tudo. Baixe o fundo na barra de cima."
    : "Essa imagem não acendeu nenhum quadradinho. Baixe a sensibilidade na barra de cima — ou use o inverter, se o desenho for claro sobre fundo escuro.");
}

/* Trocar a imagem de uma peça guarda o lugar, a inclinação e a linha dela —
   que é a razão de existir do botão: reimportar do zero devolveria a peça no
   meio da foto, na cor corrente, e o alinhamento teria de ser refeito.

   O ajuste ponto a ponto é o que não sobrevive, e não por descuido: ele é
   uma lista de quadradinhos daquele desenho, e sobre um desenho diferente
   não quer dizer nada. Por isso pergunta antes, como o Recalcular. */
function trocaImagem(el, img, nome){
  var id = novoId();       // id novo: a imagem velha pode ser de uma peça duplicada
  guardaOrigem(id, img);
  el.img = id;
  if (nome) el.nome = nome;
  refazNoCentro(el, true);
  renderChips(); syncControls(); draw(); pushHist();
  avisaVazio(el);
}

function avisaImagem(msg){
  var p = $("imgAviso");
  if (p) p.textContent = msg || "";
}

// null: a imagem escolhida vira peça nova. Senão, é a peça que troca de
// imagem — guardada como referência, e não como índice, porque apagar outra
// peça enquanto a janela de arquivos está aberta move os índices
var imgAlvo = null;

function pedeImagem(alvo){
  imgAlvo = alvo || null;
  var inp = $("imgArq");
  inp.value = "";     // escolher o mesmo arquivo duas vezes ainda avisa
  inp.click();
}

$("addImg").addEventListener("click", function(){ avisaImagem(""); pedeImagem(null); });

$("imgTroca").addEventListener("click", function(){
  var el = els[sel];
  if (!el || el.kind !== "img") return;
  var n = el.manual || 0;
  if (n && !confirm("Esta peça tem " + n + (n === 1 ? " quadradinho aceso" : " quadradinhos acesos") +
      " ou apagado à mão. A imagem nova é outro desenho, então esse ajuste será perdido. Trocar mesmo assim?"))
    return;
  avisaImagem("");
  pedeImagem(el);
});

$("imgArq").addEventListener("change", function(e){
  var f = e.target.files && e.target.files[0];
  var alvo = imgAlvo;
  imgAlvo = null;
  if (!f) return;
  var nome = String(f.name || "").replace(/\.[^.]+$/, "").trim().slice(0, 28) || "imagem";
  var rd = new FileReader();
  rd.onerror = function(){ avisaImagem("Não consegui ler esse arquivo."); };
  rd.onload = function(){
    var img = new Image();
    img.onerror = function(){ avisaImagem("Esse arquivo não é uma imagem que o navegador abra."); };
    img.onload = function(){
      // a peça pode ter sido apagada ou desfeita enquanto a janela de
      // arquivos estava aberta: sem ela na lista, a troca não tem alvo
      if (alvo){ if (els.indexOf(alvo) >= 0) trocaImagem(alvo, img, nome); return; }
      addImg(img, nome);
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(f);
});

$("addText").addEventListener("click", function(){
  loadFontThen(addText, comoEstaNaBarra().font);
});
$("addSym").addEventListener("click", addSym);
$("addMoldura").addEventListener("click", addMoldura);
$("addFaixa").addEventListener("click", addFaixa);
$("delEl").addEventListener("click", function(){
  if (!els.length) return;
  els.splice(sel, 1);
  sel = Math.max(0, sel - 1);
  soUm(sel);
  if (!els.length) foco = "none";
  renderChips(); syncControls(); draw(); pushHist();
});

/* Espelhar mexe nas células como elas estão, e não refaz a peça: quem
   acendeu quadradinho à mão vê o ajuste virar junto em vez de sumir. A marca
   fica gravada para o próximo Recalcular espelhar também. */
$("flipEl").addEventListener("click", function(){
  var el = els[sel];
  if (!el) return;
  el.flip = el.flip ? 0 : 1;
  el.cells = espelha(el.cells);
  // as colunas viraram, e com elas a lista: ajuste espelhado continua no
  // mesmo lugar do desenho em vez de aparecer do outro lado
  var colsEsp = el.cells[0] ? el.cells[0].length : 0;
  (el.edits || []).forEach(function(e){ e.q = colsEsp - 1 - e.q; });
  this.classList.toggle("on", !!el.flip);
  renderChips(); draw(); pushHist();
});

$("dupEl").addEventListener("click", function(){
  var el = els[sel];
  if (!el) return;
  // packEl/unpackEl já é a cópia profunda do app: leva as células como estão,
  // e com elas os ajustes feitos ponto a ponto
  var copia = unpackEl(packEl(el));
  if (!copia) return;
  var pa = paperMM();
  var b = bboxMM(el);
  copia.x = Math.min(el.x + 4, Math.max(0, pa.w - b.w));
  copia.y = Math.min(el.y + 4, Math.max(0, pa.h - b.h));
  els.splice(sel + 1, 0, copia);
  sel = sel + 1;
  soUm(sel);
  foco = "el";
  renderChips(); syncControls(); draw(); pushHist();
});

function updateSelected(){
  var el = els[sel];
  if (!el) return;
  if (el.kind === "text"){
    el.text = $("txt").value;
    el.font = $("font").value;
    el.rowsTarget = parseInt($("rows").value, 10);
    el.hv = 2;   // o número veio da barra, que já conta pela maiúscula
    el.thick = parseInt($("thick").value, 10);
    el.thr = parseInt($("thr").value, 10) / 100;
    el.esp = parseInt($("esp").value, 10) || 0;
    el.arc = parseInt($("arc").value, 10) || 0;
    $("rowsOut").textContent = el.rowsTarget;
    $("thickOut").textContent = el.thick;
    $("thrOut").textContent = $("thr").value;
    $("espOut").textContent = el.esp;
    $("arcOut").textContent = el.arc;
    loadFontThen(function(){ refazNoCentro(el); renderChips(); draw(); pushLater(); });
    return;
  }
  if (el.kind === "img"){
    var lg = parseInt($("imgLarg").value, 10);
    var tr = parseInt($("imgThr").value, 10);
    var ct = parseInt($("imgCorte").value, 10);
    var nc = parseInt($("imgCores").value, 10);
    if (!isNaN(lg)) el.larg = Math.max(IMG_LARG_MIN, Math.min(IMG_LARG_MAX, lg));
    if (!isNaN(tr)) el.thr = Math.max(0, Math.min(90, tr)) / 100;
    if (!isNaN(ct)) el.corte = Math.max(0, Math.min(80, ct)) / 100;
    if (!isNaN(nc)) el.cores = Math.max(1, Math.min(CORES_MAX, nc));
    el.fonte = $("imgFonte").value || "anchor";
    $("imgLargOut").textContent = el.larg;
    $("imgThrOut").textContent = Math.round(el.thr * 100);
    $("imgCorteOut").textContent = Math.round(el.corte * 100);
    $("imgCoresOut").textContent = el.cores;
    refazNoCentro(el);
    avisaVazio(el);
    // a barra troca de campos quando a peça deixa de ser silhueta, e a lista
    // de linhas do gráfico nasce ou some junto
    syncControls(); renderPaleta(); renderFios();
    renderChips(); draw(); pushLater();
    return;
  }
  if (el.kind === "pat"){
    var num = function(id, min, max, alt){
      var v = parseInt($(id).value, 10);
      return isNaN(v) ? alt : Math.max(min, Math.min(max, v));
    };
    var arranjoAntes = el.arranjo;
    el.arranjo = $("patArr").value === "faixa" ? "faixa" : "moldura";
    el.motivo = $("patMot").value || el.motivo;
    el.scale = num("patScale", 1, 4, el.scale);
    el.gap = num("patGap", 0, 10, el.gap);
    el.margem = num("patMargem", 0, 60, el.margem);
    el.rep = num("patRep", 1, PAT_REP_MAX, el.rep);
    el.cores = num("patCores", 1, PAT_CORES_MAX, el.cores);
    // a moldura volta para a foto; a faixa cresce a partir do meio dela, que
    // é o que mantém a fileira no eixo do marca-página
    if (el.arranjo === "moldura"){ rebuild(el); centraNaMira(el); }
    else refazNoCentro(el);
    if (arranjoAntes !== el.arranjo) syncControls();
    renderPaleta(); renderFios(); renderChips(); draw(); pushLater();
    return;
  }
  el.sym = $("sym").value;
  el.scale = parseInt($("symScale").value, 10);
  $("symScaleOut").textContent = el.scale;
  refazNoCentro(el);
  renderChips(); draw(); pushLater();
}

["txt","font","rows","thick","thr","esp","arc","sym","symScale",
 "imgLarg","imgThr","imgCorte","imgCores",
 "patArr","patMot","patScale","patGap","patMargem","patRep","patCores"]
  .forEach(function(id){ $(id).addEventListener("input", updateSelected); });
$("imgFonte").addEventListener("change", function(){
  var el = els[sel];
  if (!el || el.kind !== "img") return;
  el.fonte = this.value || "anchor";
  // trocar de cartela é pedir paleta nova: as meadas de outra marca não são
  // as mesmas cores com outro número
  el.paleta = null; el.paletaDe = 0;
  refazNoCentro(el);
  syncControls(); renderPaleta(); renderFios(); renderChips(); draw(); pushHist();
});

// as marcas entre as quais o gráfico escolhe as linhas
function montaFonteLinhas(){
  var sel2 = $("imgFonte");
  if (!sel2) return;
  var antes = sel2.value;
  sel2.innerHTML = "";
  CAT.forEach(function(m){
    var o = document.createElement("option");
    o.value = m.id; o.textContent = m.marca;
    sel2.appendChild(o);
  });
  var o2 = document.createElement("option");
  o2.value = "minhas"; o2.textContent = "minhas";
  sel2.appendChild(o2);
  if (antes) sel2.value = antes;
  if (!sel2.value) sel2.value = CAT.length ? CAT[0].id : "minhas";
}

$("imgInv").addEventListener("click", function(){
  var el = els[sel];
  if (!el || el.kind !== "img") return;
  el.inv = el.inv ? 0 : 1;
  this.classList.toggle("on", !!el.inv);
  refazNoCentro(el);
  avisaVazio(el);
  draw(); pushHist();
});
$("rot").addEventListener("input", function(){
  var el = els[sel]; if (!el) return;
  el.rot = parseInt($("rot").value, 10);
  $("rotOut").textContent = el.rot;
  draw(); pushLater();
});
$("mm").addEventListener("input", function(){
  $("mmOut").textContent = fmt(parseFloat($("mm").value));
  draw(); pushLater();
});

function papelPainel(){
  var prop = $("paperSize").value === "custom";
  $("paperCustom").classList.toggle("hide", !prop);
  $("paperOrCampo").classList.toggle("dim", prop);
  $("paperNota").innerHTML = prop
    ? "No tamanho <b>Personalizado</b> quem manda são os dois campos acima: a " +
      "orientação fica de lado, e o papel sai com a largura e a altura que você digitou."
    : "As medidas próprias aparecem quando o tamanho é <b>Personalizado</b>.";
}

function fotoPainel(){
  var prop = $("photoSize").value === "custom", sem = $("photoSize").value === "none";
  $("photoCampos").classList.toggle("hide", sem);
  $("semFotoNota").classList.toggle("hide", !sem);
  $("alFoto").classList.toggle("hide", sem);
  $("alBase").classList.toggle("hide", sem);
  $("photoCustom").classList.toggle("hide", !prop);
  $("photoOrCampo").classList.toggle("dim", prop);
  $("photoNota").innerHTML = prop
    ? "No tamanho <b>Personalizado</b> quem manda são os dois campos acima: a " +
      "orientação fica de lado, e a foto sai com a largura e a altura que você digitou."
    : "";
}

/* O papel mudou: o arranjo inteiro — foto e peças juntas — vai para o
   lugar equivalente do papel novo, e, se couber nele, entra inteiro. Antes
   quem ia para o lugar equivalente era só a foto, e as peças seguiam presas
   a ela: um nome embaixo da foto num A4 caía para fora de um A5, mesmo
   havendo lugar para tudo. Tamanho não muda nunca — o molde é em tamanho
   real —, então o que não cabe continua não cabendo, e o aviso diz isso. */
function caixaDoArranjo(){
  var cx = [];
  if (!photo.off) cx.push({ x: photo.x, y: photo.y, w: photo.w, h: photo.h });
  els.forEach(function(el){ cx.push(elPaperBox(el)); });
  if (!cx.length) return null;
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  cx.forEach(function(b){
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
  });
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function onPaperChange(){
  papelPainel();
  var before = lastPaper || paperMM();
  var after = paperMM();
  var g = caixaDoArranjo();
  if (g && (before.w !== after.w || before.h !== after.h)){
    var nx = (g.x + g.w / 2) / before.w * after.w - g.w / 2;
    var ny = (g.y + g.h / 2) / before.h * after.h - g.h / 2;
    // cabendo, entra inteiro; não cabendo, fica centrado — sobra igual dos dois lados
    nx = g.w <= after.w ? Math.max(0, Math.min(after.w - g.w, nx)) : (after.w - g.w) / 2;
    ny = g.h <= after.h ? Math.max(0, Math.min(after.h - g.h, ny)) : (after.h - g.h) / 2;
    var dx = nx - g.x, dy = ny - g.y;
    photo.x += dx; photo.y += dy;
    els.forEach(function(el){ el.x = dec1(el.x + dx); el.y = dec1(el.y + dy); });
  }
  clampPhoto();
  lastPaper = after;
  guiasApara();        // a guia que sobrou fora da folha nova mediria mentira
  draw();
}
["paperSize","paperOr"].forEach(function(id){ $(id).addEventListener("change", onPaperChange); });
["paperW","paperH"].forEach(function(id){
  $(id).addEventListener("input", function(){ propriaLe(id); papelAviso(); onPaperChange(); });
  $(id).addEventListener("change", function(){ propriaFirma(id); papelAviso(); onPaperChange(); });
});

/* A foto mudou de tamanho ou girou: ela cresce em volta do próprio centro, e
   as peças vão junto. Antes a foto crescia a partir do canto de cima e as
   peças ficavam onde estavam — o nome que estava embaixo da foto acabava em
   cima dela.

   Cada peça guarda a relação que tinha com a foto, eixo por eixo: a que
   estava fora (embaixo, em cima, dos lados) continua à mesma distância da
   borda mais perto; a que estava dentro continua na mesma proporção. */
function seguePosicao(c, a0, l0, a1, l1){
  if (c <= a0) return a1 - (a0 - c);
  if (c >= a0 + l0) return a1 + l1 + (c - a0 - l0);
  return a1 + (c - a0) / l0 * l1;
}

function fotoMudou(antes){
  if (photo.w === antes.w && photo.h === antes.h) return;
  photo.x = antes.x + antes.w / 2 - photo.w / 2;
  photo.y = antes.y + antes.h / 2 - photo.h / 2;
  clampPhoto();
  els.forEach(function(el){
    if (el.kind === "pat" && el.arranjo === "moldura") return;   // refazMolduras cuida dela
    var b = bboxMM(el), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    var nx = seguePosicao(cx, antes.x, antes.w, photo.x, photo.w);
    var ny = seguePosicao(cy, antes.y, antes.h, photo.y, photo.h);
    el.x = dec1(el.x + nx - cx);
    el.y = dec1(el.y + ny - cy);
  });
}

function onPhotoChange(){
  var antes = { x: photo.x, y: photo.y, w: photo.w, h: photo.h };
  fotoPainel();
  syncPhotoSize();
  fotoMudou(antes);
  refazMolduras();
  draw(); pushLater();
}

// a moldura é da foto: foto que muda de tamanho pede outra quantidade de
// blocos, e a moldura volta a ficar centrada nela
function refazMolduras(){
  var mudou = false;
  els.forEach(function(el){
    if (el.kind !== "pat" || el.arranjo !== "moldura") return;
    rebuild(el); centraNaMira(el); mudou = true;
  });
  if (mudou){ renderPaleta(); renderFios(); }
}
["photoSize","photoOr"].forEach(function(id){ $(id).addEventListener("change", onPhotoChange); });
["photoWmm","photoHmm"].forEach(function(id){
  $(id).addEventListener("input", function(){ propriaLe(id); fotoAviso(); onPhotoChange(); });
  $(id).addEventListener("change", function(){ propriaFirma(id); fotoAviso(); onPhotoChange(); });
});

function flip(id){
  var e = $(id);
  e.value = e.value === "p" ? "l" : "p";
}

$("rotPhoto").addEventListener("click", function(){
  var antes = { x: photo.x, y: photo.y, w: photo.w, h: photo.h };
  flip("photoOr");
  syncPhotoSize();
  fotoMudou(antes);
  refazMolduras();
  draw(); pushHist();
});

$("semFoto").addEventListener("click", function(){
  $("photoSize").value = "none";
  onPhotoChange();
  syncControls(); renderChips();
});

$("centerPhoto").addEventListener("click", function(){
  var pa = paperMM();
  photo.x = (pa.w - photo.w) / 2;
  photo.y = (pa.h - photo.h) / 2;
  draw(); pushHist();
});
$("centerTop").addEventListener("click", function(){
  var pa = paperMM();
  photo.x = (pa.w - photo.w) / 2;
  photo.y = Math.max(0, pa.h * 0.12);
  draw(); pushHist();
});

$("photo").addEventListener("change", function(e){
  var f = e.target.files && e.target.files[0];
  if (!f) return;
  var rd = new FileReader();
  rd.onload = function(){
    var img = new Image();
    img.onload = function(){ photoImg = img; photoURL = rd.result; savePhoto(img); draw(); };
    img.src = rd.result;
  };
  rd.readAsDataURL(f);
});

$("edit").addEventListener("click", function(){
  editing = !editing;
  if (editing) soUm(sel);   // ponto a ponto é numa peça só
  syncControls();
  this.classList.toggle("on", editing);
  document.querySelector(".app").classList.toggle("editando", editing);
  $("ctlEdit").classList.toggle("hide", !editing);
  $("editLabel").textContent = editing ? "terminar" : "ajustar";
  draw();   // a grade ganha ou devolve a altura do painel
  $("modeHint").textContent = editing
    ? "Toque num quadradinho da peça selecionada para acender ou apagar. Arrastando sem soltar, o traço inteiro segue o primeiro."
    : MODO_MOVER;
});

/* Recalcular refaz as células a partir dos controles, então apaga tudo que
   foi aceso ou apagado à mão. Só pergunta quando há o que perder. */
function recalc(todas){
  // forEach(rebuild) entregaria o índice como segundo argumento, que aqui é o
  // "descarta" — e a peça 0 não descartaria nada
  if (todas) els.forEach(function(el){ refazNoCentro(el, true); });
  else if (els[sel]) refazNoCentro(els[sel], true);
  draw(); pushHist();
}

function fecharModal(){ $("modal").classList.add("hide"); }

$("reset").addEventListener("click", function(){
  var n = manualCount();
  if (!n){ recalc(true); return; }
  var daSel = els[sel] ? (els[sel].manual || 0) : 0;
  $("modalWarn").textContent = n === 1
    ? "Você acendeu ou apagou 1 quadradinho à mão. Ele será perdido."
    : "Você acendeu ou apagou " + n + " quadradinhos à mão. Eles serão perdidos.";
  $("modalOne").classList.toggle("hide", els.length < 2);
  $("modalOne").textContent = daSel
    ? "recalcular só a peça selecionada (perde " + daSel + ")"
    : "recalcular só a peça selecionada (não perde nada)";
  $("modal").classList.remove("hide");
  $("modalNo").focus();
});

$("modalNo").addEventListener("click", fecharModal);
$("modalYes").addEventListener("click", function(){ fecharModal(); recalc(true); });
$("modalOne").addEventListener("click", function(){ fecharModal(); recalc(false); });
$("modal").addEventListener("click", function(e){ if (e.target === this) fecharModal(); });
document.addEventListener("keydown", function(e){
  if (e.key === "Escape" && !$("modal").classList.contains("hide")) fecharModal();
});
