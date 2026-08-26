import { create } from 'zustand'
import { findOrAddPaletteEntry } from '../lib/pattern/buildPattern'
import { compositePattern, recomputePaletteCounts } from '../lib/pattern/compositeLayers'
import { assignSymbols } from '../lib/pattern/symbols'
import { saveImage, loadImage } from '../lib/persistence/imagesRepo'
import { loadPattern, savePattern } from '../lib/persistence/patternsRepo'
import { getSetting, setSetting } from '../lib/persistence/settingsRepo'
import { createPatternWorkerClient } from '../lib/workers/workerClient'
import type { Pattern, PatternViewMode, TextLayer } from '../types/pattern'

export interface PatternSettings {
  widthStitches: number
  heightStitches: number
  fabricCount: number
  colorCount: number
  lockAspectRatio: boolean
}

export type EngineStatus = 'idle' | 'computing' | 'ready' | 'error'

const DEFAULT_SETTINGS: PatternSettings = {
  widthStitches: 100,
  heightStitches: 100,
  fabricCount: 14,
  colorCount: 20,
  lockAspectRatio: true,
}

const LAST_PATTERN_KEY = 'lastOpenPatternId'
const REGENERATE_DEBOUNCE_MS = 250
const PERSIST_DEBOUNCE_MS = 500

const workerClient = createPatternWorkerClient()

interface EditorState {
  imageBitmap: ImageBitmap | null
  currentImageId: string | null
  imageAspectRatio: number | null
  settings: PatternSettings
  pattern: Pattern | null
  compositedCells: Uint16Array | null
  viewMode: PatternViewMode
  engineStatus: EngineStatus
  engineMessage: string

  loadImageFile: (file: File) => Promise<void>
  updateSettings: (partial: Partial<PatternSettings>) => void
  setViewMode: (mode: PatternViewMode) => void
  addTextLayer: (text: string, fontId: string, dmcCode: string, dmcName: string, rgb: [number, number, number]) => void
  updateTextLayer: (id: string, partial: Partial<Omit<TextLayer, 'id'>>) => void
  removeTextLayer: (id: string) => void
  renamePattern: (name: string) => void
  restoreLastSession: () => Promise<void>
}

let regenerateTimeout: ReturnType<typeof setTimeout> | undefined
let persistTimeout: ReturnType<typeof setTimeout> | undefined

function schedulePersist(pattern: Pattern): void {
  if (persistTimeout) clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => {
    void savePattern(pattern)
    void setSetting(LAST_PATTERN_KEY, pattern.id)
  }, PERSIST_DEBOUNCE_MS)
}

function withRecomposite(pattern: Pattern): { pattern: Pattern; compositedCells: Uint16Array } {
  const cells = compositePattern(pattern)
  recomputePaletteCounts(pattern, cells)
  pattern.updatedAt = Date.now()
  schedulePersist(pattern)
  return { pattern, compositedCells: cells }
}

export const useEditorStore = create<EditorState>((set, get) => ({
  imageBitmap: null,
  currentImageId: null,
  imageAspectRatio: null,
  settings: DEFAULT_SETTINGS,
  pattern: null,
  compositedCells: null,
  viewMode: 'color',
  engineStatus: 'idle',
  engineMessage: '',

  async loadImageFile(file) {
    const bitmap = await createImageBitmap(file)
    const aspectRatio = bitmap.width / bitmap.height
    const imageId = crypto.randomUUID()
    await saveImage(imageId, file)

    const { widthStitches } = get().settings
    const heightStitches = Math.max(1, Math.round(widthStitches / aspectRatio))

    set((state) => ({
      imageBitmap: bitmap,
      currentImageId: imageId,
      imageAspectRatio: aspectRatio,
      settings: { ...state.settings, heightStitches },
    }))

    scheduleRegenerate(set, get)
  },

  updateSettings(partial) {
    set((state) => {
      const next = { ...state.settings, ...partial }
      if (state.imageAspectRatio && next.lockAspectRatio) {
        if (partial.widthStitches !== undefined) {
          next.heightStitches = Math.max(1, Math.round(next.widthStitches / state.imageAspectRatio))
        } else if (partial.heightStitches !== undefined) {
          next.widthStitches = Math.max(1, Math.round(next.heightStitches * state.imageAspectRatio))
        }
      }
      return { settings: next }
    })
    scheduleRegenerate(set, get)
  },

  setViewMode(mode) {
    set({ viewMode: mode })
  },

  addTextLayer(text, fontId, dmcCode, dmcName, rgb) {
    set((state) => {
      const basePattern: Pattern =
        state.pattern ?? {
          id: crypto.randomUUID(),
          name: 'Sem título',
          width: state.settings.widthStitches,
          height: state.settings.heightStitches,
          fabricCount: state.settings.fabricCount,
          palette: [],
          textLayers: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

      const pattern: Pattern = { ...basePattern, palette: [...basePattern.palette], textLayers: [...basePattern.textLayers] }
      const paletteIndex = findOrAddPaletteEntry(pattern.palette, dmcCode, dmcName, rgb)
      const symbols = assignSymbols(pattern.palette.length)
      pattern.palette.forEach((entry, i) => {
        entry.symbol = symbols[i]
      })

      const layer: TextLayer = {
        id: crypto.randomUUID(),
        text,
        fontId,
        x: 0,
        y: 0,
        dmcCode: pattern.palette[paletteIndex].dmcCode,
        visible: true,
      }
      pattern.textLayers.push(layer)

      return withRecomposite(pattern)
    })
  },

  updateTextLayer(id, partial) {
    set((state) => {
      if (!state.pattern) return state
      const pattern: Pattern = { ...state.pattern, textLayers: state.pattern.textLayers.map((l) => (l.id === id ? { ...l, ...partial } : l)) }
      return withRecomposite(pattern)
    })
  },

  removeTextLayer(id) {
    set((state) => {
      if (!state.pattern) return state
      const pattern: Pattern = { ...state.pattern, textLayers: state.pattern.textLayers.filter((l) => l.id !== id) }
      return withRecomposite(pattern)
    })
  },

  renamePattern(name) {
    set((state) => {
      if (!state.pattern) return state
      const pattern: Pattern = { ...state.pattern, name, updatedAt: Date.now() }
      schedulePersist(pattern)
      return { pattern }
    })
  },

  async restoreLastSession() {
    const lastId = await getSetting<string>(LAST_PATTERN_KEY)
    if (!lastId) return
    const pattern = await loadPattern(lastId)
    if (!pattern) return

    let imageBitmap: ImageBitmap | null = null
    let imageAspectRatio: number | null = null
    if (pattern.sourceImageId) {
      const blob = await loadImage(pattern.sourceImageId)
      if (blob) {
        imageBitmap = await createImageBitmap(blob)
        imageAspectRatio = imageBitmap.width / imageBitmap.height
      }
    }

    const cells = compositePattern(pattern)
    set({
      pattern,
      compositedCells: cells,
      imageBitmap,
      currentImageId: pattern.sourceImageId ?? null,
      imageAspectRatio,
      settings: {
        widthStitches: pattern.width,
        heightStitches: pattern.height,
        fabricCount: pattern.fabricCount,
        colorCount: Math.max(pattern.palette.length, 1),
        lockAspectRatio: true,
      },
      engineStatus: 'ready',
      engineMessage: 'Restaurado da última sessão',
    })
  },
}))

function scheduleRegenerate(set: (partial: Partial<EditorState>) => void, get: () => EditorState): void {
  if (regenerateTimeout) clearTimeout(regenerateTimeout)
  regenerateTimeout = setTimeout(() => {
    void regenerate(set, get)
  }, REGENERATE_DEBOUNCE_MS)
}

async function regenerate(set: (partial: Partial<EditorState>) => void, get: () => EditorState): Promise<void> {
  const { imageBitmap, settings, pattern, currentImageId } = get()
  if (!imageBitmap) return

  set({ engineStatus: 'computing', engineMessage: 'Gerando padrão...' })
  const startedAt = performance.now()

  try {
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D context unavailable')
    ctx.drawImage(imageBitmap, 0, 0)
    const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height)

    const rebuilt = await workerClient.api.buildPattern(imageData, {
      width: settings.widthStitches,
      height: settings.heightStitches,
      colorCount: settings.colorCount,
      fabricCount: settings.fabricCount,
      name: pattern?.name ?? 'Sem título',
    })

    rebuilt.id = pattern?.id ?? rebuilt.id
    rebuilt.textLayers = pattern?.textLayers ?? []
    rebuilt.sourceImageId = currentImageId ?? undefined
    rebuilt.createdAt = pattern?.createdAt ?? rebuilt.createdAt

    const cells = compositePattern(rebuilt)
    recomputePaletteCounts(rebuilt, cells)
    schedulePersist(rebuilt)

    const elapsedMs = Math.round(performance.now() - startedAt)
    set({ pattern: rebuilt, compositedCells: cells, engineStatus: 'ready', engineMessage: `Pronto em ${elapsedMs}ms` })
  } catch (error) {
    console.error(error)
    set({ engineStatus: 'error', engineMessage: 'Falha ao gerar o padrão' })
  }
}
