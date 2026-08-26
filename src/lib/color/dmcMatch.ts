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

let byCode: Map<string, DmcColor> | null = null

/** Looks up a color by its DMC code — the reverse of matching, for rendering a stored code. */
export function findDmcByCode(code: string): DmcColor | undefined {
  if (!byCode) {
    byCode = new Map(DMC_COLORS.map((color) => [color.code, color]))
  }
  return byCode.get(code)
}

/** CSS color for a stored DMC code, falling back to a neutral red when the code is unknown. */
export function dmcCssColor(code: string, fallback = '#b3122b'): string {
  const found = findDmcByCode(code)
  return found ? `rgb(${found.rgb.join(',')})` : fallback
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
