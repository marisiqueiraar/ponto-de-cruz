import { useState } from 'react'
import { Icon } from '../components/common/Icon'
import { MODALITY_DESCRIPTIONS, MODALITY_LABELS, objectivesByModality, type Modality } from '../data/objectives'
import { getSubstrate } from '../data/substrates'
import { tipOfTheDay } from '../data/stitchGuide'
import { physicalFromStitches } from '../lib/pattern/sizing'
import { useEditorStore } from '../state/useEditorStore'
import { useMatStore } from '../state/useMatStore'
import type { TabId } from '../navigation'

interface DashboardPageProps {
  onNavigate: (tab: TabId) => void
}

const MODALITIES: Modality[] = ['moldura', 'padrao']

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const pattern = useEditorStore((s) => s.pattern)
  const applyPreset = useEditorStore((s) => s.applyPreset)
  const matProject = useMatStore((s) => s.project)
  const applyObjective = useMatStore((s) => s.applyObjective)
  const [modality, setModality] = useState<Modality>('moldura')

  const tip = tipOfTheDay()
  const objectives = objectivesByModality(modality)

  const start = (objective: (typeof objectives)[number]) => {
    if (objective.modality === 'moldura') {
      applyObjective(objective.substrateId, objective.count, objective.widthCm, objective.heightCm)
    } else {
      const substrate = getSubstrate(objective.substrateId)
      const count = substrate?.counts.includes(objective.count) ? objective.count : (substrate?.defaultCount ?? 14)
      applyPreset(
        Math.round((objective.widthCm / 2.54) * count),
        Math.round((objective.heightCm / 2.54) * count),
        count,
      )
    }
    onNavigate(objective.goTo)
  }

  return (
    <div className="page stack">
      <div className="card">
        <div className="search-hero">
          <h2>O que você quer bordar?</h2>
          <p>
            Escolha o objetivo e o app já configura o material, a contagem e o tamanho certos para esse tipo de peça.
          </p>
        </div>

        <div className="card-grid" style={{ marginTop: 20 }}>
          {MODALITIES.map((option) => (
            <button
              key={option}
              type="button"
              className={option === modality ? 'modality-card active' : 'modality-card'}
              onClick={() => setModality(option)}
            >
              <span className={option === 'moldura' ? 'icon-tile' : 'icon-tile icon-tile--green'}>
                <Icon name={option === 'moldura' ? 'photo' : 'layers'} size={21} />
              </span>
              <h3 className="card-title" style={{ fontSize: '1.12rem' }}>
                {MODALITY_LABELS[option]}
              </h3>
              <p className="card-sub">{MODALITY_DESCRIPTIONS[option]}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Projetos de {MODALITY_LABELS[modality].toLowerCase()}</p>

        {objectives.map((objective) => {
          const substrate = getSubstrate(objective.substrateId)
          return (
            <div key={objective.id} className="objective-row">
              <div className="objective-row__main">
                <div className="objective-row__name">{objective.name}</div>
                <p className="objective-row__why">{objective.why}</p>
                <div className="objective-row__meta">
                  <span className="badge badge--primary">{substrate?.name}</span>
                  <span className="badge">{objective.count} ct</span>
                  <span className="badge">
                    {objective.widthCm} × {objective.heightCm} cm
                  </span>
                  <span className="badge">{objective.effort}</span>
                </div>
              </div>
              <button type="button" className="btn btn--primary" onClick={() => start(objective)}>
                Começar
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="page--split" style={{ padding: 0 }}>
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm icon-tile--amber">
              <Icon name="bulb" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>{tip.title}</h2>
              <p>Dica de bordado</p>
            </div>
          </div>
          <p className="card-sub">{tip.body}</p>
        </div>

        <div className="status-panel">
          <p className="eyebrow">Seus projetos abertos</p>

          <div className="status-panel__row">
            <span className="status-panel__dot" />
            <span>Moldura</span>
            <span>
              {matProject.items.length > 0
                ? `${matProject.items.length} elemento${matProject.items.length === 1 ? '' : 's'} · ${matProject.widthCm}×${matProject.heightCm}cm`
                : 'vazia'}
            </span>
          </div>

          <div className="status-panel__row">
            <span className={pattern ? 'status-panel__dot' : 'status-panel__dot status-panel__dot--idle'} />
            <span>Padrão da imagem</span>
            <span>
              {pattern
                ? `${pattern.width}×${pattern.height} pts · ${physicalFromStitches(pattern.width, pattern.fabricCount).toFixed(1)}cm`
                : 'nenhum'}
            </span>
          </div>

          <div className="status-panel__row">
            <span className="status-panel__dot status-panel__dot--idle" />
            <span>Tudo salvo no navegador</span>
            <span>sem conta</span>
          </div>
        </div>
      </div>
    </div>
  )
}
