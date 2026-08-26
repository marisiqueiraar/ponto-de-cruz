import { Icon } from '../common/Icon'
import { BUILTIN_TYPEFACES } from '../../data/fonts/builtinTypefaces'
import { FONTS } from '../../data/fonts'
import { MODALITY_LABELS, OBJECTIVES } from '../../data/objectives'
import { getSubstrate } from '../../data/substrates'
import { CONTENT_BY_MODALITY, CONTENT_HINTS, CONTENT_LABELS, currentObjective, useFlowStore, type ContentType } from '../../state/useFlowStore'
import { useEditorStore } from '../../state/useEditorStore'
import { useMatStore } from '../../state/useMatStore'
import { useFontLibraryStore } from '../../state/useFontLibraryStore'

export function ProjectWizard() {
  const step = useFlowStore((s) => s.step)
  const objectiveId = useFlowStore((s) => s.objectiveId)
  const contentType = useFlowStore((s) => s.contentType)
  const fontId = useFlowStore((s) => s.fontId)
  const chooseObjective = useFlowStore((s) => s.chooseObjective)
  const chooseContent = useFlowStore((s) => s.chooseContent)
  const chooseFont = useFlowStore((s) => s.chooseFont)
  const finish = useFlowStore((s) => s.finish)
  const goToStep = useFlowStore((s) => s.goToStep)

  const applyObjective = useMatStore((s) => s.applyObjective)
  const applyPreset = useEditorStore((s) => s.applyPreset)
  const ensureBuiltinRasterized = useFontLibraryStore((s) => s.ensureBuiltinRasterized)
  const customFonts = useFontLibraryStore((s) => s.customFonts)

  const objective = currentObjective(objectiveId)

  const handleStart = async () => {
    if (!objective) return
    if (objective.modality === 'moldura') {
      applyObjective(objective.substrateId, objective.count, objective.widthCm, objective.heightCm)
      if (fontId && BUILTIN_TYPEFACES.some((t) => t.id === fontId)) {
        await ensureBuiltinRasterized(fontId)
      }
    } else {
      const substrate = getSubstrate(objective.substrateId)
      const count = substrate?.counts.includes(objective.count) ? objective.count : (substrate?.defaultCount ?? 14)
      applyPreset(
        Math.round((objective.widthCm / 2.54) * count),
        Math.round((objective.heightCm / 2.54) * count),
        count,
      )
    }
    finish()
  }

  if (step === 0) {
    return (
      <div className="page stack">
        <div className="card">
          <div className="search-hero">
            <p className="wizard-step">Passo 1 de 2</p>
            <h2>O que você vai bordar?</h2>
            <p>A escolha define o material, a contagem e o tamanho — tudo já configurado pra você.</p>
          </div>
        </div>

        {(['moldura', 'padrao'] as const).map((modality) => (
          <div className="card" key={modality}>
            <p className="eyebrow">{MODALITY_LABELS[modality]}</p>
            <div className="card-grid">
              {OBJECTIVES.filter((o) => o.modality === modality).map((option) => {
                const substrate = getSubstrate(option.substrateId)
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={option.id === objectiveId ? 'modality-card active' : 'modality-card'}
                    onClick={() => chooseObjective(option.id)}
                  >
                    <div className="objective-row__name">{option.name}</div>
                    <p className="objective-row__why">{option.why}</p>
                    <div className="objective-row__meta">
                      <span className="badge badge--primary">{substrate?.name}</span>
                      <span className="badge">
                        {option.widthCm} × {option.heightCm} cm
                      </span>
                      <span className="badge">{option.effort}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const allowed = objective ? CONTENT_BY_MODALITY[objective.modality] : []
  const needsFont = contentType === 'letra' || contentType === 'frase'
  const substrate = objective ? getSubstrate(objective.substrateId) : undefined

  return (
    <div className="page stack">
      <div className="card">
        <div className="search-hero">
          <p className="wizard-step">Passo 2 de 2</p>
          <h2>{objective?.name}</h2>
          <p>{objective?.why}</p>
        </div>
        <button type="button" className="btn btn--ghost" style={{ marginTop: 12 }} onClick={() => goToStep(0)}>
          ← Trocar projeto
        </button>
      </div>

      <div className="card">
        <p className="eyebrow">O que vai ser bordado</p>
        <div className="card-grid">
          {allowed.map((option: ContentType) => (
            <button
              key={option}
              type="button"
              className={option === contentType ? 'modality-card active' : 'modality-card'}
              onClick={() => chooseContent(option)}
            >
              <span className="icon-tile icon-tile--sm">
                <Icon name={option === 'desenho' ? 'palette' : option === 'foto' ? 'photo' : 'type'} size={17} />
              </span>
              <div className="objective-row__name" style={{ marginTop: 10 }}>
                {CONTENT_LABELS[option]}
              </div>
              <p className="objective-row__why">{CONTENT_HINTS[option]}</p>
            </button>
          ))}
        </div>
      </div>

      {needsFont && (
        <div className="card">
          <p className="eyebrow">Fonte das letras</p>
          <div className="motif-grid">
            {[...BUILTIN_TYPEFACES, ...FONTS.map((f) => ({ id: f.id, name: f.name })), ...customFonts.map((f) => ({ id: f.id, name: f.name }))].map(
              (face) => (
                <button
                  key={face.id}
                  type="button"
                  className={face.id === fontId ? 'motif-tile motif-tile--active' : 'motif-tile'}
                  onClick={() => chooseFont(face.id)}
                >
                  <span style={{ fontSize: '1.5rem', lineHeight: 1.1 }}>Aa</span>
                  <span>{face.name}</span>
                </button>
              ),
            )}
          </div>
          <p className="hint">A conversão da fonte em pontos acontece no seu navegador quando você começar.</p>
        </div>
      )}

      {substrate && (
        <div className="card">
          <p className="eyebrow">Material recomendado</p>
          <div className="objective-row__name">{substrate.name}</div>
          <p className="objective-row__why">{substrate.description}</p>
          <div className="data-block">
            <span className="data-block__label">FICHA</span>
            Fios: {substrate.strands}
            <br />
            Agulha: {substrate.needle}
          </div>
          <p className="hint">Dá pra trocar o material depois, dentro do editor.</p>
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={handleStart}
        disabled={!contentType || (needsFont && !fontId)}
      >
        Começar a montar
        <Icon name="arrow-right" size={17} />
      </button>
    </div>
  )
}
