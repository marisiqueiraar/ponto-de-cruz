export interface BuiltinTypeface {
  id: string
  name: string
  url: string
  /** Glyph grid size. Script faces need a taller box so their strokes survive rasterization. */
  cellWidth: number
  cellHeight: number
  /** Alpha cutoff: lower keeps the thin hairlines of calligraphic faces. */
  threshold: number
}

export const BUILTIN_CELL_WIDTH = 8
export const BUILTIN_CELL_HEIGHT = 10

// Open-license (SIL OFL) Google Fonts, bundled locally so the gallery works offline.
export const BUILTIN_TYPEFACES: BuiltinTypeface[] = [
  { id: 'great-vibes', name: 'Great Vibes (cursiva)', url: '/fonts/great-vibes.woff2', cellWidth: 26, cellHeight: 30, threshold: 55 },
  { id: 'pinyon-script', name: 'Pinyon Script (cursiva)', url: '/fonts/pinyon-script.woff2', cellWidth: 26, cellHeight: 30, threshold: 55 },
  { id: 'parisienne', name: 'Parisienne (cursiva)', url: '/fonts/parisienne.woff2', cellWidth: 24, cellHeight: 28, threshold: 55 },
  { id: 'press-start-2p', name: 'Press Start 2P', url: '/fonts/press-start-2p.ttf', cellWidth: 8, cellHeight: 10, threshold: 90 },
  { id: 'vt323', name: 'VT323', url: '/fonts/vt323.ttf', cellWidth: 8, cellHeight: 10, threshold: 90 },
  { id: 'silkscreen', name: 'Silkscreen', url: '/fonts/silkscreen.ttf', cellWidth: 8, cellHeight: 10, threshold: 90 },
  { id: 'pixelify-sans', name: 'Pixelify Sans', url: '/fonts/pixelify-sans.ttf', cellWidth: 8, cellHeight: 10, threshold: 90 },
]

export function getBuiltinTypeface(id: string): BuiltinTypeface | undefined {
  return BUILTIN_TYPEFACES.find((t) => t.id === id)
}
