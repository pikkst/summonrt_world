import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: projectRoot,
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    css: true,
    alias: {
      '@': resolve(projectRoot, './src'),
      '@stores': resolve(projectRoot, './src/stores'),
      '@types': resolve(projectRoot, './src/types'),
      '@ui': resolve(projectRoot, './src/ui'),
      '@modules': resolve(projectRoot, './src/modules'),
      '@core': resolve(projectRoot, './src/core'),
      '@data': resolve(projectRoot, './src/data'),
      '@utils': resolve(projectRoot, './src/utils'),
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  },
})
