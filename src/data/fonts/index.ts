import type { CrossStitchFont } from '../../types/font'
import { FONT_5X7_BASIC } from './font5x7Basic'
import { FONT_7X9_BOLD } from './font7x9Bold'

export const FONTS: CrossStitchFont[] = [FONT_5X7_BASIC, FONT_7X9_BOLD]

export function getFontById(id: string): CrossStitchFont | undefined {
  return FONTS.find((font) => font.id === id)
}
