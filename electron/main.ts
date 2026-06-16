import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerAutomationHandlers } from './ipc/automationHandlers'
import { registerSettingsHandlers } from './ipc/settingsHandlers'

// Nonaktifkan hardware acceleration untuk stabilitas
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Edge Search Automation Bot',
    backgroundColor: '#0f1117',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../../resources/icon.ico'),
    show: false,
  })

  // Tampilkan window setelah siap untuk menghindari flicker
  mainWindow.once('ready-to-show', () => {
    mainWindow!.show()
  })

  // Buka link eksternal di browser default (bukan Electron window)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Load app
  if (process.env.ELECTRON_RENDERER_URL) {
    // Development mode (electron-vite)
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Production mode
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Register semua IPC handlers
function registerAllHandlers(): void {
  registerFileHandlers()
  registerAutomationHandlers()
  registerSettingsHandlers()
}

app.whenReady().then(() => {
  registerAllHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Tangani crash/error yang tidak tertangkap
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in main process:', error)
})
