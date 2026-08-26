import { useState } from 'react'
import { useEditorStore } from '../../state/useEditorStore'

export function PrintPanel() {
  const pattern = useEditorStore((s) => s.pattern)
  const compositedCells = useEditorStore((s) => s.compositedCells)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!pattern || !compositedCells) return
    setExporting(true)
    try {
      // Loaded on demand: jsPDF pulls in a couple of heavy transitive dependencies that would
      // otherwise bloat the initial bundle for a feature most sessions never touch.
      const { exportPatternToPdf } = await import('../../lib/pdf/exportPatternPdf')
      exportPatternToPdf(pattern, compositedCells)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="panel">
      <h2>Impressão</h2>
      <p className="hint">
        Gera um PDF em A4 com capa colorida, gráfico de símbolos paginado (com margem de sobreposição entre folhas) e
        legenda com códigos DMC.
      </p>
      <button type="button" className="button-primary" onClick={handleExport} disabled={!pattern || !compositedCells || exporting}>
        {exporting ? 'Gerando PDF…' : 'Baixar PDF para impressão'}
      </button>
    </div>
  )
}
