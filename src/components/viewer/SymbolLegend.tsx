import { useEffect, useRef } from 'react'
import { drawSymbol } from '../../lib/pattern/symbols'

interface SymbolSwatchProps {
  symbolId: string
  rgb: [number, number, number]
  size?: number
}

/** Small canvas rendering one palette entry's symbol over its color, reused by the legend/shopping list. */
export function SymbolSwatch({ symbolId, rgb, size = 28 }: SymbolSwatchProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
    ctx.fillRect(0, 0, size, size)

    const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]
    ctx.fillStyle = luminance > 140 ? '#111111' : '#ffffff'
    ctx.strokeStyle = ctx.fillStyle
    ctx.lineWidth = Math.max(1, size * 0.09)
    drawSymbol(ctx, symbolId, size / 2, size / 2, size)
  }, [symbolId, rgb, size])

  return <canvas ref={ref} className="symbol-swatch" />
}
