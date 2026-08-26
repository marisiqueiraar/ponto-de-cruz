export interface BuiltinTypeface {
  id: string
  name: string
  url: string
}

export const BUILTIN_CELL_WIDTH = 8
export const BUILTIN_CELL_HEIGHT = 10

// Open-license (SIL OFL) Google Fonts, bundled locally so the gallery works offline.
export const BUILTIN_TYPEFACES: BuiltinTypeface[] = [
  { id: 'press-start-2p', name: 'Press Start 2P', url: '/fonts/press-start-2p.ttf' },
  { id: 'vt323', name: 'VT323', url: '/fonts/vt323.ttf' },
  { id: 'silkscreen', name: 'Silkscreen', url: '/fonts/silkscreen.ttf' },
  { id: 'pixelify-sans', name: 'Pixelify Sans', url: '/fonts/pixelify-sans.ttf' },
]
