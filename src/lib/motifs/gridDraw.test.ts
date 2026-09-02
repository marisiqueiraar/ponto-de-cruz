import { describe, expect, it } from 'vitest'
import { MOTIFS, type Motif } from '../../data/motifs'
import { fromAscii, transform, type GridShape } from './gridDraw'

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

function occupiedSet(shape: GridShape): Set<string> {
  return new Set(shape.cells.map(([x, y]) => `${x},${y}`))
}

/** Connected regions under 8-connectivity — one stroke should be one region. */
function componentCount(shape: GridShape): number {
  const remaining = occupiedSet(shape)
  let components = 0
  while (remaining.size > 0) {
    components++
    const stack = [remaining.values().next().value as string]
    remaining.delete(stack[0])
    while (stack.length > 0) {
      const [x, y] = stack.pop()!.split(',').map(Number)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${x + dx},${y + dy}`
          if (remaining.delete(key)) stack.push(key)
        }
      }
    }
  }
  return components
}

/** Solid 3x3 patches. A two-cell stroke cannot make one unless two passes have merged. */
function solidBlocks(shape: GridShape): number {
  const filled = occupiedSet(shape)
  let count = 0
  for (let y = 0; y + 2 < shape.height; y++) {
    for (let x = 0; x + 2 < shape.width; x++) {
      let all = true
      for (let dy = 0; dy < 3 && all; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          if (!filled.has(`${x + dx},${y + dy}`)) {
            all = false
            break
          }
        }
      }
      if (all) count++
    }
  }
  return count
}

/** Background cells walled in on six or more sides — a one-cell channel that stitches up as mud. */
function pinchedGaps(shape: GridShape): number {
  const filled = occupiedSet(shape)
  let count = 0
  for (let y = 1; y + 1 < shape.height; y++) {
    for (let x = 1; x + 1 < shape.width; x++) {
      if (filled.has(`${x},${y}`)) continue
      let neighbours = 0
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue
          if (filled.has(`${x + dx},${y + dy}`)) neighbours++
        }
      }
      if (neighbours >= 6) count++
    }
  }
  return count
}

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

  it('leaves no stray single stitches anywhere in the library', () => {
    for (const motif of MOTIFS) {
      const filled = occupiedSet(motif.shape)
      for (const [x, y] of motif.shape.cells) {
        let neighbours = 0
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue
            if (filled.has(`${x + dx},${y + dy}`)) neighbours++
          }
        }
        expect(neighbours, `${motif.id} has an orphan stitch at ${x},${y}`).toBeGreaterThan(0)
      }
    }
  })
})

/**
 * The flourishes are the pieces that have to read as drawn ribbon rather than as a smudge,
 * so they carry rules the filled hearts and the multi-part divider do not.
 */
describe('flourishes', () => {
  const flourishes = MOTIFS.filter((m) => m.category === 'arabesco')

  /** Where a form deliberately closes to a point or a stroke rejoins itself. */
  const SOLID_BUDGET: Record<string, number> = {
    'arabesco-simples': 0,
    'arabesco-duplo': 0,
    // The coil rejoins the arc in one thicker knot.
    ramo: 2,
    // The teardrop's tip.
    'arabesco-coracao': 2,
  }

  it('covers every flourish with a budget', () => {
    expect(flourishes.map((m) => m.id).sort()).toEqual(Object.keys(SOLID_BUDGET).sort())
  })

  it.each(flourishes.map((m) => [m.id, m] as [string, Motif]))('%s is drawn as one continuous stroke', (_id, motif) => {
    expect(componentCount(motif.shape)).toBe(1)
  })

  it.each(flourishes.map((m) => [m.id, m] as [string, Motif]))('%s keeps its turns apart', (id, motif) => {
    expect(solidBlocks(motif.shape), `${id} has merged turns`).toBeLessThanOrEqual(SOLID_BUDGET[id])
    expect(pinchedGaps(motif.shape), `${id} has a one-cell channel`).toBe(0)
  })

  it.each(flourishes.map((m) => [m.id, m] as [string, Motif]))('%s is big enough to read on a card', (id, motif) => {
    expect(Math.max(motif.shape.width, motif.shape.height), `${id} is too small for a 2-cell stroke`).toBeGreaterThanOrEqual(16)
  })
})
