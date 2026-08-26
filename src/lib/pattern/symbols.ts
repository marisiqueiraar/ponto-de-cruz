import { SYMBOL_DRAWERS, SYMBOL_IDS } from '../../data/symbols'

/**
 * Assigns a symbol id to each of `count` palette entries, most-distinct symbols first.
 * If `count` exceeds the number of available symbols, ids repeat (rare in practice: most
 * patterns use well under `SYMBOL_IDS.length` colors).
 */
export function assignSymbols(count: number): string[] {
  return Array.from({ length: count }, (_, i) => SYMBOL_IDS[i % SYMBOL_IDS.length])
}

export function drawSymbol(ctx: CanvasRenderingContext2D, symbolId: string, cx: number, cy: number, size: number): void {
  const draw = SYMBOL_DRAWERS[symbolId]
  if (draw) draw(ctx, cx, cy, size)
}
