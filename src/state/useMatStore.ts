import { create } from 'zustand'
import { getMotif } from '../data/motifs'
import { getSubstrate } from '../data/substrates'
import { db } from '../lib/persistence/db'
import { getSetting, setSetting } from '../lib/persistence/settingsRepo'
import { DEFAULT_MAT_NAME } from '../lib/project/projectName'
import { matGrid, resolveItemShape } from '../lib/mat/matGeometry'
import type { Rotation } from '../lib/motifs/gridDraw'
import type { MatItem, MatProject } from '../types/mat'

const LAST_MAT_KEY = 'lastOpenMatId'
const PERSIST_DEBOUNCE_MS = 500

/** Centimetre values are edited in number inputs, so keep them at one decimal. */
export function roundCm(value: number): number {
  return Math.round(value * 10) / 10
}

function createDefaultProject(): MatProject {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: DEFAULT_MAT_NAME,
    substrateId: 'cartolina-texturizada',
    count: 12,
    widthCm: 15,
    heightCm: 10,
    photo: { xCm: 4, yCm: 2.5, widthCm: 8, heightCm: 5.5 },
    items: [],
    createdAt: now,
    updatedAt: now,
  }
}

interface MatState {
  project: MatProject
  selectedItemId: string | null

  loadOrCreate: () => Promise<void>
  updateProject: (partial: Partial<Omit<MatProject, 'items'>>) => void
  applyObjective: (substrateId: string, count: number, widthCm: number, heightCm: number) => void
  addMotif: (motifId: string, dmcCode: string) => void
  addText: (text: string, fontId: string, dmcCode: string) => void
  updateItem: (id: string, partial: Partial<Omit<MatItem, 'id'>>) => void
  removeItem: (id: string) => void
  selectItem: (id: string | null) => void
  clearItems: () => void
}

let persistTimeout: ReturnType<typeof setTimeout> | undefined

function schedulePersist(project: MatProject): void {
  if (persistTimeout) clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => {
    void db.mats.put(project)
    void setSetting(LAST_MAT_KEY, project.id)
  }, PERSIST_DEBOUNCE_MS)
}

function touched(project: MatProject): MatProject {
  const next = { ...project, updatedAt: Date.now() }
  schedulePersist(next)
  return next
}

/** Places a new item roughly in the top-left quadrant, clear of the photo opening. */
function defaultPlacement(project: MatProject, width: number, height: number): { x: number; y: number } {
  const grid = matGrid(project)
  return {
    x: Math.max(0, Math.min(grid.cols - width, 2)),
    y: Math.max(0, Math.min(grid.rows - height, 2)),
  }
}

export const useMatStore = create<MatState>((set) => ({
  project: createDefaultProject(),
  selectedItemId: null,

  async loadOrCreate() {
    const lastId = await getSetting<string>(LAST_MAT_KEY)
    if (!lastId) return
    const stored = await db.mats.get(lastId)
    if (stored) set({ project: stored })
  },

  updateProject(partial) {
    set((state) => ({ project: touched({ ...state.project, ...partial }) }))
  },

  applyObjective(substrateId, count, widthCm, heightCm) {
    const substrate = getSubstrate(substrateId)
    const effectiveCount = substrate?.counts.includes(count) ? count : (substrate?.defaultCount ?? count)
    set((state) => ({
      project: touched({
        ...state.project,
        substrateId,
        count: effectiveCount,
        widthCm,
        heightCm,
        // Re-centre a photo opening sized to leave a stitching border all around.
        // Rounded to a tenth: these land in number inputs, where raw float noise shows up.
        photo: {
          xCm: roundCm(widthCm * 0.25),
          yCm: roundCm(heightCm * 0.22),
          widthCm: roundCm(widthCm * 0.5),
          heightCm: roundCm(heightCm * 0.56),
        },
      }),
    }))
  },

  addMotif(motifId, dmcCode) {
    const motif = getMotif(motifId)
    if (!motif) return
    set((state) => {
      const { x, y } = defaultPlacement(state.project, motif.shape.width, motif.shape.height)
      const item: MatItem = { id: crypto.randomUUID(), kind: 'motif', motifId, x, y, rotation: 0, mirrored: false, dmcCode }
      return { project: touched({ ...state.project, items: [...state.project.items, item] }), selectedItemId: item.id }
    })
  },

  addText(text, fontId, dmcCode) {
    set((state) => {
      const draft: MatItem = { id: crypto.randomUUID(), kind: 'text', text, fontId, x: 0, y: 0, rotation: 0, mirrored: false, dmcCode }
      const shape = resolveItemShape(draft)
      const { x, y } = defaultPlacement(state.project, shape?.width ?? 1, shape?.height ?? 1)
      const item = { ...draft, x, y }
      return { project: touched({ ...state.project, items: [...state.project.items, item] }), selectedItemId: item.id }
    })
  },

  updateItem(id, partial) {
    set((state) => ({
      project: touched({
        ...state.project,
        items: state.project.items.map((item) => (item.id === id ? { ...item, ...partial } : item)),
      }),
    }))
  },

  removeItem(id) {
    set((state) => ({
      project: touched({ ...state.project, items: state.project.items.filter((item) => item.id !== id) }),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    }))
  },

  selectItem(id) {
    set({ selectedItemId: id })
  },

  clearItems() {
    set((state) => ({ project: touched({ ...state.project, items: [] }), selectedItemId: null }))
  },
}))

export type { Rotation }
