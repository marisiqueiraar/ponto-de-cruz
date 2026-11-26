# -*- coding: utf-8 -*-
# Puxa dos arquivos de js/ os trechos que os testes rodam. Teste que roda contra
# uma cópia velha do código não testa nada, então a extração é sempre refeita.
#
# Os arquivos são lidos na ordem em que o index.html os carrega e emendados num
# texto só: é o mesmo código, na mesma ordem, que o navegador executa.
import io, os, re
D = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(D, "..")
html = io.open(os.path.join(R, "index.html"), encoding="utf-8").read()
ordem = re.findall(r'<script src="(js/[^"]+\.js)"></script>', html)
if not ordem:
    raise SystemExit("o index.html não carrega nenhum arquivo de js/")
s = u"\n".join(io.open(os.path.join(R, f), encoding="utf-8").read() for f in ordem)

def bloco(i, f):
    a = s.index(i); b = s.index(f, a); return s[a:b]

io.open(os.path.join(D, "pdfcode.js"), "w", encoding="utf-8").write(
    bloco(u"function hexRGB(hex){", u"// A caixa de linhas é uma marca") +
    bloco(u"function bboxMM(el){", u"function drawPhoto(") +
    bloco(u"/* Régua impressa.", u"/* ponto & letra — fontes.js"))

io.open(os.path.join(D, "estante.js"), "w", encoding="utf-8").write(
    bloco(u'var MOLDES = "ponto-e-letra/moldes/v1";', u"function nomeSugerido(){") +
    bloco(u"function quando(ms){", u"function moldeEmBranco(){") +
    bloco(u"function apagaMolde(id){", u'$("moldeNovo").addEventListener'))

io.open(os.path.join(D, "geo.js"), "w", encoding="utf-8").write(
    # geo.js testa so o repartir em folhas; a legenda do rodape tem teste proprio
    u"var els = [];\nfunction linhasUsadas(){ return []; }\n" +
    bloco(u"var PDF_SIDE = 10", u"/* ponto & letra — tela.js") +
    u"\nmodule.exports = { pdfFit, pdfPlan, cabeSolta, nFolhas, inicios, PDF_SIDE, PDF_TOP, PDF_FOOT, PDF_BLEED, TILE_TOP, SOBRA };\n")

# o script inteiro, so para o node --check achar erro de sintaxe
io.open(os.path.join(D, "app.js"), "w", encoding="utf-8").write(s)
print(u"extraido de " + str(len(ordem)) + u" arquivos de js/")
