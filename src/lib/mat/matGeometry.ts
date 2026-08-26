import { getMotif } from '../../data/motifs'
import { getFontById } from '../../data/fonts'
import { stitchesFromPhysical } from '../pattern/sizing'
import { transform, type GridShape } from '../motifs/gridDraw'
import type { MatItem, MatProject } from '../../types/mat'

export interface MatGrid {
  cols: number
  rows: number
}

export function matGrid(project: MatProject): MatGrid {
  return {
    cols: stitchesFromPhysical(project.widthCm, project.count),
    rows: stitchesFromPhysical(project.heightCm, project.count),
  }
}

/** Photo opening expressed in grid cells, so it can be drawn on the same grid as the stitches. */
export function photoRectInCells(project: MatProject) {
  return {
    x: stitchesFromPhysical(project.photo.xCm, project.count),
    y: stitchesFromPhysical(project.photo.yCm, project.count),
    width: stitchesFromPhysical(project.photo.widthCm, project.count),
    height: stitchesFromPhysical(project.photo.heightCm, project.count),
  }
}

const GLYPH_SPACING = 1

/** Renders a text item's glyphs into a single shape, laid out left to right. */
function textShape(text: string, fontId: string): GridShape | null {
  const font = getFontById(fontId)
  if (!font) return null

  const cells: Array<[number, number]> = []
  let cursorX = 0
  for (const char of text) {
    const glyph = font.glyphs[char.toUpperCase()] ?? font.glyphs[' ']
    if (glyph) {
      for (let row = 0; row < font.cellHeight; row++) {
        const line = glyph[row]
        for (let col = 0; col < font.cellWidth; col++) {
          if (line?.[col] === '#') cells.push([cursorX + col, row])
        }
      }
    }
    cursorX += font.cellWidth + GLYPH_SPACING
  }

  if (cells.length === 0) return { width: 0, height: 0, cells: [] }
  const minX = Math.min(...cells.map((c) => c[0]))
  const minY = Math.min(...cells.map((c) => c[1]))
  const maxX = Math.max(...cells.map((c) => c[0]))
  const maxY = Math.max(...cells.map((c) => c[1]))
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    cells: cells.map(([x, y]) => [x - minX, y - minY] as [number, number]),
  }
}

/** The final placed shape of one item, after its rotation and mirroring are applied. */
export function resolveItemShape(item: MatItem): GridShape | null {
  const base =
    item.kind === 'motif'
      ? (getMotif(item.motifId ?? '')?.shape ?? null)
      : textShape(item.text ?? '', item.fontId ?? '')
  if (!base || base.cells.length === 0) return base
  return transform(base, item.rotation, item.mirrored)
}

export interface PlacedCell {
  x: number
  y: number
  dmcCode: string
}

/** Every stitch in the project, in grid coordinates — the single source for drawing and export. */
export function collectStitches(project: MatProject): PlacedCell[] {
  const grid = matGrid(project)
  const seen = new Set<string>()
  const placed: PlacedCell[] = []

  for (const item of project.items) {
    const shape = resolveItemShape(item)
    if (!shape) continue
    for (const [dx, dy] of shape.cells) {
      const x = item.x + dx
      const y = item.y + dy
      if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) continue
      const key = `${x},${y}`
      if (seen.has(key)) continue
      seen.add(key)
      placed.push({ x, y, dmcCode: item.dmcCode })
    }
  }
  return placed
}

/** Stitch totals per thread colour, for the shopping list. */
export function stitchCountsByColor(project: MatProject): Map<string, number> {
  const counts = new Map<string, number>()
  for (const cell of collectStitches(project)) {
    counts.set(cell.dmcCode, (counts.get(cell.dmcCode) ?? 0) + 1)
  }
  return counts
}

/** True when any part of an item falls outside the card. */
export function itemOverflows(project: MatProject, item: MatItem): boolean {
  const shape = resolveItemShape(item)
  if (!shape) return false
  const grid = matGrid(project)
  return item.x < 0 || item.y < 0 || item.x + shape.width > grid.cols || item.y + shape.height > grid.rows
}
