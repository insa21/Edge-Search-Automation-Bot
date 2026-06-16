import { AppSettings, KeywordItem, LogEntry, AutomationStatus, KeywordStatus } from './types/index'

type AutomationStartPayload = {
  keywords: KeywordItem[]
  settings: AppSettings
  startFromIndex: number
}

type StateUpdateCallback = (data: {
  status: AutomationStatus
  currentKeyword?: string | null
  currentKeywordIndex?: number
  completedKeywords?: number
  failedKeywords?: number
  elapsedMs?: number
  etaMs?: number | null
  errorMessage?: string | null
  profileStatus?: 'ready' | 'not_set' | 'unknown'
}) => void

type KeywordUpdateCallback = (data: {
  id: string
  status: KeywordStatus
  duration?: number
  message?: string
}) => void

type LogCallback = (entry: LogEntry) => void

interface ElectronAPI {
  openFileDialog: () => Promise<string | null>
  readKeywordFile: (filePath: string) => Promise<{
    success: boolean
    data?: {
      keywords: string[]
      totalCount: number
      duplicates: string[]
      filePath: string
      fileName: string
    }
    error?: string
  }>
  saveLog: (content: string) => Promise<{ success: boolean; filePath?: string; error?: string }>

  startAutomation: (payload: AutomationStartPayload) => Promise<{ success: boolean; error?: string }>
  pauseAutomation: () => Promise<{ success: boolean }>
  resumeAutomation: () => Promise<{ success: boolean }>
  stopAutomation: () => Promise<{ success: boolean }>

  loginAccount: () => Promise<{ success: boolean; error?: string }>
  openEdgeCheck: () => Promise<{ success: boolean; error?: string }>
  checkAccount: () => Promise<{ exists: boolean; profilePath: string }>
  resetProfile: () => Promise<{ success: boolean; error?: string }>
  captchaResolved: () => Promise<{ success: boolean }>

  loadSettings: () => Promise<{ success: boolean; data?: AppSettings; error?: string }>
  saveSettings: (settings: AppSettings) => Promise<{ success: boolean; error?: string }>

  getProfilePath: () => Promise<string>
  getVersion: () => Promise<string>

  onStateUpdate: (callback: StateUpdateCallback) => () => void
  onKeywordUpdate: (callback: KeywordUpdateCallback) => () => void
  onLog: (callback: LogCallback) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
