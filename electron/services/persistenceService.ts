import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { KeywordItem, AppSettings } from '../../src/types/index'

const PERSISTENCE_FILE = 'last-session.json'

interface SessionData {
  lastFilePath: string | null
  keywords: KeywordItem[]
  lastIndex: number
  settings: Partial<AppSettings>
  automationHistory: {
    date: string
    totalKeywords: number
    completedKeywords: number
    failedKeywords: number
  }[]
}

function getSessionPath(): string {
  return path.join(app.getPath('userData'), PERSISTENCE_FILE)
}

export async function loadSession(): Promise<SessionData> {
  const sessionPath = getSessionPath()
  try {
    const content = await fs.readFile(sessionPath, 'utf-8')
    return JSON.parse(content) as SessionData
  } catch {
    return {
      lastFilePath: null,
      keywords: [],
      lastIndex: 0,
      settings: {},
      automationHistory: [],
    }
  }
}

export async function saveSession(data: Partial<SessionData>): Promise<void> {
  const sessionPath = getSessionPath()
  const existing = await loadSession()
  const merged = { ...existing, ...data }
  await fs.mkdir(path.dirname(sessionPath), { recursive: true })
  await fs.writeFile(sessionPath, JSON.stringify(merged, null, 2), 'utf-8')
}

export async function saveLastFilePath(filePath: string): Promise<void> {
  await saveSession({ lastFilePath: filePath })
}

export async function saveKeywordProgress(
  keywords: KeywordItem[],
  lastIndex: number
): Promise<void> {
  await saveSession({ keywords, lastIndex })
}

export async function addAutomationHistory(entry: {
  totalKeywords: number
  completedKeywords: number
  failedKeywords: number
}): Promise<void> {
  const existing = await loadSession()
  const history = existing.automationHistory ?? []
  history.unshift({
    date: new Date().toISOString(),
    ...entry,
  })
  // Simpan hanya 20 riwayat terakhir
  await saveSession({ automationHistory: history.slice(0, 20) })
}

export async function clearSession(): Promise<void> {
  const sessionPath = getSessionPath()
  try {
    await fs.unlink(sessionPath)
  } catch {
    // File tidak ada — tidak masalah
  }
}
