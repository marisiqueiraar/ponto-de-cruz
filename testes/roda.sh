#!/bin/sh
cd "$(dirname "$0")" || exit 1
python3 extrai.py || exit 1
node --check app.js || exit 1
falhou=0
for t in geo pos emenda pdf cor estante; do
  if node "$t.test.js" >/dev/null 2>&1; then echo "ok    $t"
  else echo "FALHA $t"; node "$t.test.js" 2>&1 | tail -12; falhou=1; fi
done
[ $falhou = 0 ] && echo "\ntodos passam"
exit $falhou
