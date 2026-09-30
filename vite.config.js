import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: '/klados/',
  test: {
    globals: true,
    environment: 'jsdom',
    // Unit tests only. tests/playwright holds .spec.js files too, but those are
    // end-to-end tests driven by Playwright, which has its own runner.
    // engines.spec.js checks package.json against the lockfile (see AGENTS.md).
    include: ['src/**/*.spec.js', 'engines.spec.js'],
  },
})
