import { jsPDF } from 'jspdf'
import { getSubstrate } from '../../data/substrates'
import { findDmcByCode } from '../color/dmcMatch'
import { collectStitches, matGrid, photoRectInCells, stitchCountsByColor } from '../mat/matGeometry'
import { estimateSkeins } from '../stitch/flossEstimate'
import type { MatProject } from '../../types/mat'

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const MARGIN_MM = 10

/** Cell pitch in mm for a given count — this is what makes the printed guide true 1:1. */
function cellPitchMm(count: number): number {
  return 25.4 / count
}

function drawGuidePage(doc: jsPDF, project: MatProject, offsetCols: number, offsetRows: number, pageCols: number, pageRows: number): void {
  const pitch = cellPitchMm(project.count)
  const grid = matGrid(project)
  const photo = photoRectInCells(project)
  const stitches = collectStitches(project)

  const colEnd = Math.min(grid.cols, offsetCols + pageCols)
  const rowEnd = Math.min(grid.rows, offsetRows + pageRows)

  const originX = MARGIN_MM
  const originY = MARGIN_MM + 8

  // Card outline, drawn only along the edges that actually fall on this page.
  doc.setLineWidth(0.4)
  doc.setDrawColor(60)
  const cardLeft = originX + (0 - offsetCols) * pitch
  const cardTop = originY + (0 - offsetRows) * pitch
  doc.rect(cardLeft, cardTop, grid.cols * pitch, grid.rows * pitch)

  // Photo opening.
  doc.setLineWidth(0.3)
  doc.setDrawColor(120)
  doc.setLineDashPattern([1.5, 1.2], 0)
  doc.rect(originX + (photo.x - offsetCols) * pitch, originY + (photo.y - offsetRows) * pitch, photo.width * pitch, photo.height * pitch)
  doc.setLineDashPattern([], 0)

  // Piercing dots: one per hole in the grid.
  doc.setFillColor(200, 200, 200)
  for (let row = offsetRows; row <= rowEnd; row++) {
    for (let col = offsetCols; col <= colEnd; col++) {
      const x = originX + (col - offsetCols) * pitch
      const y = originY + (row - offsetRows) * pitch
      doc.circle(x, y, 0.18, 'F')
    }
  }

  // Stitches as filled squares in their thread colour.
  for (const cell of stitches) {
    if (cell.x < offsetCols || cell.x >= colEnd || cell.y < offsetRows || cell.y >= rowEnd) continue
    const dmc = findDmcByCode(cell.dmcCode)
    const [r, g, b] = dmc?.rgb ?? [180, 20, 40]
    doc.setFillColor(r, g, b)
    const x = originX + (cell.x - offsetCols) * pitch
    const y = originY + (cell.y - offsetRows) * pitch
    doc.rect(x, y, pitch, pitch, 'F')
  }

  // Every tenth hole gets a heavier rule, so counting stays possible on paper.
  doc.setDrawColor(90)
  doc.setLineWidth(0.25)
  for (let col = offsetCols; col <= colEnd; col++) {
    if (col % 10 !== 0) continue
    const x = originX + (col - offsetCols) * pitch
    doc.line(x, originY, x, originY + (rowEnd - offsetRows) * pitch)
  }
  for (let row = offsetRows; row <= rowEnd; row++) {
    if (row % 10 !== 0) continue
    const y = originY + (row - offsetRows) * pitch
    doc.line(originX, y, originX + (colEnd - offsetCols) * pitch, y)
  }
}

/** A 1cm reference square: if it does not measure 1cm on the print, the scale is wrong. */
function drawScaleCheck(doc: jsPDF, x: number, y: number): void {
  doc.setDrawColor(60)
  doc.setLineWidth(0.3)
  doc.rect(x, y, 10, 10)
  doc.setFontSize(7)
  doc.setTextColor(90)
  doc.text('1 cm — confira com a régua antes de furar', x + 13, y + 6)
}

function addCoverPage(doc: jsPDF, project: MatProject): void {
  const substrate = getSubstrate(project.substrateId)
  const grid = matGrid(project)
  const counts = stitchCountsByColor(project)
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0)

  doc.setFontSize(19)
  doc.setTextColor(20)
  doc.text(project.name || 'Moldura bordada', MARGIN_MM, 22)

  doc.setFontSize(10)
  doc.setTextColor(70)
  const lines = [
    `Cartão: ${project.widthCm} × ${project.heightCm} cm  ·  grade ${grid.cols} × ${grid.rows} furos  ·  ${project.count} ct`,
    `Janela da foto: ${project.photo.widthCm} × ${project.photo.heightCm} cm, a ${project.photo.xCm} cm da esquerda e ${project.photo.yCm} cm do topo`,
    `Base: ${substrate?.name ?? '—'}`,
    `Fios: ${substrate?.strands ?? '—'}`,
    `Agulha: ${substrate?.needle ?? '—'}`,
    `Total: ${total} pontos`,
  ]
  doc.text(lines, MARGIN_MM, 33)

  let cursorY = 33 + lines.length * 5.5 + 6
  drawScaleCheck(doc, MARGIN_MM, cursorY)
  cursorY += 20

  doc.setFontSize(11)
  doc.setTextColor(20)
  doc.text('Linhas', MARGIN_MM, cursorY)
  cursorY += 6
  doc.setFontSize(9)
  for (const [code, count] of counts) {
    const dmc = findDmcByCode(code)
    const [r, g, b] = dmc?.rgb ?? [180, 20, 40]
    doc.setFillColor(r, g, b)
    doc.rect(MARGIN_MM, cursorY - 3, 4, 4, 'F')
    doc.setTextColor(70)
    doc.text(
      `DMC ${code}${dmc ? ` — ${dmc.name}` : ''}  ·  ${count} pontos  ·  ${estimateSkeins(count, project.count, 2).skeinsToBuy} meada(s)`,
      MARGIN_MM + 7,
      cursorY,
    )
    cursorY += 6
  }

  if (substrate) {
    cursorY += 6
    doc.setFontSize(11)
    doc.setTextColor(20)
    doc.text('Atenção', MARGIN_MM, cursorY)
    cursorY += 6
    doc.setFontSize(9)
    doc.setTextColor(70)
    for (const caution of substrate.cautions) {
      const wrapped = doc.splitTextToSize(`• ${caution}`, A4_WIDTH_MM - MARGIN_MM * 2)
      doc.text(wrapped, MARGIN_MM, cursorY)
      cursorY += wrapped.length * 5
    }
  }

  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('Imprima em escala 100% (sem "ajustar à página").', MARGIN_MM, A4_HEIGHT_MM - MARGIN_MM)
}

export interface MatPdfLayout {
  cols: number
  rows: number
  guidePages: number
  totalPages: number
}

/** How many A4 sheets the 1:1 guide needs. */
export function estimateMatPdfPages(project: MatProject): MatPdfLayout {
  const pitch = cellPitchMm(project.count)
  const grid = matGrid(project)
  const perPageCols = Math.max(1, Math.floor((A4_WIDTH_MM - MARGIN_MM * 2) / pitch))
  const perPageRows = Math.max(1, Math.floor((A4_HEIGHT_MM - MARGIN_MM * 2 - 8) / pitch))
  const cols = Math.max(1, Math.ceil(grid.cols / perPageCols))
  const rows = Math.max(1, Math.ceil(grid.rows / perPageRows))
  return { cols, rows, guidePages: cols * rows, totalPages: 1 + cols * rows }
}

/** Builds the printable 1:1 piercing-and-stitching guide and triggers the download. */
export function exportMatToPdf(project: MatProject): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  addCoverPage(doc, project)

  const pitch = cellPitchMm(project.count)
  const grid = matGrid(project)
  const perPageCols = Math.max(1, Math.floor((A4_WIDTH_MM - MARGIN_MM * 2) / pitch))
  const perPageRows = Math.max(1, Math.floor((A4_HEIGHT_MM - MARGIN_MM * 2 - 8) / pitch))

  for (let rowStart = 0; rowStart < grid.rows; rowStart += perPageRows) {
    for (let colStart = 0; colStart < grid.cols; colStart += perPageCols) {
      doc.addPage()
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(
        `${project.name || 'Moldura'} — guia 1:1 · colunas ${colStart + 1}+ · linhas ${rowStart + 1}+`,
        MARGIN_MM,
        MARGIN_MM + 3,
      )
      drawGuidePage(doc, project, colStart, rowStart, perPageCols, perPageRows)
    }
  }

  doc.save(`${project.name || 'moldura'}-guia.pdf`)
}

