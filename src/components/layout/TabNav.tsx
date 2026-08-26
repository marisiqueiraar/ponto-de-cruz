import { Icon } from '../common/Icon'
import { TABS, type TabId } from '../../navigation'

interface TabNavProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Seções">
      <div className="tab-nav__bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={active === tab.id ? 'tab-nav__item active' : 'tab-nav__item'}
            aria-current={active === tab.id ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
          >
            <Icon name={tab.icon} size={17} />
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
