import { physicalFromStitches } from '../pattern/sizing'

/** Recommended margin per side, in cm, by intended finishing method. */
export const FINISH_MARGINS_CM = {
  bastidor: 7,
  moldura: 10,
  costura: 5,
} as const

export type FinishMethod = keyof typeof FINISH_MARGINS_CM

export const FINISH_LABELS: Record<FinishMethod, string> = {
  bastidor: 'Bastidor / argola',
  moldura: 'Moldura (quadro)',
  costura: 'Costura / aplicação',
}

export interface FabricSizeResult {
  /** Stitched area only, no margin. */
  designWidthCm: number
  designHeightCm: number
  /** Margin applied per side. */
  marginCm: number
  /** Total fabric to cut. */
  cutWidthCm: number
  cutHeightCm: number
}

/**
 * Fabric needed for a design: the stitched area plus a margin on every side.
 * Standard practice is 5-10cm per side depending on how the piece will be finished —
 * framing needs the most, since fabric wraps around the mount board.
 */
export function calculateFabricSize(
  widthStitches: number,
  heightStitches: number,
  fabricCount: number,
  finish: FinishMethod,
): FabricSizeResult {
  const designWidthCm = physicalFromStitches(widthStitches, fabricCount)
  const designHeightCm = physicalFromStitches(heightStitches, fabricCount)
  const marginCm = FINISH_MARGINS_CM[finish]

  return {
    designWidthCm,
    designHeightCm,
    marginCm,
    cutWidthCm: designWidthCm + marginCm * 2,
    cutHeightCm: designHeightCm + marginCm * 2,
  }
}
