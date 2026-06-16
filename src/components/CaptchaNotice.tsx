import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { AutomationStatus } from '../types/index'

interface CaptchaNoticeProps {
  status: AutomationStatus
  onResolved: () => void
}

export const CaptchaNotice: React.FC<CaptchaNoticeProps> = ({ status, onResolved }) => {
  const visible = status === 'WAITING_FOR_USER'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <AlertTriangle size={20} color="var(--status-paused)" strokeWidth={2} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--status-paused)', marginBottom: 2 }}>
              CAPTCHA Terdeteksi
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Selesaikan verifikasi CAPTCHA di jendela Edge yang terbuka, lalu klik tombol di bawah.
            </div>
          </div>
          <button
            className="btn btn-warning"
            onClick={onResolved}
            style={{ flexShrink: 0 }}
          >
            <CheckCircle size={14} />
            Saya Sudah Menyelesaikan
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
