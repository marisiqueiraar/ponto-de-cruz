import { useState } from 'react'
import { Callout } from '../components/common/controls'
import { Icon } from '../components/common/Icon'
import { physicalFromStitches } from '../lib/pattern/sizing'
import { estimatePdfPages } from '../lib/pdf/pageLayout'
import { useEditorStore } from '../state/useEditorStore'
import type { TabId } from '../navigation'

interface PrintPageProps {
  onNavigate: (tab: TabId) => void
}

export function PrintPage({ onNavigate }: PrintPageProps) {
  const pattern = useEditorStore((s) => s.pattern)
  const compositedCells = useEditorStore((s) => s.compositedCells)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!pattern || !compositedCells) return
    setExporting(true)
    try {
      // Loaded on demand: jsPDF pulls in heavy transitive dependencies that would otherwise
      // bloat the initial bundle for a feature most sessions never touch.
      const { exportPatternToPdf } = await import('../lib/pdf/exportPatternPdf')
      exportPatternToPdf(pattern, compositedCells)
    } finally {
      setExporting(false)
    }
  }

  if (!pattern || !compositedCells) {
    return (
      <div className="page">
        <div className="card">
          <div className="canvas-empty" style={{ position: 'static', padding: 60 }}>
            <Icon name="printer" size={34} />
            <p className="card-sub">Gere um padrão antes de exportar o PDF de impressão.</p>
            <button type="button" className="btn btn--primary" onClick={() => onNavigate('gerador')}>
              Ir para o Gerador
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const layout = estimatePdfPages(pattern.width, pattern.height, pattern.palette.length)
  const widthCm = physicalFromStitches(pattern.width, pattern.fabricCount)
  const heightCm = physicalFromStitches(pattern.height, pattern.fabricCount)

  return (
    <div className="page page--split">
      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="printer" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>O que vai no PDF</h2>
              <p>Documento A4 pronto para imprimir e bordar</p>
            </div>
          </div>

          <div className="guide-item">
            <h3>1. Capa colorida</h3>
            <p>Prévia do bordado montado, com tamanho final, tecido e número de cores.</p>
          </div>
          <div className="guide-item">
            <h3>2. Legenda e lista de compras</h3>
            <p>Símbolo, código DMC, nome da cor e quantidade de pontos de cada linha.</p>
          </div>
          <div className="guide-item">
            <h3>3. Gráfico em símbolos</h3>
            <p>
              Preto e branco, com linhas grossas a cada 10 pontos e numeração de linhas e colunas nas bordas de cada folha.
            </p>
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">Resumo do documento</p>
          <div className="metric-grid">
            <div className="metric metric--accent">
              <div className="metric__label">Total de páginas</div>
              <div className="metric__value">{layout.totalPages}</div>
            </div>
            <div className="metric">
              <div className="metric__label">Mosaico do gráfico</div>
              <div className="metric__value">
                {layout.cols}×{layout.rows}
                <small>folhas</small>
              </div>
            </div>
            <div className="metric">
              <div className="metric__label">Legenda</div>
              <div className="metric__value">
                {layout.legendPages}
                <small>{layout.legendPages === 1 ? 'página' : 'páginas'}</small>
              </div>
            </div>
          </div>

          <Callout muted>
            Imprima em <strong>escala 100%</strong> (sem "ajustar à página"), senão a contagem dos quadradinhos sai errada
            em relação ao tecido.
          </Callout>
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm icon-tile--green">
              <Icon name="download" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>{pattern.name || 'Sem título'}</h2>
              <p>
                {pattern.width} × {pattern.height} pontos · {widthCm.toFixed(1)} × {heightCm.toFixed(1)} cm · Aida{' '}
                {pattern.fabricCount}
              </p>
            </div>
          </div>

          <div className="data-block">
            <span className="data-block__label">MOSAICO</span>
            {layout.cols * layout.rows} folha{layout.cols * layout.rows === 1 ? '' : 's'} A4 para o gráfico, com{' '}
            {layout.overlapStitches} pontos de sobreposição nas emendas
          </div>

          <button
            type="button"
            className="btn btn--primary btn--block"
            style={{ marginTop: 16 }}
            onClick={handleExport}
            disabled={exporting}
          >
            <Icon name="printer" size={17} />
            {exporting ? 'Gerando PDF…' : 'Baixar PDF para impressão'}
          </button>

          <p className="hint hint--mono">
            {pattern.palette.length} cores · {(pattern.width * pattern.height).toLocaleString('pt-BR')} pontos
          </p>
        </div>
      </div>
    </div>
  )
}
