import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  KeywordItem,
  LogEntry,
  AutomationStatus,
  KeywordStatus,
} from '../src/types/index'

// ─── Type imports only for the bridge API ───────────────────
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

// ─── Exposed API — contextBridge ─────────────────────────────
// Hanya expose API yang terbatas dan aman. Tidak expose fs, child_process, atau ipcRenderer mentah.
contextBridge.exposeInMainWorld('electronAPI', {
  // ── File Operations ──────────────────────────────────────
  openFileDialog: (): Promise<string | null> =>
    ipcRenderer.invoke('file:open-dialog'),

  readKeywordFile: (filePath: string): Promise<{
    success: boolean
    data?: {
      keywords: string[]
      totalCount: number
      duplicates: string[]
      filePath: string
      fileName: string
    }
    error?: string
  }> => ipcRenderer.invoke('file:read-txt', filePath),

  saveLog: (content: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('logs:save', content),

  // ── Automation Control ───────────────────────────────────
  startAutomation: (payload: AutomationStartPayload): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('automation:start', payload),

  pauseAutomation: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('automation:pause'),

  resumeAutomation: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('automation:resume'),

  stopAutomation: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('automation:stop'),

  // ── Account Management ───────────────────────────────────
  loginAccount: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('automation:login-account'),

  openEdgeCheck: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('automation:open-edge-check'),

  checkAccount: (): Promise<{ exists: boolean; profilePath: string }> =>
    ipcRenderer.invoke('automation:check-account'),

  resetProfile: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('automation:reset-profile'),

  captchaResolved: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('automation:captcha-resolved'),

  // ── Settings ─────────────────────────────────────────────
  loadSettings: (): Promise<{ success: boolean; data?: AppSettings; error?: string }> =>
    ipcRenderer.invoke('settings:load'),

  saveSettings: (settings: AppSettings): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('settings:save', settings),

  // ── App Info ─────────────────────────────────────────────
  getProfilePath: (): Promise<string> =>
    ipcRenderer.invoke('app:get-profile-path'),

  getVersion: (): Promise<string> =>
    ipcRenderer.invoke('app:get-version'),

  // ── Event Listeners (Main → Renderer) ────────────────────
  onStateUpdate: (callback: StateUpdateCallback): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: Parameters<StateUpdateCallback>[0]) =>
      callback(data)
    ipcRenderer.on('automation:state-update', handler)
    return () => ipcRenderer.removeListener('automation:state-update', handler)
  },

  onKeywordUpdate: (callback: KeywordUpdateCallback): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: Parameters<KeywordUpdateCallback>[0]) =>
      callback(data)
    ipcRenderer.on('automation:keyword-update', handler)
    return () => ipcRenderer.removeListener('automation:keyword-update', handler)
  },

  onLog: (callback: LogCallback): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, entry: LogEntry) => callback(entry)
    ipcRenderer.on('automation:log', handler)
    return () => ipcRenderer.removeListener('automation:log', handler)
  },
})

// ─── Type declaration for renderer ───────────────────────────
// (Diekspor agar TypeScript renderer dapat menggunakannya)
export type ElectronAPI = typeof import('./preload')
