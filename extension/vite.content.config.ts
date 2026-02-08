import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  root: resolve(__dirname, 'src/content'),
  build: {
    outDir: resolve(__dirname, 'dist/content/content'),
    emptyOutDir: true, // Clean the content directory to remove old TS-compiled files
    rollupOptions: {
      input: resolve(__dirname, 'src/content/content-script.ts'),
      output: {
        entryFileNames: 'content-script.js',
        chunkFileNames: 'chunk-[hash].js',
        format: 'iife', // IIFE format for content scripts (no ES modules)
        inlineDynamicImports: true, // Bundle everything into one file
      }
    },
    minify: false, // Keep readable for debugging
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
})

