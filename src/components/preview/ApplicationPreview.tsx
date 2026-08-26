import { useMemo, useState } from 'react'
import { APPLICATION_TEMPLATES, getApplicationTemplate } from '../../data/applications'
import { physicalFromStitches } from '../../lib/pattern/sizing'
import { renderPatternPreviewDataUrl } from '../../lib/pattern/renderPreviewImage'
import { useEditorStore } from '../../state/useEditorStore'
import { ApplicationSilhouette } from './ApplicationSilhouette'

export function ApplicationPreview() {
  const pattern = useEditorStore((s) => s.pattern)
  const compositedCells = useEditorStore((s) => s.compositedCells)
  const [templateId, setTemplateId] = useState(APPLICATION_TEMPLATES[0].id)
  const template = getApplicationTemplate(templateId) ?? APPLICATION_TEMPLATES[0]

  const previewUrl = useMemo(() => {
    if (!pattern || !compositedCells) return null
    return renderPatternPreviewDataUrl(compositedCells, pattern.width, pattern.height, pattern.palette)
  }, [pattern, compositedCells])

  if (!pattern || !previewUrl) {
    return (
      <div className="panel">
        <h2>Aplicação</h2>
        <p className="hint">Gere um padrão a partir de uma foto para testar o tamanho numa aplicação.</p>
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

  return (
    <div className="panel">
      <h2>Aplicação</h2>

      <label className="field">
        <span>Onde vai ser usado</span>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {APPLICATION_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <svg viewBox={`0 0 ${template.widthCm} ${template.heightCm}`} className="application-preview-svg">
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

      <p className={fits ? 'hint' : 'hint hint--warning'}>
        Seu padrão: {patternWidthCm.toFixed(1)}×{patternHeightCm.toFixed(1)}cm — área útil ({template.name}): {usableArea.widthCm}×
        {usableArea.heightCm}cm
        {!fits && ' — maior que a área, exibido reduzido; diminua o tamanho do padrão para caber de verdade'}
      </p>
    </div>
  )
}
