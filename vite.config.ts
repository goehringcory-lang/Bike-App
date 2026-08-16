/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base is '/Bike-App/' so the built site works on GitHub Pages project hosting;
// HashRouter handles in-app routing so no server rewrites are needed.
export default defineConfig({
  base: '/Bike-App/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
