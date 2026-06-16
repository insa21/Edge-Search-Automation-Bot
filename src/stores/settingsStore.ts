import { create } from 'zustand'
import { AppSettings, DEFAULT_SETTINGS, ThemeMode } from '../types/index'

interface SettingsStore {
  settings: AppSettings
  isLoaded: boolean
  setSettings: (settings: Partial<AppSettings>) => void
  setTheme: (theme: ThemeMode) => void
  loadFromMain: () => Promise<void>
  saveToMain: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  isLoaded: false,

  setSettings: (partial) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
    }))
  },

  setTheme: (theme) => {
    set((state) => ({
      settings: { ...state.settings, theme },
    }))
    // Apply theme to DOM
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },

  loadFromMain: async () => {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.loadSettings()
      if (result.success && result.data) {
        set({ settings: result.data, isLoaded: true })
        // Apply loaded theme
        const theme = result.data.theme
        document.documentElement.setAttribute('data-theme', theme)
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } else {
        set({ isLoaded: true })
      }
    } catch {
      set({ isLoaded: true })
    }
  },

  saveToMain: async () => {
    if (!window.electronAPI) return
    const { settings } = get()
    try {
      await window.electronAPI.saveSettings(settings)
    } catch {
      // Silent fail
    }
  },
}))
