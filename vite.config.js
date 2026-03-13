import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Allow Google Sign-In popup to postMessage back to the page
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
})
