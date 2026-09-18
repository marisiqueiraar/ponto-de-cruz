# -*- coding: utf-8 -*-
# Puxa do index.html os trechos que os testes rodam. Teste que roda contra uma
# cópia velha do código não testa nada, então a extração é sempre refeita.
import io, os
D = os.path.dirname(os.path.abspath(__file__))
s = io.open(os.path.join(D, "..", "index.html"), encoding="utf-8").read()
def bloco(i, f):
    a = s.index(i); b = s.index(f, a); return s[a:b]

io.open(os.path.join(D, "pdfcode.js"), "w", encoding="utf-8").write(
    bloco(u"  function hexRGB(hex){", u"  // A caixa de linhas é uma marca") +
    bloco(u"  function bboxMM(el){", u"  function drawPhoto(") +
    bloco(u"  /* Régua impressa.", u"  /* ---- escolher a fonte vendo o traço"))

io.open(os.path.join(D, "estante.js"), "w", encoding="utf-8").write(
    bloco(u'  var MOLDES = "ponto-e-letra/moldes/v1";', u"  function nomeSugerido(){") +
    bloco(u"  function quando(ms){", u"  function moldeEmBranco(){") +
    bloco(u"  function apagaMolde(id){", u'  $("moldeNovo").addEventListener'))

io.open(os.path.join(D, "geo.js"), "w", encoding="utf-8").write(
    # geo.js testa so o repartir em folhas; a legenda do rodape tem teste proprio
    u"var els = [];\nfunction linhasUsadas(){ return []; }\n" +
    bloco(u"  var PDF_SIDE = 10", u"  function drawPhoto(") +
    u"\nmodule.exports = { pdfFit, pdfPlan, nFolhas, inicios, PDF_SIDE, PDF_TOP, PDF_FOOT, TILE_TOP, SOBRA };\n")
# o script inteiro, so para o node --check achar erro de sintaxe
import re
io.open(os.path.join(D, "app.js"), "w", encoding="utf-8").write(
    u"\n".join(re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", s, re.S)))
print("extraido do index.html")
