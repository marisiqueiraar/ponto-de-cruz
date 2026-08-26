/** A standard DMC skein holds 8m of 6-strand floss. */
const SKEIN_LENGTH_CM = 800
const STRANDS_PER_SKEIN = 6

/**
 * Working floss length consumed by one full cross stitch on 14-count, in cm.
 * Anchored to the widely cited ~0.6in per stitch, which yields the commonly quoted
 * 1500-1800 stitches per skein at 14ct with 2 strands.
 */
const CM_PER_STITCH_AT_14 = 1.52
const REFERENCE_COUNT = 14

/** Recommended strand count for full cross stitches, by fabric count. */
export function recommendedStrands(fabricCount: number): number {
  if (fabricCount <= 11) return 3
  if (fabricCount <= 16) return 2
  if (fabricCount <= 18) return 2
  return 1
}

/** Floss length (cm) used by one full cross stitch — the path scales with stitch size. */
export function cmPerStitch(fabricCount: number): number {
  return CM_PER_STITCH_AT_14 * (REFERENCE_COUNT / fabricCount)
}

/** How many full cross stitches a single skein covers at a given count and strand count. */
export function stitchesPerSkein(fabricCount: number, strands: number): number {
  const usableLengthCm = (SKEIN_LENGTH_CM * STRANDS_PER_SKEIN) / strands
  return Math.floor(usableLengthCm / cmPerStitch(fabricCount))
}

export interface SkeinEstimate {
  stitchCount: number
  stitchesPerSkein: number
  /** Exact fractional skeins, before rounding. */
  exactSkeins: number
  /** Skeins to buy, rounded up with a safety allowance. */
  skeinsToBuy: number
}

/** Safety allowance on top of the raw estimate, covering waste, mistakes and dye-lot risk. */
const SAFETY_FACTOR = 1.15

export function estimateSkeins(stitchCount: number, fabricCount: number, strands: number): SkeinEstimate {
  const perSkein = stitchesPerSkein(fabricCount, strands)
  const exactSkeins = stitchCount / perSkein
  return {
    stitchCount,
    stitchesPerSkein: perSkein,
    exactSkeins,
    skeinsToBuy: Math.max(1, Math.ceil(exactSkeins * SAFETY_FACTOR)),
  }
}
