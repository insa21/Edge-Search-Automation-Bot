import { ipcMain } from 'electron'
import { IPC_CHANNELS, KeywordItem, AppSettings } from '../../src/types/index'
import * as automationService from '../services/edgeAutomationService'
import * as logger from '../services/loggerService'
import { saveKeywordProgress, addAutomationHistory } from '../services/persistenceService'

export function registerAutomationHandlers(): void {
  // Start automation
  ipcMain.handle(
    IPC_CHANNELS.AUTOMATION_START,
    async (
      _event,
      payload: { keywords: KeywordItem[]; settings: AppSettings; startFromIndex: number }
    ) => {
      if (automationService.getIsBrowserOpen()) {
        return {
          success: false,
          error: 'Browser sedang terbuka. Tutup browser sebelum memulai.',
        }
      }

      try {
        // Jalankan automation secara async (non-blocking)
        void runAndPersist(payload.keywords, payload.settings, payload.startFromIndex)
        return { success: true }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
      }
    }
  )

  // Pause
  ipcMain.handle(IPC_CHANNELS.AUTOMATION_PAUSE, () => {
    automationService.pauseAutomation()
    logger.info('Perintah jeda diterima.')
    return { success: true }
  })

  // Resume
  ipcMain.handle(IPC_CHANNELS.AUTOMATION_RESUME, () => {
    automationService.resumeAutomation()
    logger.info('Perintah lanjutkan diterima.')
    return { success: true }
  })

  // Stop
  ipcMain.handle(IPC_CHANNELS.AUTOMATION_STOP, () => {
    automationService.stopAutomation()
    logger.info('Perintah hentikan diterima.')
    return { success: true }
  })

  // Login account — open Edge for manual login
  ipcMain.handle(IPC_CHANNELS.AUTOMATION_LOGIN_ACCOUNT, async () => {
    if (automationService.getIsBrowserOpen()) {
      return {
        success: false,
        error: 'Browser sedang terbuka. Tutup browser terlebih dahulu.',
      }
    }
    await automationService.openEdgeForLogin()
    return { success: true }
  })

  // Open Edge to check account
  ipcMain.handle(IPC_CHANNELS.AUTOMATION_OPEN_EDGE_CHECK, async () => {
    if (automationService.getIsBrowserOpen()) {
      return {
        success: false,
        error: 'Browser sudah terbuka.',
      }
    }
    await automationService.openEdgeForCheck()
    return { success: true }
  })

  // Check account/profile status
  ipcMain.handle(IPC_CHANNELS.AUTOMATION_CHECK_ACCOUNT, async () => {
    const exists = await automationService.checkProfileExists()
    const profilePath = automationService.getProfilePath()
    return {
      exists,
      profilePath,
    }
  })

  // Reset profile
  ipcMain.handle(IPC_CHANNELS.AUTOMATION_RESET_PROFILE, async () => {
    if (automationService.getIsBrowserOpen()) {
      return {
        success: false,
        error: 'Tutup browser Edge terlebih dahulu sebelum mereset profil.',
      }
    }

    try {
      await automationService.deleteProfile()
      logger.warning('Profil akun telah direset. Silakan login kembali.')
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Gagal mereset profil: ${msg}`)
      return { success: false, error: msg }
    }
  })

  // CAPTCHA resolved by user
  ipcMain.handle(IPC_CHANNELS.AUTOMATION_CAPTCHA_RESOLVED, () => {
    automationService.resolveCaptcha()
    logger.info('Pengguna melaporkan CAPTCHA selesai. Melanjutkan automasi...')
    return { success: true }
  })

  // Get profile path
  ipcMain.handle(IPC_CHANNELS.APP_GET_PROFILE_PATH, () => {
    return automationService.getProfilePath()
  })
}

/**
 * Jalankan automation dan simpan progress setelah selesai
 */
async function runAndPersist(
  keywords: KeywordItem[],
  settings: AppSettings,
  startFromIndex: number
): Promise<void> {
  try {
    await automationService.runAutomation(keywords, settings, startFromIndex)
  } finally {
    // Simpan progress keyword ke disk
    await saveKeywordProgress(keywords, startFromIndex).catch(() => {})

    // Simpan riwayat automation
    const completed = keywords.filter((k) => k.status === 'success').length
    const failed = keywords.filter((k) => k.status === 'failed').length
    await addAutomationHistory({
      totalKeywords: keywords.length,
      completedKeywords: completed,
      failedKeywords: failed,
    }).catch(() => {})
  }
}
