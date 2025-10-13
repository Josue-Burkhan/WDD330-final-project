import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 6767
  },
  build: {
    outDir: '../dist'
  },
  root: 'src'
})
