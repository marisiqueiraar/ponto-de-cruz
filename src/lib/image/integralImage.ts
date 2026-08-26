/** Summed-area table per RGB channel, for O(1) rectangular-area color averaging. */
export interface IntegralImage {
  width: number
  height: number
  /** Cumulative sums, one Float64Array per channel (R, G, B), size (width+1)*(height+1). */
  channels: [Float64Array, Float64Array, Float64Array]
}

export function buildIntegralImage(imageData: ImageData): IntegralImage {
  const { width, height, data } = imageData
  const stride = width + 1
  const channels: [Float64Array, Float64Array, Float64Array] = [
    new Float64Array(stride * (height + 1)),
    new Float64Array(stride * (height + 1)),
    new Float64Array(stride * (height + 1)),
  ]

  for (let y = 0; y < height; y++) {
    let rowSumR = 0
    let rowSumG = 0
    let rowSumB = 0
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4
      rowSumR += data[pixelIndex]
      rowSumG += data[pixelIndex + 1]
      rowSumB += data[pixelIndex + 2]

      const above = y * stride + (x + 1)
      const current = (y + 1) * stride + (x + 1)
      channels[0][current] = channels[0][above] + rowSumR
      channels[1][current] = channels[1][above] + rowSumG
      channels[2][current] = channels[2][above] + rowSumB
    }
  }

  return { width, height, channels }
}

/**
 * Average RGB color over the half-open rectangle [x0,x1) x [y0,y1) using the integral image.
 * Coordinates are clamped to the image bounds.
 */
export function averageArea(
  integral: IntegralImage,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): [number, number, number] {
  const cx0 = Math.max(0, Math.min(integral.width, x0))
  const cx1 = Math.max(0, Math.min(integral.width, x1))
  const cy0 = Math.max(0, Math.min(integral.height, y0))
  const cy1 = Math.max(0, Math.min(integral.height, y1))
  const stride = integral.width + 1
  const area = Math.max(1, (cx1 - cx0) * (cy1 - cy0))

  const result: [number, number, number] = [0, 0, 0]
  for (let c = 0; c < 3; c++) {
    const table = integral.channels[c]
    const sum =
      table[cy1 * stride + cx1] -
      table[cy0 * stride + cx1] -
      table[cy1 * stride + cx0] +
      table[cy0 * stride + cx0]
    result[c] = sum / area
  }
  return result
}
