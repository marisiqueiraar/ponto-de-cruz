import { findClosestDmcColor } from '../color/dmcMatch'
import { quantizeColors } from '../color/kmeans'
import { resampleToGrid } from '../image/resample'
import type { PaletteEntry, Pattern } from '../../types/pattern'
import { assignSymbols } from './symbols'

export interface BuildPatternOptions {
  width: number
  height: number
  colorCount: number
  fabricCount: number
  name?: string
  seed?: number
}

/** Builds a Pattern from source image data by resampling, quantizing color, and matching to DMC. */
export function buildPatternFromImage(imageData: ImageData, options: BuildPatternOptions): Pattern {
  const { width, height, colorCount, fabricCount, name = 'Sem título', seed } = options

  const samples = resampleToGrid(imageData, width, height)
  const { centroids, assignments } = quantizeColors(samples, colorCount, { seed })

  // Average the original RGB of each cluster's members (nicer than converting the Lab centroid
  // back to RGB, which can drift slightly outside gamut).
  const rgbSums = centroids.map(() => [0, 0, 0, 0])
  for (let i = 0; i < samples.length; i++) {
    const bucket = rgbSums[assignments[i]]
    bucket[0] += samples[i][0]
    bucket[1] += samples[i][1]
    bucket[2] += samples[i][2]
    bucket[3] += 1
  }
  const clusterRgb: Array<[number, number, number]> = rgbSums.map(([r, g, b, count]) =>
    count > 0 ? [Math.round(r / count), Math.round(g / count), Math.round(b / count)] : [0, 0, 0],
  )

  // Map clusters to DMC colors, merging clusters that land on the same DMC code.
  const dmcByCluster = clusterRgb.map((rgb) => findClosestDmcColor(rgb))
  const paletteIndexByDmcCode = new Map<string, number>()
  const palette: PaletteEntry[] = []
  const clusterToPaletteIndex = new Uint16Array(centroids.length)

  for (let c = 0; c < dmcByCluster.length; c++) {
    const dmc = dmcByCluster[c]
    let paletteIndex = paletteIndexByDmcCode.get(dmc.code)
    if (paletteIndex === undefined) {
      paletteIndex = palette.length
      paletteIndexByDmcCode.set(dmc.code, paletteIndex)
      palette.push({ dmcCode: dmc.code, name: dmc.name, rgb: dmc.rgb, symbol: '', count: 0 })
    }
    clusterToPaletteIndex[c] = paletteIndex
  }

  const baseCells = new Uint16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const paletteIndex = clusterToPaletteIndex[assignments[i]]
    baseCells[i] = paletteIndex
    palette[paletteIndex].count++
  }

  const symbols = assignSymbols(palette.length)
  palette.forEach((entry, i) => {
    entry.symbol = symbols[i]
  })

  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name,
    width,
    height,
    fabricCount,
    baseCells,
    palette,
    textLayers: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Distance-ordered palette lookup, used when composing text layer colors into the shared palette. */
export function findOrAddPaletteEntry(palette: PaletteEntry[], dmcCode: string, name: string, rgb: [number, number, number]): number {
  const existing = palette.findIndex((p) => p.dmcCode === dmcCode)
  if (existing >= 0) return existing
  palette.push({ dmcCode, name, rgb, symbol: '', count: 0 })
  return palette.length - 1
}
