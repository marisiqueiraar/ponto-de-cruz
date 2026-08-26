import { useRef, type ChangeEvent } from 'react'
import { Callout, SectionHead, SliderControl, ToggleRow } from '../components/common/controls'
import { EngineStatusPanel } from '../components/common/EngineStatusPanel'
import { Icon } from '../components/common/Icon'
import { PaletteSection } from '../components/controls/PaletteSection'
import { TextToolPanel } from '../components/controls/TextToolPanel'
import { ColorCountTable } from '../components/viewer/ColorCountTable'
import { PatternCanvas } from '../components/viewer/PatternCanvas'
import { FABRIC_COUNTS, physicalFromStitches, stitchesFromPhysical } from '../lib/pattern/sizing'
import { recommendedStrands } from '../lib/stitch/flossEstimate'
import { useEditorStore } from '../state/useEditorStore'

export function GeneratorPage() {
  const settings = useEditorStore((s) => s.settings)
  const updateSettings = useEditorStore((s) => s.updateSettings)
  const loadImageFile = useEditorStore((s) => s.loadImageFile)
  const pattern = useEditorStore((s) => s.pattern)
  const compositedCells = useEditorStore((s) => s.compositedCells)
  const viewMode = useEditorStore((s) => s.viewMode)
  const setViewMode = useEditorStore((s) => s.setViewMode)
  const engineStatus = useEditorStore((s) => s.engineStatus)
  const engineMessage = useEditorStore((s) => s.engineMessage)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void loadImageFile(file)
    event.target.value = ''
  }

  const widthCm = physicalFromStitches(settings.widthStitches, settings.fabricCount)
  const heightCm = physicalFromStitches(settings.heightStitches, settings.fabricCount)
  const totalStitches = settings.widthStitches * settings.heightStitches

  return (
    <div className="page page--split">
      <div className="stack">
        <div className="card">
          <Callout>
            <strong>Como funciona:</strong> envie uma foto → ajuste tamanho e cores → confira na aba Aplicação → gere o PDF
            na aba Imprimir.
          </Callout>

          <SectionHead>1. Imagem de origem</SectionHead>
          <button type="button" className="btn btn--primary btn--block" onClick={() => inputRef.current?.click()}>
            <Icon name="photo" size={17} />
            {pattern ? 'Trocar foto' : 'Enviar foto'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />

          <SectionHead>2. Tecido e tamanho</SectionHead>

          <div className="control">
            <div className="control__top">
              <span className="control__label">Contagem do tecido</span>
              <span className="help-dot" title="Pontos por polegada. Quanto maior a contagem, menor cada ponto — e menor o bordado final.">
                ?
              </span>
              <span className="value-chip">{recommendedStrands(settings.fabricCount)} fios</span>
            </div>
            <select
              value={settings.fabricCount}
              aria-label="Contagem do tecido"
              onChange={(e) => updateSettings({ fabricCount: Number(e.target.value) })}
              style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8 }}
            >
              {FABRIC_COUNTS.map((count) => (
                <option key={count} value={count}>
                  Aida {count} — {count} pontos/pol
                </option>
              ))}
            </select>
          </div>

          <ToggleRow
            label="Travar proporção da foto"
            checked={settings.lockAspectRatio}
            onChange={(checked) => updateSettings({ lockAspectRatio: checked })}
          />

          <SliderControl
            label="Largura"
            value={settings.widthStitches}
            min={10}
            max={400}
            display={`${widthCm.toFixed(1)} cm`}
            minLabel="10 pts"
            maxLabel="400 pts"
            onChange={(value) => updateSettings({ widthStitches: value })}
          />

          <SliderControl
            label="Altura"
            value={settings.heightStitches}
            min={10}
            max={400}
            display={`${heightCm.toFixed(1)} cm`}
            minLabel="10 pts"
            maxLabel="400 pts"
            onChange={(value) => updateSettings({ heightStitches: value })}
          />

          <div className="control">
            <div className="control__top">
              <span className="control__label">Definir pela medida física</span>
              <span className="value-chip">cm</span>
            </div>
            <div className="control-row">
              <label className="field" style={{ margin: 0 }}>
                <span>Largura</span>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={widthCm.toFixed(1)}
                  onChange={(e) => updateSettings({ widthStitches: stitchesFromPhysical(Number(e.target.value), settings.fabricCount) })}
                />
              </label>
              <label className="field" style={{ margin: 0 }}>
                <span>Altura</span>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={heightCm.toFixed(1)}
                  onChange={(e) => updateSettings({ heightStitches: stitchesFromPhysical(Number(e.target.value), settings.fabricCount) })}
                />
              </label>
            </div>
          </div>

          <div className="stat-card stat-card--blue">
            <span className="stat-card__glyph">
              <Icon name="grid" size={20} />
            </span>
            <div>
              <div className="stat-card__eyebrow">Total de pontos</div>
              <div className="stat-card__value">{totalStitches.toLocaleString('pt-BR')}</div>
              <div className="stat-card__note">
                {widthCm.toFixed(1)} × {heightCm.toFixed(1)} cm em Aida {settings.fabricCount}
              </div>
            </div>
          </div>
        </div>

        <PaletteSection />
        <TextToolPanel />
      </div>

      <div className="stack">
        <div className="card">
          <div className="panel-head">
            <span className="icon-tile icon-tile--sm">
              <Icon name="grid" size={17} />
            </span>
            <div className="panel-head__text">
              <h2>Gráfico do padrão</h2>
              <EngineStatusPanel status={engineStatus} message={engineMessage} />
            </div>
            <div className="panel-head__actions">
              <button
                type="button"
                className={viewMode === 'color' ? 'btn btn--ghost active' : 'btn btn--ghost'}
                onClick={() => setViewMode('color')}
              >
                Cor
              </button>
              <button
                type="button"
                className={viewMode === 'symbol' ? 'btn btn--ghost active' : 'btn btn--ghost'}
                onClick={() => setViewMode('symbol')}
              >
                Símbolos
              </button>
            </div>
          </div>

          <PatternCanvas
            cells={compositedCells}
            width={pattern?.width ?? 0}
            height={pattern?.height ?? 0}
            palette={pattern?.palette ?? []}
            viewMode={viewMode}
          />

          <div className="canvas-footer">
            <span>Linhas grossas a cada 10 pontos</span>
            {pattern && (
              <span>
                · {pattern.width} × {pattern.height} pts
              </span>
            )}
            <span className="canvas-footer__scale">
              Aida {settings.fabricCount}
              <span className="canvas-footer__ruler" />
            </span>
          </div>
        </div>

        <ColorCountTable palette={pattern?.palette ?? []} />
      </div>
    </div>
  )
}
