import { useEffect, useState } from 'react'
import { EngineStatusPanel } from './components/common/EngineStatusPanel'
import { PaletteControls } from './components/controls/PaletteControls'
import { SizeControls } from './components/controls/SizeControls'
import { TextToolPanel } from './components/controls/TextToolPanel'
import { PrintPanel } from './components/print/PrintPanel'
import { ApplicationPreview } from './components/preview/ApplicationPreview'
import { ImageUploader } from './components/upload/ImageUploader'
import { ColorCountTable } from './components/viewer/ColorCountTable'
import { PatternCanvas } from './components/viewer/PatternCanvas'
import { useEditorStore } from './state/useEditorStore'
import { useFontLibraryStore } from './state/useFontLibraryStore'

const TABS = [
  { id: 'gerador', label: 'Gerador' },
  { id: 'aplicacao', label: 'Aplicação' },
  { id: 'imprimir', label: 'Imprimir' },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const restoreLastSession = useEditorStore((s) => s.restoreLastSession)
  const pattern = useEditorStore((s) => s.pattern)
  const compositedCells = useEditorStore((s) => s.compositedCells)
  const viewMode = useEditorStore((s) => s.viewMode)
  const engineStatus = useEditorStore((s) => s.engineStatus)
  const engineMessage = useEditorStore((s) => s.engineMessage)
  const renamePattern = useEditorStore((s) => s.renamePattern)
  const loadCustomFonts = useFontLibraryStore((s) => s.loadCustomFonts)
  const [activeTab, setActiveTab] = useState<TabId>('gerador')

  useEffect(() => {
    void restoreLastSession()
    void loadCustomFonts()
  }, [restoreLastSession, loadCustomFonts])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand__mark" aria-hidden="true" />
          <h1>Ponto de Cruz</h1>
        </div>
        {pattern && (
          <input className="pattern-name-input" value={pattern.name} onChange={(e) => renamePattern(e.target.value)} />
        )}
        <div className="app-header__status">
          <EngineStatusPanel status={engineStatus} message={engineMessage} />
        </div>
      </header>

      <nav className="app-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'app-tabs__item active' : 'app-tabs__item'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'gerador' && (
        <div className="app-body app-body--split">
          <aside className="app-sidebar">
            <ImageUploader />
            <SizeControls />
            <PaletteControls />
            <TextToolPanel />
          </aside>
          <main className="app-main">
            <PatternCanvas
              cells={compositedCells}
              width={pattern?.width ?? 0}
              height={pattern?.height ?? 0}
              palette={pattern?.palette ?? []}
              viewMode={viewMode}
            />
            <ColorCountTable palette={pattern?.palette ?? []} />
          </main>
        </div>
      )}

      {activeTab === 'aplicacao' && (
        <div className="app-body app-body--centered">
          <ApplicationPreview />
        </div>
      )}

      {activeTab === 'imprimir' && (
        <div className="app-body app-body--centered">
          <PrintPanel />
        </div>
      )}
    </div>
  )
}

export default App
