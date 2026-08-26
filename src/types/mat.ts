import type { Rotation } from '../lib/motifs/gridDraw'

export type MatItemKind = 'motif' | 'text'

export interface MatItem {
  id: string
  kind: MatItemKind
  /** Motif id, for kind 'motif'. */
  motifId?: string
  /** Text content and font, for kind 'text'. */
  text?: string
  fontId?: string
  /** Top-left position in grid cells. */
  x: number
  y: number
  rotation: Rotation
  mirrored: boolean
  dmcCode: string
}

export interface MatProject {
  id: string
  name: string
  substrateId: string
  /** Stitches (holes) per inch. */
  count: number
  /** Card dimensions in cm. */
  widthCm: number
  heightCm: number
  /** Photo opening, in cm, measured from the card's top-left corner. */
  photo: { xCm: number; yCm: number; widthCm: number; heightCm: number }
  items: MatItem[]
  createdAt: number
  updatedAt: number
}
