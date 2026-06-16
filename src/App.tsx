import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { DashboardPage } from './pages/DashboardPage'
import { KeywordsPage } from './pages/KeywordsPage'
import { ActivityLogPage } from './pages/ActivityLogPage'
import { SettingsPage } from './pages/SettingsPage'
import { AccountPage } from './pages/AccountPage'
import { useSettingsStore } from './stores/settingsStore'
import { useLogStore } from './stores/logStore'
import { useAutomationStore } from './stores/automationStore'

type Page = 'dashboard' | 'keywords' | 'logs' | 'settings' | 'account'

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  keywords: 'Keyword',
  logs: 'Activity Log',
  settings: 'Pengaturan',
  account: 'Akun',
}

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [version, setVersion] = useState('1.0.0')
  const { loadFromMain } = useSettingsStore()
  const { addLog } = useLogStore()
  const { setProfileStatus } = useAutomationStore()

  // Initialize on mount
  useEffect(() => {
    if (!window.electronAPI) return

    // Load settings
    void loadFromMain()

    // Get version
    window.electronAPI.getVersion().then((v) => setVersion(v)).catch(() => {})

    // Check account status
    window.electronAPI.checkAccount().then((result) => {
      setProfileStatus(result.exists ? 'ready' : 'not_set')
    }).catch(() => {})

    // Subscribe to logs from main process
    const unsubLog = window.electronAPI.onLog((entry) => {
      addLog(entry)
    })

    return () => {
      unsubLog()
    }
  }, [])

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        version={version}
      />

      <div className="main-area">
        <TopBar title={PAGE_TITLES[currentPage]} />

        <div className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              style={{ height: '100%' }}
            >
              {currentPage === 'dashboard' && <DashboardPage />}
              {currentPage === 'keywords' && <KeywordsPage />}
              {currentPage === 'logs' && <ActivityLogPage />}
              {currentPage === 'settings' && <SettingsPage />}
              {currentPage === 'account' && <AccountPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
