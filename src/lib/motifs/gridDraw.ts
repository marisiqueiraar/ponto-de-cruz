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
