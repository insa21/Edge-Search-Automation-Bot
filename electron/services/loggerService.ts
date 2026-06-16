import { BrowserWindow } from 'electron'
import { LogEntry, LogLevel } from '../../src/types/index'
import { IPC_CHANNELS } from '../../src/types/index'
import fs from 'fs/promises'

const MAX_LOG_ENTRIES = 2000
let logBuffer: LogEntry[] = []
let logIdCounter = 0

function generateId(): string {
  return `log-${Date.now()}-${++logIdCounter}`
}

function formatTimestamp(): string {
  const now = new Date()
  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const ss = now.getSeconds().toString().padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

/**
 * Sanitize log message - jangan log data sensitif
 */
function sanitizeMessage(message: string): string {
  // Hapus pola yang terlihat seperti token, password, atau cookie
  return message
    .replace(/password\s*[:=]\s*\S+/gi, 'password: [REDACTED]')
    .replace(/token\s*[:=]\s*\S+/gi, 'token: [REDACTED]')
    .replace(/cookie\s*[:=]\s*\S+/gi, 'cookie: [REDACTED]')
    .replace(/authorization\s*[:=]\s*\S+/gi, 'authorization: [REDACTED]')
}

/**
 * Tambah log entry dan kirim ke semua renderer window
 */
export function addLog(level: LogLevel, message: string): LogEntry {
  const entry: LogEntry = {
    id: generateId(),
    timestamp: formatTimestamp(),
    level,
    message: sanitizeMessage(message),
  }

  logBuffer.push(entry)

  // Batasi ukuran buffer
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer = logBuffer.slice(-MAX_LOG_ENTRIES)
  }

  // Kirim ke semua renderer window
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.ON_AUTOMATION_LOG, entry)
    }
  }

  return entry
}

export function info(message: string): LogEntry {
  return addLog('INFO', message)
}

export function success(message: string): LogEntry {
  return addLog('SUCCESS', message)
}

export function warning(message: string): LogEntry {
  return addLog('WARNING', message)
}

export function error(message: string): LogEntry {
  return addLog('ERROR', message)
}

export function getRecentLogs(count = 500): LogEntry[] {
  return logBuffer.slice(-count)
}

export function clearLogs(): void {
  logBuffer = []
}

/**
 * Simpan log ke file TXT
 */
export async function saveLogsToFile(filePath: string): Promise<void> {
  const lines = logBuffer.map(
    (entry) => `[${entry.timestamp}] [${entry.level}] ${entry.message}`
  )
  const content = lines.join('\n')
  await fs.writeFile(filePath, content, 'utf-8')
}

/**
 * Ambil semua log sebagai teks untuk disalin
 */
export function getLogsAsText(): string {
  return logBuffer
    .map((entry) => `[${entry.timestamp}] [${entry.level}] ${entry.message}`)
    .join('\n')
}
