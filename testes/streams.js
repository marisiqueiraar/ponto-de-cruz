// os streams do PDF saem comprimidos (FlateDecode); para conferir o desenho
// é preciso descomprimir antes de ler os operadores.
const zlib = require("zlib");
module.exports = function streams(buf){
  const t = buf.toString("latin1"), out = [];
  const re = /stream\r?\n/g; let m;
  while ((m = re.exec(t))){
    const ini = m.index + m[0].length;
    const fim = t.indexOf("endstream", ini);
    if (fim < 0) continue;
    const cru = buf.subarray(ini, fim);
    let txt;
    try { txt = zlib.inflateSync(cru).toString("latin1"); }
    catch (e){ txt = cru.toString("latin1"); }
    out.push(txt);
  }
  return out;
};
