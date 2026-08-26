import { drawSymbol } from '../pattern/symbols'

const tileCache = new Map<string, string>()

/** Renders a symbol as a black-on-white square PNG tile, cached per symbol id for reuse across many PDF cells. */
export function getSymbolTileDataUrl(symbolId: string, sizePx = 128): string {
  const cached = tileCache.get(symbolId)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = sizePx
  canvas.height = sizePx
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sizePx, sizePx)
  ctx.fillStyle = '#111111'
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = sizePx * 0.09
  drawSymbol(ctx, symbolId, sizePx / 2, sizePx / 2, sizePx)

  const url = canvas.toDataURL('image/png')
  tileCache.set(symbolId, url)
  return url
}

/** Renders a color+symbol legend swatch (used on the legend pages), not cached since colors vary per entry. */
export function renderLegendSwatchDataUrl(symbolId: string, rgb: [number, number, number], sizePx = 96): string {
  const canvas = document.createElement('canvas')
  canvas.width = sizePx
  canvas.height = sizePx
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
  ctx.fillRect(0, 0, sizePx, sizePx)
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]
  ctx.fillStyle = luminance > 140 ? '#111111' : '#ffffff'
  ctx.strokeStyle = ctx.fillStyle
  ctx.lineWidth = sizePx * 0.09
  drawSymbol(ctx, symbolId, sizePx / 2, sizePx / 2, sizePx)
  return canvas.toDataURL('image/png')
}
