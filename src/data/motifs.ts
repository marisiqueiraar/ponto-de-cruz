import { bezier, combine, fromAscii, spiral, type GridShape } from '../lib/motifs/gridDraw'

export type MotifCategory = 'arabesco' | 'estrela' | 'coracao' | 'moldura'

export interface Motif {
  id: string
  name: string
  category: MotifCategory
  shape: GridShape
}

/** Scroll flourish: a large spiral flowing into a smaller one, like the corner vines in the references. */
function doubleScroll(): GridShape {
  const big = spiral({ radius: 7, turns: 1.5, startAngle: Math.PI * 0.5 })
  const small = spiral({ radius: 4, turns: 1.4, startAngle: -Math.PI * 0.5, clockwise: true })
  const stem = bezier([0, 0], [5, -3], [9, -6], [13, -6])
  return combine([
    { shape: big, dx: 0, dy: 6 },
    { shape: stem, dx: 11, dy: 8 },
    { shape: small, dx: 22, dy: 0 },
  ])
}

/** A single scroll with a leaf-like tail — the simplest flourish, good for tight corners. */
function singleScroll(): GridShape {
  const curl = spiral({ radius: 6, turns: 1.5, startAngle: Math.PI * 0.6 })
  const tail = bezier([0, 0], [4, -2], [8, -5], [11, -9])
  return combine([
    { shape: curl, dx: 0, dy: 8 },
    { shape: tail, dx: 10, dy: 3 },
  ])
}

/** Long flowing vine for framing a whole side of the photo. */
function vine(): GridShape {
  const curlA = spiral({ radius: 5, turns: 1.4, startAngle: Math.PI * 0.5 })
  const curlB = spiral({ radius: 4, turns: 1.3, startAngle: -Math.PI * 0.4, clockwise: true })
  const wave = bezier([0, 8], [9, 0], [18, 16], [27, 8])
  return combine([
    { shape: curlA, dx: 0, dy: 3 },
    { shape: wave, dx: 8, dy: 0 },
    { shape: curlB, dx: 34, dy: 5 },
  ])
}

/** Two mirrored curls meeting at the top, used above or below the photo. */
function heartScroll(): GridShape {
  const left = spiral({ radius: 5, turns: 1.3, startAngle: Math.PI * 0.2 })
  const right = spiral({ radius: 5, turns: 1.3, startAngle: Math.PI * 0.8, clockwise: true })
  const arc = bezier([0, 6], [6, -3], [12, -3], [18, 6])
  return combine([
    { shape: left, dx: 0, dy: 6 },
    { shape: arc, dx: 5, dy: 0 },
    { shape: right, dx: 16, dy: 6 },
  ])
}

const STAR_SMALL = fromAscii([
  '..#..',
  '#.#.#',
  '.###.',
  '#.#.#',
  '..#..',
])

const STAR_MEDIUM = fromAscii([
  '...#...',
  '#..#..#',
  '.#.#.#.',
  '###.###',
  '.#.#.#.',
  '#..#..#',
  '...#...',
])

const SPARKLE = fromAscii([
  '.#.',
  '###',
  '.#.',
])

const HEART_SMALL = fromAscii([
  '.##.##.',
  '#######',
  '#######',
  '.#####.',
  '..###..',
  '...#...',
])

const HEART_OUTLINE = fromAscii([
  '.##.##.',
  '#..#..#',
  '#.....#',
  '.#...#.',
  '..#.#..',
  '...#...',
])

const CORNER_BRACKET = fromAscii([
  '#########',
  '#........',
  '#........',
  '#..###...',
  '#..#.....',
  '#..#.....',
  '#........',
  '#........',
  '#........',
])

const DIVIDER = fromAscii([
  '..#..#..#..',
  '.###.#.###.',
  '..#..#..#..',
])

export const MOTIFS: Motif[] = [
  { id: 'arabesco-duplo', name: 'Arabesco duplo', category: 'arabesco', shape: doubleScroll() },
  { id: 'arabesco-simples', name: 'Arabesco simples', category: 'arabesco', shape: singleScroll() },
  { id: 'ramo', name: 'Ramo comprido', category: 'arabesco', shape: vine() },
  { id: 'arabesco-coracao', name: 'Volutas em coração', category: 'arabesco', shape: heartScroll() },
  { id: 'estrela-p', name: 'Estrela pequena', category: 'estrela', shape: STAR_SMALL },
  { id: 'estrela-m', name: 'Estrela média', category: 'estrela', shape: STAR_MEDIUM },
  { id: 'brilho', name: 'Brilho', category: 'estrela', shape: SPARKLE },
  { id: 'coracao-cheio', name: 'Coração cheio', category: 'coracao', shape: HEART_SMALL },
  { id: 'coracao-vazado', name: 'Coração vazado', category: 'coracao', shape: HEART_OUTLINE },
  { id: 'canto', name: 'Canto reto', category: 'moldura', shape: CORNER_BRACKET },
  { id: 'divisoria', name: 'Divisória', category: 'moldura', shape: DIVIDER },
]

export const MOTIF_CATEGORY_LABELS: Record<MotifCategory, string> = {
  arabesco: 'Arabescos',
  estrela: 'Estrelas',
  coracao: 'Corações',
  moldura: 'Molduras',
}

export function getMotif(id: string): Motif | undefined {
  return MOTIFS.find((motif) => motif.id === id)
}
