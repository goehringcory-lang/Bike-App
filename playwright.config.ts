import { defineConfig } from '@playwright/test'
import fs from 'node:fs'

// The CI/remote environment pre-installs Chromium at /opt/pw-browsers/chromium;
// local machines fall back to Playwright's own download.
const prebuiltChromium = '/opt/pw-browsers/chromium'

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173/Bike-App/',
    ...(fs.existsSync(prebuiltChromium) ? { launchOptions: { executablePath: prebuiltChromium } } : {}),
  },
  webServer: {
    command: 'pnpm dev --port 5173',
    url: 'http://localhost:5173/Bike-App/',
    reuseExistingServer: true,
  },
})
