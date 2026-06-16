import { create } from 'zustand'
import { LogEntry, LogLevel } from '../types/index'

interface LogStore {
  logs: LogEntry[]
  addLog: (entry: LogEntry) => void
  clearLogs: () => void
  getLogsAsText: () => string
}

export const useLogStore = create<LogStore>((set, get) => ({
  logs: [],

  addLog: (entry) => {
    set((state) => ({
      logs: [...state.logs.slice(-1999), entry], // Keep last 2000
    }))
  },

  clearLogs: () => set({ logs: [] }),

  getLogsAsText: () => {
    const { logs } = get()
    return logs
      .map((e) => `[${e.timestamp}] [${e.level}] ${e.message}`)
      .join('\n')
  },
}))

// Helper untuk membuat log entry lokal (tanpa IPC)
let localCounter = 0
export function createLogEntry(level: LogLevel, message: string): LogEntry {
  const now = new Date()
  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const ss = now.getSeconds().toString().padStart(2, '0')
  return {
    id: `local-${Date.now()}-${++localCounter}`,
    timestamp: `${hh}:${mm}:${ss}`,
    level,
    message,
  }
}
