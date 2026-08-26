export interface CrossStitchFont {
  id: string
  name: string
  cellWidth: number
  cellHeight: number
  /** Each glyph is an array of `cellHeight` strings, `cellWidth` chars each: '#' = stitch, '.' = empty. */
  glyphs: Record<string, string[]>
}
