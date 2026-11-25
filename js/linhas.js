/* ponto & letra — linhas.js
   Fio por linha, a linha de cada peça e o catálogo das marcas.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

/* ---- quanto fio cada linha gasta ------------------------------------

   A conta tem uma parte certa e duas suposições, e as três ficam à vista na
   aba molde, porque quem vai à loja com um número merece saber de onde ele
   veio.

   CERTO: a frente. Cada ponto cheio são duas diagonais de um quadradinho,
   p√2 cada uma. Isso é geometria, não palpite.

   SUPOSTO: o avesso. Bordando um ponto cheio de cada vez — sobe em A, desce
   em D, sobe em C, desce em B — o fio anda dois LADOS do quadradinho por
   trás, 2p. Quem borda em fileiras gasta menos; quem pula de um canto a
   outro do desenho gasta mais.

   SUPOSTO: os 15% de começos, remates e a ponta que não dá para usar.

   O que sai é o comprimento do fio como ele atravessa o furo: se você borda
   com 2 fios, são metros de fio de 2 fios. Não converto para meadas porque
   isso depende do comprimento da meada de cada marca — mas uma meada de 6
   fios desfiada em pares rende três vezes o comprimento dela. */
var PERDA = 1.15;
function fioFrente(){ return 2 * P() * Math.SQRT2; }   // mm por ponto, exato
function fioAvesso(){ return 2 * P(); }                // mm por ponto, suposto
function fioPorPonto(){ return (fioFrente() + fioAvesso()) * PERDA; }

// as linhas do molde, na ordem das peças e sem repetir cor, com quantos
// pontos e quantos metros cada uma pede
/* A legenda é do molde inteiro, e não de uma peça: duas peças na mesma
   meada são uma linha só na lista de compras. A letra vem daqui pelo mesmo
   motivo — ela identifica a linha no molde todo, então dois gráficos que
   dividem uma cor dividem a letra dela. */
/* O fio do ponto reto é outra conta. No ponto atrás cada ponto aparece uma
   vez na frente, com o comprimento dele, e o fio anda o dobro por trás — a
   agulha volta um ponto pela frente e avança dois pelo avesso. Frente mais
   avesso dá três vezes o comprimento do desenho, mais a mesma perda. */
var RETO_FIO = 3;

function fioReto(el){ return pontosReto(el).mm * RETO_FIO * PERDA; }

function linhasUsadas(){
  var vistas = {}, lista = [];
  var poe = function(hex, nome, n, mm){
    if (!n) return;
    if (!vistas[hex]){
      vistas[hex] = { hex: hex, nome: nome, pontos: 0, mm: 0 };
      lista.push(vistas[hex]);
    }
    vistas[hex].pontos += n;
    vistas[hex].mm += mm;
  };
  var porPonto = fioPorPonto();
  els.forEach(function(el){
    if (el.paleta && el.paleta.length){
      var n = contaPorCor(el);
      el.paleta.forEach(function(sl, i){
        poe(sl.hex, sl.rotulo || sl.hex, n[i + 1] || 0, (n[i + 1] || 0) * porPonto);
      });
      return;
    }
    var c = corDe(el), q = countOf(el);
    poe(c.hex, c.nome, q, el.kind === "reto" ? fioReto(el) : q * porPonto);
  });
  lista.forEach(function(l, i){
    l.metros = l.mm / 1000;
    l.letra = LETRAS[i % LETRAS.length];
    l.rotulo = l.nome + "  ·  " + fmt(l.metros) + " m";
  });
  return lista;
}

// hex → letra da legenda, para o molde impresso escrever em cada
// quadradinho a mesma letra que o rodapé explica
function mapaLetras(){
  var m = {};
  linhasUsadas().forEach(function(l){ m[l.hex] = l.letra; });
  return m;
}

// a cor de um quadradinho: a da paleta da peça, quando ela tem uma
function corCel(el, v){
  return el && el.paleta && el.paleta.length && v > 0 && el.paleta[v - 1]
    ? el.paleta[v - 1] : null;
}

// A caixa de linhas é uma marca como as outras na fileira, e a primeira
// quando tem algo dentro: é a lista de onde se escolhe cor para o molde.
function chavesDaVista(){
  if (marcaAtiva === "minhas") return minhas.slice();
  var m = CAT.filter(function(x){ return x.id === marcaAtiva; })[0];
  return m ? m.cores.map(function(c){ return m.id + ":" + c[0]; }) : null;
}

function nomePeca(el){
  if (el.kind === "text") return el.text || "texto";
  if (el.kind === "img") return el.nome || "imagem";
  if (el.kind === "pat") return (el.arranjo === "faixa" ? "faixa de " : "moldura de ") + nomeMotivo(el.motivo);
  if (el.kind === "reto" && el.desenho === "palavra") return (el.texto || "palavra") + " (ponto reto)";
  if (el.kind === "reto" && el.desenho === "imagem") return (el.nome || "imagem") + " (ponto reto)";
  if (el.kind === "reto") return ((DESENHOS_RETO[el.desenho] || {}).nome || "desenho") + " em ponto reto";
  return NOMES_SYM[el.sym] || "símbolo";
}

// o alto do painel diz duas coisas: que peça está sendo pintada e com quê
function mostraThread(){
  var el = els[sel];
  // com um gráfico selecionado, a cor tocada no catálogo entra na linha
  // escolhida da paleta — e o cabeçalho tem de dizer isso, senão o toque
  // parece não ter feito nada
  if (el && el.paleta && el.paleta.length){
    var sl = el.paleta[slotAtivo(el) - 1];
    $("threadDot").style.background = sl.hex;
    $("threadName").textContent = sl.rotulo || sl.hex;
    $("threadAlvo").textContent = "Linha escolhida de “" + nomePeca(el) + "”";
    return;
  }
  var cor = corDe(el);
  $("threadDot").style.background = cor.hex;
  $("threadName").textContent = cor.nome;
  $("threadAlvo").textContent = el
    ? "Linha de " + (el.kind === "text" ? "“" + (el.text || "texto") + "”"
        : el.kind === "img" || el.kind === "pat" ? "“" + nomePeca(el) + "”" : "símbolo")
    : "Linha da próxima peça";
}

function usaCor(hex, nome){
  thread = hex;                       // a cor corrente, com que a próxima peça nasce
  var el = els[sel];
  /* Num gráfico, a cor tocada não pinta a peça inteira: ela entra na linha
     escolhida da paleta. Pintar tudo de uma cor só desfaria o gráfico, e a
     escolha manual de meada é justamente o que o casamento automático não
     acerta sozinho — a cor da tela é referência, quem tem a cartela na mão
     é você. */
  if (el && el.paleta && el.paleta.length){
    var sl = el.paleta[slotAtivo(el) - 1];
    sl.hex = hex;
    sl.rotulo = nome;
    // `sl.lab` não muda: ele é a cor da IMAGEM que esta casa representa, e é
    // por ele que os quadradinhos são repartidos. Trocar a meada muda com
    // que linha se borda, não que parte do desenho é esta
    sl.chave = "";      // escolhida à mão: não é mais a que o casamento deu
    renderPaleta(); mostraThread(); renderChips(); renderFios(); draw(); pushHist();
    return;
  }
  if (el){ el.color = hex; el.colorName = nome; }
  mostraThread();
  renderChips();
  draw();          // draw() é quem agenda a gravação, inclusive da cor
  if (el) pushHist();   // trocar a linha se desfaz como qualquer outro passo
}

/* ---- catálogo das marcas -------------------------------------------- */

function montaMarcas(){
  var box = $("marcas");
  box.innerHTML = "";
  var vistas = CAT.map(function(m){
    return { id: m.id, nome: m.marca.toLowerCase(), n: m.cores.length };
  });
  if (minhas.length) vistas.unshift({ id: "minhas", nome: "minhas", n: minhas.length });
  if (marcaAtiva === "minhas" && !minhas.length) marcaAtiva = CAT.length ? CAT[0].id : "";
  vistas.forEach(function(v){
    var b = document.createElement("button");
    b.type = "button";
    b.className = v.id === marcaAtiva ? "on" : "";
    b.textContent = v.nome + " (" + v.n + ")";
    b.addEventListener("click", function(){
      marcaAtiva = v.id;
      montaMarcas();
      listaCatalogo();
    });
    box.appendChild(b);
  });
}

/* ---- ordem por tom --------------------------------------------------
   Uma cartela impressa não vem por número: vem por família, e dentro da
   família do claro ao escuro. Aqui a família sai do matiz, em faixas de 15°,
   e a escala sai da luminância — o cinza, o cru e o preto não têm matiz que
   preste, então vão juntos no fim, do mais claro ao mais escuro. */
function matizEscala(hex){
  var r = parseInt(hex.substr(1, 2), 16) / 255,
      g = parseInt(hex.substr(3, 2), 16) / 255,
      b = parseInt(hex.substr(5, 2), 16) / 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  var h = 0;
  if (d > 0){
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  var sat = (mx + mn === 0 || mx + mn === 2) ? 0 : d / (1 - Math.abs(mx + mn - 1));
  // pouca cor, ou escuro demais para a cor significar algo: é neutro
  var neutro = sat < 0.16 || mx < 0.10;
  return { faixa: neutro ? 99 : Math.floor(h / 15), lum: lum };
}

var ordemModo = "tom";
var ordemCache = {};

function ordena(chaves, marca){
  if (ordemModo === "codigo"){
    return chaves.slice().sort(function(a, b){
      var x = parseInt(catIdx[a].code, 10), y = parseInt(catIdx[b].code, 10);
      if (isNaN(x) && isNaN(y)) return catIdx[a].code.localeCompare(catIdx[b].code);
      if (isNaN(x)) return 1;                       // Blanc, Ecru e afins no fim
      if (isNaN(y)) return -1;
      return x - y;
    });
  }
  var cache = ordemCache[marca];
  if (cache && cache.n === chaves.length) return cache.ordem;
  var ordem = chaves.slice().sort(function(a, b){
    var p = matizEscala(catIdx[a].hex), q = matizEscala(catIdx[b].hex);
    if (p.faixa !== q.faixa) return p.faixa - q.faixa;
    return q.lum - p.lum;                           // do claro ao escuro
  });
  ordemCache[marca] = { n: chaves.length, ordem: ordem };
  return ordem;
}

// Preto ou branco por cima da cor, conforme ela seja clara ou escura: o
// código tem de ser lido em cima de qualquer amostra da cartela.
function tinta(hex){
  var r = parseInt(hex.substr(1, 2), 16),
      g = parseInt(hex.substr(3, 2), 16),
      b = parseInt(hex.substr(5, 2), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55 ? "#26323D" : "#FFFFFF";
}

// são centenas de botões por marca: eles nascem num fragmento e dividem um
// ouvinte só, no pai, senão cada letra digitada na busca custa uma enxurrada
function listaCatalogo(){
  var grade = $("catGrade");
  grade.innerHTML = "";
  var chaves = chavesDaVista();
  if (!chaves){
    // sem catalogos.js não há catálogo nenhum: dizer isso é melhor do que
    // deixar o painel vazio, que passa por painel quebrado
    grade.innerHTML = '<p class="vazio">Os catálogos das marcas não carregaram. ' +
                      'Falta o arquivo <b>catalogos.js</b> ao lado do index.html.</p>';
    return;
  }
  chaves = ordena(chaves, marcaAtiva);
  var q = ($("catBusca").value || "").trim().toLowerCase();
  var vistas = chaves.filter(function(k){
    var r = catIdx[k];
    if (!r) return false;
    return !q || (rotulo(r) + " " + r.nome).toLowerCase().indexOf(q) >= 0;
  });
  if (!vistas.length){
    grade.innerHTML = '<p class="vazio">Nenhuma cor com esse código ou nome.</p>';
    return;
  }
  var caixa = linhaModo === "caixa", soMinhas = marcaAtiva === "minhas";
  var frag = document.createDocumentFragment();
  vistas.forEach(function(k){
    var reg = catIdx[k];
    var tem = minhas.indexOf(k) >= 0;
    var rot = rotulo(reg) + (reg.nome ? " — " + reg.nome : "");
    var b = document.createElement("button");
    b.type = "button";
    // na caixa, o tique diz "tenho"; na aplicação, um ponto discreto diz o
    // mesmo sem parecer que a cor está escolhida — e em "minhas" todas são
    b.className = "cat" + (tem ? (caixa ? " on" : (soMinhas ? "" : " tem")) : "");
    b.style.background = reg.hex;
    b.style.color = tinta(reg.hex);
    b.dataset.k = k;
    b.textContent = reg.code || "—";
    b.title = rot + " " + reg.hex;
    b.setAttribute("aria-label", rot);
    if (caixa) b.setAttribute("aria-pressed", tem ? "true" : "false");
    frag.appendChild(b);
  });
  grade.appendChild(frag);
}

/* Dois gestos, um para cada lugar da aba linha. Antes eram um só: tocar
   numa cor dizia "tenho essa" e pintava a peça no mesmo toque, então
   experimentar uma cor na peça enchia a caixa de linhas que você não tem, e
   tirar da caixa não despintava nada. */
var linhaModo = "peca";   // "peca": o toque pinta; "caixa": o toque marca que tem

function aplicaNaPeca(k){
  var c = catIdx[k];
  if (c) usaCor(c.hex, rotulo(c));
}

// pôr na caixa ou tirar dela, e mais nada: a peça não muda
function alternaNaCaixa(k, botao){
  var c = catIdx[k];
  if (!c) return;
  var i = minhas.indexOf(k);
  if (i >= 0){
    minhas.splice(i, 1);
    // uma avulsa só existe porque você a cadastrou: desmarcar é apagar, senão
    // ela ficaria parada na grade sem ser de ninguém
    if (avulsas[k]){
      delete avulsas[k];
      montaIndice();
      salvaLinhas();
      montaMarcas(); montaFonteLinhas(); listaCatalogo(); contaLinhas();
      return;
    }
  } else {
    minhas.push(k);
  }
  var tem = i < 0;
  if (botao){
    botao.classList.toggle("on", tem);
    botao.setAttribute("aria-pressed", tem ? "true" : "false");
  }
  salvaLinhas();
  montaMarcas();
  // em "minhas", a que saiu da caixa sai da grade também
  if (marcaAtiva === "minhas" || !minhas.length) listaCatalogo();
  contaLinhas();
}

/* Várias de uma vez: a lista de códigos que se tem anotada, colada num campo
   só. Cada código é procurado como está e, não achando, sem os zeros à
   esquerda (a Anchor escreve 00268 na cartela e 268 aqui) e em maiúsculas
   (a DMC tem B5200 e ECRU). O aviso diz quantas entraram, quantas já
   estavam e quais não existem — código digitado errado não pode sumir
   calado. */
function poeLote(marca, texto){
  var codigos = String(texto || "").split(/[\s,;]+/).filter(Boolean);
  var novas = 0, ja = 0, faltou = [];
  codigos.forEach(function(cod){
    var tentativas = [cod, cod.replace(/^0+(?=.)/, ""), cod.toUpperCase(),
                      cod.charAt(0).toUpperCase() + cod.slice(1).toLowerCase()];
    var k = null;
    for (var i = 0; i < tentativas.length && !k; i++)
      if (catIdx[marca + ":" + tentativas[i]]) k = marca + ":" + tentativas[i];
    if (!k){ faltou.push(cod); return; }
    if (minhas.indexOf(k) >= 0){ ja++; return; }
    minhas.push(k); novas++;
  });
  salvaLinhas(); montaMarcas(); montaFonteLinhas(); listaCatalogo(); contaLinhas();
  return { novas: novas, ja: ja, faltou: faltou };
}

function montaLote(){
  var s = $("loteMarca");
  if (!s) return;
  var antes = s.value;
  s.innerHTML = "";
  CAT.forEach(function(m){
    if (m.id === "avulsa") return;
    var o = document.createElement("option");
    o.value = m.id; o.textContent = m.marca;
    s.appendChild(o);
  });
  if (antes) s.value = antes;
}

function mudaModoLinha(modo){
  linhaModo = modo === "caixa" ? "caixa" : "peca";
  var caixa = linhaModo === "caixa";
  [].forEach.call(document.querySelectorAll("#linhaModo button"), function(b){
    var on = b.dataset.modo === linhaModo;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  $("soPeca").classList.toggle("hide", caixa);
  $("soCaixa").classList.toggle("hide", !caixa);
  $("soCaixa2").classList.toggle("hide", !caixa);
  $("catFoot").classList.toggle("hide", !caixa);
  listaCatalogo();
}

// Linha que não está em cartela nenhuma: nasce já marcada, porque cadastrar
// é dizer que você tem. Entra no índice como as outras e some do mesmo jeito.
function guardaAvulsa(){
  var marca = ($("avMarca").value || "").trim().slice(0, 24);
  var code = ($("avCode").value || "").trim().slice(0, 12);
  var hex = ($("avCor").value || "").toUpperCase();
  if (!marca && !code){
    $("avAviso").textContent = "Escreva a marca, o código, ou os dois — é como você vai reconhecer a linha depois.";
    $("avMarca").focus();
    return;
  }
  if (!/^#[0-9A-F]{6}$/.test(hex)) return;
  var k = "avulsa:" + proxAvulsa++;
  avulsas[k] = { marca: marca, code: code, hex: hex };
  montaIndice();
  minhas.push(k);   // cadastrar é dizer que tem; pôr na peça é na outra aba
  salvaLinhas();
  montaMarcas(); montaFonteLinhas(); listaCatalogo(); contaLinhas();
  $("avMarca").value = ""; $("avCode").value = ""; $("avAviso").textContent = "";
  $("avMarca").focus();
}

function contaLinhas(){
  var n = minhas.length;
  $("catConta").textContent = n === 0 ? "nenhuma linha marcada"
                            : n === 1 ? "1 linha marcada"
                            : n + " linhas marcadas";
  $("catLimpar").classList.toggle("hide", n === 0);
  $("catLimpar").textContent = "limpar";
  $("catLimpar").classList.remove("perigo");
}
