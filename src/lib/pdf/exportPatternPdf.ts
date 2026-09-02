import { jsPDF } from 'jspdf'
import { physicalFromStitches } from '../pattern/sizing'
import { toFileName } from '../project/projectName'
import { renderPatternPreviewDataUrl } from '../pattern/renderPreviewImage'
import type { Pattern } from '../../types/pattern'
import {
  CELL_MM,
  CHART_HEADER_MM,
  computePageStarts,
  LABEL_MARGIN_MM,
  LEGEND_ROW_MM,
  legendRowsPerPage,
  MARGIN_MM,
  OVERLAP_STITCHES,
  PAGE_WIDTH_MM,
  stitchesPerChartPage,
} from './pageLayout'
import { getSymbolTileDataUrl, renderLegendSwatchDataUrl } from './renderSwatch'

function addCoverPage(doc: jsPDF, pattern: Pattern, cells: Uint16Array): void {
  doc.setFontSize(20)
  doc.text(pattern.name || 'Padrão de ponto de cruz', PAGE_WIDTH_MM / 2, 24, { align: 'center' })

  const widthCm = physicalFromStitches(pattern.width, pattern.fabricCount)
  const heightCm = physicalFromStitches(pattern.height, pattern.fabricCount)
  doc.setFontSize(11)
  doc.text(
    [
      `${pattern.width} × ${pattern.height} pontos`,
      `${widthCm.toFixed(1)} × ${heightCm.toFixed(1)} cm em tecido Aida ${pattern.fabricCount}`,
      `${pattern.palette.length} cores`,
      new Date(pattern.updatedAt).toLocaleDateString('pt-BR'),
    ],
    PAGE_WIDTH_MM / 2,
    36,
    { align: 'center' },
  )

  const dataUrl = renderPatternPreviewDataUrl(cells, pattern.width, pattern.height, pattern.palette)
  if (!dataUrl) return
  const maxBoxMm = 160
  const aspect = pattern.width / pattern.height
  let imgW = maxBoxMm
  let imgH = maxBoxMm / aspect
  if (imgH > maxBoxMm) {
    imgH = maxBoxMm
    imgW = maxBoxMm * aspect
  }
  doc.addImage(dataUrl, 'PNG', (PAGE_WIDTH_MM - imgW) / 2, 60, imgW, imgH)
}

function addLegendPages(doc: jsPDF, pattern: Pattern): void {
  const sorted = [...pattern.palette].sort((a, b) => b.count - a.count)
  const rowsPerPage = legendRowsPerPage()

  for (let pageStart = 0; pageStart < sorted.length; pageStart += rowsPerPage) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Legenda e lista de compras', MARGIN_MM, MARGIN_MM)
    doc.setFontSize(9)
    doc.text('Símbolo', MARGIN_MM + 12, MARGIN_MM + 8)
    doc.text('DMC', MARGIN_MM + 30, MARGIN_MM + 8)
    doc.text('Nome', MARGIN_MM + 55, MARGIN_MM + 8)
    doc.text('Pontos', PAGE_WIDTH_MM - MARGIN_MM - 15, MARGIN_MM + 8)

    const pageEntries = sorted.slice(pageStart, pageStart + rowsPerPage)
    pageEntries.forEach((entry, i) => {
      const y = MARGIN_MM + 12 + i * LEGEND_ROW_MM
      const swatch = renderLegendSwatchDataUrl(entry.symbol, entry.rgb)
      if (swatch) doc.addImage(swatch, 'PNG', MARGIN_MM, y - 5, 6, 6)
      doc.setFontSize(9)
      doc.text(entry.dmcCode, MARGIN_MM + 30, y)
      doc.text(entry.name, MARGIN_MM + 55, y, { maxWidth: 100 })
      doc.text(String(entry.count), PAGE_WIDTH_MM - MARGIN_MM - 15, y)
    })
  }
}

function addChartPages(doc: jsPDF, pattern: Pattern, cells: Uint16Array): void {
  const { cols: stitchesPerPageCol, rows: stitchesPerPageRow } = stitchesPerChartPage()

  const colStarts = computePageStarts(pattern.width, stitchesPerPageCol, OVERLAP_STITCHES)
  const rowStarts = computePageStarts(pattern.height, stitchesPerPageRow, OVERLAP_STITCHES)

  const chartOriginX = MARGIN_MM + LABEL_MARGIN_MM
  const chartOriginY = MARGIN_MM + LABEL_MARGIN_MM + CHART_HEADER_MM

  rowStarts.forEach((rowStart, pageRow) => {
    colStarts.forEach((colStart, pageCol) => {
      doc.addPage()
      const colEnd = Math.min(pattern.width, colStart + stitchesPerPageCol)
      const rowEnd = Math.min(pattern.height, rowStart + stitchesPerPageRow)

      doc.setFontSize(11)
      doc.text(`${pattern.name} — página ${pageRow + 1}.${pageCol + 1}`, MARGIN_MM, MARGIN_MM)
      doc.setFontSize(8)
      doc.text(`Colunas ${colStart + 1}–${colEnd} · Linhas ${rowStart + 1}–${rowEnd}`, MARGIN_MM, MARGIN_MM + 5)

      // Column/row index labels, every 10 stitches.
      doc.setFontSize(6)
      for (let col = colStart; col < colEnd; col++) {
        if ((col + 1) % 10 !== 0 && col !== colStart) continue
        const x = chartOriginX + (col - colStart) * CELL_MM + CELL_MM / 2
        doc.text(String(col + 1), x, chartOriginY - 1.5, { align: 'center' })
      }
      for (let row = rowStart; row < rowEnd; row++) {
        if ((row + 1) % 10 !== 0 && row !== rowStart) continue
        const y = chartOriginY + (row - rowStart) * CELL_MM + CELL_MM / 2 + 1
        doc.text(String(row + 1), chartOriginX - 2, y, { align: 'right' })
      }

      // Symbol tiles.
      for (let row = rowStart; row < rowEnd; row++) {
        for (let col = colStart; col < colEnd; col++) {
          const entry = pattern.palette[cells[row * pattern.width + col]]
          if (!entry) continue
          const tile = getSymbolTileDataUrl(entry.symbol)
          if (!tile) continue
          const x = chartOriginX + (col - colStart) * CELL_MM
          const y = chartOriginY + (row - rowStart) * CELL_MM
          doc.addImage(tile, 'PNG', x, y, CELL_MM, CELL_MM, entry.symbol)
        }
      }

      // Gridlines: thin every cell, bold every 10 stitches.
      const chartWidthMm = (colEnd - colStart) * CELL_MM
      const chartHeightMm = (rowEnd - rowStart) * CELL_MM
      for (let col = colStart; col <= colEnd; col++) {
        const x = chartOriginX + (col - colStart) * CELL_MM
        doc.setLineWidth(col % 10 === 0 ? 0.35 : 0.1)
        doc.line(x, chartOriginY, x, chartOriginY + chartHeightMm)
      }
      for (let row = rowStart; row <= rowEnd; row++) {
        const y = chartOriginY + (row - rowStart) * CELL_MM
        doc.setLineWidth(row % 10 === 0 ? 0.35 : 0.1)
        doc.line(chartOriginX, y, chartOriginX + chartWidthMm, y)
      }
    })
  })
}

/** Generates and triggers a download of a print-ready PDF: cover, DMC legend, and a paginated A4 symbol chart. */
export function exportPatternToPdf(pattern: Pattern, cells: Uint16Array): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  addCoverPage(doc, pattern, cells)
  addLegendPages(doc, pattern)
  addChartPages(doc, pattern, cells)
  doc.save(`${toFileName(pattern.name, 'padrao')}.pdf`)
}
