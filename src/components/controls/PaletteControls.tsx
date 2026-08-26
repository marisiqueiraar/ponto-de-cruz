import { useEditorStore } from '../../state/useEditorStore'

export function PaletteControls() {
  const settings = useEditorStore((s) => s.settings)
  const updateSettings = useEditorStore((s) => s.updateSettings)
  const viewMode = useEditorStore((s) => s.viewMode)
  const setViewMode = useEditorStore((s) => s.setViewMode)

  return (
    <div className="panel">
      <h2>Cores</h2>

      <label className="field">
        <span>Número de cores: {settings.colorCount}</span>
        <input
          type="range"
          min={2}
          max={50}
          value={settings.colorCount}
          onChange={(e) => updateSettings({ colorCount: Number(e.target.value) })}
        />
      </label>

      <div className="field">
        <span>Modo de visualização</span>
        <div className="segmented">
          <button type="button" className={viewMode === 'color' ? 'active' : ''} onClick={() => setViewMode('color')}>
            Cor
          </button>
          <button type="button" className={viewMode === 'symbol' ? 'active' : ''} onClick={() => setViewMode('symbol')}>
            Símbolo (P&B)
          </button>
        </div>
      </div>

      <p className="hint">Cores aproximadas de linha de bordado (compatível com codificação DMC); DMC é marca de terceiros.</p>
    </div>
  )
}
