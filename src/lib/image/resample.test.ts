import { describe, expect, it } from 'vitest'
import { resampleToGrid } from './resample'

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

describe('resampleToGrid', () => {
  it('averages a 4x4 checkerboard down to 2x2 exactly', () => {
    // Each 2x2 quadrant is a solid color, so downsampling to 2x2 should reproduce it exactly.
    const colors: Record<string, [number, number, number]> = {
      '0,0': [255, 0, 0],
      '1,0': [0, 255, 0],
      '0,1': [0, 0, 255],
      '1,1': [255, 255, 0],
    }
    const image = makeImageData(4, 4, (x, y) => colors[`${Math.floor(x / 2)},${Math.floor(y / 2)}`])
    const grid = resampleToGrid(image, 2, 2)
    expect(grid[0]).toEqual([255, 0, 0])
    expect(grid[1]).toEqual([0, 255, 0])
    expect(grid[2]).toEqual([0, 0, 255])
    expect(grid[3]).toEqual([255, 255, 0])
  })

  it('produces a solid-color grid for a uniform image', () => {
    const image = makeImageData(10, 6, () => [100, 150, 200])
    const grid = resampleToGrid(image, 3, 2)
    expect(grid).toHaveLength(6)
    for (const [r, g, b] of grid) {
      expect(r).toBeCloseTo(100, 0)
      expect(g).toBeCloseTo(150, 0)
      expect(b).toBeCloseTo(200, 0)
    }
  })
})
