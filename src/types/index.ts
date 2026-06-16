// ============================================================
// Shared Types for Edge Search Automation Bot
// ============================================================

// ─── Log Types ───────────────────────────────────────────────
export type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
}

// ─── Keyword Types ───────────────────────────────────────────
export type KeywordStatus =
  | 'waiting'    // Menunggu
  | 'searching'  // Sedang dicari
  | 'success'    // Berhasil
  | 'failed'     // Gagal
  | 'skipped'    // Dilewati

export interface KeywordItem {
  id: string
  keyword: string
  status: KeywordStatus
  duration: number | null       // in milliseconds
  message: string | null
  retryCount: number
}

// ─── Automation State Machine ─────────────────────────────────
export type AutomationStatus =
  | 'IDLE'
  | 'LOADING_FILE'
  | 'READY'
  | 'LAUNCHING_BROWSER'
  | 'RUNNING'
  | 'PAUSING'
  | 'PAUSED'
  | 'WAITING_FOR_USER'    // e.g., CAPTCHA
  | 'STOPPING'
  | 'STOPPED'
  | 'COMPLETED'
  | 'ERROR'

export interface AutomationState {
  status: AutomationStatus
  totalKeywords: number
  completedKeywords: number
  failedKeywords: number
  currentKeyword: string | null
  currentKeywordIndex: number
  elapsedMs: number
  etaMs: number | null
  errorMessage: string | null
  lastFileLoaded: string | null
  profileStatus: 'unknown' | 'ready' | 'not_set'
}

// ─── Settings Types ───────────────────────────────────────────
export type TypingSpeed = 'slow' | 'normal' | 'fast'

export const TYPING_DELAY_MAP: Record<TypingSpeed, number> = {
  slow: 100,
  normal: 60,
  fast: 25,
}

export type ThemeMode = 'dark' | 'light'

export interface AppSettings {
  delayBetweenSearches: number   // seconds, min 3
  pageTimeout: number            // seconds, default 30
  typingSpeed: TypingSpeed
  closeEdgeAfterDone: boolean
  resumeFromLastIndex: boolean
  maxRetryPerKeyword: number     // default 2
  theme: ThemeMode
}

export const DEFAULT_SETTINGS: AppSettings = {
  delayBetweenSearches: 5,
  pageTimeout: 30,
  typingSpeed: 'normal',
  closeEdgeAfterDone: false,
  resumeFromLastIndex: true,
  maxRetryPerKeyword: 2,
  theme: 'dark',
}

// ─── IPC Channel Names ────────────────────────────────────────
export const IPC_CHANNELS = {
  // Renderer → Main (invoke)
  FILE_OPEN_DIALOG: 'file:open-dialog',
  FILE_READ_TXT: 'file:read-txt',
  AUTOMATION_START: 'automation:start',
  AUTOMATION_PAUSE: 'automation:pause',
  AUTOMATION_RESUME: 'automation:resume',
  AUTOMATION_STOP: 'automation:stop',
  AUTOMATION_LOGIN_ACCOUNT: 'automation:login-account',
  AUTOMATION_CHECK_ACCOUNT: 'automation:check-account',
  AUTOMATION_RESET_PROFILE: 'automation:reset-profile',
  AUTOMATION_OPEN_EDGE_CHECK: 'automation:open-edge-check',
  AUTOMATION_CAPTCHA_RESOLVED: 'automation:captcha-resolved',
  SETTINGS_LOAD: 'settings:load',
  SETTINGS_SAVE: 'settings:save',
  LOGS_SAVE: 'logs:save',
  APP_GET_PROFILE_PATH: 'app:get-profile-path',
  APP_GET_VERSION: 'app:get-version',

  // Main → Renderer (on)
  ON_AUTOMATION_STATE: 'automation:state-update',
  ON_AUTOMATION_LOG: 'automation:log',
  ON_KEYWORD_UPDATE: 'automation:keyword-update',
  ON_PROFILE_STATUS: 'automation:profile-status',
} as const

// ─── IPC Payload Types ────────────────────────────────────────
export interface FileReadResult {
  keywords: string[]
  totalCount: number
  duplicates: string[]
  filePath: string
  fileName: string
}

export interface AutomationStartPayload {
  keywords: KeywordItem[]
  settings: AppSettings
  startFromIndex: number
}

export interface KeywordUpdatePayload {
  id: string
  status: KeywordStatus
  duration?: number
  message?: string
}

export interface ProfileStatusPayload {
  status: 'ready' | 'not_set' | 'unknown'
  profilePath: string
}

// ─── Bing Selector Config ─────────────────────────────────────
// Centralized selector config — update here if Bing changes selectors
export const BING_SELECTORS = {
  HOME_URL: 'https://www.bing.com/',
  SEARCH_BOX: [
    '#sb_form_q',
    'textarea[name="q"]',
    'input[name="q"]',
    'input[type="search"]',
  ],
  CONSENT_BUTTONS: [
    '#bnp_btn_accept',
    'button:has-text("Accept all")',
    'button:has-text("Accept")',
    'button:has-text("Agree")',
    'button:has-text("Terima")',
    'button:has-text("Setuju")',
    '[data-bi="AcceptAll"]',
  ],
  CAPTCHA_INDICATORS: [
    '#captcha-container',
    'iframe[src*="captcha"]',
    '.captcha',
    '#BotDetected',
    'form[action*="captcha"]',
  ],
} as const
