import { chromium, BrowserContext, Page } from 'playwright'
import { app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import {
  KeywordItem,
  AppSettings,
  AutomationStatus,
  KeywordStatus,
  BING_SELECTORS,
  TYPING_DELAY_MAP,
  IPC_CHANNELS,
} from '../../src/types/index'
import * as logger from './loggerService'

// ─── Profile Path ─────────────────────────────────────────────
export function getProfilePath(): string {
  return path.join(app.getPath('userData'), 'edge-automation-profile')
}

/**
 * Cek apakah profil akun sudah tersedia
 */
export async function checkProfileExists(): Promise<boolean> {
  const profilePath = getProfilePath()
  try {
    await fs.access(profilePath)
    return true
  } catch {
    return false
  }
}

/**
 * Hapus profil akun (hanya boleh dipanggil saat browser tidak berjalan)
 */
export async function deleteProfile(): Promise<void> {
  const profilePath = getProfilePath()
  await fs.rm(profilePath, { recursive: true, force: true })
}

// ─── Browser Launch ───────────────────────────────────────────
async function launchPersistentEdge(): Promise<BrowserContext> {
  const profilePath = getProfilePath()
  logger.info(`Membuka Microsoft Edge dengan profil: ${profilePath}`)

  return chromium.launchPersistentContext(profilePath, {
    channel: 'msedge',
    headless: false,
    viewport: null,
    args: ['--start-maximized'],
  })
}

// ─── Consent Popup Handler ────────────────────────────────────
async function handleConsentPopup(page: Page): Promise<void> {
  for (const selector of BING_SELECTORS.CONSENT_BUTTONS) {
    try {
      const btn = page.locator(selector).first()
      const visible = await btn.isVisible({ timeout: 1500 }).catch(() => false)
      if (visible) {
        await btn.click({ timeout: 3000 }).catch(() => {})
        logger.info('Popup consent Bing ditutup')
        break
      }
    } catch {
      // Lanjutkan ke selector berikutnya
    }
  }
}

// ─── CAPTCHA Detection ────────────────────────────────────────
async function detectCaptcha(page: Page): Promise<boolean> {
  for (const selector of BING_SELECTORS.CAPTCHA_INDICATORS) {
    try {
      const el = page.locator(selector).first()
      const visible = await el.isVisible({ timeout: 1000 }).catch(() => false)
      if (visible) return true
    } catch {
      // Lanjutkan
    }
  }
  // Cek URL jika mengandung kata captcha
  const url = page.url()
  return url.includes('captcha') || url.includes('BotDetected')
}

// ─── Search Box Finder ────────────────────────────────────────
/**
 * Cari kotak pencarian Bing menggunakan beberapa selector fallback.
 * Melempar error dengan pesan jelas jika tidak ditemukan.
 */
async function findSearchBox(page: Page) {
  for (const selector of BING_SELECTORS.SEARCH_BOX) {
    try {
      const el = page.locator(selector).first()
      await el.waitFor({ state: 'visible', timeout: 5000 })
      return el
    } catch {
      // Coba selector berikutnya
    }
  }
  throw new Error(
    `Kotak pencarian Bing tidak ditemukan. Selector yang dicoba: ${BING_SELECTORS.SEARCH_BOX.join(', ')}`
  )
}

// ─── Automation State Broadcaster ────────────────────────────
function broadcastState(status: AutomationStatus, extra: Record<string, unknown> = {}): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.ON_AUTOMATION_STATE, { status, ...extra })
    }
  }
}

function broadcastKeywordUpdate(payload: {
  id: string
  status: KeywordStatus
  duration?: number
  message?: string
}): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.ON_KEYWORD_UPDATE, payload)
    }
  }
}

// ─── Singleton Browser Context ────────────────────────────────
let activeContext: BrowserContext | null = null
let isBrowserOpen = false

// ─── Automation Controller ────────────────────────────────────
interface AutomationController {
  abort: () => void
  pause: () => void
  resume: () => void
  captchaResolved: () => void
}

let currentController: AutomationController | null = null

export function pauseAutomation(): void {
  currentController?.pause()
}

export function resumeAutomation(): void {
  currentController?.resume()
}

export function stopAutomation(): void {
  currentController?.abort()
}

export function resolveCaptcha(): void {
  currentController?.captchaResolved()
}

// ─── Main Automation Runner ───────────────────────────────────
export async function runAutomation(
  keywords: KeywordItem[],
  settings: AppSettings,
  startFromIndex = 0
): Promise<void> {
  const typingDelay = TYPING_DELAY_MAP[settings.typingSpeed]
  const pageTimeout = settings.pageTimeout * 1000
  const searchDelay = settings.delayBetweenSearches * 1000

  // Abort/Pause/Resume/CAPTCHA state
  let aborted = false
  let paused = false
  let captchaWaiting = false

  const controller: AutomationController = {
    abort: () => { aborted = true; paused = false; captchaWaiting = false },
    pause: () => { paused = true },
    resume: () => { paused = false; captchaWaiting = false },
    captchaResolved: () => { captchaWaiting = false; paused = false },
  }
  currentController = controller

  /**
   * Helper: tunggu sampai tidak di-pause dan tidak di-abort
   */
  async function waitIfPaused(): Promise<boolean> {
    while (paused && !aborted) {
      await sleep(300)
    }
    return !aborted
  }

  /**
   * Helper: tunggu sampai CAPTCHA diselesaikan user
   */
  async function waitForCaptcha(): Promise<boolean> {
    captchaWaiting = true
    while (captchaWaiting && !aborted) {
      await sleep(500)
    }
    return !aborted
  }

  // ── Launch browser ─────────────────────────────────────────
  broadcastState('LAUNCHING_BROWSER')
  logger.info('Membuka Microsoft Edge...')

  try {
    activeContext = await launchPersistentEdge()
    isBrowserOpen = true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('msedge') || msg.toLowerCase().includes('executable')) {
      logger.error('Microsoft Edge tidak terinstal atau tidak ditemukan di sistem ini.')
      broadcastState('ERROR', { errorMessage: 'Microsoft Edge tidak ditemukan. Pastikan Edge terinstal.' })
    } else {
      logger.error(`Gagal membuka Edge: ${msg}`)
      broadcastState('ERROR', { errorMessage: `Gagal membuka Edge: ${msg}` })
    }
    currentController = null
    return
  }

  // Tangani penutupan browser oleh pengguna
  activeContext.on('close', () => {
    if (!aborted) {
      logger.warning('Microsoft Edge ditutup oleh pengguna.')
      aborted = true
      paused = false
      captchaWaiting = false
      isBrowserOpen = false
      broadcastState('STOPPED', {
        errorMessage: 'Edge ditutup oleh pengguna. Automasi dihentikan.',
      })
    }
    activeContext = null
  })

  // Ambil atau buat halaman baru
  const pages = activeContext.pages()
  const page = pages[0] ?? await activeContext.newPage()

  // ── Buka halaman utama Bing ────────────────────────────────
  logger.info('Membuka halaman utama Bing...')
  try {
    await page.goto(BING_SELECTORS.HOME_URL, {
      waitUntil: 'domcontentloaded',
      timeout: pageTimeout,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(`Gagal membuka Bing: ${msg}. Periksa koneksi internet.`)
    broadcastState('ERROR', { errorMessage: 'Gagal membuka Bing. Periksa koneksi internet.' })
    await safeCloseContext()
    currentController = null
    return
  }

  await handleConsentPopup(page)
  logger.success('Microsoft Edge berhasil dibuka. Memulai pencarian...')
  broadcastState('RUNNING')

  // ── Loop pencarian ─────────────────────────────────────────
  const totalKeywords = keywords.length
  let completedCount = 0
  let failedCount = 0
  const startTime = Date.now()

  for (let index = startFromIndex; index < totalKeywords; index++) {
    if (aborted) break

    // Tunggu jika dijeda
    if (paused) {
      broadcastState('PAUSED', {
        currentKeywordIndex: index,
        completedKeywords: completedCount,
        failedKeywords: failedCount,
      })
      logger.info('Automasi dijeda. Menunggu perintah lanjutkan...')
      const ok = await waitIfPaused()
      if (!ok) break
      broadcastState('RUNNING', {
        currentKeywordIndex: index,
        completedKeywords: completedCount,
        failedKeywords: failedCount,
      })
    }

    const item = keywords[index]
    if (!item) continue

    // Tandai sedang diproses
    broadcastKeywordUpdate({ id: item.id, status: 'searching' })
    logger.info(`Mencari: ${item.keyword}`)

    const kwStartTime = Date.now()
    let searchSuccess = false
    let lastErrorMsg = ''

    // ── Retry loop ──────────────────────────────────────────
    for (let attempt = 0; attempt <= settings.maxRetryPerKeyword; attempt++) {
      if (aborted) break

      try {
        // Cek CAPTCHA sebelum mencari
        const hasCaptcha = await detectCaptcha(page)
        if (hasCaptcha) {
          logger.warning('CAPTCHA terdeteksi! Menunggu pengguna menyelesaikan...')
          broadcastState('WAITING_FOR_USER', {
            currentKeyword: item.keyword,
            currentKeywordIndex: index,
          })
          const ok = await waitForCaptcha()
          if (!ok) break
          broadcastState('RUNNING')
          // Refresh halaman setelah CAPTCHA selesai
          await page.reload({ waitUntil: 'domcontentloaded', timeout: pageTimeout })
        }

        // Temukan search box
        let searchBox
        try {
          searchBox = await findSearchBox(page)
        } catch {
          // Search box tidak ditemukan — coba refresh halaman
          logger.warning(`Search box tidak ditemukan. Mencoba refresh halaman...`)
          await page.reload({ waitUntil: 'domcontentloaded', timeout: pageTimeout })
          await sleep(1500)

          // Jika masih tidak ada, kembali ke Bing home
          try {
            searchBox = await findSearchBox(page)
          } catch {
            logger.warning(`Masih tidak ada. Kembali ke halaman utama Bing...`)
            await page.goto(BING_SELECTORS.HOME_URL, {
              waitUntil: 'domcontentloaded',
              timeout: pageTimeout,
            })
            await handleConsentPopup(page)
            await sleep(1000)
            searchBox = await findSearchBox(page)
          }
        }

        // Klik, hapus isi lama, ketik keyword baru
        await searchBox.click()
        await searchBox.press('Control+A')
        await searchBox.press('Backspace')
        // Tunggu sebentar untuk memastikan input sudah kosong
        await sleep(150)

        // Ketik keyword seperti pengguna biasa
        await searchBox.pressSequentially(item.keyword, { delay: typingDelay })

        // Tekan Enter
        await searchBox.press('Enter')

        // Tunggu halaman hasil dimuat
        await page.waitForLoadState('domcontentloaded', { timeout: pageTimeout }).catch(() => {})

        // Pastikan tidak diarahkan ke URL pencarian langsung
        // (hanya sebagai validasi, tidak memblokir)
        const currentUrl = page.url()
        if (currentUrl.includes('bing.com/search') && !currentUrl.includes('?q=')) {
          // Normal — hasil pencarian melalui form
        }

        // Tunggu search box di halaman hasil tersedia
        await findSearchBox(page).catch(() => {})

        searchSuccess = true
        break
      } catch (err) {
        lastErrorMsg = err instanceof Error ? err.message : String(err)
        if (attempt < settings.maxRetryPerKeyword) {
          logger.warning(`Retry ${attempt + 1}/${settings.maxRetryPerKeyword} untuk "${item.keyword}": ${lastErrorMsg}`)
          await sleep(2000)
        }
      }
    }

    const kwDuration = Date.now() - kwStartTime

    if (aborted) break

    if (searchSuccess) {
      completedCount++
      broadcastKeywordUpdate({ id: item.id, status: 'success', duration: kwDuration })
      logger.success(`Berhasil: ${item.keyword} (${(kwDuration / 1000).toFixed(1)}s)`)
    } else {
      failedCount++
      broadcastKeywordUpdate({
        id: item.id,
        status: 'failed',
        duration: kwDuration,
        message: lastErrorMsg,
      })
      logger.error(`Gagal: ${item.keyword} — ${lastErrorMsg}`)
    }

    // Hitung ETA
    const elapsed = Date.now() - startTime
    const doneCount = completedCount + failedCount
    const avgMs = doneCount > 0 ? elapsed / doneCount : 0
    const remaining = totalKeywords - index - 1
    const etaMs = avgMs > 0 ? avgMs * remaining : null

    broadcastState('RUNNING', {
      currentKeyword: index < totalKeywords - 1 ? keywords[index + 1]?.keyword : null,
      currentKeywordIndex: index + 1,
      completedKeywords: completedCount,
      failedKeywords: failedCount,
      elapsedMs: elapsed,
      etaMs,
    })

    // Delay antar pencarian (kecuali keyword terakhir)
    if (index < totalKeywords - 1 && !aborted) {
      logger.info(`Menunggu ${settings.delayBetweenSearches} detik sebelum pencarian berikutnya...`)
      await interruptibleSleep(searchDelay, () => aborted || paused)
    }
  }

  // ── Selesai ────────────────────────────────────────────────
  if (aborted) {
    logger.info('Automasi dihentikan oleh pengguna.')
    broadcastState('STOPPED', {
      completedKeywords: completedCount,
      failedKeywords: failedCount,
    })
  } else {
    logger.success(`Semua pencarian selesai! Berhasil: ${completedCount}, Gagal: ${failedCount}`)
    broadcastState('COMPLETED', {
      completedKeywords: completedCount,
      failedKeywords: failedCount,
    })
  }

  // Tutup browser jika setting mengharuskan
  if (settings.closeEdgeAfterDone && !aborted) {
    await safeCloseContext()
  }

  currentController = null
}

// ─── Account Login Mode ───────────────────────────────────────
/**
 * Buka Edge untuk login akun secara manual.
 * Browser tetap terbuka sampai pengguna menutupnya.
 */
export async function openEdgeForLogin(): Promise<void> {
  if (isBrowserOpen) {
    logger.warning('Edge sudah terbuka. Tutup browser yang ada terlebih dahulu.')
    return
  }

  logger.info('Membuka Microsoft Edge untuk login akun...')
  try {
    const context = await launchPersistentEdge()
    activeContext = context
    isBrowserOpen = true

    const pages = context.pages()
    const page = pages[0] ?? await context.newPage()

    await page.goto(BING_SELECTORS.HOME_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await handleConsentPopup(page)

    logger.info('Edge terbuka. Silakan login ke akun Microsoft Anda, lalu tutup Edge untuk menyimpan sesi.')

    context.on('close', () => {
      isBrowserOpen = false
      activeContext = null
      logger.success('Sesi akun disimpan. Browser ditutup.')
      broadcastState('IDLE', { profileStatus: 'ready' })
    })
  } catch (err) {
    isBrowserOpen = false
    activeContext = null
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(`Gagal membuka Edge untuk login: ${msg}`)
    broadcastState('ERROR', { errorMessage: `Gagal membuka Edge: ${msg}` })
  }
}

/**
 * Buka Edge untuk mengecek status akun
 */
export async function openEdgeForCheck(): Promise<void> {
  await openEdgeForLogin()
}

// ─── Safe Cleanup ─────────────────────────────────────────────
async function safeCloseContext(): Promise<void> {
  if (activeContext) {
    try {
      await activeContext.close()
    } catch {
      // Sudah ditutup
    }
    activeContext = null
    isBrowserOpen = false
  }
}

export function getIsBrowserOpen(): boolean {
  return isBrowserOpen
}

// ─── Sleep Helpers ────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Sleep yang dapat diinterupsi — cek condition setiap 200ms
 */
async function interruptibleSleep(
  ms: number,
  shouldStop: () => boolean
): Promise<void> {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (shouldStop()) break
    await sleep(200)
  }
}
