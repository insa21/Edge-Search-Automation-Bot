import React from 'react'
import { Play, Pause, Square, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AutomationStatus } from '../types/index'

interface ControlButtonsProps {
  status: AutomationStatus
  hasKeywords: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  status,
  hasKeywords,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  const isIdle = ['IDLE', 'READY', 'STOPPED', 'COMPLETED', 'ERROR'].includes(status)
  const isRunning = status === 'RUNNING'
  const isPaused = status === 'PAUSED'
  const isTransitioning = ['LAUNCHING_BROWSER', 'PAUSING', 'STOPPING', 'LOADING_FILE'].includes(status)
  const isWaiting = status === 'WAITING_FOR_USER'

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <AnimatePresence mode="wait">
        {/* Mulai */}
        {(isIdle) && (
          <motion.button
            key="start"
            className="btn btn-success btn-lg"
            onClick={onStart}
            disabled={!hasKeywords || isTransitioning}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            title={!hasKeywords ? 'Tambahkan keyword terlebih dahulu' : 'Mulai pencarian'}
          >
            <Play size={16} strokeWidth={2.5} />
            Mulai Pencarian
          </motion.button>
        )}

        {/* Jeda */}
        {isRunning && (
          <motion.button
            key="pause"
            className="btn btn-warning btn-lg"
            onClick={onPause}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <Pause size={16} strokeWidth={2.5} />
            Jeda
          </motion.button>
        )}

        {/* Lanjutkan */}
        {(isPaused || isWaiting) && (
          <motion.button
            key="resume"
            className="btn btn-success btn-lg"
            onClick={onResume}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            Lanjutkan
          </motion.button>
        )}

        {/* Hentikan — tampil saat running, paused, atau waiting */}
        {(isRunning || isPaused || isWaiting || isTransitioning) && (
          <motion.button
            key="stop"
            className="btn btn-danger btn-lg"
            onClick={onStop}
            disabled={['STOPPING', 'LAUNCHING_BROWSER'].includes(status)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <Square size={16} strokeWidth={2.5} />
            Hentikan
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
