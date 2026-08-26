/** A motif as a set of occupied grid cells, normalized so the top-left occupied cell is (0,0). */
export interface GridShape {
  width: number
  height: number
  cells: Array<[number, number]>
}

export type Point = [number, number]

class CellSet {
  private readonly keys = new Set<string>()
  private readonly list: Point[] = []

  add(x: number, y: number): void {
    const rx = Math.round(x)
    const ry = Math.round(y)
    const key = `${rx},${ry}`
    if (this.keys.has(key)) return
    this.keys.add(key)
    this.list.push([rx, ry])
  }

  /** Normalizes to a top-left origin and reports the bounding box. */
  toShape(): GridShape {
    if (this.list.length === 0) return { width: 0, height: 0, cells: [] }
    const minX = Math.min(...this.list.map((p) => p[0]))
    const minY = Math.min(...this.list.map((p) => p[1]))
    const maxX = Math.max(...this.list.map((p) => p[0]))
    const maxY = Math.max(...this.list.map((p) => p[1]))
    return {
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      cells: this.list.map(([x, y]) => [x - minX, y - minY] as Point),
    }
  }
}

/** Samples a parametric curve densely enough that consecutive samples land on adjacent cells. */
function traceCurve(set: CellSet, at: (t: number) => Point, samples: number): void {
  for (let i = 0; i <= samples; i++) {
    const [x, y] = at(i / samples)
    set.add(x, y)
  }
}

export interface SpiralOptions {
  /** Outer radius in cells. */
  radius: number
  /** How many times the curve winds inward. */
  turns?: number
  /** Radians the spiral starts at. */
  startAngle?: number
  /** true winds clockwise. */
  clockwise?: boolean
}

/** Archimedean spiral — the base shape of the scroll flourishes in the reference pieces. */
export function spiral({ radius, turns = 1.6, startAngle = 0, clockwise = false }: SpiralOptions): GridShape {
  const set = new CellSet()
  const totalAngle = turns * Math.PI * 2
  const direction = clockwise ? -1 : 1
  traceCurve(
    set,
    (t) => {
      const angle = startAngle + direction * totalAngle * t
      // Radius shrinks toward the centre as t advances, leaving a small eye rather than a point.
      const r = radius * (1 - 0.88 * t)
      return [Math.cos(angle) * r, Math.sin(angle) * r]
    },
    Math.ceil(radius * turns * 14),
  )
  return set.toShape()
}

/** Cubic Bézier stroke, used to join spirals into a flowing vine. */
export function bezier(p0: Point, p1: Point, p2: Point, p3: Point): GridShape {
  const set = new CellSet()
  const approxLength = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) + Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
  traceCurve(
    set,
    (t) => {
      const u = 1 - t
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
      return [x, y]
    },
    Math.ceil(approxLength * 4),
  )
  return set.toShape()
}

/** Places several shapes at offsets and merges them into one motif. */
export function combine(parts: Array<{ shape: GridShape; dx: number; dy: number }>): GridShape {
  const set = new CellSet()
  for (const { shape, dx, dy } of parts) {
    for (const [x, y] of shape.cells) set.add(x + dx, y + dy)
  }
  return set.toShape()
}

/** Builds a shape from an ASCII drawing, where '#' marks a stitch. */
export function fromAscii(rows: string[]): GridShape {
  const set = new CellSet()
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') set.add(x, y)
    }
  })
  return set.toShape()
}

export type Rotation = 0 | 90 | 180 | 270

/** Rotates a shape in 90° steps and optionally mirrors it, renormalizing the origin. */
export function transform(shape: GridShape, rotation: Rotation, mirrored = false): GridShape {
  const set = new CellSet()
  for (const [x, y] of shape.cells) {
    const sx = mirrored ? shape.width - 1 - x : x
    switch (rotation) {
      case 0:
        set.add(sx, y)
        break
      case 90:
        set.add(shape.height - 1 - y, sx)
        break
      case 180:
        set.add(shape.width - 1 - sx, shape.height - 1 - y)
        break
      case 270:
        set.add(y, shape.width - 1 - sx)
        break
    }
  }
  return set.toShape()
}
