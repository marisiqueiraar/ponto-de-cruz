import type { CrossStitchFont } from '../../types/font'
import { FONT_5X7_BASIC } from './font5x7Basic'

const SRC_WIDTH = 5
const SRC_HEIGHT = 7
const DILATE_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
]

function dilateGlyph(glyph: string[]): string[] {
  const dstWidth = SRC_WIDTH + 2
  const dstHeight = SRC_HEIGHT + 2
  const grid: boolean[][] = Array.from({ length: dstHeight }, () => Array(dstWidth).fill(false))

  for (let row = 0; row < SRC_HEIGHT; row++) {
    for (let col = 0; col < SRC_WIDTH; col++) {
      if (glyph[row][col] !== '#') continue
      for (const [dr, dc] of DILATE_OFFSETS) {
        grid[row + 1 + dr][col + 1 + dc] = true
      }
    }
  }

  return grid.map((row) => row.map((filled) => (filled ? '#' : '.')).join(''))
}

// Algorithmically thickened variant of FONT_5X7_BASIC: each stitch is grown into a 2x2 block,
// giving a bolder alphabet without hand-authoring a second full glyph set.
export const FONT_7X9_BOLD: CrossStitchFont = {
  id: '7x9-bold',
  name: 'Bloco 7x9 Negrito',
  cellWidth: 7,
  cellHeight: 9,
  glyphs: Object.fromEntries(Object.entries(FONT_5X7_BASIC.glyphs).map(([char, glyph]) => [char, dilateGlyph(glyph)])),
}
