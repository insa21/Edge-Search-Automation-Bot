import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { IPC_CHANNELS } from '../../src/types/index'
import { parseKeywordFile } from '../services/keywordFileService'
import * as logger from '../services/loggerService'

export function registerFileHandlers(): void {
  // Open native file dialog
  ipcMain.handle(IPC_CHANNELS.FILE_OPEN_DIALOG, async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      title: 'Pilih File TXT Keyword',
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    return filePath
  })

  // Read and parse TXT file
  ipcMain.handle(IPC_CHANNELS.FILE_READ_TXT, async (_event, filePath: string) => {
    try {
      const result = await parseKeywordFile(filePath)
      logger.success(`File ${result.fileName} berhasil dimuat`)
      logger.info(`Ditemukan ${result.totalCount} keyword`)
      if (result.duplicates.length > 0) {
        logger.warning(`Ditemukan ${result.duplicates.length} keyword duplikat`)
      }
      return { success: true, data: result }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Gagal membaca file: ${msg}`)
      return { success: false, error: msg }
    }
  })

  // Save log to file
  ipcMain.handle(IPC_CHANNELS.LOGS_SAVE, async (_event, content: string) => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win!, {
      title: 'Simpan Log Aktivitas',
      defaultPath: `log-${new Date().toISOString().slice(0, 10)}.txt`,
      filters: [{ name: 'Text Files', extensions: ['txt'] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false }
    }

    try {
      await fs.writeFile(result.filePath, content, 'utf-8')
      logger.success(`Log disimpan ke: ${path.basename(result.filePath)}`)
      return { success: true, filePath: result.filePath }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Gagal menyimpan log: ${msg}`)
      return { success: false, error: msg }
    }
  })
}
