import { FABRIC_COUNTS, physicalFromStitches, stitchesFromPhysical } from '../../lib/pattern/sizing'
import { useEditorStore } from '../../state/useEditorStore'

export function SizeControls() {
  const settings = useEditorStore((s) => s.settings)
  const updateSettings = useEditorStore((s) => s.updateSettings)

  const widthCm = physicalFromStitches(settings.widthStitches, settings.fabricCount)
  const heightCm = physicalFromStitches(settings.heightStitches, settings.fabricCount)

  return (
    <div className="panel">
      <h2>Tamanho</h2>

      <label className="field">
        <span>Contagem do tecido (pontos/polegada)</span>
        <select
          value={settings.fabricCount}
          onChange={(e) => updateSettings({ fabricCount: Number(e.target.value) })}
        >
          {FABRIC_COUNTS.map((count) => (
            <option key={count} value={count}>
              Aida {count}
            </option>
          ))}
        </select>
      </label>

      <label className="field checkbox-field">
        <input
          type="checkbox"
          checked={settings.lockAspectRatio}
          onChange={(e) => updateSettings({ lockAspectRatio: e.target.checked })}
        />
        <span>Travar proporção</span>
      </label>

      <label className="field">
        <span>Largura: {settings.widthStitches} pontos ({widthCm.toFixed(1)} cm)</span>
        <input
          type="range"
          min={10}
          max={400}
          value={settings.widthStitches}
          onChange={(e) => updateSettings({ widthStitches: Number(e.target.value) })}
        />
      </label>

      <label className="field">
        <span>Altura: {settings.heightStitches} pontos ({heightCm.toFixed(1)} cm)</span>
        <input
          type="range"
          min={10}
          max={400}
          value={settings.heightStitches}
          onChange={(e) => updateSettings({ heightStitches: Number(e.target.value) })}
        />
      </label>

      <label className="field">
        <span>Largura física (cm)</span>
        <input
          type="number"
          min={1}
          step={0.5}
          value={widthCm.toFixed(1)}
          onChange={(e) =>
            updateSettings({ widthStitches: stitchesFromPhysical(Number(e.target.value), settings.fabricCount) })
          }
        />
      </label>
    </div>
  )
}
