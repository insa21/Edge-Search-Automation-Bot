import React from 'react'
import {
  LayoutDashboard,
  List,
  Activity,
  Settings,
  User,
  Bot,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'

type Page = 'dashboard' | 'keywords' | 'logs' | 'settings' | 'account'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  version: string
}

const navItems: { page: Page; label: string; icon: LucideIcon }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'keywords', label: 'Keyword', icon: List },
  { page: 'logs', label: 'Activity Log', icon: Activity },
  { page: 'settings', label: 'Pengaturan', icon: Settings },
  { page: 'account', label: 'Akun', icon: User },
]

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, version }) => {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={18} color="white" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Edge Search
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
              Bot Automation
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8 }}>
        {navItems.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            className={`nav-item ${currentPage === page ? 'active' : ''}`}
            onClick={() => onNavigate(page)}
          >
            <Icon size={16} strokeWidth={2} />
            <span style={{ flex: 1 }}>{label}</span>
            {currentPage === page && (
              <ChevronRight size={12} strokeWidth={2.5} style={{ opacity: 0.6 }} />
            )}
          </button>
        ))}
      </nav>

      {/* Version */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}>
        v{version}
      </div>
    </aside>
  )
}
