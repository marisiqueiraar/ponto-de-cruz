import type { PaletteEntry } from '../../types/pattern'

/** Renders the pattern's colors as a 1px-per-stitch PNG data URL (a compact mosaic thumbnail). */
export function renderPatternPreviewDataUrl(cells: Uint16Array, width: number, height: number, palette: PaletteEntry[]): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const imageData = ctx.createImageData(width, height)
  for (let i = 0; i < cells.length; i++) {
    const entry = palette[cells[i]]
    const offset = i * 4
    imageData.data[offset] = entry?.rgb[0] ?? 255
    imageData.data[offset + 1] = entry?.rgb[1] ?? 255
    imageData.data[offset + 2] = entry?.rgb[2] ?? 255
    imageData.data[offset + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}
