import { labDistanceSquaredEuclidean, rgbToLab, type LabColor } from './colorSpace'

export interface KMeansResult {
  /** Lab centroid for each cluster, length k (or fewer if there were fewer distinct samples). */
  centroids: LabColor[]
  /** Cluster index for each input sample. */
  assignments: Uint16Array
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickInitialCentroids(samples: LabColor[], k: number, random: () => number): LabColor[] {
  const centroids: LabColor[] = [samples[Math.floor(random() * samples.length)]]
  const distances = new Float64Array(samples.length).fill(Infinity)

  while (centroids.length < k) {
    let totalWeight = 0
    for (let i = 0; i < samples.length; i++) {
      const d = labDistanceSquaredEuclidean(samples[i], centroids[centroids.length - 1])
      if (d < distances[i]) distances[i] = d
      totalWeight += distances[i]
    }
    if (totalWeight === 0) {
      centroids.push(samples[Math.floor(random() * samples.length)])
      continue
    }
    let threshold = random() * totalWeight
    let chosen = samples[samples.length - 1]
    for (let i = 0; i < samples.length; i++) {
      threshold -= distances[i]
      if (threshold <= 0) {
        chosen = samples[i]
        break
      }
    }
    centroids.push(chosen)
  }
  return centroids
}

/**
 * K-means clustering of Lab colors (k-means++ init). Deterministic given `seed`, so results are
 * reproducible for the same input/parameters.
 */
export function kMeansLab(
  samples: LabColor[],
  k: number,
  options: { maxIterations?: number; seed?: number } = {},
): KMeansResult {
  const { maxIterations = 20, seed = 1 } = options
  const effectiveK = Math.max(1, Math.min(k, samples.length))
  const random = mulberry32(seed)

  let centroids = pickInitialCentroids(samples, effectiveK, random)
  const assignments = new Uint16Array(samples.length)

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false
    for (let i = 0; i < samples.length; i++) {
      let bestCluster = 0
      let bestDist = Infinity
      for (let c = 0; c < centroids.length; c++) {
        const dist = labDistanceSquaredEuclidean(samples[i], centroids[c])
        if (dist < bestDist) {
          bestDist = dist
          bestCluster = c
        }
      }
      if (assignments[i] !== bestCluster) changed = true
      assignments[i] = bestCluster
    }

    const sums = centroids.map(() => ({ l: 0, a: 0, b: 0, count: 0 }))
    for (let i = 0; i < samples.length; i++) {
      const bucket = sums[assignments[i]]
      bucket.l += samples[i].l
      bucket.a += samples[i].a
      bucket.b += samples[i].b
      bucket.count++
    }
    centroids = sums.map((bucket, idx) =>
      bucket.count > 0
        ? { l: bucket.l / bucket.count, a: bucket.a / bucket.count, b: bucket.b / bucket.count }
        : centroids[idx],
    )

    if (!changed && iter > 0) break
  }

  return { centroids, assignments }
}

/** Convenience wrapper: cluster raw RGB samples and return Lab centroids + per-sample assignment. */
export function quantizeColors(
  rgbSamples: Array<readonly [number, number, number]>,
  k: number,
  options?: { maxIterations?: number; seed?: number },
): KMeansResult {
  const labSamples = rgbSamples.map((rgb) => rgbToLab(rgb))
  return kMeansLab(labSamples, k, options)
}
