import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { AppSettings, DEFAULT_SETTINGS } from '../../src/types/index'

const SETTINGS_FILE = 'settings.json'

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE)
}

/**
 * Load settings dari disk. Jika file tidak ada, kembalikan default.
 */
export async function loadSettings(): Promise<AppSettings> {
  const settingsPath = getSettingsPath()
  try {
    const content = await fs.readFile(settingsPath, 'utf-8')
    const parsed = JSON.parse(content) as Partial<AppSettings>
    // Merge dengan default untuk memastikan field baru ada
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/**
 * Simpan settings ke disk.
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  const settingsPath = getSettingsPath()
  await fs.mkdir(path.dirname(settingsPath), { recursive: true })
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
}
