#!/bin/sh
# Todos os testes. Os de navegador se pulam sozinhos quando não há Chromium.
cd "$(dirname "$0")" || exit 1
python3 extrai.py || exit 1
node --check app.js || exit 1
falhou=0
for t in geo.test pos.test emenda.test pdf.test cor.test semfoto.test grafico.test estante.test tela posicao guias traco laco letra ajuste imagem grafico fio teto cota; do
  if node "$t.js" >/dev/null 2>&1; then echo "ok    $t"
  else echo "FALHA $t"; node "$t.js" 2>&1 | tail -12; falhou=1; fi
done
[ $falhou = 0 ] && echo "" && echo "todos passam"
exit $falhou
