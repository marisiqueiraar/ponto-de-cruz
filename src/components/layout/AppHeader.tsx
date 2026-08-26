import { Icon } from '../common/Icon'
import { GlobalSearch } from './GlobalSearch'
import type { TabId } from '../../navigation'

interface AppHeaderProps {
  onNavigate: (tab: TabId) => void
}

export function AppHeader({ onNavigate }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="brand">
          <span className="brand__mark">
            <Icon name="stitch" size={21} />
          </span>
          <span className="brand__name">Ponto de Cruz</span>
        </div>

        <GlobalSearch onNavigate={onNavigate} />
      </div>
    </header>
  )
}
