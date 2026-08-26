import { getFontById } from '../../data/fonts'
import type { Pattern } from '../../types/pattern'
import { drawTextIntoCells } from '../fonts/renderText'

/** Flattens the base photo grid and all visible text layers into a single cell array. */
export function compositePattern(pattern: Pattern): Uint16Array {
  const cells = pattern.baseCells ? new Uint16Array(pattern.baseCells) : new Uint16Array(pattern.width * pattern.height)

  for (const layer of pattern.textLayers) {
    if (!layer.visible) continue
    const font = getFontById(layer.fontId)
    if (!font) continue
    const paletteIndex = pattern.palette.findIndex((entry) => entry.dmcCode === layer.dmcCode)
    if (paletteIndex < 0) continue
    drawTextIntoCells(cells, pattern.width, pattern.height, layer, font, paletteIndex)
  }

  return cells
}

/** Recomputes each palette entry's stitch count from a composited cell array (mutates `palette`). */
export function recomputePaletteCounts(pattern: Pattern, compositedCells: Uint16Array): void {
  for (const entry of pattern.palette) entry.count = 0
  for (const paletteIndex of compositedCells) {
    if (pattern.palette[paletteIndex]) pattern.palette[paletteIndex].count++
  }
}
