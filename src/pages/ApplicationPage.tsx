import { useMemo, useState } from 'react'
import { ApplicationSilhouette } from '../components/preview/ApplicationSilhouette'
import { Callout } from '../components/common/controls'
import { Icon } from '../components/common/Icon'
import { APPLICATION_TEMPLATES, getApplicationTemplate } from '../data/applications'
import { physicalFromStitches, stitchesFromPhysical } from '../lib/pattern/sizing'
import { renderPatternPreviewDataUrl } from '../lib/pattern/renderPreviewImage'
import { useEditorStore } from '../state/useEditorStore'
import type { TabId } from '../navigation'

interface ApplicationPageProps {
  onNavigate: (tab: TabId) => void
}

export function ApplicationPage({ onNavigate }: ApplicationPageProps) {
  const pattern = useEditorStore((s) => s.pattern)
  const compositedCells = useEditorStore((s) => s.compositedCells)
  const updateSettings = useEditorStore((s) => s.updateSettings)
  const [templateId, setTemplateId] = useState(APPLICATION_TEMPLATES[0].id)
  const template = getApplicationTemplate(templateId) ?? APPLICATION_TEMPLATES[0]

  const previewUrl = useMemo(() => {
    if (!pattern || !compositedCells) return null
    return renderPatternPreviewDataUrl(compositedCells, pattern.width, pattern.height, pattern.palette)
  }, [pattern, compositedCells])

  if (!pattern || !previewUrl) {
    return (
      <div className="page">
        <div className="card">
          <div className="canvas-empty" style={{ position: 'static', padding: 60 }}>
            <Icon name="shirt" size={34} />
            <p className="card-sub">Gere um padrão no Gerador para testá-lo numa aplicação real.</p>
            <button type="button" className="btn btn--primary" onClick={() => onNavigate('gerador')}>
              Ir para o Gerador
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const patternWidthCm = physicalFromStitches(pattern.width, pattern.fabricCount)
  const patternHeightCm = physicalFromStitches(pattern.height, pattern.fabricCount)
  const { usableArea } = template

  const scale = Math.min(usableArea.widthCm / patternWidthCm, usableArea.heightCm / patternHeightCm, 1)
  const fits = scale >= 1
  const drawWidth = patternWidthCm * scale
  const drawHeight = patternHeightCm * scale
  const drawX = usableArea.xCm + (usableArea.widthCm - drawWidth) / 2
  const drawY = usableArea.yCm + (usableArea.heightCm - drawHeight) / 2

  /** Largest stitch count that still fits the usable area, keeping the pattern's aspect ratio. */
  const fitToArea = () => {
    const widthLimit = stitchesFromPhysical(usableArea.widthCm, pattern.fabricCount)
    const heightLimit = stitchesFromPhysical(usableArea.heightCm, pattern.fabricCount)
    const ratio = Math.min(widthLimit / pattern.width, heightLimit / pattern.height)
    updateSettings({
      widthStitches: Math.max(10, Math.floor(pattern.width * ratio)),
      heightStitches: Math.max(10, Math.floor(pattern.height * ratio)),
    })
  }

  return (
    <div className="page page--split">
      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="shirt" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Onde vai ser usado</h2>
              <p>Escolha a peça para conferir a escala</p>
            </div>
          </div>

          <div className="option-grid">
            {APPLICATION_TEMPLATES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={option.id === templateId ? 'option-card active' : 'option-card'}
                onClick={() => setTemplateId(option.id)}
              >
                <Icon name="shirt" size={18} />
                <div className="option-card__name">{option.name}</div>
                <div className="option-card__meta">
                  útil {option.usableArea.widthCm}×{option.usableArea.heightCm}cm
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">Conferência de escala</p>
          <div className="metric-grid">
            <div className="metric metric--accent">
              <div className="metric__label">Seu padrão</div>
              <div className="metric__value">
                {patternWidthCm.toFixed(1)}×{patternHeightCm.toFixed(1)}
                <small>cm</small>
              </div>
            </div>
            <div className="metric">
              <div className="metric__label">Área útil</div>
              <div className="metric__value">
                {usableArea.widthCm}×{usableArea.heightCm}
                <small>cm</small>
              </div>
            </div>
            <div className="metric">
              <div className="metric__label">Ocupação</div>
              <div className="metric__value">
                {Math.round((patternWidthCm / usableArea.widthCm) * 100)}
                <small>% da largura</small>
              </div>
            </div>
          </div>

          {fits ? (
            <Callout muted>O padrão cabe na área útil desta peça, no tamanho atual.</Callout>
          ) : (
            <>
              <p className="hint hint--warning">
                O padrão é maior que a área útil — abaixo ele aparece reduzido só para visualização.
              </p>
              <button type="button" className="btn btn--primary btn--block" onClick={fitToArea} style={{ marginTop: 12 }}>
                Ajustar para caber
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="panel-head">
          <span className="icon-tile icon-tile--sm">
            <Icon name="ruler" size={17} />
          </span>
          <div className="panel-head__text">
            <h2>{template.name}</h2>
            <p>Desenho em escala real — o tracejado marca a área bordável</p>
          </div>
        </div>

        <svg viewBox={`0 0 ${template.widthCm} ${template.heightCm}`} className="application-svg">
          <ApplicationSilhouette templateId={template.id} />
          <rect
            x={usableArea.xCm}
            y={usableArea.yCm}
            width={usableArea.widthCm}
            height={usableArea.heightCm}
            className="application-usable-area"
          />
          <image href={previewUrl} x={drawX} y={drawY} width={drawWidth} height={drawHeight} className="application-pattern-image" />
        </svg>

        <div className="canvas-footer">
          <span>
            Peça {template.widthCm} × {template.heightCm} cm
          </span>
          <span className="canvas-footer__scale">
            {fits ? 'escala 1:1' : `reduzido a ${Math.round(scale * 100)}%`}
          </span>
        </div>
      </div>
    </div>
  )
}
