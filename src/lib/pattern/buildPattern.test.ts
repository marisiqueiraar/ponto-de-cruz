import { describe, expect, it } from 'vitest'
import { buildPatternFromImage } from './buildPattern'

function makeImageData(width: number, height: number, pixel: (x: number, y: number) => [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y)
      const i = (y * width + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  return new ImageData(data, width, height)
}

describe('buildPatternFromImage', () => {
  it('builds a pattern with the requested grid size and a consistent palette', () => {
    const colors: [number, number, number][] = [
      [220, 20, 20],
      [20, 20, 220],
    ]
    const image = makeImageData(20, 20, (x) => colors[x < 10 ? 0 : 1])

    const pattern = buildPatternFromImage(image, { width: 10, height: 10, colorCount: 2, fabricCount: 14, seed: 1 })

    expect(pattern.width).toBe(10)
    expect(pattern.height).toBe(10)
    expect(pattern.baseCells).toBeDefined()
    expect(pattern.baseCells!.length).toBe(100)
    expect(pattern.palette.length).toBeGreaterThan(0)
    expect(pattern.palette.length).toBeLessThanOrEqual(2)

    const totalCount = pattern.palette.reduce((sum, entry) => sum + entry.count, 0)
    expect(totalCount).toBe(100)

    for (const entry of pattern.palette) {
      expect(entry.symbol).not.toBe('')
    }
  })

  it('assigns every cell a valid palette index', () => {
    const image = makeImageData(8, 8, (x, y) => [(x * 30) % 255, (y * 30) % 255, 128])
    const pattern = buildPatternFromImage(image, { width: 8, height: 8, colorCount: 5, fabricCount: 14, seed: 2 })

    for (const index of pattern.baseCells!) {
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(pattern.palette.length)
    }
  })
})
