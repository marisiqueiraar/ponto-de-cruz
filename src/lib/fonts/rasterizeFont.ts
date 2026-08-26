import type { CrossStitchFont } from '../../types/font'

const DEFAULT_CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!-'?"
const SUPERSAMPLE = 8

const loadedFaceKeys = new Set<string>()

async function ensureFontLoaded(fontFamily: string, fontUrl: string): Promise<void> {
  const key = `${fontFamily}::${fontUrl}`
  if (loadedFaceKeys.has(key)) return
  const face = new FontFace(fontFamily, `url(${fontUrl})`)
  await face.load()
  document.fonts.add(face)
  loadedFaceKeys.add(key)
}

function rasterizeGlyph(fontFamily: string, char: string, cellWidth: number, cellHeight: number, threshold: number): string[] {
  if (char === ' ') return Array.from({ length: cellHeight }, () => '.'.repeat(cellWidth))

  const w = cellWidth * SUPERSAMPLE
  const h = cellHeight * SUPERSAMPLE
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return Array.from({ length: cellHeight }, () => '.'.repeat(cellWidth))

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#000000'
  ctx.textAlign = 'center'
  ctx.font = `${Math.round(h * 0.82)}px "${fontFamily}"`
  const metrics = ctx.measureText(char)
  const ascent = metrics.actualBoundingBoxAscent || h * 0.35
  const descent = metrics.actualBoundingBoxDescent || h * 0.1
  const baselineY = h / 2 + (ascent - descent) / 2
  ctx.fillText(char, w / 2, baselineY)

  const imageData = ctx.getImageData(0, 0, w, h)
  const rows: string[] = []
  for (let cy = 0; cy < cellHeight; cy++) {
    let row = ''
    for (let cx = 0; cx < cellWidth; cx++) {
      let sum = 0
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const px = cx * SUPERSAMPLE + sx
          const py = cy * SUPERSAMPLE + sy
          sum += imageData.data[(py * w + px) * 4 + 3]
        }
      }
      row += sum / (SUPERSAMPLE * SUPERSAMPLE) > threshold ? '#' : '.'
    }
    rows.push(row)
  }
  return rows
}

export interface RasterizeFontOptions {
  id: string
  name: string
  fontFamily: string
  fontUrl: string
  cellWidth: number
  cellHeight: number
  charset?: string
  threshold?: number
}

/** Loads a font file and converts each character into a cross-stitch bitmap glyph. */
export async function rasterizeFontToCrossStitchFont(options: RasterizeFontOptions): Promise<CrossStitchFont> {
  const { id, name, fontFamily, fontUrl, cellWidth, cellHeight, charset = DEFAULT_CHARSET, threshold = 90 } = options
  await ensureFontLoaded(fontFamily, fontUrl)

  const glyphs: Record<string, string[]> = {}
  for (const char of charset) {
    glyphs[char.toUpperCase()] = rasterizeGlyph(fontFamily, char, cellWidth, cellHeight, threshold)
  }

  return { id, name, cellWidth, cellHeight, glyphs }
}
