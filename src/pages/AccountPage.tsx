import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LogIn, Globe, Trash2,
  CheckCircle, XCircle,
  ShieldCheck,
} from 'lucide-react'
import { useAutomationStore } from '../stores/automationStore'
import { ConfirmDialog } from '../components/ConfirmDialog'

export const AccountPage: React.FC = () => {
  const { profileStatus, setProfileStatus } = useAutomationStore()
  const [profilePath, setProfilePath] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Load account status on mount
  useEffect(() => {
    void checkAccount()
  }, [])

  const checkAccount = async () => {
    const result = await window.electronAPI.checkAccount()
    setProfilePath(result.profilePath)
    setProfileStatus(result.exists ? 'ready' : 'not_set')
  }

  const showMessage = (msg: string, duration = 3000) => {
    setActionMessage(msg)
    setTimeout(() => setActionMessage(null), duration)
  }

  const handleLogin = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.loginAccount()
      if (!result.success) {
        showMessage(`Gagal: ${result.error}`)
      } else {
        showMessage('Edge terbuka. Silakan login, lalu tutup Edge untuk menyimpan sesi.')
      }
    } finally {
      setLoading(false)
      // Re-check after a short delay
      setTimeout(() => void checkAccount(), 2000)
    }
  }

  const handleOpenCheck = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.openEdgeCheck()
      if (!result.success) {
        showMessage(`Gagal: ${result.error}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setShowResetConfirm(false)
    setLoading(true)
    try {
      const result = await window.electronAPI.resetProfile()
      if (result.success) {
        setProfileStatus('not_set')
        showMessage('Profil akun berhasil direset. Silakan login kembali.')
      } else {
        showMessage(`Gagal reset profil: ${result.error}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status Card */}
      <div className="card">
        <div className="card-title">Status Akun</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: profileStatus === 'ready' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            border: `1px solid ${profileStatus === 'ready' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(107, 114, 128, 0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {profileStatus === 'ready'
              ? <CheckCircle size={28} color="var(--status-running)" strokeWidth={1.5} />
              : <XCircle size={28} color="var(--status-idle)" strokeWidth={1.5} />
            }
          </div>

          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: profileStatus === 'ready' ? 'var(--status-running)' : 'var(--text-secondary)',
              marginBottom: 4,
            }}>
              {profileStatus === 'ready' ? 'Akun Tersimpan' : 'Belum Login'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {profileStatus === 'ready'
                ? 'Sesi login tersimpan di profil automation. Siap digunakan.'
                : 'Klik "Login / Kelola Akun" untuk menyimpan sesi login Edge.'
              }
            </div>
          </div>
        </div>

        {/* Profile path */}
        {profilePath && (
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            wordBreak: 'break-all',
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Profil: </span>
            {profilePath}
          </div>
        )}
      </div>

      {/* Action Message */}
      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--accent-primary-muted)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--accent-primary)',
          }}
        >
          {actionMessage}
        </motion.div>
      )}

      {/* Actions */}
      <div className="card">
        <div className="card-title">Kelola Akun</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Login */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>
                Login / Kelola Akun Edge
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Buka Edge dengan profil automation, login manual, lalu tutup Edge untuk menyimpan sesi
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleLogin}
              disabled={loading}
              id="btn-login-account"
            >
              <LogIn size={14} />
              Login / Kelola Akun
            </button>
          </div>

          {/* Open to check */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>
                Buka Edge untuk Mengecek Akun
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Buka Bing dengan profil automation untuk memverifikasi status login
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleOpenCheck}
              disabled={loading}
              id="btn-open-edge-check"
            >
              <Globe size={14} />
              Buka Edge
            </button>
          </div>

          {/* Reset */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'rgba(248, 113, 113, 0.05)',
            borderRadius: 10,
            border: '1px solid rgba(248, 113, 113, 0.15)',
          }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>
                Reset Profil Akun
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Hapus semua data sesi, cookie, dan profil automation. Tidak dapat dibatalkan.
              </div>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => setShowResetConfirm(true)}
              disabled={loading || profileStatus === 'not_set'}
              id="btn-reset-profile"
            >
              <Trash2 size={14} />
              Reset Profil
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{
        background: 'rgba(90, 110, 240, 0.05)',
        border: '1px solid rgba(90, 110, 240, 0.15)',
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <ShieldCheck size={18} color="var(--accent-primary)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent-primary)', marginBottom: 6 }}>
              Keamanan Data Akun
            </div>
            <ul style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 0, listStyle: 'none' }}>
              <li>✓ Password tidak pernah diminta atau disimpan di aplikasi ini</li>
              <li>✓ Sesi login disimpan di profil browser terpisah (bukan profil Edge utama)</li>
              <li>✓ Cookie dan sesi tersimpan di folder userData Electron yang aman</li>
              <li>✓ Data tidak pernah dikirim ke server manapun</li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset Profil Akun?"
        message="Tindakan ini akan menghapus semua data sesi login, cookie, dan profil automation. Anda perlu login ulang setelah reset. Pastikan Edge sudah tertutup sebelum mereset."
        confirmLabel="Reset Profil"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  )
}
