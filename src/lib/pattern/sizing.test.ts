import { describe, expect, it } from 'vitest'
import { physicalFromStitches, stitchesFromPhysical } from './sizing'

describe('sizing conversions', () => {
  it('converts stitches to cm at 14 count', () => {
    // 100 stitches / 14 count = 7.142857in = 18.14cm
    expect(physicalFromStitches(100, 14)).toBeCloseTo(18.14, 1)
  })

  it('converts cm to stitches at 14 count', () => {
    expect(stitchesFromPhysical(18.14, 14)).toBe(100)
  })

  it('round-trips within rounding tolerance', () => {
    const stitches = stitchesFromPhysical(20, 18)
    const cm = physicalFromStitches(stitches, 18)
    expect(cm).toBeCloseTo(20, 0)
  })
})
