import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  // ── Main Process ─────────────────────────────────────────────
  main: {
    plugins: [externalizeDepsPlugin()],
    entry: 'electron/main.ts',
  },

  // ── Preload Script ───────────────────────────────────────────
  preload: {
    plugins: [externalizeDepsPlugin()],
    entry: 'electron/preload.ts',
  },

  // ── Renderer (React) ─────────────────────────────────────────
  renderer: {
    root: '.',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
        },
      },
    },
  },
})
