import { ipcMain } from 'electron'
import { IPC_CHANNELS, AppSettings } from '../../src/types/index'
import { loadSettings, saveSettings } from '../services/settingsService'
import * as logger from '../services/loggerService'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_LOAD, async () => {
    try {
      const settings = await loadSettings()
      return { success: true, data: settings }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Gagal memuat pengaturan: ${msg}`)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE, async (_event, settings: AppSettings) => {
    try {
      await saveSettings(settings)
      logger.info('Pengaturan berhasil disimpan.')
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Gagal menyimpan pengaturan: ${msg}`)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    const { app } = require('electron')
    return app.getVersion()
  })
}
