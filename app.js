/* ponto & letra — gerador de gráfico de ponto cruz para letras cursivas */
(function(){
  "use strict";

  /* ---- constantes de desenho e amostragem ---- */
  var CFG = {
    SAMPLE: 6,            // px por célula no canvas de amostragem
    ALPHA_MIN: 90,        // alfa mínimo para um subpixel contar como tinta
    STROKE_RATIO: 0.55,   // espessura do controle -> lineWidth do strokeText
    CELL_MIN: 10,         // px por célula na tela
    CELL_MAX: 18,
    CROSS_INSET: 0.24,    // recuo da cruz dentro da célula, em fração da célula
    MAX_COLS: 600,        // teto absoluto de colunas
    MAX_CANVAS: 16384,    // maior lado de canvas que os navegadores garantem
    DEBOUNCE: 120,        // ms entre o último input e o recálculo
    UNDO_LIMIT: 60
  };

  /* ---- folha A4 retrato, em milímetros ---- */
  var PAGE = { w: 210, h: 297, margin: 10, caption: 8, overlap: 2 };

  /* ---- fontes: fonte única da verdade, casa com os @font-face do style.css ---- */
  var FONTS = [
    { family: "Great Vibes",        label: "Great Vibes",    style: "normal" },
    { family: "Pinyon Script",      label: "Pinyon Script",  style: "normal" },
    { family: "Dancing Script",     label: "Dancing Script", style: "normal" },
    { family: "Sacramento",         label: "Sacramento",     style: "normal" },
    { family: "Parisienne",         label: "Parisienne",     style: "normal" },
    { family: "Caveat",             label: "Caveat",         style: "normal" },
    { family: "Cormorant Garamond", label: "Serif itálica",  style: "italic" }
  ];

  var STORE = "ponto-e-letra/v1";

  var el = {};
  ["txt","font","rows","thick","thr","mm","rowsOut","thickOut","thrOut","mmOut",
   "dims","count","size","grid","notice","editbar","editcount","undo","clear",
   "dl","print","reset","sheet","say"].forEach(function(id){ el[id] = document.getElementById(id); });

  /* ---- estado ---- */
  var state = {
    grid: null,          // {cols, rows, data:Uint8Array}
    edits: new Map(),    // "coluna,linha" -> 0|1, ajustes feitos à mão
    editsDims: "",       // dimensões da grade em que os ajustes foram feitos
    undo: [],
    cursor: null,        // {q, r} do cursor de teclado
    fontOk: true
  };
  var generation = 0, timer = 0, saveTimer = 0;

  function dimsOf(g){ return g ? g.cols + "×" + g.rows : ""; }
  function fontOf(family){
    for (var i = 0; i < FONTS.length; i++) if (FONTS[i].family === family) return FONTS[i];
    return FONTS[0];
  }
  // a Cormorant Garamond só existe em itálico: pedir "normal" deixa o navegador
  // sintetizar ou cair fora da fonte, então o estilo entra na string do canvas
  function fontString(f, px){
    return (f.style === "italic" ? "italic " : "") + px + 'px "' + f.family + '", cursive';
  }

  // acima disso o canvas da tela estoura silenciosamente e o quadro fica em branco
  function maxCols(){
    var dpr = window.devicePixelRatio || 1;
    return Math.min(CFG.MAX_COLS, Math.floor(CFG.MAX_CANVAS / (CFG.CELL_MIN * dpr)));
  }

  function controls(){
    return {
      text: el.txt.value,
      font: fontOf(el.font.value),
      rows: parseInt(el.rows.value, 10),
      thick: parseInt(el.thick.value, 10),
      thr: parseInt(el.thr.value, 10) / 100,
      mm: parseFloat(el.mm.value)
    };
  }

  /* ---- texto -> grade ------------------------------------------------- */

  function buildGrid(o){
    var S = CFG.SAMPLE;
    var text = o.text || " ";

    var probe = document.createElement("canvas").getContext("2d");
    probe.font = fontString(o.font, 100);
    var m = probe.measureText(text);
    var asc = m.actualBoundingBoxAscent || 72;
    var dsc = m.actualBoundingBoxDescent || 28;
    var left = m.actualBoundingBoxLeft || 0;
    var right = m.actualBoundingBoxRight || m.width;
    var h = asc + dsc, w = left + right;
    if (!(h > 0) || !(w > 0)) return null;

    var k = (o.rows * S) / h;
    var lw = o.thick > 0 ? o.thick * k * CFG.STROKE_RATIO : 0;

    // a margem precisa comportar metade do traço, senão o contorno é cortado.
    // a folga extra vai em células inteiras para não deslocar a fase da amostragem:
    // com traço fino a grade sai idêntica à de antes, e o trim corta a sobra.
    var extra = lw > 0 ? Math.ceil((lw / 2) / S) * S : 0;
    var padX = S * 2 + extra;
    var padY = S + extra;
    var cw = Math.ceil(w * k) + padX * 2;
    var ch = Math.ceil(o.rows * S) + padY * 2;

    var cols = Math.floor(cw / S);
    if (cols > maxCols()) return { tooBig: cols };

    var c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    var x = c.getContext("2d", { willReadFrequently: true });
    x.font = fontString(o.font, 100 * k);
    x.textBaseline = "alphabetic";
    x.fillStyle = "#000";
    x.strokeStyle = "#000";
    x.lineJoin = "round";
    x.lineCap = "round";
    var bx = padX + left * k, by = padY + asc * k;
    if (lw > 0){ x.lineWidth = lw; x.strokeText(text, bx, by); }
    x.fillText(text, bx, by);

    var rows = Math.floor(ch / S);
    var data = x.getImageData(0, 0, cw, ch).data;
    var out = new Uint8Array(cols * rows);
    var min = S * S * o.thr;

    for (var r = 0; r < rows; r++){
      for (var q = 0; q < cols; q++){
        var on = 0;
        for (var yy = 0; yy < S; yy++){
          var base = ((r * S + yy) * cw + q * S) * 4 + 3;
          for (var xx = 0; xx < S; xx++){
            if (data[base + xx * 4] > CFG.ALPHA_MIN) on++;
          }
        }
        if (on > min) out[r * cols + q] = 1;
      }
    }
    return trim({ cols: cols, rows: rows, data: out });
  }

  function trim(g){
    var loX = g.cols, hiX = -1, loY = g.rows, hiY = -1;
    for (var r = 0; r < g.rows; r++){
      for (var q = 0; q < g.cols; q++){
        if (!g.data[r * g.cols + q]) continue;
        if (q < loX) loX = q;
        if (q > hiX) hiX = q;
        if (r < loY) loY = r;
        if (r > hiY) hiY = r;
      }
    }
    if (hiX < 0) return g;
    loX = Math.max(0, loX - 1); hiX = Math.min(g.cols - 1, hiX + 1);
    loY = Math.max(0, loY - 1); hiY = Math.min(g.rows - 1, hiY + 1);

    var cols = hiX - loX + 1, rows = hiY - loY + 1;
    var out = new Uint8Array(cols * rows);
    for (var y = 0; y < rows; y++){
      for (var q2 = 0; q2 < cols; q2++){
        out[y * cols + q2] = g.data[(loY + y) * g.cols + (loX + q2)];
      }
    }
    return { cols: cols, rows: rows, data: out };
  }

  /* ---- ajustes manuais ------------------------------------------------ */

  function applyEdits(g){
    if (!g || !state.edits.size) return g;
    if (state.editsDims !== dimsOf(g)) return g;   // ajustes de outro tamanho: ficam guardados
    state.edits.forEach(function(v, key){
      var p = key.split(","), q = +p[0], r = +p[1];
      if (q < g.cols && r < g.rows) g.data[r * g.cols + q] = v;
    });
    return g;
  }

  function pushUndo(){
    if (!state.grid) return;
    state.undo.push({
      data: state.grid.data.slice(),
      edits: new Map(state.edits),
      dims: state.editsDims
    });
    if (state.undo.length > CFG.UNDO_LIMIT) state.undo.shift();
  }

  function undo(){
    var snap = state.undo.pop();
    if (!snap || !state.grid) return;
    if (snap.data.length === state.grid.data.length) state.grid.data = snap.data;
    state.edits = snap.edits;
    state.editsDims = snap.dims;
    paint(); save();
    say("Desfeito. " + state.edits.size + " ajustes.");
  }

  function clearEdits(){
    if (!state.edits.size) return;
    pushUndo();
    state.edits = new Map();
    state.editsDims = "";
    apply(controls());
    save();
    say("Ajustes descartados.");
  }

  function toggle(q, r){
    var g = state.grid;
    if (!g || q < 0 || r < 0 || q >= g.cols || r >= g.rows) return;
    pushUndo();
    var i = r * g.cols + q;
    var v = g.data[i] ? 0 : 1;
    g.data[i] = v;
    if (state.editsDims !== dimsOf(g)){ state.edits = new Map(); state.editsDims = dimsOf(g); }
    state.edits.set(q + "," + r, v);
    paint(); save();
    say("Coluna " + (q + 1) + ", linha " + (r + 1) + (v ? ", marcado." : ", apagado."));
  }

  /* ---- desenho na tela ------------------------------------------------ */

  function paint(){
    var g = state.grid;
    var cv = el.grid, ctx = cv.getContext("2d");

    if (!g){
      cv.width = 0; cv.height = 0;
      el.dims.textContent = el.count.textContent = el.size.textContent = "—";
      paintEditBar();
      return;
    }

    var avail = cv.parentNode.clientWidth - 20;
    var cp = Math.max(CFG.CELL_MIN, Math.min(CFG.CELL_MAX, Math.floor(avail / g.cols)));
    var dpr = window.devicePixelRatio || 1;
    var W = g.cols * cp, H = g.rows * cp;

    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    lines(ctx, g, cp, W, H, 1, "#E2DED2", 1);
    lines(ctx, g, cp, W, H, 10, "#9AA8A2", 1.4);

    ctx.strokeStyle = "#C42A2A";
    ctx.lineWidth = Math.max(1.5, cp * 0.15);
    ctx.lineCap = "round";
    var n = 0, p = cp * CFG.CROSS_INSET;
    for (var r = 0; r < g.rows; r++){
      for (var q = 0; q < g.cols; q++){
        if (!g.data[r * g.cols + q]) continue;
        n++;
        var X = q * cp, Y = r * cp;
        ctx.beginPath();
        ctx.moveTo(X + p, Y + p); ctx.lineTo(X + cp - p, Y + cp - p);
        ctx.moveTo(X + cp - p, Y + p); ctx.lineTo(X + p, Y + cp - p);
        ctx.stroke();
      }
    }

    if (state.cursor && document.activeElement === cv){
      var cq = Math.min(state.cursor.q, g.cols - 1), cr = Math.min(state.cursor.r, g.rows - 1);
      ctx.strokeStyle = "#16544A";
      ctx.lineWidth = 2;
      ctx.strokeRect(cq * cp + 1, cr * cp + 1, cp - 2, cp - 2);
    }

    var mm = controls().mm;
    el.dims.textContent = g.cols + "×" + g.rows;
    el.count.textContent = n.toLocaleString("pt-BR");
    el.size.textContent = cm(g.cols * mm) + " × " + cm(g.rows * mm) + " cm";
    cv.setAttribute("aria-label",
      "Gráfico de " + g.cols + " por " + g.rows + " pontos, " + n + " pontos marcados. " +
      "Use as setas para andar pela grade e a barra de espaço para marcar ou apagar.");
    paintEditBar();
  }

  function lines(ctx, g, cp, W, H, every, color, width){
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (var q = 0; q <= g.cols; q += every){
      ctx.beginPath(); ctx.moveTo(q * cp + .5, 0); ctx.lineTo(q * cp + .5, H); ctx.stroke();
    }
    for (var r = 0; r <= g.rows; r += every){
      ctx.beginPath(); ctx.moveTo(0, r * cp + .5); ctx.lineTo(W, r * cp + .5); ctx.stroke();
    }
  }

  function cm(v){ return (v / 10).toFixed(1).replace(".", ","); }

  function paintEditBar(){
    var n = state.edits.size;
    el.editbar.hidden = n === 0;
    el.undo.disabled = state.undo.length === 0;
    if (!n) return;
    // derivado, nunca guardado: os ajustes valem para a grade em que foram feitos
    var stale = !state.grid || state.editsDims !== dimsOf(state.grid);
    var noun = n === 1 ? "1 ajuste manual" : n + " ajustes manuais";
    el.editcount.textContent = stale
      ? noun + (n === 1 ? " guardado" : " guardados") + ", da grade " + state.editsDims +
        (n === 1 ? " — volta" : " — voltam") + " se você retomar esse tamanho"
      : noun;
  }

  function notice(msg, soft){
    el.notice.hidden = !msg;
    el.notice.textContent = msg || "";
    el.notice.className = "notice" + (soft ? " soft" : "");
  }

  function say(msg){ el.say.textContent = msg; }

  /* ---- folha de impressão em escala real ------------------------------ */

  function buildSheet(){
    var g = state.grid;
    el.sheet.innerHTML = "";
    if (!g) return;

    var o = controls(), mm = o.mm;
    var perX = Math.max(1, Math.floor((PAGE.w - PAGE.margin * 2) / mm));
    var perY = Math.max(1, Math.floor((PAGE.h - PAGE.margin * 2 - PAGE.caption) / mm));
    var stepX = Math.max(1, perX - PAGE.overlap), stepY = Math.max(1, perY - PAGE.overlap);
    var pagesX = g.cols <= perX ? 1 : Math.ceil((g.cols - PAGE.overlap) / stepX);
    var pagesY = g.rows <= perY ? 1 : Math.ceil((g.rows - PAGE.overlap) / stepY);
    var total = pagesX * pagesY, html = "", n = 0;

    for (var py = 0; py < pagesY; py++){
      for (var px = 0; px < pagesX; px++){
        var c0 = px * stepX, c1 = Math.min(g.cols, c0 + perX);
        var r0 = py * stepY, r1 = Math.min(g.rows, r0 + perY);
        n++;
        var cap = "«" + esc(o.text || " ") + "» · " + esc(o.font.label) +
                  " · colunas " + (c0 + 1) + "–" + c1 +
                  " · linhas " + (r0 + 1) + "–" + r1 +
                  " · " + cm(mm * 10) + " mm por ponto · página " + n + "/" + total;
        if (n === 1) cap += ' <em>— imprima em 100%, sem "ajustar à página"</em>';
        html += '<section class="page"><p class="cap">' + cap + "</p>" +
                pageSvg(g, c0, c1, r0, r1, mm, stepX, stepY, px < pagesX - 1, py < pagesY - 1) +
                "</section>";
      }
    }
    el.sheet.innerHTML = html;
  }

  function esc(s){
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function pageSvg(g, c0, c1, r0, r1, mm, stepX, stepY, moreX, moreY){
    var nx = c1 - c0, ny = r1 - r0;
    var W = nx * mm, H = ny * mm;
    var thin = "", thick = "", cross = "", seam = "";

    for (var i = 0; i <= nx; i++){
      var X = f(i * mm);
      var heavy = (c0 + i) % 10 === 0 || i === 0 || i === nx;
      (heavy ? (thick += "M" + X + " 0V" + f(H)) : (thin += "M" + X + " 0V" + f(H)));
    }
    for (var j = 0; j <= ny; j++){
      var Y = f(j * mm);
      var hv = (r0 + j) % 10 === 0 || j === 0 || j === ny;
      (hv ? (thick += "M0 " + Y + "H" + f(W)) : (thin += "M0 " + Y + "H" + f(W)));
    }

    var inset = mm * CFG.CROSS_INSET;
    for (var r = r0; r < r1; r++){
      for (var q = c0; q < c1; q++){
        if (!g.data[r * g.cols + q]) continue;
        var x0 = f((q - c0) * mm + inset), x1 = f((q - c0 + 1) * mm - inset);
        var y0 = f((r - r0) * mm + inset), y1 = f((r - r0 + 1) * mm - inset);
        cross += "M" + x0 + " " + y0 + "L" + x1 + " " + y1 +
                 "M" + x1 + " " + y0 + "L" + x0 + " " + y1;
      }
    }

    if (moreX && stepX < nx) seam += "M" + f(stepX * mm) + " 0V" + f(H);
    if (moreY && stepY < ny) seam += "M0 " + f(stepY * mm) + "H" + f(W);

    var cw = Math.min(0.5, Math.max(0.16, mm * 0.11));
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + f(W) + 'mm" height="' + f(H) +
           'mm" viewBox="0 0 ' + f(W) + " " + f(H) + '">' +
           '<rect width="' + f(W) + '" height="' + f(H) + '" fill="#fff"/>' +
           '<path d="' + thin + '" stroke="#B9B4A6" stroke-width="0.09" fill="none"/>' +
           '<path d="' + thick + '" stroke="#6E7C76" stroke-width="0.25" fill="none"/>' +
           (seam ? '<path d="' + seam + '" stroke="#16544A" stroke-width="0.25" stroke-dasharray="1.2 1.2" fill="none"/>' : "") +
           '<path d="' + cross + '" stroke="#C42A2A" stroke-width="' + f(cw) +
           '" stroke-linecap="round" fill="none"/>' +
           "</svg>";
  }

  function f(v){ return Math.round(v * 100) / 100; }

  /* ---- memória local --------------------------------------------------- */

  function save(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
      try {
        var edits = [];
        state.edits.forEach(function(v, k){ edits.push([k, v]); });
        localStorage.setItem(STORE, JSON.stringify({
          text: el.txt.value, family: el.font.value,
          rows: el.rows.value, thick: el.thick.value, thr: el.thr.value, mm: el.mm.value,
          edits: edits, editsDims: state.editsDims
        }));
      } catch (e){ /* modo privado ou armazenamento cheio: seguir sem memória */ }
    }, 250);
  }

  function restore(){
    var raw;
    try { raw = localStorage.getItem(STORE); } catch (e){ return; }
    if (!raw) return;
    try {
      var s = JSON.parse(raw);
      if (typeof s.text === "string") el.txt.value = s.text;
      if (s.family && fontOf(s.family).family === s.family) el.font.value = s.family;
      ["rows","thick","thr","mm"].forEach(function(k){ if (s[k] != null) el[k].value = s[k]; });
      if (Array.isArray(s.edits)){
        state.edits = new Map(s.edits);
        state.editsDims = s.editsDims || "";
      }
    } catch (e){ /* memória corrompida: começar limpo */ }
  }

  /* ---- ciclo de recálculo --------------------------------------------- */

  function apply(o){
    var g = buildGrid(o);
    if (g && g.tooBig){
      state.grid = null;
      notice("Texto longo demais para essa altura: daria " + g.tooBig + " colunas e o navegador não " +
             "desenha uma grade desse tamanho (teto de " + maxCols() + " colunas neste aparelho). " +
             "Diminua a altura ou encurte o texto.");
      paint();
      return;
    }
    notice(state.fontOk ? "" :
      "A fonte " + o.font.label + " não carregou — o gráfico saiu numa cursiva genérica do sistema " +
      "e não vai bater com o desenho esperado.", true);
    state.grid = applyEdits(g);
    paint();
  }

  function render(){
    var mine = ++generation;
    var o = controls();
    var spec = fontString(o.font, 100);
    var run = function(){
      if (mine !== generation) return;
      state.fontOk = !document.fonts || !document.fonts.check || document.fonts.check(spec);
      apply(o);
    };
    if (document.fonts && document.fonts.load){
      document.fonts.load(spec).then(run, run);
    } else {
      run();
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(render, CFG.DEBOUNCE);
  }

  /* ---- interface ------------------------------------------------------- */

  function buildFontOptions(){
    var html = "";
    for (var i = 0; i < FONTS.length; i++){
      html += '<option value="' + esc(FONTS[i].family) + '">' + esc(FONTS[i].label) + "</option>";
    }
    el.font.innerHTML = html;
  }

  function syncLabels(){
    el.rowsOut.textContent = el.rows.value;
    el.thickOut.textContent = el.thick.value;
    el.thrOut.textContent = el.thr.value;
    el.mmOut.textContent = parseFloat(el.mm.value).toFixed(1).replace(".", ",");
    el.rows.setAttribute("aria-valuetext", el.rows.value + " pontos de altura");
    el.thick.setAttribute("aria-valuetext", "espessura " + el.thick.value);
    el.thr.setAttribute("aria-valuetext", el.thr.value + " por cento");
    el.mm.setAttribute("aria-valuetext", el.mmOut.textContent + " milímetros");
  }

  function cellFromEvent(e){
    var b = el.grid.getBoundingClientRect();
    var cp = b.width / state.grid.cols;
    return { q: Math.floor((e.clientX - b.left) / cp), r: Math.floor((e.clientY - b.top) / cp) };
  }

  el.grid.addEventListener("click", function(e){
    if (!state.grid) return;
    var c = cellFromEvent(e);
    state.cursor = c;
    toggle(c.q, c.r);
  });

  el.grid.addEventListener("keydown", function(e){
    var g = state.grid;
    if (!g) return;
    if (!state.cursor) state.cursor = { q: 0, r: 0 };
    var c = state.cursor, moved = true;
    switch (e.key){
      case "ArrowLeft":  c.q = Math.max(0, c.q - 1); break;
      case "ArrowRight": c.q = Math.min(g.cols - 1, c.q + 1); break;
      case "ArrowUp":    c.r = Math.max(0, c.r - 1); break;
      case "ArrowDown":  c.r = Math.min(g.rows - 1, c.r + 1); break;
      case "Home":       c.q = 0; break;
      case "End":        c.q = g.cols - 1; break;
      case " ":
      case "Enter":      e.preventDefault(); toggle(c.q, c.r); return;
      default: moved = false;
    }
    if (!moved) return;
    e.preventDefault();
    paint();
    say("Coluna " + (c.q + 1) + ", linha " + (c.r + 1) + ", " +
        (g.data[c.r * g.cols + c.q] ? "marcado" : "vazio") + ".");
  });

  el.grid.addEventListener("focus", function(){
    if (!state.cursor) state.cursor = { q: 0, r: 0 };
    paint();
  });
  el.grid.addEventListener("blur", paint);

  ["txt","font","rows","thick","thr"].forEach(function(id){
    el[id].addEventListener("input", function(){ syncLabels(); schedule(); save(); });
  });

  el.mm.addEventListener("input", function(){ syncLabels(); paint(); save(); });

  el.undo.addEventListener("click", undo);
  el.clear.addEventListener("click", clearEdits);
  el.reset.addEventListener("click", render);
  el.print.addEventListener("click", function(){ buildSheet(); window.print(); });
  el.dl.addEventListener("click", function(){
    if (!state.grid) return;
    var a = document.createElement("a");
    var name = (el.txt.value || "ponto-cruz").trim().replace(/\s+/g, "-") || "ponto-cruz";
    a.download = "grafico-" + name + ".png";
    a.href = el.grid.toDataURL("image/png");
    a.click();
  });

  document.addEventListener("keydown", function(e){
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")){
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;
      e.preventDefault();
      undo();
    }
  });

  window.addEventListener("resize", function(){ if (state.grid) paint(); });
  window.addEventListener("beforeprint", buildSheet);

  buildFontOptions();
  restore();
  syncLabels();
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
})();
