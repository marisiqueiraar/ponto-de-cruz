import { describe, expect, it } from 'vitest'
import { FONT_5X7_BASIC } from '../../data/fonts/font5x7Basic'
import type { Pattern } from '../../types/pattern'
import { compositePattern, recomputePaletteCounts } from './compositeLayers'

function emptyPattern(width: number, height: number): Pattern {
  return {
    id: 't',
    name: 'test',
    width,
    height,
    fabricCount: 14,
    baseCells: new Uint16Array(width * height),
    palette: [{ dmcCode: 'BLANC', name: 'White', rgb: [255, 255, 255], symbol: 'dot', count: width * height }],
    textLayers: [],
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('compositePattern', () => {
  it('leaves cells untouched when there are no text layers', () => {
    const pattern = emptyPattern(10, 10)
    const cells = compositePattern(pattern)
    expect(Array.from(cells)).toEqual(Array.from(pattern.baseCells!))
  })

  it('draws a text layer on top of the base grid using the matching palette index', () => {
    const pattern = emptyPattern(20, 10)
    pattern.palette.push({ dmcCode: '310', name: 'Black', rgb: [0, 0, 0], symbol: 'square_fill', count: 0 })
    pattern.textLayers.push({ id: 'l1', text: 'I', fontId: FONT_5X7_BASIC.id, x: 2, y: 1, dmcCode: '310', visible: true })

    const cells = compositePattern(pattern)
    // The 'I' glyph's top row is fully lit (#####), so all 5 columns at y=1 should be palette index 1.
    for (let col = 0; col < 5; col++) {
      expect(cells[1 * 20 + (2 + col)]).toBe(1)
    }
  })

  it('skips invisible layers', () => {
    const pattern = emptyPattern(20, 10)
    pattern.palette.push({ dmcCode: '310', name: 'Black', rgb: [0, 0, 0], symbol: 'square_fill', count: 0 })
    pattern.textLayers.push({ id: 'l1', text: 'I', fontId: FONT_5X7_BASIC.id, x: 2, y: 1, dmcCode: '310', visible: false })

    const cells = compositePattern(pattern)
    expect(cells[1 * 20 + 2]).toBe(0)
  })
})

describe('recomputePaletteCounts', () => {
  it('recomputes counts to match the composited cells', () => {
    const pattern = emptyPattern(4, 4)
    pattern.palette.push({ dmcCode: '310', name: 'Black', rgb: [0, 0, 0], symbol: 'square_fill', count: 0 })
    pattern.textLayers.push({ id: 'l1', text: '.', fontId: FONT_5X7_BASIC.id, x: 0, y: 0, dmcCode: '310', visible: true })

    const cells = compositePattern(pattern)
    recomputePaletteCounts(pattern, cells)
    const total = pattern.palette.reduce((sum, e) => sum + e.count, 0)
    expect(total).toBe(16)
  })
})
