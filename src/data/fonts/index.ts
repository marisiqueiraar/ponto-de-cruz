import type { CrossStitchFont } from '../../types/font'
import { FONT_5X7_BASIC } from './font5x7Basic'
import { FONT_7X9_BOLD } from './font7x9Bold'

export const FONTS: CrossStitchFont[] = [FONT_5X7_BASIC, FONT_7X9_BOLD]

const dynamicFonts = new Map<string, CrossStitchFont>()

/** Registers a font rasterized at runtime (gallery typeface or user upload) so it can be looked up like a built-in one. */
export function registerFont(font: CrossStitchFont): void {
  dynamicFonts.set(font.id, font)
}

export function unregisterFont(id: string): void {
  dynamicFonts.delete(id)
}

export function getFontById(id: string): CrossStitchFont | undefined {
  return FONTS.find((font) => font.id === id) ?? dynamicFonts.get(id)
}
