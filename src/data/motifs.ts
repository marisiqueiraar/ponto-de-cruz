import { fromAscii, type GridShape } from '../lib/motifs/gridDraw'

export type MotifCategory = 'arabesco' | 'estrela' | 'coracao' | 'moldura'

export interface Motif {
  id: string
  name: string
  category: MotifCategory
  shape: GridShape
}

/**
 * The flourishes are charted art, not generated curves. Each one was drawn by placing the
 * centreline by eye against the reference pieces, then laying a two-cell stroke along it.
 *
 * Two rules keep a scroll readable once it is stitched, and both are enforced in the tests:
 * turns of a coil stay six cells apart from centre to centre, so four cells of card show
 * between them, and the stroke never thickens into a solid 3x3 patch except where a form
 * deliberately comes to a point.
 */

const VOLUTA_SIMPLES = fromAscii([
  '................########...',
  '............###############',
  '........##########....####.',
  '......########.............',
  '.....#####.................',
  '....####...................',
  '...###.....................',
  '..###......................',
  '.####......................',
  '.###.......................',
  '###.....###................',
  '###.....######.............',
  '##.......######............',
  '##..........###............',
  '###..........##............',
  '####........###............',
  '.####......####............',
  '..####.....###.............',
  '...#####.####..............',
  '.....#######...............',
  '......#####................',
])

const VOLUTA_DUPLA = fromAscii([
  '........################.................',
  '......####################...............',
  '....######............######....######...',
  '....####................###############..',
  '...###....................########..####.',
  '..###.................................###',
  '.####.................................###',
  '.###...................................##',
  '###.....###...........................###',
  '###.....######........................###',
  '##.......######...............###....###.',
  '##..........###.................########.',
  '###..........##..................######..',
  '####........###..........................',
  '.####......####..........................',
  '..####.....###...........................',
  '...#####.####............................',
  '.....#######.............................',
  '......#####..............................',
])

const RAMO = fromAscii([
  '.......######..............................',
  '....##############.........................',
  '...######..##########......................',
  '..####..........########...................',
  '.####...............########...............',
  '.###..................#########............',
  '###...###.................########.........',
  '###...#####..................##########....',
  '##.....#####....................###########',
  '###......###.........................####..',
  '###.......##...............................',
  '.###.....###...............................',
  '.####...####...............................',
  '..#########................................',
  '...#######.................................',
  '.....####..................................',
])

const LACO = fromAscii([
  '......######......',
  '....##########....',
  '...#####..#####...',
  '..####......####..',
  '.###..........###.',
  '####..........####',
  '###............###',
  '##..............##',
  '##..............##',
  '##..............##',
  '##..............##',
  '###............###',
  '.###..........###.',
  '.###..........###.',
  '..###........###..',
  '..####......####..',
  '...###......###...',
  '....###....###....',
  '....###....###....',
  '.....###..###.....',
  '......######......',
  '......######......',
  '.......####.......',
])

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

/**
 * Ids are load-bearing: a saved card stores the motif id, so renaming one would silently
 * drop that element from an existing project. The four flourishes below carry their original
 * ids with new artwork.
 */
export const MOTIFS: Motif[] = [
  { id: 'arabesco-simples', name: 'Voluta de canto', category: 'arabesco', shape: VOLUTA_SIMPLES },
  { id: 'arabesco-duplo', name: 'Voluta dupla', category: 'arabesco', shape: VOLUTA_DUPLA },
  { id: 'ramo', name: 'Ramo comprido', category: 'arabesco', shape: RAMO },
  { id: 'arabesco-coracao', name: 'Laço', category: 'arabesco', shape: LACO },
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
