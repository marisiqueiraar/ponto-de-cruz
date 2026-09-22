// PNG cru, escrito à mão. Os testes desenham as imagens que usam, em código,
// porque é a única forma de afirmar "este quadradinho acendeu porque ali era
// preto". Sem biblioteca: o repositório não instala nada, e um PNG sem filtro
// é cabeçalho, pixels crus e três CRCs.
const zlib = require("zlib");

const TABELA = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++){
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = TABELA[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};

// cor(x, y) devolve um número (cinza) ou [r, g, b]
function png(w, h, cor){
  const linhas = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++){
    linhas[o++] = 0;                        // filtro nenhum: o pixel é o pixel
    for (let x = 0; x < w; x++){
      const v = cor(x, y);
      if (typeof v === "number"){ linhas[o++] = v; linhas[o++] = v; linhas[o++] = v; }
      else { linhas[o++] = v[0]; linhas[o++] = v[1]; linhas[o++] = v[2]; }
    }
  }
  const pedaco = (tipo, dados) => {
    const t = Buffer.from(tipo, "latin1");
    const len = Buffer.alloc(4); len.writeUInt32BE(dados.length, 0);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])), 0);
    return Buffer.concat([len, t, dados, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;                 // 8 bits por canal, RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
                        pedaco("IHDR", ihdr),
                        pedaco("IDAT", zlib.deflateSync(linhas)),
                        pedaco("IEND", Buffer.alloc(0))]);
}

module.exports = { png };
