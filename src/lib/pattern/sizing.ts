export const FABRIC_COUNTS = [11, 14, 16, 18, 20, 22, 25, 28] as const
export type FabricCount = (typeof FABRIC_COUNTS)[number]

const CM_PER_INCH = 2.54

/** Number of stitches needed to cover `cm` centimeters on fabric with `fabricCount` stitches/inch. */
export function stitchesFromPhysical(cm: number, fabricCount: number): number {
  return Math.round((cm / CM_PER_INCH) * fabricCount)
}

/** Physical size in centimeters for a given stitch count on fabric with `fabricCount` stitches/inch. */
export function physicalFromStitches(stitches: number, fabricCount: number): number {
  return (stitches / fabricCount) * CM_PER_INCH
}
