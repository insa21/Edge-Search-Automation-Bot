import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number  // 0–100
  color?: string
  height?: number
  showLabel?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'var(--accent-primary)',
  height = 6,
  showLabel = false,
}) => {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div>
      {showLabel && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          <span>Progress</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{clamped.toFixed(0)}%</span>
        </div>
      )}
      <div
        className="progress-track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="progress-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
