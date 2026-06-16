import React, { useEffect, useRef } from 'react'
import { Trash2, Copy, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLogStore } from '../stores/logStore'
import { LogEntry } from '../types/index'

const LOG_LEVEL_LABELS = {
  INFO: 'INFO',
  SUCCESS: 'OK',
  WARNING: 'WARN',
  ERROR: 'ERR',
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <motion.div
      className="log-entry"
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.1 }}
    >
      <span className="log-timestamp">[{entry.timestamp}]</span>
      <span
        className={`log-level-${entry.level}`}
        style={{ minWidth: 46, fontWeight: 600 }}
      >
        [{LOG_LEVEL_LABELS[entry.level]}]
      </span>
      <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
        {entry.message}
      </span>
    </motion.div>
  )
}

export const ActivityLogPage: React.FC = () => {
  const { logs, clearLogs, getLogsAsText } = useLogStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll ke bawah ketika log baru masuk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  const handleCopy = async () => {
    const text = getLogsAsText()
    await navigator.clipboard.writeText(text)
  }

  const handleSave = async () => {
    const text = getLogsAsText()
    const result = await window.electronAPI.saveLog(text)
    if (!result.success && result.error) {
      console.error('Gagal menyimpan log:', result.error)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Header */}
      <div className="card">
        <div className="flex-between">
          <div>
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
              Activity Log
            </span>
            <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              {logs.length} entri
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopy} disabled={logs.length === 0}>
              <Copy size={13} />
              Salin Log
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={logs.length === 0}>
              <Download size={13} />
              Simpan ke TXT
            </button>
            <button className="btn btn-danger btn-sm" onClick={clearLogs} disabled={logs.length === 0}>
              <Trash2 size={13} />
              Bersihkan
            </button>
          </div>
        </div>
      </div>

      {/* Log content */}
      <div className="card" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 16px',
        maxHeight: 'calc(100vh - 200px)',
      }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 13 }}>Belum ada log aktivitas</div>
          </div>
        ) : (
          <div className="log-panel">
            {logs.map((entry) => (
              <LogRow key={entry.id} entry={entry} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}
