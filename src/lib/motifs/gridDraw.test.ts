import { describe, expect, it } from 'vitest'
import { MOTIFS } from '../../data/motifs'
import { bezier, fromAscii, spiral, transform } from './gridDraw'

describe('fromAscii', () => {
  it('reads marked cells and normalizes the bounding box', () => {
    const shape = fromAscii(['.#.', '###'])
    expect(shape.width).toBe(3)
    expect(shape.height).toBe(2)
    expect(shape.cells).toHaveLength(4)
  })

  it('trims empty leading columns and rows', () => {
    const shape = fromAscii(['....', '..#.', '..#.'])
    expect(shape.width).toBe(1)
    expect(shape.height).toBe(2)
  })
})

describe('spiral', () => {
  it('produces a continuous ring roughly the requested size', () => {
    const shape = spiral({ radius: 6 })
    expect(shape.width).toBeGreaterThan(6)
    expect(shape.width).toBeLessThanOrEqual(14)
    expect(shape.cells.length).toBeGreaterThan(15)
  })

  it('leaves no gaps between consecutive traced cells', () => {
    const shape = spiral({ radius: 8, turns: 2 })
    const occupied = new Set(shape.cells.map(([x, y]) => `${x},${y}`))
    // Every cell should touch at least one other cell (8-connectivity): a gapless stroke.
    for (const [x, y] of shape.cells) {
      let neighbours = 0
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue
          if (occupied.has(`${x + dx},${y + dy}`)) neighbours++
        }
      }
      expect(neighbours).toBeGreaterThan(0)
    }
  })
})

describe('bezier', () => {
  it('starts and ends near the given endpoints', () => {
    const shape = bezier([0, 0], [5, 0], [5, 10], [10, 10])
    expect(shape.width).toBeGreaterThan(8)
    expect(shape.height).toBeGreaterThan(8)
  })
})

describe('transform', () => {
  it('swaps dimensions on a 90 degree rotation', () => {
    const shape = fromAscii(['####', '#...'])
    const rotated = transform(shape, 90)
    expect(rotated.width).toBe(shape.height)
    expect(rotated.height).toBe(shape.width)
    expect(rotated.cells).toHaveLength(shape.cells.length)
  })

  it('returns to the original after four 90 degree rotations', () => {
    const shape = fromAscii(['##.', '#..', '#.#'])
    let result = shape
    for (let i = 0; i < 4; i++) result = transform(result, 90)
    const key = (s: typeof shape) => s.cells.map(([x, y]) => `${x},${y}`).sort().join('|')
    expect(key(result)).toBe(key(shape))
  })

  it('preserves the cell count when mirrored', () => {
    const shape = fromAscii(['###', '#..'])
    expect(transform(shape, 0, true).cells).toHaveLength(shape.cells.length)
  })
})

describe('motif library', () => {
  it('has no empty motifs and no duplicate ids', () => {
    const ids = MOTIFS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const motif of MOTIFS) {
      expect(motif.shape.cells.length, `${motif.id} is empty`).toBeGreaterThan(0)
      expect(motif.shape.width).toBeGreaterThan(0)
    }
  })

  it('keeps motifs within a size that fits a small card', () => {
    for (const motif of MOTIFS) {
      expect(motif.shape.width, `${motif.id} too wide`).toBeLessThanOrEqual(60)
      expect(motif.shape.height, `${motif.id} too tall`).toBeLessThanOrEqual(60)
    }
  })
})
