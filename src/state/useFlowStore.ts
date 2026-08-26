import { create } from 'zustand'
import { OBJECTIVES, type Modality, type Objective } from '../data/objectives'
import { getSetting, setSetting } from '../lib/persistence/settingsRepo'

/** What is actually going to be stitched — this decides which tools the editor shows. */
export type ContentType = 'letra' | 'frase' | 'desenho' | 'foto'

export const CONTENT_LABELS: Record<ContentType, string> = {
  letra: 'Uma letra (monograma)',
  frase: 'Nome, frase ou data',
  desenho: 'Desenho decorativo',
  foto: 'A foto inteira em pontos',
}

export const CONTENT_HINTS: Record<ContentType, string> = {
  letra: 'Uma inicial grande e trabalhada. Fontes cursivas rendem o melhor resultado.',
  frase: 'Texto em linha. Fontes estreitas cabem mais; cursivas ficam mais delicadas.',
  desenho: 'Arabescos, estrelas e corações posicionados ao redor da foto.',
  foto: 'A imagem vira um mosaico de pontos, cor a cor.',
}

/** Content types that make sense for each modality. */
export const CONTENT_BY_MODALITY: Record<Modality, ContentType[]> = {
  moldura: ['letra', 'frase', 'desenho'],
  padrao: ['foto'],
}

const FLOW_KEY = 'projectFlow'

interface PersistedFlow {
  objectiveId: string | null
  contentType: ContentType | null
  fontId: string | null
  configured: boolean
}

interface FlowState extends PersistedFlow {
  step: 0 | 1
  restore: () => Promise<void>
  chooseObjective: (objectiveId: string) => void
  chooseContent: (contentType: ContentType) => void
  chooseFont: (fontId: string) => void
  finish: () => void
  reset: () => void
  goToStep: (step: 0 | 1) => void
}

function persist(state: PersistedFlow): void {
  void setSetting(FLOW_KEY, state)
}

export const useFlowStore = create<FlowState>((set, get) => ({
  step: 0,
  objectiveId: null,
  contentType: null,
  fontId: null,
  configured: false,

  async restore() {
    const stored = await getSetting<PersistedFlow>(FLOW_KEY)
    if (stored?.configured) set({ ...stored, step: 1 })
  },

  chooseObjective(objectiveId) {
    const objective = OBJECTIVES.find((o) => o.id === objectiveId)
    if (!objective) return
    const allowed = CONTENT_BY_MODALITY[objective.modality]
    set((state) => ({
      objectiveId,
      // Keep the current content type only if it still applies to this objective's modality.
      contentType: state.contentType && allowed.includes(state.contentType) ? state.contentType : allowed[0],
      step: 1,
    }))
  },

  chooseContent(contentType) {
    set({ contentType })
  },

  chooseFont(fontId) {
    set({ fontId })
  },

  finish() {
    set({ configured: true })
    const { objectiveId, contentType, fontId } = get()
    persist({ objectiveId, contentType, fontId, configured: true })
  },

  reset() {
    set({ step: 0, configured: false })
    const { objectiveId, contentType, fontId } = get()
    persist({ objectiveId, contentType, fontId, configured: false })
  },

  goToStep(step) {
    set({ step })
  },
}))

export function currentObjective(objectiveId: string | null): Objective | undefined {
  return OBJECTIVES.find((o) => o.id === objectiveId)
}
