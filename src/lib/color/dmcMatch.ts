import { DMC_COLORS } from '../../data/dmcColors'
import type { DmcColor } from '../../types/dmc'
import { labDistance, rgbToLab, type LabColor } from './colorSpace'

interface IndexedDmcColor extends DmcColor {
  lab: LabColor
}

let indexCache: IndexedDmcColor[] | null = null

function getIndex(): IndexedDmcColor[] {
  if (!indexCache) {
    indexCache = DMC_COLORS.map((c) => ({ ...c, lab: rgbToLab(c.rgb) }))
  }
  return indexCache
}

/** Finds the closest DMC-style color to a given RGB triple using CIEDE2000 perceptual distance. */
export function findClosestDmcColor(rgb: readonly [number, number, number]): DmcColor {
  const lab = rgbToLab(rgb)
  const index = getIndex()
  let best = index[0]
  let bestDist = Infinity
  for (const candidate of index) {
    const dist = labDistance(lab, candidate.lab)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }
  return { code: best.code, name: best.name, rgb: best.rgb }
}
