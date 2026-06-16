import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Clock, Target, CheckCircle2, XCircle,
  Search, Zap, TrendingUp,
} from 'lucide-react'
import { useAutomationStore } from '../stores/automationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useLogStore } from '../stores/logStore'
import { StatusBadge } from '../components/StatusBadge'
import { ProgressBar } from '../components/ProgressBar'
import { ControlButtons } from '../components/ControlButtons'
import { CaptchaNotice } from '../components/CaptchaNotice'

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}j ${m}m ${s}d`
  if (m > 0) return `${m}m ${s}d`
  return `${s}d`
}

export const DashboardPage: React.FC = () => {
  const store = useAutomationStore()
  const { settings } = useSettingsStore()
  const { logs } = useLogStore()

  const {
    status,
    keywords,
    completedKeywords,
    failedKeywords,
    currentKeywordIndex,
    elapsedMs,
    etaMs,
    errorMessage,
  } = store

  const totalKeywords = keywords.length
  const progressPct = totalKeywords > 0
    ? Math.round(((completedKeywords + failedKeywords) / totalKeywords) * 100)
    : 0

  const currentKeyword = keywords[currentKeywordIndex] ?? null

  // ── Event listeners dari main process ─────────────────────
  useEffect(() => {
    if (!window.electronAPI) return

    const unsubState = window.electronAPI.onStateUpdate((data) => {
      store.setStatus(data.status)
      if (data.completedKeywords !== undefined) {
        // Update individual fields via zustand setState
        useAutomationStore.setState({
          completedKeywords: data.completedKeywords ?? store.completedKeywords,
          failedKeywords: data.failedKeywords ?? store.failedKeywords,
          currentKeywordIndex: data.currentKeywordIndex ?? store.currentKeywordIndex,
          etaMs: data.etaMs ?? null,
          errorMessage: data.errorMessage ?? null,
        })
      }
      if (data.profileStatus) {
        store.setProfileStatus(data.profileStatus)
      }
      // Timer management
      if (data.status === 'RUNNING' || data.status === 'LAUNCHING_BROWSER') {
        store.startTimer()
      } else if (['STOPPED', 'COMPLETED', 'ERROR', 'PAUSED'].includes(data.status)) {
        store.stopTimer()
      }
    })

    const unsubKeyword = window.electronAPI.onKeywordUpdate((data) => {
      store.updateKeywordStatus(data.id, data.status, data.duration, data.message)
    })

    return () => {
      unsubState()
      unsubKeyword()
    }
  }, [])

  // ── Control handlers ───────────────────────────────────────
  const handleStart = async () => {
    if (keywords.length === 0) return

    // Reset statuses jika sebelumnya sudah selesai
    if (['COMPLETED', 'STOPPED', 'ERROR'].includes(status)) {
      store.resetKeywordStatuses()
    }

    store.setStatus('LAUNCHING_BROWSER')
    store.resetTimer()

    const startFromIndex = settings.resumeFromLastIndex
      ? store.getNextPendingIndex()
      : 0

    const result = await window.electronAPI.startAutomation({
      keywords: useAutomationStore.getState().keywords,
      settings,
      startFromIndex,
    })

    if (!result.success) {
      store.setStatus('ERROR', { errorMessage: result.error ?? 'Gagal memulai automasi' })
    }
  }

  const handlePause = async () => {
    store.setStatus('PAUSING')
    await window.electronAPI.pauseAutomation()
  }

  const handleResume = async () => {
    store.setStatus('RUNNING')
    store.startTimer()
    await window.electronAPI.resumeAutomation()
  }

  const handleStop = async () => {
    store.setStatus('STOPPING')
    store.stopTimer()
    await window.electronAPI.stopAutomation()
  }

  const handleCaptchaResolved = async () => {
    await window.electronAPI.captchaResolved()
  }

  // Recent logs (dashboard preview)
  const recentLogs = logs.slice(-5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* CAPTCHA Notice */}
      <CaptchaNotice status={status} onResolved={handleCaptchaResolved} />

      {/* Error notice */}
      <AnimatePresence>
        {status === 'ERROR' && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'rgba(248, 113, 113, 0.08)',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--status-error)',
            }}
          >
            <strong>Error:</strong> {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1: Status + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        {/* Bot Status */}
        <div className="card" style={{ gridColumn: '1 / 3' }}>
          <div className="card-title">Status Bot</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.div
              animate={status === 'RUNNING' ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 2, repeat: status === 'RUNNING' ? Infinity : 0, ease: 'linear' }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'var(--accent-primary-muted)',
                border: '1px solid var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={26} color="var(--accent-primary)" strokeWidth={1.5} />
            </motion.div>
            <div>
              <StatusBadge status={status} />
              {currentKeyword && ['RUNNING', 'PAUSED'].includes(status) && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  Keyword: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {currentKeyword.keyword}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="card card-sm">
          <div className="card-title">Total</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalKeywords}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>keyword</div>
        </div>

        {/* Progress */}
        <div className="card card-sm">
          <div className="card-title">Selesai</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--status-running)' }}>
            {completedKeywords}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            dari {totalKeywords}
          </div>
        </div>
      </div>

      {/* Row 2: Progress bar + Stats */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            <TrendingUp size={12} style={{ display: 'inline', marginRight: 5 }} />
            Progress
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-primary)' }}>
            {progressPct}%
          </span>
        </div>
        <ProgressBar value={progressPct} height={8} />

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
          <Stat icon={<CheckCircle2 size={14} color="var(--status-running)" />} label="Berhasil" value={completedKeywords} color="var(--status-running)" />
          <Stat icon={<XCircle size={14} color="var(--status-error)" />} label="Gagal" value={failedKeywords} color="var(--status-error)" />
          <Stat icon={<Clock size={14} color="var(--status-ready)" />} label="Waktu Berjalan" value={formatDuration(elapsedMs)} color="var(--status-ready)" />
          <Stat
            icon={<Target size={14} color="var(--status-paused)" />}
            label="Estimasi Sisa"
            value={etaMs !== null && etaMs > 0 ? formatDuration(etaMs) : '—'}
            color="var(--status-paused)"
          />
        </div>
      </div>

      {/* Row 3: Current keyword */}
      {currentKeyword && ['RUNNING', 'PAUSED', 'PAUSING'].includes(status) && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card-title">
            <Search size={12} style={{ display: 'inline', marginRight: 5 }} />
            Keyword Saat Ini
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--bg-elevated)',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--text-primary)',
            }}>
              {currentKeyword.keyword}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
              {currentKeywordIndex + 1} / {totalKeywords}
            </div>
          </div>
        </motion.div>
      )}

      {/* Row 4: Control buttons */}
      <div className="card">
        <div className="card-title">
          <Zap size={12} style={{ display: 'inline', marginRight: 5 }} />
          Kontrol Automasi
        </div>
        <ControlButtons
          status={status}
          hasKeywords={keywords.length > 0}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
        />
      </div>

      {/* Row 5: Recent log */}
      {recentLogs.length > 0 && (
        <div className="card">
          <div className="card-title">Log Terbaru</div>
          <div className="log-panel" style={{ maxHeight: 120, overflowY: 'auto' }}>
            {recentLogs.map((entry) => (
              <div key={entry.id} className="log-entry">
                <span className="log-timestamp">[{entry.timestamp}]</span>
                <span className={`log-level-${entry.level}`}>[{entry.level}]</span>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Small stat card ─────────────────────────────────────────
interface StatProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}
const Stat: React.FC<StatProps> = ({ icon, label, value, color }) => (
  <div style={{
    background: 'var(--bg-elevated)',
    borderRadius: 10,
    padding: '10px 12px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {icon}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
  </div>
)
