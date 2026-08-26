import { differenceCiede2000, converter } from 'culori'

export interface LabColor {
  l: number
  a: number
  b: number
}

const toLab = converter('lab')

export function rgbToLab([r, g, b]: readonly [number, number, number]): LabColor {
  const lab = toLab({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 })
  return { l: lab.l, a: lab.a ?? 0, b: lab.b ?? 0 }
}

const ciede2000 = differenceCiede2000()

/** Perceptual color distance between two Lab colors (lower = more similar). Relatively expensive (CIEDE2000). */
export function labDistance(a: LabColor, b: LabColor): number {
  return ciede2000(
    { mode: 'lab', l: a.l, a: a.a, b: a.b },
    { mode: 'lab', l: b.l, a: b.a, b: b.b },
  )
}

/**
 * Squared Euclidean distance in Lab space — much cheaper than CIEDE2000 and good enough as a
 * relative-ordering metric for k-means, which evaluates millions of comparisons per run.
 */
export function labDistanceSquaredEuclidean(a: LabColor, b: LabColor): number {
  const dl = a.l - b.l
  const da = a.a - b.a
  const db = a.b - b.b
  return dl * dl + da * da + db * db
}
