import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src/popup'),
  build: {
    outDir: resolve(__dirname, 'dist/popup'),
    rollupOptions: {
      input: resolve(__dirname, 'src/popup/index.html'),
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'chunk-[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  base: './' // Use relative paths for file:// protocol support
})

