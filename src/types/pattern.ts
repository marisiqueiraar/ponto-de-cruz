export interface PaletteEntry {
  dmcCode: string
  name: string
  rgb: [number, number, number]
  symbol: string
  count: number
}

export interface TextLayer {
  id: string
  text: string
  fontId: string
  /** Top-left position of the text, in grid cells. */
  x: number
  y: number
  dmcCode: string
  visible: boolean
}

export interface Pattern {
  id: string
  name: string
  /** Width/height in stitches. */
  width: number
  height: number
  /** Fabric count in stitches per inch (11/14/16/18/20/22/25/28). */
  fabricCount: number
  /** Index into `palette` for each cell, row-major, length width*height. Absent for a text-only pattern. */
  baseCells?: Uint16Array
  palette: PaletteEntry[]
  textLayers: TextLayer[]
  /** Id of the original uploaded image Blob, stored separately for reprocessing. */
  sourceImageId?: string
  createdAt: number
  updatedAt: number
}

export type PatternViewMode = 'color' | 'symbol'
