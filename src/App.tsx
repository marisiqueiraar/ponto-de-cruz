import { useEffect, useState } from 'react'
import { AppFooter } from './components/layout/AppFooter'
import { AppHeader } from './components/layout/AppHeader'
import { TabNav } from './components/layout/TabNav'
import { ApplicationPage } from './pages/ApplicationPage'
import { CalculatorsPage } from './pages/CalculatorsPage'
import { DashboardPage } from './pages/DashboardPage'
import { GeneratorPage } from './pages/GeneratorPage'
import { GuidePage } from './pages/GuidePage'
import { LibraryPage } from './pages/LibraryPage'
import { MatPage } from './pages/MatPage'
import { PrintPage } from './pages/PrintPage'
import { useEditorStore } from './state/useEditorStore'
import { useFontLibraryStore } from './state/useFontLibraryStore'
import { useMatStore } from './state/useMatStore'
import type { TabId } from './navigation'

function App() {
  const restoreLastSession = useEditorStore((s) => s.restoreLastSession)
  const loadCustomFonts = useFontLibraryStore((s) => s.loadCustomFonts)
  const loadMat = useMatStore((s) => s.loadOrCreate)
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  useEffect(() => {
    void restoreLastSession()
    void loadCustomFonts()
    void loadMat()
  }, [restoreLastSession, loadCustomFonts, loadMat])

  // Each tab is a distinct page of the tool; the generator holds the shared editor state.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <div className="app-shell">
      <AppHeader onNavigate={setActiveTab} />
      <TabNav active={activeTab} onChange={setActiveTab} />

      {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
      {activeTab === 'moldura' && <MatPage />}
      {activeTab === 'gerador' && <GeneratorPage />}
      {activeTab === 'aplicacao' && <ApplicationPage onNavigate={setActiveTab} />}
      {activeTab === 'biblioteca' && <LibraryPage onNavigate={setActiveTab} />}
      {activeTab === 'calculadoras' && <CalculatorsPage />}
      {activeTab === 'guia' && <GuidePage />}
      {activeTab === 'imprimir' && <PrintPage onNavigate={setActiveTab} />}

      <AppFooter />
    </div>
  )
}

export default App
