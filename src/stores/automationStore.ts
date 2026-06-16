import { create } from 'zustand'
import {
  AutomationStatus,
  KeywordItem,
  KeywordStatus,
} from '../types/index'

let keywordIdCounter = 0
function generateKeywordId(): string {
  return `kw-${Date.now()}-${++keywordIdCounter}`
}

interface AutomationStore {
  // ── State ────────────────────────────────────────────────
  status: AutomationStatus
  keywords: KeywordItem[]
  currentKeywordIndex: number
  completedKeywords: number
  failedKeywords: number
  elapsedMs: number
  etaMs: number | null
  errorMessage: string | null
  lastFilePath: string | null
  lastFileName: string | null
  profileStatus: 'unknown' | 'ready' | 'not_set'

  // ── Timer ─────────────────────────────────────────────────
  timerInterval: ReturnType<typeof setInterval> | null

  // ── Actions ───────────────────────────────────────────────
  setStatus: (status: AutomationStatus, extra?: Partial<AutomationStore>) => void
  setKeywords: (keywords: KeywordItem[]) => void
  addKeyword: (keyword: string) => void
  editKeyword: (id: string, newKeyword: string) => void
  removeKeyword: (id: string) => void
  clearKeywords: () => void
  updateKeywordStatus: (
    id: string,
    status: KeywordStatus,
    duration?: number,
    message?: string
  ) => void
  resetKeywordStatuses: () => void
  setLastFile: (filePath: string, fileName: string) => void
  setProfileStatus: (status: 'ready' | 'not_set' | 'unknown') => void
  setErrorMessage: (msg: string | null) => void

  // Timer controls
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void

  // Computed helpers
  getNextPendingIndex: () => number
}

export const useAutomationStore = create<AutomationStore>((set, get) => ({
  // ── Initial State ─────────────────────────────────────────
  status: 'IDLE',
  keywords: [],
  currentKeywordIndex: 0,
  completedKeywords: 0,
  failedKeywords: 0,
  elapsedMs: 0,
  etaMs: null,
  errorMessage: null,
  lastFilePath: null,
  lastFileName: null,
  profileStatus: 'unknown',
  timerInterval: null,

  // ── State Updaters ────────────────────────────────────────
  setStatus: (status, extra = {}) => {
    set({ status, ...extra })
  },

  setKeywords: (keywords) => {
    set({
      keywords,
      completedKeywords: keywords.filter((k) => k.status === 'success').length,
      failedKeywords: keywords.filter((k) => k.status === 'failed').length,
    })
  },

  addKeyword: (keyword) => {
    const trimmed = keyword.trim()
    if (!trimmed) return
    const newItem: KeywordItem = {
      id: generateKeywordId(),
      keyword: trimmed,
      status: 'waiting',
      duration: null,
      message: null,
      retryCount: 0,
    }
    set((state) => ({ keywords: [...state.keywords, newItem] }))
  },

  editKeyword: (id, newKeyword) => {
    const trimmed = newKeyword.trim()
    if (!trimmed) return
    set((state) => ({
      keywords: state.keywords.map((kw) =>
        kw.id === id
          ? { ...kw, keyword: trimmed, status: 'waiting', duration: null, message: null }
          : kw
      ),
    }))
  },

  removeKeyword: (id) => {
    set((state) => ({
      keywords: state.keywords.filter((kw) => kw.id !== id),
    }))
  },

  clearKeywords: () => {
    set({ keywords: [] })
  },

  updateKeywordStatus: (id, status, duration, message) => {
    set((state) => {
      const keywords = state.keywords.map((kw) =>
        kw.id === id
          ? {
              ...kw,
              status,
              duration: duration ?? kw.duration,
              message: message ?? kw.message,
            }
          : kw
      )
      return { keywords }
    })
  },

  resetKeywordStatuses: () => {
    set((state) => ({
      keywords: state.keywords.map((kw) => ({
        ...kw,
        status: 'waiting' as KeywordStatus,
        duration: null,
        message: null,
        retryCount: 0,
      })),
      completedKeywords: 0,
      failedKeywords: 0,
      currentKeywordIndex: 0,
      elapsedMs: 0,
      etaMs: null,
      errorMessage: null,
    }))
  },

  setLastFile: (filePath, fileName) => {
    set({ lastFilePath: filePath, lastFileName: fileName })
  },

  setProfileStatus: (status) => {
    set({ profileStatus: status })
  },

  setErrorMessage: (msg) => {
    set({ errorMessage: msg })
  },

  // ── Timer ─────────────────────────────────────────────────
  startTimer: () => {
    const { timerInterval } = get()
    if (timerInterval) return // Already running
    const interval = setInterval(() => {
      set((state) => ({ elapsedMs: state.elapsedMs + 1000 }))
    }, 1000)
    set({ timerInterval: interval })
  },

  stopTimer: () => {
    const { timerInterval } = get()
    if (timerInterval) {
      clearInterval(timerInterval)
      set({ timerInterval: null })
    }
  },

  resetTimer: () => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)
    set({ timerInterval: null, elapsedMs: 0, etaMs: null })
  },

  // ── Computed ──────────────────────────────────────────────
  getNextPendingIndex: () => {
    const { keywords } = get()
    const idx = keywords.findIndex((kw) => kw.status === 'waiting')
    return idx >= 0 ? idx : 0
  },
}))
