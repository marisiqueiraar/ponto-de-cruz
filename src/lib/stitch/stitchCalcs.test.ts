import { describe, expect, it } from 'vitest'
import { calculateFabricSize, FINISH_MARGINS_CM } from './fabricSize'
import { estimateSkeins, recommendedStrands, stitchesPerSkein } from './flossEstimate'

describe('calculateFabricSize', () => {
  it('adds the finishing margin to both sides of the design', () => {
    const result = calculateFabricSize(140, 140, 14, 'bastidor')
    // 140 stitches / 14 count = 10in = 25.4cm
    expect(result.designWidthCm).toBeCloseTo(25.4, 1)
    expect(result.cutWidthCm).toBeCloseTo(25.4 + FINISH_MARGINS_CM.bastidor * 2, 1)
  })

  it('gives a larger cut size for framing than for hooping', () => {
    const hoop = calculateFabricSize(100, 100, 14, 'bastidor')
    const frame = calculateFabricSize(100, 100, 14, 'moldura')
    expect(frame.cutWidthCm).toBeGreaterThan(hoop.cutWidthCm)
  })
})

describe('recommendedStrands', () => {
  it('recommends more strands on coarser fabric', () => {
    expect(recommendedStrands(11)).toBe(3)
    expect(recommendedStrands(14)).toBe(2)
    expect(recommendedStrands(22)).toBe(1)
  })
})

describe('stitchesPerSkein', () => {
  it('matches the commonly cited range at 14 count with 2 strands', () => {
    const perSkein = stitchesPerSkein(14, 2)
    expect(perSkein).toBeGreaterThan(1400)
    expect(perSkein).toBeLessThan(1900)
  })

  it('covers more stitches on finer fabric', () => {
    expect(stitchesPerSkein(18, 2)).toBeGreaterThan(stitchesPerSkein(14, 2))
  })

  it('covers fewer stitches when using more strands', () => {
    expect(stitchesPerSkein(14, 3)).toBeLessThan(stitchesPerSkein(14, 2))
  })
})

describe('estimateSkeins', () => {
  it('always recommends at least one skein', () => {
    expect(estimateSkeins(5, 14, 2).skeinsToBuy).toBe(1)
  })

  it('rounds up with a safety allowance above the exact requirement', () => {
    const estimate = estimateSkeins(10_000, 14, 2)
    expect(estimate.skeinsToBuy).toBeGreaterThanOrEqual(Math.ceil(estimate.exactSkeins))
  })
})
