import { describe, expect, it } from 'vitest'
import { DMC_COLORS } from '../../data/dmcColors'
import { findClosestDmcColor } from './dmcMatch'

describe('dataset integrity', () => {
  it('has no duplicate codes', () => {
    const codes = DMC_COLORS.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('has a reasonable number of colors', () => {
    expect(DMC_COLORS.length).toBeGreaterThan(300)
  })
})

describe('findClosestDmcColor', () => {
  it('matches pure white to a near-white color', () => {
    const match = findClosestDmcColor([255, 255, 255])
    expect(match.rgb.every((c) => c > 230)).toBe(true)
  })

  it('matches pure black to a near-black color', () => {
    const match = findClosestDmcColor([0, 0, 0])
    expect(match.rgb.every((c) => c < 40)).toBe(true)
  })

  it('matches bright red to a color dominated by red', () => {
    const match = findClosestDmcColor([220, 20, 20])
    const [r, g, b] = match.rgb
    expect(r).toBeGreaterThan(g)
    expect(r).toBeGreaterThan(b)
  })

  it('returns an exact color unchanged', () => {
    const sample = DMC_COLORS[100]
    const match = findClosestDmcColor(sample.rgb)
    expect(match.code).toBe(sample.code)
  })
})
