/* ponto & letra — reto.js
   Ponto reto: os desenhos em linha e a conta de onde vão os furos.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior.

   No ponto cruz o desenho é uma grade de quadradinhos, e os furos são os
   cantos deles. No ponto reto o fio vai de um furo a outro em linha, e os
   furos ficam onde o desenho pede: no vértice do hexágono, ao longo da
   nervura da folha, na curva da onda. Não há grade.

   O desenho é uma lista de caminhos, em milímetros, com a origem no canto de
   cima à esquerda da peça. Cada caminho é de um de dois tipos:

     reta  — uma linha quebrada: todo vértice é furo (o canto do hexágono
             tem de ser furo, senão o hexágono vira círculo), e cada trecho
             entre dois vértices é repartido em pontos iguais de até um
             comprimento de ponto;
     curva — uma curva desenhada fina, em pedacinhos: os furos são postos a
             distâncias iguais ao longo dela, e os pedacinhos não importam.

   O comprimento de ponto é escolhido na peça (de fábrica, 2,5 mm). Abaixo de
   2 mm a tira de papel entre dois furos rasga — o mesmo limite do ponto
   cruz. */

var RETO_PASSO = 2.5;          // mm: o comprimento de ponto de fábrica
var RETO_PASSO_MIN = 2, RETO_PASSO_MAX = 8;
// a maiúscula abaixo da qual a palavra em ponto reto fica apertada demais:
// as voltas do "a" e do "e" ficam mais estreitas que a distância entre furos
var RETO_PALAVRA_MIN = 18;   // mm

function distR(a, b){ var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
function entre(a, b, t){ return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

// os furos de um caminho de retas: todo vértice, e o trecho repartido por igual
function furosReta(pts, L, fechada){
  var out = [pts[0].slice()];
  var n = pts.length, lim = fechada ? n : n - 1;
  for (var i = 0; i < lim; i++){
    var a = pts[i], b = pts[(i + 1) % n];
    var k = Math.max(1, Math.round(distR(a, b) / L));
    for (var j = 1; j <= k; j++) out.push(entre(a, b, j / k));
  }
  if (fechada) out.pop();          // o último é o primeiro
  return out;
}

// os furos de uma curva: a distâncias iguais ao longo dela
function furosCurva(pts, L, fechada){
  var seg = [], total = 0, n = pts.length, lim = fechada ? n : n - 1;
  for (var i = 0; i < lim; i++){
    var d = distR(pts[i], pts[(i + 1) % n]);
    seg.push(d); total += d;
  }
  if (!(total > 0)) return [pts[0].slice()];
  var k = Math.max(1, Math.round(total / L)), passo = total / k;
  var out = [pts[0].slice()], i2 = 0, feito = 0;
  for (var m = 1; m <= (fechada ? k - 1 : k); m++){
    var alvo = m * passo;
    while (i2 < seg.length - 1 && feito + seg[i2] < alvo){ feito += seg[i2]; i2++; }
    var t = seg[i2] > 0 ? (alvo - feito) / seg[i2] : 0;
    out.push(entre(pts[i2], pts[(i2 + 1) % n], Math.min(1, t)));
  }
  return out;
}

/* Os pontos de uma peça de ponto reto: para cada caminho, a lista de furos
   na ordem em que a agulha passa. Cada par de furos vizinhos é um ponto.

   Depois de postos, os furos que caíram praticamente no mesmo lugar — dois
   caminhos que se cruzam, a ponta de um encostada no meio de outro — viram
   um furo só, no meio deles: é o furo onde as duas linhas passam, como se
   faria à mão.

   Só os que estão a menos de 1 mm. Juntar mais longe que isso desmancha o
   desenho: numa palavra pequena, os dois lados da volta do "a" estão a um
   milímetro e meio, e juntar os furos fecha a letra. Furo entre 1 e 2 mm de
   outro rasga o papel do mesmo jeito, mas a saída certa é aumentar a peça,
   e quem diz isso é o aviso de furos colados — não uma letra deformada em
   silêncio. */
var RETO_MESMO_FURO = 1;   // mm

function pontosDoDesenho(caminhos, L){
  var pontos = caminhos.map(function(c){
    var furos = c.curva ? furosCurva(c.pts, L, c.fechada) : furosReta(c.pts, L, c.fechada);
    // cantos e pontas não saem nunca: são eles que dão a forma
    var fixos = {};
    if (!c.fechada){ fixos[0] = 1; fixos[furos.length - 1] = 1; }
    if (!c.curva){
      var ch = {};
      c.pts.forEach(function(p){ ch[p[0].toFixed(3) + "," + p[1].toFixed(3)] = 1; });
      furos.forEach(function(f, i){ if (ch[f[0].toFixed(3) + "," + f[1].toFixed(3)]) fixos[i] = 1; });
    }
    return { furos: furos, fechada: !!c.fechada, fixos: fixos };
  });
  /* Juntar pontas move furos, e furo movido pode cair perto de outro: a
     limpeza roda em voltas até não sobrar furo colado, quatro no máximo. Da
     segunda volta em diante só as pontas de linha são fixas — os cantos de
     um desenho pronto já estão resolvidos na primeira. */
  for (var volta = 0; volta < 4; volta++){
    pontos = juntaPontas(pontos, RETO_FURO_MIN);
    pontos.forEach(function(pt){
      if (pt.fixos) return;
      pt.fixos = {};
      if (!pt.fechada){ pt.fixos[0] = 1; pt.fixos[pt.furos.length - 1] = 1; }
    });
    pontos = semRepetidos(juntaFurosPerto(desbasta(pontos, RETO_FURO_MIN), RETO_MESMO_FURO));
    if (!temColados(pontos, RETO_FURO_MIN)) break;
  }
  return pontos;
}

// se ainda há dois furos entre 0,3 mm (o mesmo furo) e `dmin` um do outro
function temColados(pontos, dmin){
  var grade = {};
  return pontos.some(function(pt){
    return pt.furos.some(function(f){
      var gx = Math.floor(f[0] / dmin), gy = Math.floor(f[1] / dmin), achou = false;
      for (var dx = -1; dx <= 1 && !achou; dx++)
        for (var dy = -1; dy <= 1 && !achou; dy++)
          (grade[(gx + dx) + "," + (gy + dy)] || []).forEach(function(o){
            var d = distR(o, f);
            if (d < dmin && d >= 0.3) achou = true;
          });
      var k = gx + "," + gy;
      if (!(grade[k] || []).some(function(o){ return distR(o, f) < 0.3; })) (grade[k] = grade[k] || []).push(f);
      return achou;
    });
  });
}

/* As pontas de linha — o começo e o fim de cada caminho aberto — que caem a
   menos de 2 mm umas das outras viram um furo só, no meio delas. Na letra
   elas estão nos encontros do traço (o afinamento deixa o cruzamento do "t"
   em três ou quatro pontas vizinhas), e juntá-las é o que se faria à mão.
   Só pontas: juntar furos do meio das linhas fecharia a volta do "a". */
function juntaPontas(pontos, dmin){
  var pontas = [];
  pontos.forEach(function(pt){
    if (pt.fechada || pt.furos.length < 2) return;
    pontas.push({ pt: pt, i: 0 }, { pt: pt, i: pt.furos.length - 1 });
  });
  // sem corrente: cada ponta entra no grupo cuja primeira ponta está perto
  // dela, e não no de qualquer vizinha. Em corrente, A perto de B perto de C
  // juntava pontas a um centímetro e ligava uma letra na outra
  var grupos = [];
  pontas.forEach(function(p){
    var f = p.pt.furos[p.i], g = null;
    for (var k = 0; k < grupos.length && !g; k++)
      if (distR(grupos[k].semente, f) < dmin) g = grupos[k];
    if (!g){ g = { semente: f, x: 0, y: 0, quem: [] }; grupos.push(g); }
    g.x += f[0]; g.y += f[1]; g.quem.push(p);
  });
  /* Dois grupos cujos centros acabaram perto um do outro — cada um puxou as
     suas pontas para o meio delas — viram um. É centro com centro, e não
     ponta com ponta, então não vira corrente: o cruzamento do traço, que o
     afinamento deixa em várias pontas vizinhas, fecha num furo só. */
  var junta = true;
  while (junta){
    junta = false;
    for (var a = 0; a < grupos.length && !junta; a++)
      for (var b = a + 1; b < grupos.length && !junta; b++){
        var ga = grupos[a], gb = grupos[b];
        var ca = [ga.x / ga.quem.length, ga.y / ga.quem.length];
        var cb = [gb.x / gb.quem.length, gb.y / gb.quem.length];
        if (distR(ca, cb) >= dmin) continue;
        ga.x += gb.x; ga.y += gb.y; ga.quem = ga.quem.concat(gb.quem);
        grupos.splice(b, 1);
        junta = true;
      }
  }
  grupos.forEach(function(g){
    if (g.quem.length < 2) return;
    var m = [g.x / g.quem.length, g.y / g.quem.length];
    g.quem.forEach(function(p){ p.pt.furos[p.i] = m; });
  });
  return pontos;
}

/* O mesmo trecho repetido — o cruzamento do traço deixa às vezes três ou
   quatro caminhos idênticos entre os mesmos dois furos — fica uma vez só:
   bordado sete vezes, o mesmo ponto rasgaria os dois furos. */
function semRepetidos(pontos){
  var visto = {};
  return pontos.filter(function(pt){
    var ida = pt.furos.map(function(f){ return f[0].toFixed(2) + "," + f[1].toFixed(2); });
    var k1 = ida.join("|"), k2 = ida.slice().reverse().join("|");
    if (visto[k1] || visto[k2]) return false;
    visto[k1] = 1;
    return true;
  });
}

/* Na ponta fina — a da estrela, a base do coração, o encontro da nervura com
   a borda da folha — os primeiros furos das duas linhas ficam a um milímetro
   e pouco um do outro, e a tira de papel entre eles rasga. O furo do meio de
   uma linha que estiver a menos de 2 mm de outro furo (que não seja o vizinho
   dele na mesma linha) sai: o ponto de cada lado se junta num ponto um pouco
   mais comprido, e a forma fica, porque canto e ponta não saem nunca. Vale
   para o vizinho na mesma linha também: ponto mais curto que 2 mm é a mesma
   tira estreita de papel. */
var RETO_FURO_MIN = 2;   // mm

function desbasta(pontos, dmin){
  var grade = {}, todos = [];
  pontos.forEach(function(pt, a){
    pt.furos.forEach(function(f, i){
      var h = { f: f, a: a, i: i, fixo: !!pt.fixos[i], fora: false };
      todos.push(h);
      var k = Math.floor(f[0] / dmin) + "," + Math.floor(f[1] / dmin);
      (grade[k] = grade[k] || []).push(h);
    });
  });
  // os fixos primeiro mandam: quem sai é sempre um furo do meio de linha
  todos.forEach(function(h){
    if (h.fixo) return;
    var gx = Math.floor(h.f[0] / dmin), gy = Math.floor(h.f[1] / dmin);
    for (var dx = -1; dx <= 1; dx++)
      for (var dy = -1; dy <= 1; dy++){
        var lista = grade[(gx + dx) + "," + (gy + dy)] || [];
        for (var j = 0; j < lista.length; j++){
          var o = lista[j];
          // o vizinho na linha conta também: ponto mais curto que 2 mm é a
          // mesma tira de papel estreita, só que costurada
          if (o === h || o.fora) continue;
          var d = distR(h.f, o.f);
          if (d >= dmin || d < RETO_MESMO_FURO) continue;
          h.fora = true; return;
        }
      }
  });
  var sai = {};
  todos.forEach(function(h){ if (h.fora) sai[h.a + ":" + h.i] = 1; });
  return pontos.map(function(pt, a){
    return { fechada: pt.fechada,
             furos: pt.furos.filter(function(f, i){ return !sai[a + ":" + i]; }) };
  });
}

function juntaFurosPerto(pontos, dmin){
  var grade = {}, grupos = [];
  var casa = function(p){ return Math.floor(p[0] / dmin) + "," + Math.floor(p[1] / dmin); };
  pontos.forEach(function(pt){
    pt.furos.forEach(function(f, i){
      var gx = Math.floor(f[0] / dmin), gy = Math.floor(f[1] / dmin), achou = null;
      for (var dx = -1; dx <= 1 && !achou; dx++)
        for (var dy = -1; dy <= 1 && !achou; dy++){
          var lista = grade[(gx + dx) + "," + (gy + dy)] || [];
          for (var k = 0; k < lista.length && !achou; k++)
            if (distR(lista[k].c, f) < dmin) achou = lista[k];
        }
      if (!achou){
        achou = { c: f.slice(), sx: 0, sy: 0, n: 0, quem: [] };
        grupos.push(achou);
        var ch = casa(f);
        (grade[ch] = grade[ch] || []).push(achou);
      }
      achou.sx += f[0]; achou.sy += f[1]; achou.n++;
      achou.quem.push([pt, i]);
    });
  });
  grupos.forEach(function(g){
    var m = [g.sx / g.n, g.sy / g.n];
    g.quem.forEach(function(q){ q[0].furos[q[1]] = m; });
  });
  // ponto de comprimento zero — dois furos do mesmo caminho que viraram um — sai
  return pontos.map(function(pt){
    var f = pt.furos.filter(function(p, i){ return i === 0 || p !== pt.furos[i - 1]; });
    if (pt.fechada && f.length > 1 && f[f.length - 1] === f[0]) f.pop();
    return { furos: f, fechada: pt.fechada && f.length > 2 };
  }).filter(function(pt){ return pt.furos.length > 1; });
}

/* ---- os desenhos prontos -------------------------------------------------
   Cada um recebe a medida principal em milímetros e devolve os caminhos já
   no tamanho. A conta de furos vem depois, com o comprimento de ponto da
   peça — o mesmo desenho sai com mais ou menos furos sem mudar de forma. */

// uma curva amostrada fina, para virar caminho do tipo curva
function amostra(f, n){
  var pts = [];
  for (var i = 0; i <= n; i++) pts.push(f(i / n));
  return pts;
}

// as arestas de muitos polígonos, sem repetir a que dois deles dividem: na
// colmeia cada lado é de dois hexágonos, e bordado duas vezes rasgaria o furo
function arestasUnicas(poligonos){
  var vistas = {}, out = [];
  var ch = function(p){ return Math.round(p[0] * 100) + "," + Math.round(p[1] * 100); };
  poligonos.forEach(function(pg){
    for (var i = 0; i < pg.length; i++){
      var a = pg[i], b = pg[(i + 1) % pg.length];
      var k1 = ch(a) + "|" + ch(b), k2 = ch(b) + "|" + ch(a);
      if (vistas[k1] || vistas[k2]) continue;
      vistas[k1] = 1;
      out.push({ pts: [a, b], curva: false, fechada: false });
    }
  });
  return out;
}

/* Cada desenho diz o que a sua medida principal mede, entre que limites, e
   que outras escolhas ele tem — colunas e fileiras da colmeia, nervuras da
   folha. Cada opção é [chave, nome na barra, de fábrica, mínimo, máximo]. */
var DESENHOS_RETO = {
  /* A palavra e a imagem não são desenho pronto: os caminhos delas saem do
     traço da fonte e dos escuros da imagem, num canvas (esqueleto.js). Moram
     aqui para a barra e a gravação tratarem todas as peças de ponto reto do
     mesmo jeito; `especial` diz que quem as faz é refazReto. */
  palavra: { nome: "palavra", medida: "altura da maiúscula", padrao: 18, min: 8, max: 150,
    opcoes: [], especial: true },
  imagem: { nome: "imagem em linha", medida: "largura", padrao: 60, min: 15, max: 250,
    opcoes: [["sens", "sens.", 50, 5, 95]], especial: true },

  // colmeia: hexágonos de ponta para cima, lado a lado
  colmeia: { nome: "colmeia", medida: "lado do hexágono", padrao: 6, min: 3, max: 30,
    opcoes: [["cols", "colunas", 4, 1, 20], ["rows", "fileiras", 3, 1, 20]],
    faz: function(lado, o){
      var cols = o.cols || 4, rows = o.rows || 3, w = lado * Math.sqrt(3), polis = [];
      for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++){
          var cx = w / 2 + c * w + (r % 2 ? w / 2 : 0), cy = lado + r * lado * 1.5, pg = [];
          for (var k = 0; k < 6; k++){
            var a = Math.PI / 6 + k * Math.PI / 3;
            pg.push([cx + lado * Math.cos(a), cy - lado * Math.sin(a)]);
          }
          polis.push(pg);
        }
      return arestasUnicas(polis);
    } },

  // folha: o contorno, a nervura do meio e as nervuras dos lados
  folha: { nome: "folha com nervuras", medida: "comprimento", padrao: 60, min: 15, max: 200,
    opcoes: [["nervuras", "nervuras", 5, 0, 12]],
    faz: function(comp, o){
      var larg = comp * (o.proporcao || 0.42), n = o.nervuras || 5, meio = larg / 2;
      var base = [meio, comp], ponta = [meio, 0];
      // cada lado é uma curva de Bézier cúbica da base à ponta
      var lado = function(s){
        var c1 = [meio + s * larg * 0.62, comp * 0.78], c2 = [meio + s * larg * 0.55, comp * 0.18];
        return function(t){
          var u = 1 - t;
          return [u*u*u*base[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*ponta[0],
                  u*u*u*base[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*ponta[1]];
        };
      };
      var esq = amostra(lado(-1), 80), dir = amostra(lado(1), 80);
      // os furos que a borda vai ter: a nervura termina exatamente num deles,
      // e os dois dividem o furo em vez de ficarem a um milímetro um do outro
      var passo = o.passo || RETO_PASSO;
      var furosBorda = [furosCurva(esq, passo, false), furosCurva(dir, passo, false)];
      var caminhos = [
        { pts: esq, curva: true }, { pts: dir, curva: true },
        { pts: [[meio, comp * 1.12], ponta], curva: false }      // nervura do meio, com o cabo
      ];
      // as nervuras dos lados saem da do meio e sobem até a borda
      for (var i = 1; i <= n; i++){
        var t = i / (n + 1), y0 = comp - t * comp * 0.92;
        furosBorda.forEach(function(borda){
          var alvoY = y0 - larg * 0.28, melhor = borda[0];
          borda.forEach(function(p){ if (Math.abs(p[1] - alvoY) < Math.abs(melhor[1] - alvoY)) melhor = p; });
          caminhos.push({ pts: [[meio, y0], melhor], curva: false });
        });
      }
      return caminhos;
    } },

  // losangos: a treliça do azulejo, linhas em diagonal nos dois sentidos
  losangos: { nome: "losangos", medida: "largura do losango", padrao: 14, min: 5, max: 60,
    opcoes: [["cols", "colunas", 4, 1, 20], ["rows", "fileiras", 6, 1, 30]],
    faz: function(w, o){
      var cols = o.cols || 4, rows = o.rows || 6, h = w * 1.4, polis = [];
      for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++){
          var cx = w / 2 + c * w + (r % 2 ? w / 2 : 0), cy = h / 2 + r * h / 2;
          polis.push([[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]]);
        }
      return arestasUnicas(polis);
    } },

  // ziguezague: uma faixa de dentes
  ziguezague: { nome: "ziguezague", medida: "comprimento", padrao: 120, min: 20, max: 300,
    opcoes: [],
    faz: function(comp, o){
      var dente = o.dente || 8, alt = o.alt || 8, pts = [];
      for (var x = 0, i = 0; x <= comp + 0.01; x += dente / 2, i++) pts.push([x, i % 2 ? 0 : alt]);
      return [{ pts: pts, curva: false }];
    } },

  // ondas: linhas onduladas paralelas
  ondas: { nome: "ondas", medida: "comprimento", padrao: 120, min: 20, max: 300,
    opcoes: [["linhas", "linhas", 3, 1, 8]],
    faz: function(comp, o){
      var onda = o.onda || 20, alt = o.alt || 4, linhas = o.linhas || 3, sep = o.sep || 7, out = [];
      for (var l = 0; l < linhas; l++)
        out.push({ curva: true, pts: amostra(function(t){
          return [t * comp, alt + l * sep - alt * Math.sin(t * comp / onda * Math.PI * 2)];
        }, Math.ceil(comp * 2)) });
      return out;
    } },

  // estrela de cinco pontas, só o contorno
  estrela: { nome: "estrela", medida: "largura", padrao: 40, min: 10, max: 200,
    opcoes: [],
    faz: function(w){
      var R = w / 2, r = R * 0.42, pts = [];
      for (var k = 0; k < 10; k++){
        var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R;
        pts.push([R + rr * Math.cos(a), R + rr * Math.sin(a)]);
      }
      return [{ pts: pts, curva: false, fechada: true }];
    } },

  // coração, só o contorno
  coracao: { nome: "coração", medida: "largura", padrao: 40, min: 10, max: 200,
    opcoes: [],
    faz: function(w){
      var k = w / 34;
      return [{ curva: true, fechada: true, pts: amostra(function(t){
        var a = t * Math.PI * 2;
        return [17 * k + 16 * k * Math.pow(Math.sin(a), 3),
                15 * k - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * k];
      }, 240).slice(0, -1) }];
    } },

  // flor de seis pétalas, cada uma um laço fechado em volta do miolo. As
  // pétalas não encostam no centro: seis pétalas num furo só são doze pontos
  // passando pelo mesmo buraco, e o papel não aguenta
  flor: { nome: "flor", medida: "largura", padrao: 44, min: 10, max: 200,
    opcoes: [["petalas", "pétalas", 6, 3, 12]],
    faz: function(w, o){
      var R = w / 2, n = o.petalas || 6, out = [], r0 = R * 0.16;
      for (var p = 0; p < n; p++){
        var a0 = p * Math.PI * 2 / n;
        out.push({ curva: true, fechada: true, pts: amostra(function(t){
          var a = t * Math.PI * 2, rr = r0 + (R - r0) * Math.sin(a / 2);   // gota que começa fora do miolo
          var ang = a0 + (t - 0.5) * (Math.PI * 2 / n) * 0.9;
          return [R + rr * Math.cos(ang), R + rr * Math.sin(ang)];
        }, 120).slice(0, -1) });
      }
      return out;
    } },

  // cruzes de sashiko (jūji-zashi): um xis pequeno em cada casa da grade
  cruzes: { nome: "cruzes de sashiko", medida: "lado da casa", padrao: 10, min: 4, max: 40,
    opcoes: [["cols", "colunas", 8, 1, 30], ["rows", "fileiras", 4, 1, 30]],
    faz: function(lado, o){
      var cols = o.cols || 8, rows = o.rows || 4, out = [], m = lado * 0.5;
      for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++){
          var cx = lado / 2 + c * lado, cy = lado / 2 + r * lado;
          out.push({ pts: [[cx - m / 2, cy], [cx + m / 2, cy]], curva: false });
          out.push({ pts: [[cx, cy - m / 2], [cx, cy + m / 2]], curva: false });
        }
      return out;
    } }
};

/* ---- faixa e moldura ------------------------------------------------------

   Os desenhos em linha também se repetem: em fileira, que é o marca-página,
   e em volta da foto, que é a moldura. Repetir é copiar os caminhos do
   desenho deslocados; a conta de furos vem depois, no conjunto — e é ela que
   junta o furo que duas cópias encostadas dividirem.

   Na moldura de ziguezague e de ondas não há cópia: a linha dá a volta na
   foto, contínua, com os dentes e as ondas repartidos por igual em cada lado
   e o canto como furo. */
function copiaCaminhos(cams, dx, dy){
  return cams.map(function(c){
    return { curva: c.curva, fechada: c.fechada,
             pts: c.pts.map(function(p){ return [p[0] + dx, p[1] + dy]; }) };
  });
}

function arranjaFaixa(cams, n, gap, deitada){
  var b = caixaCaminhos(cams), out = [];
  for (var i = 0; i < n; i++)
    out = out.concat(copiaCaminhos(cams,
      deitada ? i * (b.w + gap) - b.x : -b.x,
      deitada ? -b.y : i * (b.h + gap) - b.y));
  return out;
}

// os centros dos motivos em volta de um retângulo: um em cada canto e os
// lados repartidos por igual, no passo mais perto do pedido — o de cima e o
// de baixo com um passo, os dos lados com outro, porque motivo alto e
// estreito, como a folha, cabe mais vezes na horizontal
function pontosDoAnel(ret, passoH, passoV){
  var cantos = [[ret.x, ret.y], [ret.x + ret.w, ret.y], [ret.x + ret.w, ret.y + ret.h], [ret.x, ret.y + ret.h]];
  var out = [];
  for (var k = 0; k < 4; k++){
    var a = cantos[k], b = cantos[(k + 1) % 4], passo = k % 2 ? passoV : passoH;
    var n = Math.max(1, Math.round(distR(a, b) / passo));
    for (var j = 0; j < n; j++) out.push(entre(a, b, j / n));
  }
  return out;
}

function arranjaMoldura(cams, ret, gap){
  var b = caixaCaminhos(cams);
  // os motivos ficam por fora da margem: o centro deles anda meio motivo para
  // fora — meia largura nos lados, meia altura em cima e embaixo
  var fora = { x: ret.x - b.w / 2, y: ret.y - b.h / 2, w: ret.w + b.w, h: ret.h + b.h };
  var out = [];
  pontosDoAnel(fora, b.w + gap, b.h + gap).forEach(function(c){
    out = out.concat(copiaCaminhos(cams, c[0] - b.x - b.w / 2, c[1] - b.y - b.h / 2));
  });
  return out;
}

// a linha contínua em volta: cada lado com um número inteiro de dentes (ou de
// ondas), deslocada para fora e para dentro do retângulo
function molduraContinua(tipo, ret, o){
  var onda = tipo === "ondas", passoDente = onda ? (o.onda || 20) : (o.dente || 8);
  var amp = onda ? (o.alt || 4) : (o.alt || 8) / 2, linhas = onda ? (o.linhas || 1) : 1;
  var sep = o.sep || 7, out = [];
  for (var l = 0; l < linhas; l++){
    var r = { x: ret.x - amp - l * sep, y: ret.y - amp - l * sep, w: ret.w + 2 * (amp + l * sep), h: ret.h + 2 * (amp + l * sep) };
    var cantos = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
    var pts = [];
    for (var k = 0; k < 4; k++){
      var a = cantos[k], b = cantos[(k + 1) % 4], L = distR(a, b);
      var n = Math.max(1, Math.round(L / passoDente)), nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L;
      var amostras = onda ? n * 24 : n * 2;
      for (var j = 0; j < amostras; j++){
        var t = j / amostras, base = entre(a, b, t);
        var desl = onda ? amp * Math.sin(t * n * Math.PI * 2) : (j % 2 ? amp : 0);
        // o normal aponta para fora; a linha parte do retângulo aumentado e o
        // dente volta para dentro, sem nunca passar da margem pedida
        pts.push([base[0] - nx * desl, base[1] - ny * desl]);
      }
    }
    out.push({ pts: pts, curva: onda, fechada: true });
  }
  return out;
}

// as opções de uma peça, com as de fábrica no que faltar
function opcoesReto(el){
  var d = DESENHOS_RETO[el.desenho], o = {};
  (d ? d.opcoes : []).forEach(function(op){
    var v = el.opts && el.opts[op[0]] != null ? +el.opts[op[0]] : op[2];
    o[op[0]] = Math.max(op[3], Math.min(op[4], v));
  });
  return o;
}

// a caixa dos caminhos, para a peça saber o próprio tamanho e encostar no zero
function caixaCaminhos(caminhos){
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  caminhos.forEach(function(c){ c.pts.forEach(function(p){
    x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
  }); });
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

if (typeof module !== "undefined") module.exports = { DESENHOS_RETO: DESENHOS_RETO,
  pontosDoDesenho: pontosDoDesenho, caixaCaminhos: caixaCaminhos, furosReta: furosReta,
  furosCurva: furosCurva, RETO_PASSO: RETO_PASSO };
