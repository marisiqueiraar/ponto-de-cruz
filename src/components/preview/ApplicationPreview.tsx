import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { ApplicationSilhouette } from './ApplicationSilhouette'
import { Icon } from '../common/Icon'
import { APPLICATION_TEMPLATES, getApplicationTemplate } from '../../data/applications'
import { physicalFromStitches } from '../../lib/pattern/sizing'
import { renderPatternPreviewDataUrl } from '../../lib/pattern/renderPreviewImage'
import { useEditorStore } from '../../state/useEditorStore'

interface ApplicationPreviewProps {
  /** Piece to open on, from the chosen objective. */
  defaultTemplateId?: string
}

/** Places the stitched design anywhere on a garment or object, at true relative scale. */
export function ApplicationPreview({ defaultTemplateId }: ApplicationPreviewProps) {
  const pattern = useEditorStore((s) => s.pattern)
  const compositedCells = useEditorStore((s) => s.compositedCells)
  const updateSettings = useEditorStore((s) => s.updateSettings)

  const [templateId, setTemplateId] = useState(
    defaultTemplateId && getApplicationTemplate(defaultTemplateId) ? defaultTemplateId : APPLICATION_TEMPLATES[0].id,
  )
  const template = getApplicationTemplate(templateId) ?? APPLICATION_TEMPLATES[0]

  /** Design centre on the piece, in cm from its top-left. Free placement, not locked to a slot. */
  const [placement, setPlacement] = useState({ xCm: template.widthCm / 2, yCm: template.heightCm / 2 })
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef(false)

  const previewUrl = useMemo(() => {
    if (!pattern || !compositedCells) return null
    return renderPatternPreviewDataUrl(compositedCells, pattern.width, pattern.height, pattern.palette)
  }, [pattern, compositedCells])

  if (!pattern || !previewUrl) {
    return <p className="hint">Gere o padrão para testá-lo sobre a peça.</p>
  }

  const designWidthCm = physicalFromStitches(pattern.width, pattern.fabricCount)
  const designHeightCm = physicalFromStitches(pattern.height, pattern.fabricCount)

  /** Converts a pointer position into cm on the piece, using the SVG's own viewBox scale. */
  const toPieceCm = (event: PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    // The viewBox is letterboxed by preserveAspectRatio, so derive the drawn area first.
    const scale = Math.min(rect.width / template.widthCm, rect.height / template.heightCm)
    const drawnW = template.widthCm * scale
    const drawnH = template.heightCm * scale
    const offsetX = (rect.width - drawnW) / 2
    const offsetY = (rect.height - drawnH) / 2
    return {
      xCm: (event.clientX - rect.left - offsetX) / scale,
      yCm: (event.clientY - rect.top - offsetY) / scale,
    }
  }

  const clampPlacement = (xCm: number, yCm: number) => ({
    xCm: Math.max(designWidthCm / 2, Math.min(template.widthCm - designWidthCm / 2, xCm)),
    yCm: Math.max(designHeightCm / 2, Math.min(template.heightCm - designHeightCm / 2, yCm)),
  })

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = toPieceCm(event)
    if (point) setPlacement(clampPlacement(point.xCm, point.yCm))
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return
    const point = toPieceCm(event)
    if (point) setPlacement(clampPlacement(point.xCm, point.yCm))
  }

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    draggingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const drawX = placement.xCm - designWidthCm / 2
  const drawY = placement.yCm - designHeightCm / 2
  const tooBig = designWidthCm > template.widthCm || designHeightCm > template.heightCm

  const fitToPiece = () => {
    const ratio = Math.min(template.usableArea.widthCm / designWidthCm, template.usableArea.heightCm / designHeightCm)
    updateSettings({
      widthStitches: Math.max(10, Math.floor(pattern.width * ratio)),
      heightStitches: Math.max(10, Math.floor(pattern.height * ratio)),
    })
  }

  return (
    <>
      <label className="field">
        <span>Peça</span>
        <select
          value={templateId}
          onChange={(e) => {
            const next = getApplicationTemplate(e.target.value)
            setTemplateId(e.target.value)
            if (next) setPlacement({ xCm: next.widthCm / 2, yCm: next.heightCm / 2 })
          }}
        >
          {APPLICATION_TEMPLATES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${template.widthCm} ${template.heightCm}`}
        className="application-svg application-svg--draggable"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <ApplicationSilhouette templateId={template.id} />
        <rect
          x={template.usableArea.xCm}
          y={template.usableArea.yCm}
          width={template.usableArea.widthCm}
          height={template.usableArea.heightCm}
          className="application-usable-area"
        />
        <image href={previewUrl} x={drawX} y={drawY} width={designWidthCm} height={designHeightCm} className="application-pattern-image" />
        <rect x={drawX} y={drawY} width={designWidthCm} height={designHeightCm} className="application-selection" />
      </svg>

      <p className="hint hint--mono">Clique ou arraste sobre a peça para posicionar o bordado</p>

      <div className="metric-grid" style={{ marginTop: 12 }}>
        <div className="metric metric--accent">
          <div className="metric__label">Tamanho do bordado</div>
          <div className="metric__value">
            {designWidthCm.toFixed(1)}×{designHeightCm.toFixed(1)}
            <small>cm</small>
          </div>
        </div>
        <div className="metric">
          <div className="metric__label">Da esquerda</div>
          <div className="metric__value">
            {drawX.toFixed(1)}
            <small>cm</small>
          </div>
        </div>
        <div className="metric">
          <div className="metric__label">Do topo</div>
          <div className="metric__value">
            {drawY.toFixed(1)}
            <small>cm</small>
          </div>
        </div>
        <div className="metric">
          <div className="metric__label">Peça</div>
          <div className="metric__value">
            {template.widthCm}×{template.heightCm}
            <small>cm</small>
          </div>
        </div>
      </div>

      <div className="data-block">
        <span className="data-block__label">PARA MARCAR NA PEÇA</span>
        Centro do bordado a {placement.xCm.toFixed(1)} cm da borda esquerda e {placement.yCm.toFixed(1)} cm do topo.
        <br />
        Comece pelo centro: {pattern.width} × {pattern.height} pontos em Aida {pattern.fabricCount}.
      </div>

      {tooBig && (
        <>
          <p className="hint hint--warning">O bordado é maior que a peça inteira nesse tamanho.</p>
          <button type="button" className="btn btn--outline btn--block" style={{ marginTop: 10 }} onClick={fitToPiece}>
            <Icon name="ruler" size={16} />
            Reduzir para caber na área útil
          </button>
        </>
      )}
    </>
  )
}
