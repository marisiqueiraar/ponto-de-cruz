import type { CrossStitchFont } from '../../types/font'
import type { TextLayer } from '../../types/pattern'

const GLYPH_SPACING = 1

export function measureText(font: CrossStitchFont, text: string): { width: number; height: number } {
  if (text.length === 0) return { width: 0, height: font.cellHeight }
  return { width: text.length * (font.cellWidth + GLYPH_SPACING) - GLYPH_SPACING, height: font.cellHeight }
}

/** Draws a text layer's glyphs into a cell grid in place, writing `paletteIndex` at each lit pixel. */
export function drawTextIntoCells(
  cells: Uint16Array,
  gridWidth: number,
  gridHeight: number,
  layer: Pick<TextLayer, 'text' | 'x' | 'y'>,
  font: CrossStitchFont,
  paletteIndex: number,
): void {
  let cursorX = layer.x
  for (const char of layer.text) {
    const glyph = font.glyphs[char.toUpperCase()] ?? font.glyphs[' ']
    if (glyph) {
      for (let row = 0; row < font.cellHeight; row++) {
        const line = glyph[row]
        for (let col = 0; col < font.cellWidth; col++) {
          if (line[col] !== '#') continue
          const gx = cursorX + col
          const gy = layer.y + row
          if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
            cells[gy * gridWidth + gx] = paletteIndex
          }
        }
      }
    }
    cursorX += font.cellWidth + GLYPH_SPACING
  }
}
