import React from 'react'
import { Sun, Moon, Monitor, Globe } from 'lucide-react'
import { useAutomationStore } from '../stores/automationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { StatusBadge } from './StatusBadge'

interface TopBarProps {
  title: string
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { status, profileStatus } = useAutomationStore()
  const { settings, setTheme } = useSettingsStore()

  const toggleTheme = () => {
    const next = settings.theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  return (
    <header className="topbar">
      {/* Page title */}
      <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
        {title}
      </h1>

      {/* Edge Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
      }}>
        <Globe size={13} color="var(--text-muted)" />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Edge: <StatusBadge status={status} compact />
        </span>
      </div>

      {/* Account Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
      }}>
        <Monitor size={13} color="var(--text-muted)" />
        <span style={{ fontSize: 12, color: profileStatus === 'ready' ? 'var(--status-running)' : 'var(--text-muted)' }}>
          {profileStatus === 'ready' ? 'Akun tersimpan' : 'Belum login'}
        </span>
      </div>

      {/* Theme toggle */}
      <button
        className="btn btn-secondary btn-icon"
        onClick={toggleTheme}
        title={settings.theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      >
        {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </header>
  )
}
