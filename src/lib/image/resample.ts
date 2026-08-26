import { averageArea, buildIntegralImage } from './integralImage'

/**
 * Downsamples image data to a `cols` x `rows` grid using area averaging (via a summed-area
 * table), which is much more faithful to the source than nearest-neighbor or a blurred resize.
 * Returns a flat array of RGB triples, row-major, length cols*rows.
 */
export function resampleToGrid(
  imageData: ImageData,
  cols: number,
  rows: number,
): Array<[number, number, number]> {
  const integral = buildIntegralImage(imageData)
  const cellWidth = imageData.width / cols
  const cellHeight = imageData.height / rows

  const result: Array<[number, number, number]> = new Array(cols * rows)
  for (let row = 0; row < rows; row++) {
    const y0 = Math.round(row * cellHeight)
    const y1 = Math.round((row + 1) * cellHeight)
    for (let col = 0; col < cols; col++) {
      const x0 = Math.round(col * cellWidth)
      const x1 = Math.round((col + 1) * cellWidth)
      result[row * cols + col] = averageArea(integral, x0, y0, x1, y1)
    }
  }
  return result
}
