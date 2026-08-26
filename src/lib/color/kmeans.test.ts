import { describe, expect, it } from 'vitest'
import { quantizeColors } from './kmeans'

describe('quantizeColors', () => {
  it('separates two well-separated color groups into two clusters', () => {
    const reds: Array<[number, number, number]> = Array.from({ length: 20 }, () => [200, 10, 10])
    const blues: Array<[number, number, number]> = Array.from({ length: 20 }, () => [10, 10, 200])
    const samples = [...reds, ...blues]

    const { assignments } = quantizeColors(samples, 2)
    const redCluster = assignments[0]
    const blueCluster = assignments[assignments.length - 1]
    expect(redCluster).not.toBe(blueCluster)
    for (let i = 0; i < 20; i++) expect(assignments[i]).toBe(redCluster)
    for (let i = 20; i < 40; i++) expect(assignments[i]).toBe(blueCluster)
  })

  it('caps the number of clusters at the sample count', () => {
    const samples: Array<[number, number, number]> = [
      [0, 0, 0],
      [255, 255, 255],
    ]
    const { centroids } = quantizeColors(samples, 10)
    expect(centroids.length).toBeLessThanOrEqual(2)
  })

  it('is deterministic for a given seed', () => {
    const samples: Array<[number, number, number]> = Array.from({ length: 30 }, (_, i) => [
      (i * 7) % 255,
      (i * 13) % 255,
      (i * 19) % 255,
    ])
    const a = quantizeColors(samples, 4, { seed: 42 })
    const b = quantizeColors(samples, 4, { seed: 42 })
    expect(Array.from(a.assignments)).toEqual(Array.from(b.assignments))
  })
})
