import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the FastAPI backend during development
      '/analyze': 'https://ibm-bob-hackerthon-1.onrender.com',
      '/run':     'https://ibm-bob-hackerthon-1.onrender.com',
      '/results': 'https://ibm-bob-hackerthon-1.onrender.com',
      '/fix':     'https://ibm-bob-hackerthon-1.onrender.com',
      '/health':  'https://ibm-bob-hackerthon-1.onrender.com',
    },
  },
})
