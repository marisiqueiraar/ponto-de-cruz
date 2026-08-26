import { create } from 'zustand'
import { BUILTIN_CELL_HEIGHT, BUILTIN_CELL_WIDTH, BUILTIN_TYPEFACES } from '../data/fonts/builtinTypefaces'
import { registerFont, unregisterFont } from '../data/fonts'
import { rasterizeFontToCrossStitchFont } from '../lib/fonts/rasterizeFont'
import { deleteCustomFont, listCustomFonts, saveCustomFont } from '../lib/persistence/fontsRepo'
import type { CrossStitchFont } from '../types/font'

interface FontLibraryState {
  customFonts: CrossStitchFont[]
  rasterizedBuiltinIds: Set<string>
  loadingBuiltinId: string | null
  loadCustomFonts: () => Promise<void>
  ensureBuiltinRasterized: (builtinId: string) => Promise<void>
  addCustomFontFromFile: (file: File, name: string) => Promise<void>
  removeCustomFont: (id: string) => Promise<void>
}

export const useFontLibraryStore = create<FontLibraryState>((set, get) => ({
  customFonts: [],
  rasterizedBuiltinIds: new Set(),
  loadingBuiltinId: null,

  async loadCustomFonts() {
    const fonts = await listCustomFonts()
    fonts.forEach(registerFont)
    set({ customFonts: fonts })
  },

  async ensureBuiltinRasterized(builtinId) {
    if (get().rasterizedBuiltinIds.has(builtinId)) return
    const typeface = BUILTIN_TYPEFACES.find((t) => t.id === builtinId)
    if (!typeface) return

    set({ loadingBuiltinId: builtinId })
    try {
      const font = await rasterizeFontToCrossStitchFont({
        id: builtinId,
        name: typeface.name,
        fontFamily: `builtin-${builtinId}`,
        fontUrl: typeface.url,
        cellWidth: BUILTIN_CELL_WIDTH,
        cellHeight: BUILTIN_CELL_HEIGHT,
      })
      registerFont(font)
      set((state) => ({ rasterizedBuiltinIds: new Set(state.rasterizedBuiltinIds).add(builtinId) }))
    } finally {
      set({ loadingBuiltinId: null })
    }
  },

  async addCustomFontFromFile(file, name) {
    const id = crypto.randomUUID()
    const url = URL.createObjectURL(file)
    try {
      const font = await rasterizeFontToCrossStitchFont({
        id,
        name,
        fontFamily: `custom-${id}`,
        fontUrl: url,
        cellWidth: BUILTIN_CELL_WIDTH,
        cellHeight: BUILTIN_CELL_HEIGHT,
      })
      registerFont(font)
      await saveCustomFont(font)
      set((state) => ({ customFonts: [...state.customFonts, font] }))
    } finally {
      URL.revokeObjectURL(url)
    }
  },

  async removeCustomFont(id) {
    unregisterFont(id)
    await deleteCustomFont(id)
    set((state) => ({ customFonts: state.customFonts.filter((font) => font.id !== id) }))
  },
}))
