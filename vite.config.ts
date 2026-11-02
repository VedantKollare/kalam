import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'node:url'

// `npm run build`          → normal multi-file build (for web hosting)
// `npm run build:desktop`  → ONE self-contained Scripter.html (open by double-click)
const singleFile = process.env.SINGLE_FILE === '1'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(singleFile ? [viteSingleFile()] : []),
  ],
  // The dictionary package only exports a Node loader; point at its raw files.
  resolve: { alias: { 'dictionary-en-files': fileURLToPath(new URL('node_modules/dictionary-en', import.meta.url)) } },
})
