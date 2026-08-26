import { EngineStatusPanel } from '../common/EngineStatusPanel'
import { Icon } from '../common/Icon'
import { useEditorStore } from '../../state/useEditorStore'

export function AppHeader() {
  const pattern = useEditorStore((s) => s.pattern)
  const renamePattern = useEditorStore((s) => s.renamePattern)
  const settings = useEditorStore((s) => s.settings)
  const engineStatus = useEditorStore((s) => s.engineStatus)
  const engineMessage = useEditorStore((s) => s.engineMessage)

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="brand">
          <span className="brand__mark">
            <Icon name="stitch" size={21} />
          </span>
          <span className="brand__name">Ponto de Cruz</span>
          <span className="badge-version">v1.0</span>
        </div>

        {pattern && (
          <input
            className="pattern-name-input"
            value={pattern.name}
            aria-label="Nome do padrão"
            onChange={(e) => renamePattern(e.target.value)}
          />
        )}

        <div className="header-right">
          <EngineStatusPanel status={engineStatus} message={engineMessage} />
          <div className="header-chip">
            TECIDO: <strong>AIDA {settings.fabricCount}</strong>
          </div>
        </div>
      </div>
    </header>
  )
}
