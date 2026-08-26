import { useEffect } from 'react'
import { EngineStatusPanel } from './components/common/EngineStatusPanel'
import { PaletteControls } from './components/controls/PaletteControls'
import { SizeControls } from './components/controls/SizeControls'
import { TextToolPanel } from './components/controls/TextToolPanel'
import { ImageUploader } from './components/upload/ImageUploader'
import { ColorCountTable } from './components/viewer/ColorCountTable'
import { PatternCanvas } from './components/viewer/PatternCanvas'
import { useEditorStore } from './state/useEditorStore'

function App() {
  const restoreLastSession = useEditorStore((s) => s.restoreLastSession)
  const pattern = useEditorStore((s) => s.pattern)
  const compositedCells = useEditorStore((s) => s.compositedCells)
  const viewMode = useEditorStore((s) => s.viewMode)
  const engineStatus = useEditorStore((s) => s.engineStatus)
  const engineMessage = useEditorStore((s) => s.engineMessage)
  const renamePattern = useEditorStore((s) => s.renamePattern)

  useEffect(() => {
    void restoreLastSession()
  }, [restoreLastSession])

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Ponto de Cruz</h1>
        {pattern && (
          <input
            className="pattern-name-input"
            value={pattern.name}
            onChange={(e) => renamePattern(e.target.value)}
          />
        )}
      </header>

      <aside className="app-sidebar">
        <ImageUploader />
        <SizeControls />
        <PaletteControls />
        <TextToolPanel />
      </aside>

      <main className="app-main">
        <EngineStatusPanel status={engineStatus} message={engineMessage} />
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
  )
}

export default App
