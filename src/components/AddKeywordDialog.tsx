import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

interface AddKeywordDialogProps {
  open: boolean
  onAdd: (keyword: string) => void
  onClose: () => void
  editMode?: boolean
  initialValue?: string
}

export const AddKeywordDialog: React.FC<AddKeywordDialogProps> = ({
  open,
  onAdd,
  onClose,
  editMode = false,
  initialValue = '',
}) => {
  const [value, setValue] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
    onClose()
  }

  // Sync initialValue when dialog opens
  React.useEffect(() => {
    if (open) setValue(initialValue)
  }, [open, initialValue])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              {editMode ? 'Edit Keyword' : 'Tambah Keyword'}
            </h2>

            <form onSubmit={handleSubmit}>
              <input
                className="input"
                type="text"
                placeholder="Masukkan keyword..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                style={{ marginBottom: 16 }}
              />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!value.trim()}
                >
                  <Plus size={14} />
                  {editMode ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
