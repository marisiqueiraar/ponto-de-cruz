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
import { PrintPage } from './pages/PrintPage'
import { useEditorStore } from './state/useEditorStore'
import { useFontLibraryStore } from './state/useFontLibraryStore'
import type { TabId } from './navigation'

function App() {
  const restoreLastSession = useEditorStore((s) => s.restoreLastSession)
  const loadCustomFonts = useFontLibraryStore((s) => s.loadCustomFonts)
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  useEffect(() => {
    void restoreLastSession()
    void loadCustomFonts()
  }, [restoreLastSession, loadCustomFonts])

  // Each tab is a distinct page of the tool; the generator holds the shared editor state.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <div className="app-shell">
      <AppHeader />
      <TabNav active={activeTab} onChange={setActiveTab} />

      {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
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
