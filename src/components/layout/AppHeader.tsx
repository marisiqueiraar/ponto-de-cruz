import { Icon } from '../common/Icon'
import { GlobalSearch } from './GlobalSearch'
import { useEditorStore } from '../../state/useEditorStore'
import type { TabId } from '../../navigation'

interface AppHeaderProps {
  onNavigate: (tab: TabId) => void
}

export function AppHeader({ onNavigate }: AppHeaderProps) {
  const pattern = useEditorStore((s) => s.pattern)
  const renamePattern = useEditorStore((s) => s.renamePattern)

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="brand">
          <span className="brand__mark">
            <Icon name="stitch" size={21} />
          </span>
          <span className="brand__name">Ponto de Cruz</span>
        </div>

        {pattern && (
          <input
            className="pattern-name-input"
            value={pattern.name}
            aria-label="Nome do padrão"
            onChange={(e) => renamePattern(e.target.value)}
          />
        )}

        <GlobalSearch onNavigate={onNavigate} />
      </div>
    </header>
  )
}
