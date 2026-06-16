import React, { useState } from 'react'
import {
  FolderOpen, Plus, Trash2, Trash, RefreshCw, Edit2,
  FileText, AlertTriangle, Check, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAutomationStore } from '../stores/automationStore'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { AddKeywordDialog } from '../components/AddKeywordDialog'
import { KeywordItem } from '../types/index'

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  return `${(ms / 1000).toFixed(1)}s`
}

export const KeywordsPage: React.FC = () => {
  const store = useAutomationStore()
  const { keywords, status, lastFilePath, lastFileName } = store

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [pendingKeywords, setPendingKeywords] = useState<string[]>([])
  const [duplicates, setDuplicates] = useState<string[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editItem, setEditItem] = useState<KeywordItem | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const isRunning = ['RUNNING', 'PAUSING', 'LAUNCHING_BROWSER'].includes(status)

  // ── Load File ──────────────────────────────────────────────
  const handleLoadFile = async () => {
    setLoadingFile(true)
    try {
      const filePath = await window.electronAPI.openFileDialog()
      if (!filePath) return

      const result = await window.electronAPI.readKeywordFile(filePath)
      if (!result.success || !result.data) {
        alert(result.error ?? 'Gagal membaca file')
        return
      }

      const { keywords: kws, duplicates: dups, fileName } = result.data
      store.setLastFile(filePath, fileName)

      if (dups.length > 0) {
        setPendingKeywords(kws)
        setDuplicates(dups)
        setShowDuplicateDialog(true)
      } else {
        applyKeywords(kws)
      }
    } finally {
      setLoadingFile(false)
    }
  }

  const applyKeywords = (kws: string[]) => {
    const items: KeywordItem[] = kws.map((kw, idx) => ({
      id: `kw-file-${Date.now()}-${idx}`,
      keyword: kw,
      status: 'waiting',
      duration: null,
      message: null,
      retryCount: 0,
    }))
    store.setKeywords(items)
  }

  const applyWithoutDuplicates = () => {
    const seen = new Set<string>()
    const unique = pendingKeywords.filter((kw) => {
      const lower = kw.toLowerCase()
      if (seen.has(lower)) return false
      seen.add(lower)
      return true
    })
    applyKeywords(unique)
    setShowDuplicateDialog(false)
  }

  const applyWithDuplicates = () => {
    applyKeywords(pendingKeywords)
    setShowDuplicateDialog(false)
  }

  // ── Reload ─────────────────────────────────────────────────
  const handleReload = async () => {
    if (!lastFilePath) return
    setLoadingFile(true)
    try {
      const result = await window.electronAPI.readKeywordFile(lastFilePath)
      if (!result.success || !result.data) return
      const { keywords: kws, duplicates: dups } = result.data
      if (dups.length > 0) {
        setPendingKeywords(kws)
        setDuplicates(dups)
        setShowDuplicateDialog(true)
      } else {
        applyKeywords(kws)
      }
    } finally {
      setLoadingFile(false)
    }
  }

  // ── Edit ───────────────────────────────────────────────────
  const handleEditSave = (newKeyword: string) => {
    if (editItem) {
      store.editKeyword(editItem.id, newKeyword)
      setEditItem(null)
    }
  }

  const validCount = keywords.filter((k) => k.keyword.trim()).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
              Daftar Keyword
            </div>
            {lastFileName && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                <FileText size={11} style={{ display: 'inline', marginRight: 4 }} />
                {lastFileName} — {validCount} keyword valid
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleLoadFile}
              disabled={isRunning || loadingFile}
              id="btn-load-file"
            >
              <FolderOpen size={14} />
              Pilih File TXT
            </button>
            {lastFilePath && (
              <button
                className="btn btn-secondary"
                onClick={handleReload}
                disabled={isRunning || loadingFile}
                title="Muat ulang dari file terakhir"
              >
                <RefreshCw size={14} className={loadingFile ? 'animate-spin-slow' : ''} />
                Muat Ulang
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddDialog(true)}
              disabled={isRunning}
              id="btn-add-keyword"
            >
              <Plus size={14} />
              Tambah
            </button>
            {keywords.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={() => setShowClearConfirm(true)}
                disabled={isRunning}
                id="btn-clear-keywords"
              >
                <Trash size={14} />
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{keywords.length}</strong></span>
          <span>Selesai: <strong style={{ color: 'var(--status-running)' }}>{keywords.filter(k => k.status === 'success').length}</strong></span>
          <span>Gagal: <strong style={{ color: 'var(--status-error)' }}>{keywords.filter(k => k.status === 'failed').length}</strong></span>
          <span>Menunggu: <strong style={{ color: 'var(--status-idle)' }}>{keywords.filter(k => k.status === 'waiting').length}</strong></span>
        </div>
      </div>

      {/* Keyword Table */}
      <div className="card" style={{ padding: 0 }}>
        {keywords.length === 0 ? (
          <div style={{
            padding: 48,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <FileText size={40} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Belum ada keyword</div>
            <div style={{ fontSize: 12 }}>Pilih file TXT atau tambah keyword secara manual</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
            <table className="kw-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1 }}>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Keyword</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ width: 80 }}>Durasi</th>
                  <th style={{ width: 200 }}>Pesan</th>
                  <th style={{ width: 80 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    className={item.status === 'searching' ? 'kw-active' : ''}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                  >
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.keyword}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatMs(item.duration)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180 }} className="truncate">
                      {item.message ?? '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => setEditItem(item)}
                          disabled={isRunning}
                          title="Edit keyword"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => setDeleteConfirmId(item.id)}
                          disabled={isRunning}
                          title="Hapus keyword"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showClearConfirm}
        title="Hapus Semua Keyword?"
        message={`Tindakan ini akan menghapus ${keywords.length} keyword dari daftar. Data yang sudah dihapus tidak dapat dikembalikan.`}
        confirmLabel="Hapus Semua"
        onConfirm={() => { store.clearKeywords(); setShowClearConfirm(false) }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Hapus Keyword?"
        message="Apakah Anda yakin ingin menghapus keyword ini?"
        confirmLabel="Hapus"
        onConfirm={() => { if (deleteConfirmId) { store.removeKeyword(deleteConfirmId); setDeleteConfirmId(null) } }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <AddKeywordDialog
        open={showAddDialog}
        onAdd={(kw) => store.addKeyword(kw)}
        onClose={() => setShowAddDialog(false)}
      />

      <AddKeywordDialog
        open={!!editItem}
        editMode
        initialValue={editItem?.keyword ?? ''}
        onAdd={handleEditSave}
        onClose={() => setEditItem(null)}
      />

      {/* Duplicate Dialog */}
      <AnimatePresence>
        {showDuplicateDialog && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 480 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <AlertTriangle size={18} color="var(--status-paused)" />
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Ditemukan Keyword Duplikat
                </h2>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Terdapat <strong>{duplicates.length}</strong> keyword duplikat dari total{' '}
                <strong>{pendingKeywords.length}</strong> keyword:
              </p>

              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 16,
                maxHeight: 150,
                overflowY: 'auto',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--status-paused)',
              }}>
                {duplicates.map((d, i) => <div key={i}>{d}</div>)}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={applyWithoutDuplicates}>
                  <X size={14} />
                  Hapus Duplikat ({pendingKeywords.length - duplicates.length} keyword)
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={applyWithDuplicates}>
                  <Check size={14} />
                  Pertahankan Semua ({pendingKeywords.length} keyword)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
