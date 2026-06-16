import React from 'react'
import { AutomationStatus, KeywordStatus } from '../types/index'

interface StatusBadgeProps {
  status: AutomationStatus | KeywordStatus
  compact?: boolean
}

const AUTOMATION_LABELS: Record<AutomationStatus, string> = {
  IDLE: 'Siap',
  LOADING_FILE: 'Memuat File',
  READY: 'Siap',
  LAUNCHING_BROWSER: 'Membuka Edge',
  RUNNING: 'Berjalan',
  PAUSING: 'Menjeda...',
  PAUSED: 'Dijeda',
  WAITING_FOR_USER: 'Menunggu Anda',
  STOPPING: 'Menghentikan...',
  STOPPED: 'Berhenti',
  COMPLETED: 'Selesai',
  ERROR: 'Error',
}

const KEYWORD_LABELS: Record<KeywordStatus, string> = {
  waiting: 'Menunggu',
  searching: 'Sedang dicari',
  success: 'Berhasil',
  failed: 'Gagal',
  skipped: 'Dilewati',
}

function getStatusColor(status: AutomationStatus | KeywordStatus): string {
  const colorMap: Record<string, string> = {
    IDLE: 'var(--status-idle)',
    LOADING_FILE: 'var(--status-ready)',
    READY: 'var(--status-ready)',
    LAUNCHING_BROWSER: 'var(--status-running)',
    RUNNING: 'var(--status-running)',
    PAUSING: 'var(--status-paused)',
    PAUSED: 'var(--status-paused)',
    WAITING_FOR_USER: 'var(--status-waiting)',
    STOPPING: 'var(--status-stopped)',
    STOPPED: 'var(--status-stopped)',
    COMPLETED: 'var(--status-completed)',
    ERROR: 'var(--status-error)',
    waiting: 'var(--status-idle)',
    searching: 'var(--status-running)',
    success: 'var(--status-completed)',
    failed: 'var(--status-error)',
    skipped: 'var(--status-stopped)',
  }
  return colorMap[status] ?? 'var(--status-idle)'
}

function isAnimated(status: AutomationStatus | KeywordStatus): boolean {
  return ['RUNNING', 'LAUNCHING_BROWSER', 'searching', 'PAUSING', 'STOPPING'].includes(status)
}

function getLabel(status: AutomationStatus | KeywordStatus): string {
  if (status in AUTOMATION_LABELS) return AUTOMATION_LABELS[status as AutomationStatus]
  if (status in KEYWORD_LABELS) return KEYWORD_LABELS[status as KeywordStatus]
  return status
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, compact = false }) => {
  const color = getStatusColor(status)
  const animated = isAnimated(status)
  const label = getLabel(status)

  if (compact) {
    return (
      <span style={{ color, fontWeight: 500 }}>{label}</span>
    )
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 10px',
      borderRadius: 20,
      background: `${color}18`,
      border: `1px solid ${color}30`,
      fontSize: 12,
      fontWeight: 500,
      color,
    }}>
      <span
        className={`status-dot ${animated ? 'status-dot-pulse' : ''}`}
        style={{ background: color, color }}
      />
      {label}
    </span>
  )
}
