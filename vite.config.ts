import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import swPrecache from './scripts/sw-plugin.mjs'

export default defineConfig({
  plugins: [react(), tailwindcss(), swPrecache()],
})
