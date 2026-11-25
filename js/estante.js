/* ponto & letra — estante.js
   Onde o molde é guardado no navegador, e a estante de moldes.
   Scripts clássicos, carregados em ordem pelo index.html: o que um arquivo
   usa ao carregar tem de estar num arquivo anterior. */

/* ---- memória local -------------------------------------------------
   Duas chaves de propósito: a foto é o único item que pode estourar a cota
   do navegador, e guardada à parte ela nunca leva o resto junto na queda. */
var STORE = "ponto-e-letra/molde/v1";
var PHOTO_STORE = "ponto-e-letra/molde/foto/v1";
var PHOTO_MAX_PX = 1600;

/* A imagem que vira peça mora numa terceira chave, pelo mesmo motivo da
   foto: é grande, e à parte ela cai sozinha sem levar o molde junto. Cai
   barato, também — as células já estão gravadas dentro do molde, então o
   desenho abre igual sem ela; o que se perde é poder mexer na largura e na
   sensibilidade sem trazer o arquivo de novo.

   Vai reduzida porque é origem de quadradinho, e não desenho final: 512 px
   dão quatro pixels por quadradinho na largura máxima, e mais do que isso
   não muda um furo. */
var IMG_STORE = "ponto-e-letra/molde/imagens/v1";
var IMG_MAX_PX = 512;
var IMG_LARG_MIN = 10, IMG_LARG_MAX = 120;

// id da peça → { url: o data-url gravado, img: o canvas já decodificado.
// O molde guarda só o id; o desenho de quem ainda não voltou da memória são
// as células gravadas, que bastam para a tela e para o PDF.
var origens = {};

// peça de gráfico colorido: a que tem mais de uma linha dentro dela. Todo
// o resto do app trata as células como liga-desliga, e continua certo —
// índice de paleta é verdadeiro do mesmo jeito que o 1 era
function temPaleta(el){
  return !!(el && el.kind === "img" && (el.cores | 0) > 1);
}

function origemPronta(el){
  var o = el && el.kind === "img" ? origens[el.img] : null;
  return o && o.img && o.img.width ? o.img : null;
}

/* ---- a estante de moldes --------------------------------------------

   Uma chave só para um molde só significava que começar um desenho novo
   apagava o anterior, sem volta. Agora cada molde tem as suas chaves e este
   índice diz quais existem e qual está aberto.

   O índice guarda o NOME das chaves de cada molde, nunca o conteúdo. Gravar
   acontece a cada gesto, e reescrever a estante inteira porque uma peça
   andou um milímetro seria desperdício. É isso também que deixa o molde que
   já estava gravado ficar exatamente onde está: ele entra na estante
   apontando para as chaves antigas, sem nada ser copiado — numa cota quase
   cheia, copiar a foto para migrar é a diferença entre migrar e perdê-la. */
var MOLDES = "ponto-e-letra/moldes/v1";
var estante = { v: 1, atual: "", itens: [] };

function novoId(){
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function itemAtual(){
  for (var i = 0; i < estante.itens.length; i++)
    if (estante.itens[i].id === estante.atual) return estante.itens[i];
  return null;
}

function salvaEstante(){
  try { localStorage.setItem(MOLDES, JSON.stringify(estante)); } catch (e){}
}

function criaMolde(nome){
  var id = novoId();
  var it = { id: id, nome: nome || "", em: Date.now(), pecas: 0,
             dados: STORE + "/" + id, foto: PHOTO_STORE + "/" + id };
  estante.itens.unshift(it);
  estante.atual = id;
  salvaEstante();
  return it;
}

function carregaEstante(){
  var raw = null;
  try { raw = localStorage.getItem(MOLDES); } catch (e){ return; }
  if (raw){
    var e;
    try { e = JSON.parse(raw); } catch (err){ e = null; }
    if (e && e.v === 1 && e.itens && e.itens.length){
      estante = { v: 1, atual: e.atual || "",
                  itens: e.itens.filter(function(i){ return i && i.id && i.dados && i.foto; }) };
      if (!itemAtual() && estante.itens.length) estante.atual = estante.itens[0].id;
      if (estante.itens.length) return;
    }
  }
  // primeira abertura desta versão: o molde que já estava gravado entra na
  // estante como está, apontando para as chaves de sempre
  var tinha = false;
  try { tinha = !!localStorage.getItem(STORE); } catch (e2){}
  if (tinha){
    estante = { v: 1, atual: "legado",
                itens: [{ id: "legado", nome: "", em: Date.now(), pecas: 0,
                          dados: STORE, foto: PHOTO_STORE }] };
    salvaEstante();
  }
}

// o nome que um molde ganha sozinho: a primeira palavra bordada nele — e,
// num molde que não tem palavra nenhuma, o nome da primeira imagem, que é o
// que a pessoa escolheu e reconhece na lista
function nomeSugerido(){
  for (var i = 0; i < els.length; i++)
    if (els[i].kind === "text" && (els[i].text || "").trim()) return els[i].text.trim();
  for (var j = 0; j < els.length; j++)
    if (els[j].kind === "img" && (els[j].nome || "").trim()) return els[j].nome.trim();
  for (var k = 0; k < els.length; k++)
    if (els[k].kind === "pat") return nomePeca(els[k]);
  return "";
}
var saveTimer = 0;
var restored = false;
