export type SymbolDrawer = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => void

function circle(filled: boolean, scale = 0.4): SymbolDrawer {
  return (ctx, cx, cy, size) => {
    ctx.beginPath()
    ctx.arc(cx, cy, size * scale, 0, Math.PI * 2)
    filled ? ctx.fill() : ctx.stroke()
  }
}

function square(filled: boolean, scale = 0.36): SymbolDrawer {
  return (ctx, cx, cy, size) => {
    const s = size * scale
    filled ? ctx.fillRect(cx - s, cy - s, s * 2, s * 2) : ctx.strokeRect(cx - s, cy - s, s * 2, s * 2)
  }
}

function diamond(filled: boolean, scale = 0.42): SymbolDrawer {
  return (ctx, cx, cy, size) => {
    const s = size * scale
    ctx.beginPath()
    ctx.moveTo(cx, cy - s)
    ctx.lineTo(cx + s, cy)
    ctx.lineTo(cx, cy + s)
    ctx.lineTo(cx - s, cy)
    ctx.closePath()
    filled ? ctx.fill() : ctx.stroke()
  }
}

function triangle(filled: boolean, up: boolean, scale = 0.42): SymbolDrawer {
  return (ctx, cx, cy, size) => {
    const s = size * scale
    ctx.beginPath()
    if (up) {
      ctx.moveTo(cx, cy - s)
      ctx.lineTo(cx + s, cy + s)
      ctx.lineTo(cx - s, cy + s)
    } else {
      ctx.moveTo(cx, cy + s)
      ctx.lineTo(cx + s, cy - s)
      ctx.lineTo(cx - s, cy - s)
    }
    ctx.closePath()
    filled ? ctx.fill() : ctx.stroke()
  }
}

const plus: SymbolDrawer = (ctx, cx, cy, size) => {
  const s = size * 0.4
  ctx.beginPath()
  ctx.moveTo(cx - s, cy)
  ctx.lineTo(cx + s, cy)
  ctx.moveTo(cx, cy - s)
  ctx.lineTo(cx, cy + s)
  ctx.stroke()
}

const cross: SymbolDrawer = (ctx, cx, cy, size) => {
  const s = size * 0.36
  ctx.beginPath()
  ctx.moveTo(cx - s, cy - s)
  ctx.lineTo(cx + s, cy + s)
  ctx.moveTo(cx + s, cy - s)
  ctx.lineTo(cx - s, cy + s)
  ctx.stroke()
}

const asterisk: SymbolDrawer = (ctx, cx, cy, size) => {
  plus(ctx, cx, cy, size)
  cross(ctx, cx, cy, size * 0.8)
}

const dot: SymbolDrawer = circle(true, 0.14)

const ring: SymbolDrawer = circle(false, 0.4)

function star(points: number, scale = 0.44): SymbolDrawer {
  return (ctx, cx, cy, size) => {
    const outer = size * scale
    const inner = outer * 0.45
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const angle = (Math.PI * i) / points - Math.PI / 2
      const px = cx + r * Math.cos(angle)
      const py = cy + r * Math.sin(angle)
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  }
}

/** Ordered from simplest/most-distinct to more elaborate, so the first colors get the clearest symbols. */
export const SYMBOL_DRAWERS: Record<string, SymbolDrawer> = {
  dot,
  square_fill: square(true),
  triangle_up_fill: triangle(true, true),
  ring,
  cross,
  plus,
  diamond_outline: diamond(false),
  square_outline: square(false),
  circle_fill: circle(true),
  triangle_down_fill: triangle(true, false),
  diamond_fill: diamond(true),
  triangle_up_outline: triangle(false, true),
  asterisk,
  triangle_down_outline: triangle(false, false),
  star4: star(4),
  star5: star(5),
  star6: star(6, 0.4),
}

export const SYMBOL_IDS = Object.keys(SYMBOL_DRAWERS)
