import { useEffect, useState } from 'react'
import { AppFooter } from './components/layout/AppFooter'
import { AppHeader } from './components/layout/AppHeader'
import { TabNav } from './components/layout/TabNav'
import { CreatePage } from './pages/CreatePage'
import { GuidePage } from './pages/GuidePage'
import { ReferencesPage } from './pages/ReferencesPage'
import { useEditorStore } from './state/useEditorStore'
import { useFlowStore } from './state/useFlowStore'
import { useFontLibraryStore } from './state/useFontLibraryStore'
import { useMatStore } from './state/useMatStore'
import type { TabId } from './navigation'

function App() {
  const restoreLastSession = useEditorStore((s) => s.restoreLastSession)
  const loadCustomFonts = useFontLibraryStore((s) => s.loadCustomFonts)
  const loadMat = useMatStore((s) => s.loadOrCreate)
  const restoreFlow = useFlowStore((s) => s.restore)
  const [activeTab, setActiveTab] = useState<TabId>('criar')

  useEffect(() => {
    void restoreLastSession()
    void loadCustomFonts()
    void loadMat()
    void restoreFlow()
  }, [restoreLastSession, loadCustomFonts, loadMat, restoreFlow])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <div className="app-shell">
      <AppHeader onNavigate={setActiveTab} />
      <TabNav active={activeTab} onChange={setActiveTab} />

      {activeTab === 'criar' && <CreatePage />}
      {activeTab === 'referencias' && <ReferencesPage />}
      {activeTab === 'guia' && <GuidePage />}

      <AppFooter />
    </div>
  )
}

export default App
